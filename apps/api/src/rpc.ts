export class RetryableError extends Error {}
export class RangeTooLargeError extends Error {}
export class ArchiveRequiredError extends Error {}
export class RequestCapError extends Error {
  constructor(max: number) {
    super(`Ingest request cap reached (${max}). Remaining work will resume from the saved cursor.`);
    this.name = "RequestCapError";
  }
}

export const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
export const hex = (n: number) => `0x${n.toString(16)}`;

/** Alchemy compute-unit costs used for estimates and per-run logging. */
export const METHOD_CU: Record<string, number> = {
  eth_blockNumber: 10,
  eth_getBlockByNumber: 20,
  eth_getLogs: 60,
  eth_getTransactionReceipt: 20,
  alchemy_getAssetTransfers: 120,
};

export function redactRpcText(text: string) {
  return text.replace(/\/v2\/[A-Za-z0-9_-]+/g, "/v2/***");
}

export class RequestMeter {
  httpRequests = 0;
  cu = 0;
  methods: Record<string, number> = {};

  constructor(readonly maxRequests: number) {}

  charge(methods: string[]) {
    this.httpRequests += 1;
    for (const method of methods) {
      this.methods[method] = (this.methods[method] ?? 0) + 1;
      this.cu += METHOD_CU[method] ?? 60;
    }
    if (this.httpRequests > this.maxRequests) throw new RequestCapError(this.maxRequests);
  }

  summary() {
    return `requests=${this.httpRequests} est_cu=${this.cu} cap=${this.maxRequests} methods=${JSON.stringify(this.methods)}`;
  }
}

const HEADERS = { "content-type": "application/json", "user-agent": "vestpayouts-ingest/1.0" };

/** Minimal JSON-RPC client with retries, range-limit detection and batched calls. */
export class Rpc {
  private id = 0;
  constructor(
    private url: string,
    private meter?: RequestMeter,
  ) {}

  async call<T>(method: string, params: unknown[], attempt = 0): Promise<T> {
    this.meter?.charge([method]);
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify({ jsonrpc: "2.0", id: ++this.id, method, params }),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429 || res.status >= 500) throw new RetryableError(`HTTP ${res.status}`);
      const json = (await res.json()) as { result?: T; error?: { code: number; message: string } };
      if (json.error) {
        const msg = json.error.message ?? "";
        if (/archive|personal token|pruned|missing trie/i.test(msg)) throw new ArchiveRequiredError(msg);
        if (/range|limit|too many|exceed|10000 results/i.test(msg)) throw new RangeTooLargeError(msg);
        throw new RetryableError(msg);
      }
      return json.result as T;
    } catch (err) {
      if (err instanceof RangeTooLargeError || err instanceof ArchiveRequiredError || err instanceof RequestCapError) {
        throw err;
      }
      if (attempt >= 5) throw new Error(redactRpcText((err as Error).message));
      console.warn(`  ↻ ${method} retry ${attempt + 1}: ${redactRpcText((err as Error).message).slice(0, 120)}`);
      await sleep(1000 * 2 ** attempt);
      return this.call<T>(method, params, attempt + 1);
    }
  }

  async batch<T>(calls: { method: string; params: unknown[] }[], attempt = 0): Promise<T[]> {
    this.meter?.charge(calls.map((c) => c.method));
    try {
      const res = await fetch(this.url, {
        method: "POST",
        headers: HEADERS,
        body: JSON.stringify(calls.map((c, i) => ({ jsonrpc: "2.0", id: i, ...c }))),
        signal: AbortSignal.timeout(60_000),
      });
      if (res.status === 429 || res.status >= 500) throw new RetryableError(`HTTP ${res.status}`);
      if (!res.ok) throw new RetryableError(`HTTP ${res.status}`);
      const json = (await res.json()) as { id: number; result?: T; error?: unknown }[];
      if (!Array.isArray(json) || json.some((r) => r.error || r.result == null)) throw new RetryableError("batch returned errors");
      return json.sort((a, b) => a.id - b.id).map((r) => r.result as T);
    } catch (err) {
      if (err instanceof RequestCapError) throw err;
      if (attempt >= 4) {
        const out: T[] = [];
        for (const c of calls) out.push(await this.call<T>(c.method, c.params));
        return out;
      }
      console.warn(`  ↻ batch retry ${attempt + 1}: ${redactRpcText((err as Error).message).slice(0, 120)}`);
      await sleep(1000 * 2 ** attempt);
      return this.batch<T>(calls, attempt + 1);
    }
  }

  async blockTimestamp(n: number) {
    const b = await this.call<{ timestamp: string }>("eth_getBlockByNumber", [hex(n), false]);
    return parseInt(b.timestamp, 16);
  }

  /** Binary search; blocks a non-archive node refuses to serve count as "too old". */
  async findBlockAtOrAfter(targetTs: number, hi: number) {
    let lo = 0;
    while (lo < hi) {
      const mid = Math.floor((lo + hi) / 2);
      let ts: number;
      try {
        ts = await this.blockTimestamp(mid);
      } catch (err) {
        if (!(err instanceof ArchiveRequiredError)) throw err;
        ts = -1;
      }
      if (ts < targetTs) lo = mid + 1;
      else hi = mid;
    }
    return lo;
  }
}
