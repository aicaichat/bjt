import { read, utils } from 'xlsx';
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore – encoding-japanese has no types
import Encoding from 'encoding-japanese';

export interface ParsedResult {
  headers: string[];
  rows: Record<string, any>[];
}

/**
 * Dynamically parses an ArrayBuffer of xlsx / xls / csv file into JSON rows.
 * First row is treated as header.
 */
export async function parseExcel(buffer: ArrayBuffer): Promise<ParsedResult> {
  let wb;
  if (isBinaryExcel(buffer)) {
    // xlsx or xls – binary parse
    wb = read(buffer, { type: 'array' });
  } else {
    // Assume text (csv/tsv). Detect encoding & convert to UTF-8 string
    const bytes = new Uint8Array(buffer);
    const detected = Encoding.detect(bytes) as Encoding.Encoding;
    let utf8Str = Encoding.convert(bytes, {
      from: detected,
      to: 'UNICODE',
      type: 'string',
    }) as string;

    // --- Delimiter normalisation ---
    // 1. Excel may add a `sep=;` directive on the first line – handle that first.
    const sepMatch = utf8Str.match(/^sep=(.)\r?\n/i);
    if (sepMatch) {
      const delimiter = sepMatch[1];
      utf8Str = utf8Str.slice(sepMatch[0].length); // strip the sep line
      if (delimiter !== ',') {
        // Replace the custom delimiter with comma so xlsx can parse it.
        // We only do a naive replace because values themselves rarely contain the delimiter char
        // when Excel decided to use it as the separator.
        utf8Str = utf8Str.split(delimiter).join(',');
      }
    }

    // 2. If没有 sep 指令，再通过前几行猜测分隔符（常见 ; 或 \t）
    if (!sepMatch) {
      const sampleLines = utf8Str.split(/\r?\n/).slice(0, 3);
      const counts = { comma: 0, semicolon: 0, tab: 0 } as Record<string, number>;
      sampleLines.forEach((line) => {
        counts.comma += (line.match(/,/g) || []).length;
        counts.semicolon += (line.match(/;/g) || []).length;
        counts.tab += (line.match(/\t/g) || []).length;
      });
      let detectedDelim: string | null = null;
      if (counts.semicolon > counts.comma && counts.semicolon > counts.tab) detectedDelim = ';';
      else if (counts.tab > counts.comma && counts.tab > counts.semicolon) detectedDelim = '\t';

      if (detectedDelim && detectedDelim !== ',') {
        utf8Str = utf8Str.split(detectedDelim).join(',');
      }
    }

    wb = read(utf8Str, { type: 'string' });
  }

  const sheet = wb.Sheets[wb.SheetNames[0]];
  const json = utils.sheet_to_json<Record<string, any>>(sheet, { header: 1, raw: false });
  const [headerRow, ...dataRows] = json as (string | number)[][];
  const headers = (headerRow as string[]).map((h) => normalizeHeader(String(h)));

  // Remove completely empty rows (some editors leave an empty line at the end of CSV)
  const filteredRows = dataRows.filter((row) =>
    row.some((cell) => cell !== undefined && cell !== null && String(cell).trim() !== '')
  );

  const rows = filteredRows.map((row) => {
    const obj: Record<string, any> = {};
    headers.forEach((h, idx) => (obj[h] = row[idx]));
    return obj;
  });
  return { headers, rows };
}

function normalizeHeader(h: string) {
  return h.trim().toLowerCase().replace(/\s+/g, '');
}

// helper to detect if buffer is XLSX/zip (starts with PK) or binary xls (D0 CF 11 E0 etc.)
function isBinaryExcel(buf: ArrayBuffer): boolean {
  const u8 = new Uint8Array(buf.slice(0, 4));
  // XLSX is a zip starting with PK\x03\x04
  if (u8[0] === 0x50 && u8[1] === 0x4B) return true;
  // Old BIFF xls starts with D0 CF 11 E0
  if (u8[0] === 0xD0 && u8[1] === 0xCF) return true;
  return false;
} 