"use client";

import { useActionState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { NativeSelect, NativeSelectOption } from "@/components/ui/native-select";
import { addPayout, deleteSamples, importCsv, login, logout, saveAlias, type ActionState } from "./actions";

function Notice({ state }: { state: ActionState }) {
  if (state.error) {
    return (
      <p role="alert" className="rounded-lg border border-coral/40 bg-coral/10 px-3 py-2 text-sm whitespace-pre-wrap text-coral">
        {state.error}
      </p>
    );
  }
  if (state.ok) {
    return <p className="rounded-lg border border-mint/30 bg-mint/10 px-3 py-2 text-sm text-mint">{state.ok}</p>;
  }
  return null;
}

export function LoginForm() {
  const [state, action, pending] = useActionState(login, {});
  const router = useRouter();
  useEffect(() => {
    if (state.ok) router.refresh();
  }, [state.ok, router]);
  return (
    <form action={action} className="mx-auto grid max-w-sm gap-3">
      <label className="grid gap-1.5 text-sm text-paper/80">
        Admin password
        <Input type="password" name="password" autoComplete="current-password" required />
      </label>
      <Notice state={state} />
      <Button type="submit" disabled={pending} size="lg">
        {pending ? "Checking…" : "Unlock admin"}
      </Button>
    </form>
  );
}

export function LogoutButton() {
  const router = useRouter();
  return (
    <form
      action={async () => {
        await logout();
        router.refresh();
      }}
    >
      <Button type="submit" variant="outline">
        Lock
      </Button>
    </form>
  );
}

export function AddPayoutForm() {
  const [state, action, pending] = useActionState(addPayout, {});
  return (
    <form action={action} className="grid gap-3">
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          Paid at
          <Input name="paid_at" type="datetime-local" required />
        </label>
        <label className="grid gap-1.5 text-sm">
          Amount (USD)
          <Input name="amount_usd" type="number" min="0" step="0.01" required />
        </label>
        <label className="grid gap-1.5 text-sm">
          Chain
          <NativeSelect name="chain" className="w-full" defaultValue="">
            <NativeSelectOption value="">Unknown</NativeSelectOption>
            <NativeSelectOption value="base">Base</NativeSelectOption>
            <NativeSelectOption value="arbitrum">Arbitrum</NativeSelectOption>
          </NativeSelect>
        </label>
        <label className="grid gap-1.5 text-sm">
          Trader name
          <Input name="trader" placeholder="Optional" />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          Transaction hash
          <Input name="tx_hash" className="font-mono" placeholder="0x… (optional, links to an on-chain payout)" spellCheck={false} />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          Wallet
          <Input name="wallet" className="font-mono" placeholder="0x… optional" spellCheck={false} />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          Proof URL
          <Input name="proof_url" type="url" placeholder="https://…" />
        </label>
        <label className="grid gap-1.5 text-sm sm:col-span-2">
          Note
          <Input name="note" placeholder="Optional" />
        </label>
      </div>
      <Notice state={state} />
      <Button type="submit" disabled={pending} className="w-fit">
        {pending ? "Saving…" : "Add payout"}
      </Button>
    </form>
  );
}

export function ImportForm() {
  const [state, action, pending] = useActionState(importCsv, {});
  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1.5 text-sm">
        CSV file
        <Input name="file" type="file" accept=".csv,text/csv,text/plain" />
      </label>
      <label className="grid gap-1.5 text-sm">
        Or paste CSV
        <textarea
          name="csv"
          rows={5}
          placeholder={"paid_at,amount_usd,chain,tx_hash,wallet,trader,proof_url,note"}
          className="rounded-lg border border-input bg-transparent px-3 py-2 font-mono text-xs outline-none focus-visible:border-ring"
        />
      </label>
      <Notice state={state} />
      <Button type="submit" disabled={pending} variant="secondary" className="w-fit">
        {pending ? "Importing…" : "Import CSV"}
      </Button>
    </form>
  );
}

export function AliasForm() {
  const [state, action, pending] = useActionState(saveAlias, {});
  return (
    <form action={action} className="grid gap-3">
      <label className="grid gap-1.5 text-sm">
        Wallet
        <Input name="address" className="font-mono" required placeholder="0x…" spellCheck={false} />
      </label>
      <div className="grid gap-3 sm:grid-cols-2">
        <label className="grid gap-1.5 text-sm">
          Display name
          <Input name="display_name" required maxLength={60} />
        </label>
        <label className="grid gap-1.5 text-sm">
          X handle
          <Input name="x_handle" placeholder="@name" />
        </label>
      </div>
      <Notice state={state} />
      <Button type="submit" disabled={pending} variant="secondary" className="w-fit">
        {pending ? "Saving…" : "Save alias"}
      </Button>
    </form>
  );
}

export function DeleteSamplesButton() {
  const [state, action, pending] = useActionState(deleteSamples, {});
  return (
    <form action={action} className="grid gap-3">
      <Notice state={state} />
      <Button type="submit" variant="destructive" disabled={pending} className="w-fit">
        {pending ? "Removing…" : "Delete all sample rows"}
      </Button>
    </form>
  );
}
