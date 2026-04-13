import React from 'react';

export interface IconProps {
  size?: number;
  color?: string;
  className?: string;
}

const baseStyle = { display: 'inline-block', verticalAlign: 'middle' };

// 产品线管理图标 - 文档/页面编辑
export const ProductLineIcon: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  className
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={baseStyle}
    className={className}
  >
    <path
      d="M14 2H6C4.9 2 4 2.9 4 4V20C4 21.1 4.9 22 6 22H18C19.1 22 20 21.1 20 20V8L14 2Z"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
      fill="none"
    />
    <path
      d="M14 2V8H20"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 13H16"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 17H13"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="17" cy="17" r="2" stroke={color} strokeWidth="1.5" fill="none"/>
    <path d="M17 15.5V16.5L17.5 17" stroke={color} strokeWidth="1" strokeLinecap="round"/>
  </svg>
);

// 气垫机图标 - 机器/设备
export const AirCushionMachineIcon: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  className
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={baseStyle}
    className={className}
  >
    <rect
      x="4" y="6" width="16" height="12" rx="2"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M8 10H10"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 14H10"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <circle cx="15" cy="12" r="2.5" stroke={color} strokeWidth="1.5" fill="none"/>
    <path
      d="M17 10L18 9"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M2 10H4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M2 14H4"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M20 10H22"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M20 14H22"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// 纸垫机图标 - 纸张/文档堆叠
export const PaperMachineIcon: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  className
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={baseStyle}
    className={className}
  >
    <path
      d="M4 6C4 5.44772 4.44772 5 5 5H15L20 10V19C20 19.5523 19.5523 20 19 20H5C4.44772 20 4 19.5523 4 19V6Z"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M14 5V10H20"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
    <path
      d="M8 13L16 13"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M8 17L13 17"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M2 8V4C2 2.89543 2.89543 2 4 2H14"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
);

// 胶带机图标 - 胶带卷
export const TapeMachineIcon: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  className
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={baseStyle}
    className={className}
  >
    <rect
      x="6" y="3" width="12" height="18" rx="2"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <circle
      cx="12" cy="8" r="3"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <circle
      cx="12" cy="16" r="3"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <circle
      cx="12" cy="8" r="1"
      fill={color}
    />
    <circle
      cx="12" cy="16" r="1"
      fill={color}
    />
  </svg>
);

// 用户管理图标
export const UserManagementIcon: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  className
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={baseStyle}
    className={className}
  >
    <circle
      cx="12" cy="8" r="4"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M4 20C4 15.5817 7.58172 12 12 12C16.4183 12 20 15.5817 20 20"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      fill="none"
    />
    <path
      d="M16 16C16 16 17.5 17 18 19"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
      opacity="0.5"
    />
  </svg>
);

// 系统设置图标
export const SystemSettingsIcon: React.FC<IconProps> = ({
  size = 20,
  color = 'currentColor',
  className
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={baseStyle}
    className={className}
  >
    <circle
      cx="12" cy="12" r="3"
      stroke={color}
      strokeWidth="1.5"
      fill="none"
    />
    <path
      d="M12 1V5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M12 19V23"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4.22 4.22L7.05 7.05"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M16.95 16.95L19.78 19.78"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M1 12H5"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M19 12H23"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M4.22 19.78L7.05 16.95"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
    <path
      d="M16.95 7.05L19.78 4.22"
      stroke={color}
      strokeWidth="1.5"
      strokeLinecap="round"
    />
  </svg>
);

// 展开/折叠箭头
export const ChevronDownIcon: React.FC<IconProps> = ({
  size = 12,
  color = 'currentColor',
  className
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={baseStyle}
    className={className}
  >
    <path
      d="M6 9L12 15L18 9"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

export const ChevronRightIcon: React.FC<IconProps> = ({
  size = 12,
  color = 'currentColor',
  className
}) => (
  <svg
    width={size}
    height={size}
    viewBox="0 0 24 24"
    fill="none"
    style={baseStyle}
    className={className}
  >
    <path
      d="M9 18L15 12L9 6"
      stroke={color}
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    />
  </svg>
);

// 图标映射
export const AdminIcons = {
  ProductLineIcon,
  AirCushionMachineIcon,
  PaperMachineIcon,
  TapeMachineIcon,
  UserManagementIcon,
  SystemSettingsIcon,
  ChevronDownIcon,
  ChevronRightIcon,
};

export default AdminIcons;
