/**
 * Audit hardcoded design values in styles.
 *
 * Goals:
 * 1) Detect color hex literals that bypass Figma tokens.
 * 2) Detect unsafe !important usage outside approved files.
 *
 * Usage:
 *   npm run design:audit
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const projectRoot = path.join(__dirname, '..');
const styleRoot = path.join(projectRoot, 'src');

const STYLE_EXTS = new Set(['.css', '.scss']);
const STRICT = process.env.DESIGN_AUDIT_STRICT === '1';
const CORE_SCOPE_PREFIXES = [
  'styles/figma-design-tokens.css',
  'styles/figma-front-shell.css',
  'styles/figma-tokens-machine-selection.css',
  'styles/sidebar-figma.css',
  'styles/page-layout-fix.css',
  'styles/machine-selection-figma.css',
  'styles/machine-compare-alignment.css',
  'pages/Home/Home.css',
  'pages/Home/Home.override.css',
];
const ALLOWLIST_IMPORTANT_FILES = new Set([
  // Legacy compatibility files (gradually reduced)
  'styles/page-layout-fix.css',
  'styles/header-layout-fix.css',
  'styles/sidebar-functional-fix.css',
  // Figma shell intentionally overrides legacy rules
  'styles/figma-front-shell.css',
  'styles/sidebar-figma.css',
]);

const HEX_RE = /#[0-9a-fA-F]{3,8}\b/g;
const HEX_RE_LINE = /#[0-9a-fA-F]{3,8}\b/;
const IMPORTANT_RE = /!important\b/g;
const TOKEN_OR_VAR_RE = /(var\(--|color-mix\(|rgba?\()/;

function walk(dir, acc = []) {
  for (const ent of fs.readdirSync(dir, { withFileTypes: true })) {
    const abs = path.join(dir, ent.name);
    if (ent.isDirectory()) {
      if (ent.name === 'node_modules' || ent.name === 'dist' || ent.name === 'coverage') continue;
      walk(abs, acc);
      continue;
    }
    if (STYLE_EXTS.has(path.extname(ent.name))) acc.push(abs);
  }
  return acc;
}

function getLineCol(content, index) {
  const pre = content.slice(0, index);
  const line = pre.split('\n').length;
  const col = index - pre.lastIndexOf('\n');
  return { line, col };
}

function isTokenDefinitionLine(line) {
  return line.includes('--') && line.includes(':') && HEX_RE_LINE.test(line);
}

function auditFile(absPath) {
  const rel = path.relative(projectRoot, absPath).replace(/\\/g, '/');
  const srcRel = rel.replace(/^src\//, '');
  const inScope = CORE_SCOPE_PREFIXES.some((prefix) => srcRel.startsWith(prefix));
  if (!inScope) return [];
  const content = fs.readFileSync(absPath, 'utf8');
  const lines = content.split('\n');
  const issues = [];

  // Hex color audit
  for (const match of content.matchAll(HEX_RE)) {
    const idx = match.index ?? 0;
    const hex = match[0];
    const { line } = getLineCol(content, idx);
    const rawLine = lines[line - 1] ?? '';

    // allow token definition file lines and comments with hex references
    if (isTokenDefinitionLine(rawLine)) continue;
    if (rawLine.trimStart().startsWith('/*') || rawLine.trimStart().startsWith('*')) continue;
    if (TOKEN_OR_VAR_RE.test(rawLine)) continue;

    issues.push({
      type: 'hex',
      rel,
      line,
      sample: hex,
      detail: rawLine.trim(),
    });
  }

  // !important audit
  const allowImportant = ALLOWLIST_IMPORTANT_FILES.has(srcRel);
  if (!allowImportant) {
    for (const match of content.matchAll(IMPORTANT_RE)) {
      const idx = match.index ?? 0;
      const { line } = getLineCol(content, idx);
      const rawLine = lines[line - 1] ?? '';
      issues.push({
        type: 'important',
        rel,
        line,
        sample: '!important',
        detail: rawLine.trim(),
      });
    }
  }

  return issues;
}

function run() {
  const files = walk(styleRoot);
  const allIssues = files.flatMap(auditFile);

  if (allIssues.length === 0) {
    console.log('design:audit passed. No scoped hardcoded style issues found.');
    return;
  }

  const grouped = new Map();
  for (const issue of allIssues) {
    if (!grouped.has(issue.rel)) grouped.set(issue.rel, []);
    grouped.get(issue.rel).push(issue);
  }

  const level = STRICT ? 'error' : 'warning';
  console.error(`design:audit ${level}: found ${allIssues.length} issue(s) in ${grouped.size} scoped file(s):`);
  for (const [file, items] of grouped.entries()) {
    console.error(`\n- ${file}`);
    for (const it of items.slice(0, 15)) {
      console.error(`  L${it.line} [${it.type}] ${it.sample} :: ${it.detail}`);
    }
    if (items.length > 15) {
      console.error(`  ... ${items.length - 15} more`);
    }
  }
  if (STRICT) process.exitCode = 1;
}

run();
