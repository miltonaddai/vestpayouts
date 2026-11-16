import { test } from "node:test";
import assert from "node:assert/strict";
import { parseCsv, toCsvLine } from "../src/csv";

test("parses a header and rows into objects", () => {
  assert.deepEqual(parseCsv("a,b\n1,2\n3,4\n"), [
    { a: "1", b: "2" },
    { a: "3", b: "4" },
  ]);
});

test("handles CRLF line endings and a missing trailing newline", () => {
  assert.deepEqual(parseCsv("a,b\r\n1,2\r\n3,4"), [
    { a: "1", b: "2" },
    { a: "3", b: "4" },
  ]);
});

test("handles quoted fields with commas, escaped quotes and newlines", () => {
  const rows = parseCsv('name,note\n"Smith, J","said ""hi""\nthen left"\n');
  assert.deepEqual(rows, [{ name: "Smith, J", note: 'said "hi"\nthen left' }]);
});

test("skips blank lines and # comment lines, trims values", () => {
  const rows = parseCsv("# exported 2026-11-01\n a , b \n\n 1 , 2 \n# trailing comment\n");
  assert.deepEqual(rows, [{ a: "1", b: "2" }]);
});

test("fills missing trailing columns with empty strings", () => {
  assert.deepEqual(parseCsv("a,b,c\n1\n"), [{ a: "1", b: "", c: "" }]);
});

test("returns nothing for empty input", () => {
  assert.deepEqual(parseCsv(""), []);
  assert.deepEqual(parseCsv("\n\n# only a comment\n"), []);
});

test("toCsvLine quotes only when needed", () => {
  assert.equal(toCsvLine(["plain", 42, "a,b", 'say "x"', "two\nlines"]), 'plain,42,"a,b","say ""x""","two\nlines"');
});

test("toCsvLine output round-trips through parseCsv", () => {
  const values = ["Smith, J", 'quote "here"', "multi\nline", "1234.56"];
  const csv = `${toCsvLine(["a", "b", "c", "d"])}\n${toCsvLine(values)}\n`;
  assert.deepEqual(parseCsv(csv), [{ a: values[0], b: values[1], c: values[2], d: values[3] }]);
});
