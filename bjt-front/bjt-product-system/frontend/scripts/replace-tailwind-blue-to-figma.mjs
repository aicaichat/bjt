/**
 * 将旧 Tailwind 蓝 (#3b82f6 系) 换为 Figma 令牌（--ff-*）。
 * 注意：勿用于含 [style*="…"] 的属性选择器（内联 style 仍是 #1e40af 等 hex），需手动保留 hex。
 * 不含 .scss：请用同一映射手改或另跑扩展脚本。
 *  run: node scripts/replace-tailwind-blue-to-figma.mjs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.join(__dirname, '..', 'src');

function walk(dir, acc = []) {
  for (const name of fs.readdirSync(dir, { withFileTypes: true })) {
    const p = path.join(dir, name.name);
    if (name.isDirectory()) {
      if (name.name === 'node_modules' || name.name === 'dist') continue;
      walk(p, acc);
    } else if (name.name.endsWith('.css')) acc.push(p);
  }
  return acc;
}

function replaceContent(s) {
  let out = s;
  // rgba(59, 130, 246, …) → rgba(var(--ff-accent-rgb), …)
  out = out.replace(/rgba\(\s*59\s*,\s*130\s*,\s*246\s*,/gi, 'rgba(var(--ff-accent-rgb),');
  const replacements = [
    [/#3b82f6\b/gi, 'var(--ff-accent)'],
    [/#2563eb\b/gi, 'var(--ff-btn-primary-hover)'],
    [/#1d4ed8\b/gi, 'var(--ff-accent-mid)'],
    [/#1e40af\b/gi, 'var(--ff-accent-mid)'],
    [/#60a5fa\b/gi, 'color-mix(in srgb, var(--ff-accent) 48%, white)'],
    [/#93c5fd\b/gi, 'color-mix(in srgb, var(--ff-accent) 38%, white)'],
    [/#bfdbfe\b/gi, 'color-mix(in srgb, var(--ff-accent) 28%, white)'],
    [/#dbeafe\b/gi, 'color-mix(in srgb, var(--ff-accent) 16%, var(--ff-tint-blue))'],
    [/#eff6ff\b/gi, 'var(--ff-tint-blue)'],
    [/#f0f9ff\b/gi, 'color-mix(in srgb, var(--ff-tint-blue) 65%, white)'],
    [/#e0f2fe\b/gi, 'var(--ff-tint-blue)'],
  ];
  for (const [re, to] of replacements) {
    out = out.replace(re, to);
  }
  return out;
}

const files = walk(root);
let changed = 0;
for (const file of files) {
  const before = fs.readFileSync(file, 'utf8');
  const after = replaceContent(before);
  if (after !== before) {
    fs.writeFileSync(file, after, 'utf8');
    changed++;
    console.log(path.relative(path.join(__dirname, '..'), file));
  }
}
console.log(`Updated ${changed} file(s).`);
