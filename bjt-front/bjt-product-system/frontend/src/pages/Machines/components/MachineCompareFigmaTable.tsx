import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import type { MachinePart } from '../../../types/machines';
import { getSimpleProductName } from '../../../utils/simpleProductName';

const IMG_PLACEHOLDER =
  'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTI4IiBoZWlnaHQ9IjEyOCIgdmlld0JveD0iMCAwIDEyOCAxMjgiIGZpbGw9Im5vbmUiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+CjxyZWN0IHdpZHRoPSIxMjgiIGhlaWdodD0iMTI4IiBmaWxsPSIjRjNGNEY2Ii8+CjxwYXRoIGQ9Ik00MCA0MEw4OCA4OE00MCA4OEw4OCA0MCIgc3Ryb2tlPSIjOTdBM0IzIiBzdHJva2Utd2lkdGg9IjIiLz48L3N2Zz4K';

const MAX_ROWS = 8;

function stripUnit(value: string | number | null | undefined, empty: string): string {
  if (value === null || value === undefined) return empty;
  if (typeof value === 'number' && !Number.isNaN(value)) return String(value);
  const str = String(value).trim();
  if (!str) return empty;
  const stripped = str.replace(/\s*(cm|inch|in|kg|lbs|g|lb|V|Hz)$/i, '').trim();
  return stripped || empty;
}

function resolvePublicUrl(url: string | null | undefined): string {
  const u = (url || '').trim();
  if (!u) return IMG_PLACEHOLDER;
  if (u.startsWith('data:') || /^https?:\/\//i.test(u)) return u;
  if (typeof window === 'undefined') return u;
  const path = u.startsWith('/') ? u : `/${u}`;
  return `${window.location.origin}${path}`;
}

function clip(s: string, max: number): string {
  const t = s.replace(/\s+/g, ' ').trim();
  if (!t) return '';
  if (t.length <= max) return t;
  return `${t.slice(0, max - 1)}…`;
}

function guessSpeedFromSpec(spec: string | null | undefined): string {
  if (!spec) return '';
  const lines = spec.split(/[\r\n;/；]/);
  for (const line of lines) {
    const L = line.trim();
    if (!L) continue;
    if (/\d/.test(L) && /(包\/|pack|m\/min|刀\/|速度|speed)/i.test(L)) return clip(L, 48);
  }
  return '';
}

function guessMaterialFromSpec(spec: string | null | undefined): string {
  if (!spec) return '';
  const lines = spec.split(/[\r\n;/；]/);
  for (const line of lines) {
    const L = line.trim();
    if (!L) continue;
    if (/(薄膜|膜材|BOPP|PET|PE|纸张|纸材|material|film)/i.test(L)) return clip(L, 40);
  }
  return '';
}

export interface MachineCompareFigmaTableProps {
  machines: MachinePart[];
  locale: 'zh' | 'en';
  unitSystem: 'metric' | 'imperial';
}

export function MachineCompareFigmaTable({ machines, locale, unitSystem }: MachineCompareFigmaTableProps) {
  const { t } = useTranslation('machines');
  const pending = t('figma.compareDataPending');

  const rows = useMemo(() => {
    const collator = locale === 'zh' ? 'zh' : 'en';
    const list = [...machines].sort((a, b) =>
      (a.model || '').localeCompare(b.model || '', collator, { sensitivity: 'base' }),
    );
    return list.slice(0, MAX_ROWS);
  }, [machines, locale]);

  if (rows.length === 0) return null;

  return (
    <div className="ms-compare-table-wrap" role="region" aria-label={t('figma.modelParamComparison')}>
      <table className="ms-compare-data-table">
        <thead>
          <tr>
            <th scope="col">{t('figma.compareColModel')}</th>
            <th scope="col">{t('figma.compareColPicture')}</th>
            <th scope="col">{t('figma.compareColType')}</th>
            <th scope="col">{t('figma.compareColSpeed')}</th>
            <th scope="col">{t('figma.compareColMaterial')}</th>
            <th scope="col">{t('figma.compareColFilmType')}</th>
            <th scope="col">{t('figma.compareColFilmWidth')}</th>
            <th scope="col">{t('figma.compareColMaxRoll')}</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((m) => {
            const spec = locale === 'zh' ? m.spec : m.spec_imperial || m.spec;
            const img =
              (m.gallery_image_urls && m.gallery_image_urls[0]) ||
              m.model_image1_url ||
              m.image_url ||
              '';
            const title = locale === 'zh' ? m.model_title_zh : m.model_title_en;
            const typeCell =
              (m.model_type && m.model_type.trim()) ||
              (title && title.trim()) ||
              getSimpleProductName(m, locale) ||
              m.model ||
              '';
            const filmWidthRaw = unitSystem === 'metric' ? m.package_size_cm : m.package_size_inch;
            const filmWidth = stripUnit(filmWidthRaw, pending);
            const maxRollNum = unitSystem === 'metric' ? m.pallet_height_cm : m.pallet_height_inch;
            const maxRoll =
              maxRollNum !== null && maxRollNum !== undefined && !Number.isNaN(Number(maxRollNum))
                ? `${maxRollNum}${unitSystem === 'metric' ? ' cm' : ' in'}`
                : pending;
            const speed = guessSpeedFromSpec(spec || '') || pending;
            const material = guessMaterialFromSpec(spec || '') || pending;
            const filmType = m.unit && m.unit.trim() ? clip(m.unit, 40) : pending;

            return (
              <tr key={`${m.part_number}-${m.id}`}>
                <td className="ms-compare-td--model">{m.model || pending}</td>
                <td className="ms-compare-td-img">
                  <img src={resolvePublicUrl(img)} alt="" loading="lazy" />
                </td>
                <td>{clip(typeCell, 36) || pending}</td>
                <td>{speed}</td>
                <td>{material}</td>
                <td>{filmType}</td>
                <td>{filmWidth}</td>
                <td>{maxRoll}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
}
