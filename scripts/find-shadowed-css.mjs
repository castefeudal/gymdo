// Static scan: find top-level rules fully shadowed by a later top-level rule
// with the same selector. The bundle is ordered by @sequence, so "later" is
// exactly "higher sequence" and equal specificity means the earlier rule can
// never win. Reports the minified byte cost of removing each one.
import { readFile, readdir, writeFile } from 'node:fs/promises';
import postcss from 'postcss';

const dir = new URL('../styles/source/', import.meta.url);
const files = (await readdir(dir)).filter((f) => f.endsWith('.css')).sort();
const rules = [];
for (const file of files) {
  const source = postcss.parse(await readFile(new URL(file, dir), 'utf8'), { from: file });
  let sequence;
  for (const node of source.nodes) {
    if (node.type === 'comment' && /^@sequence \d+$/.test(node.text)) {
      sequence = Number(node.text.split(' ')[1]);
      continue;
    }
    if (node.type === 'rule') {
      const decls = new Map();
      let pure = true;
      node.each((child) => {
        if (child.type === 'decl') decls.set(child.prop + (child.important ? '!' : ''), child.value);
        else if (child.type !== 'comment') pure = false;
      });
      if (pure && decls.size) rules.push({ file, sequence, node, selector: node.selector.replace(/\s+/g, ' ').trim(), decls });
    }
    sequence = undefined;
  }
}
rules.sort((a, b) => a.sequence - b.sequence);
const bySelector = new Map();
for (const r of rules) {
  if (!bySelector.has(r.selector)) bySelector.set(r.selector, []);
  bySelector.get(r.selector).push(r);
}
const dead = [];
for (const [, list] of bySelector) {
  for (let i = 0; i < list.length - 1; i++) {
    const later = list.slice(i + 1);
    if ([...list[i].decls.keys()].every((key) => later.some((l) => l.decls.has(key)))) {
      const min = `${list[i].selector}{${[...list[i].decls].map(([k, v]) => `${k}:${v}`).join(';')}}`;
      dead.push({ selector: list[i].selector, file: list[i].file, seq: list[i].sequence, cost: min.length, node: list[i].node });
    }
  }
}
dead.sort((a, b) => b.cost - a.cost);
for (const d of dead) console.log(`${String(d.cost).padStart(5)}B  ${d.file} @${d.seq}  ${d.selector.slice(0, 72)}`);
console.log(`\n${dead.length} shadowed rules, ~${dead.reduce((n, d) => n + d.cost, 0)} bytes reclaimable`);
if (process.argv[2] === '--remove') {
  const byFile = new Map();
  for (const d of dead) {
    if (!byFile.has(d.file)) byFile.set(d.file, []);
    byFile.get(d.file).push(d);
  }
  for (const [file, list] of byFile) {
    const source = postcss.parse(await readFile(new URL(file, dir), 'utf8'), { from: file });
    const seqs = new Set(list.map((d) => d.seq));
    const keep = [];
    let pending = [];
    let sequence;
    for (const node of source.nodes) {
      if (node.type === 'comment' && /^@sequence \d+$/.test(node.text)) {
        sequence = Number(node.text.split(' ')[1]);
        pending = [node];
        continue;
      }
      if (node.type === 'comment') { pending.push(node); continue; }
      if (seqs.has(sequence)) { pending = []; sequence = undefined; continue; }
      keep.push(...pending, node);
      pending = [];
      sequence = undefined;
    }
    keep.push(...pending);
    source.nodes = keep;
    await writeFile(new URL(file, dir), source.toString());
    console.log(`cleaned ${file}: ${list.length} rules`);
  }
}
