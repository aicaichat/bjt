// src/types/machines.ts
export interface MachineProduct {
    id: string;
    model: string;
    name: string;
    subtitle?: string;
    description?: string;
    image_url: string;
    images?: string[];
    specs: Record<string, string>;
    inventory: Array<{region: string, amount: number}>;
    prices: {
      base: number;
      tier1: number;
      tier2: number;
      vip: number;
    };
    features?: string[];
  }
  
  export interface MachineAccessory {
    id: string;
    model: string;
    title: string;
    level: number;
    image_url: string;
    parts: AccessoryPart[];
    parent_id?: string;
    compatible_machines?: string[];
    child_accessories?: MachineAccessory[];
  }
  
  export interface AccessoryPart {
    id: string;
    part_number: string;
    title: string;
    specs: Record<string, string>;
    spec: string;
    spec_imperial: string;
    prices: {
      base: number;
      tier1: number;
      tier2: number;
      vip: number;
    };
    inventory: Array<{region: string, amount: number}>;
  }
  
  export interface APIResponse<T> {
    success: boolean;
    data: T;
    message?: string;
    code?: number;
  }
  
  export interface PaginatedResponse<T> {
    success: boolean;
    data: {
      items: T[];
      total: number;
      page: number;
      page_size: number;
      total_pages: number;
    };
  }