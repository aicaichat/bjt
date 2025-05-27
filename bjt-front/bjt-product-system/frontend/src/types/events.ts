// 通用事件类型定义
export type InputChangeEvent = React.ChangeEvent<HTMLInputElement>;
export type TextAreaChangeEvent = React.ChangeEvent<HTMLTextAreaElement>;
export type SelectChangeEvent = string | number | undefined;
export type ButtonClickEvent = React.MouseEvent<HTMLButtonElement>;
export type TableChangeEvent = (pagination: any, filters: any, sorter: any) => void;
export type PaginationShowTotal = (total: number, range?: [number, number]) => string;

// 表单验证类型
export type FormValidator = (rule: any, value: any) => Promise<void>;

// 表格行操作类型
export type TableRowEvent<T> = (record: T) => {
  onClick?: () => void;
  className?: string;
  [key: string]: any;
};

// 文件上传类型
export type FileUploadEvent = (file: File) => Promise<void>;

// 常用的Select选项类型
export interface SelectOption {
  label: string;
  value: string | number;
  disabled?: boolean;
}

// 搜索事件类型
export type SearchEvent = (value: string) => void; 