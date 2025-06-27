#!/usr/bin/env node
import fs from 'fs/promises';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const LOCALES_DIR = path.resolve(__dirname, '../src/i18n/locales');
const TARGET_LANG = 'ja';
const OUTPUT_CSV = path.resolve(__dirname, '../../untranslated.csv');
const namespaces = await fs.readdir(path.join(LOCALES_DIR, 'zh'));

let csvLines = ['namespace,key,zh'];

for (const file of namespaces.filter((f)=>f.endsWith('.json'))) {
  const ns = path.basename(file, '.json');
  const zhPath = path.join(LOCALES_DIR, 'zh', file);
  const targetPath = path.join(LOCALES_DIR, TARGET_LANG, file);
  let zhJson = {};
  let targetJson = {};
  try { zhJson = JSON.parse(await fs.readFile(zhPath, 'utf8')); } catch {}
  try { targetJson = JSON.parse(await fs.readFile(targetPath, 'utf8')); } catch {}

  Object.entries(zhJson).forEach(([key, zhVal]) => {
    if (!targetJson[key]) {
      csvLines.push(`${ns},"${key}","${String(zhVal).replace(/"/g,'""')}"`);
    }
  });
}

await fs.writeFile(OUTPUT_CSV, csvLines.join('\n'));
console.log(`✅ Generated ${OUTPUT_CSV} with ${csvLines.length-1} records`); 