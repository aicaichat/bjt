import http from '../../admin/api/httpAdminService';
import adminConfig from '../../admin/api/adminConfig';

const { API_BASE_URL, getAdminAuthHeaders } = adminConfig;

export interface ImportPreviewResponse {
  valid: boolean;
  token?: string;
  stats?: { insert: number; update: number; skip: number };
  errors?: { row: number; field: string; message: string }[];
}

export async function previewImport(entity: string, mode: string, rows: any[]): Promise<ImportPreviewResponse> {
  const { data } = await http.post<ImportPreviewResponse>(`/admin/import/preview`, { entity, mode, rows });
  return data;
}

export async function commitImport(token: string) {
  const { data } = await http.post(`/admin/import/commit`, { token });
  return data;
}

// Download import template or data CSV and trigger browser download
export async function downloadImportCsv(entity: string, mode: 'template' | 'data' = 'template') {
  const headers = getAdminAuthHeaders();
  const response = await fetch(`${API_BASE_URL}/admin/import/export?entity=${entity}&mode=${mode}`, {
    method: 'GET',
    headers,
  });
  if (!response.ok) {
    throw new Error('Failed to download CSV');
  }
  const blob = await response.blob();
  const url = window.URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = `${entity}-${mode}.csv`;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.URL.revokeObjectURL(url);
} 