export interface AdminMultilingualText {
  zh: string;
  en: string;
}

export interface AdminSubItem {
  id?: string; // Optional if new
  key?: string; // For React list rendering, might not be part of the backend model
  title: AdminMultilingualText;
  description: AdminMultilingualText;
  // Add any other fields a subitem might have, e.g., image_url
}

export interface AdminProductLine {
  id?: string; // Optional if creating a new product line
  title: AdminMultilingualText;
  description: AdminMultilingualText;
  subItems: AdminSubItem[];
  imageUrl?: string; // URL of the main product line image
  // Add other fields like status, code, etc., if managed by admin
  // For example, from your frontend/src/types/index.ts:
  // code?: string;
  // status?: 'active' | 'inactive';
  // createdAt?: string;
  // updatedAt?: string;
}

// Add other admin-specific models here as needed, e.g.:
// export interface AdminHostModel { ... }
// export interface AdminPart { ... }
// export interface AdminUser { ... }

export type AdminModelStatus = 'active' | 'inactive'; // Or specific strings like '已上架' | '已下架'

export interface AdminHostModel {
  id: string;
  name: string; // 型号名称 e.g., LA-E4S
  status: AdminModelStatus;
  // Potentially other fields from mockup/3.html (edit page)
  // description?: AdminMultilingualText;
  // productLineId?: string;
  // mainImageUrl?: string;
  // explodedViewPdfUrl?: string;
}

export interface AdminPart {
  id: string;
  hostModelId?: string; // ID of the host model it belongs to
  hostModelName?: string; // Name of the host model for display (e.g., LA-E4S)
  partNumber: string; // 料号 e.g., 13A00001
  status: AdminModelStatus;
  // Potentially other fields from mockup/4.html (edit page)
  // voltage?: string;
  // name_multilingual?: AdminMultilingualText;
  // spec_params_multilingual?: AdminMultilingualText;
  // logistics_packaging_size?: string;
  // logistics_net_weight_kg?: number;
  // logistics_gross_weight_kg?: number;
  // imageUrl?: string;
} 