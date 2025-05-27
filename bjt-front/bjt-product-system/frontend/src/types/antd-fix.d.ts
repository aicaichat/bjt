// 修复 Ant Design 组件类型问题
declare module 'antd' {
  import { ComponentType } from 'react';
  
  // 重新声明有问题的组件类型
  export const Space: ComponentType<any>;
  export const Button: ComponentType<any>;
  export const Card: ComponentType<any>;
  export const Form: ComponentType<any> & {
    Item: ComponentType<any>;
    useForm: () => any[];
  };
  export const Input: ComponentType<any> & {
    Search: ComponentType<any>;
    Password: ComponentType<any>;
    TextArea: ComponentType<any>;
  };
  export const Select: ComponentType<any> & {
    Option: ComponentType<any>;
  };
  export const Table: ComponentType<any>;
  export const Tag: ComponentType<any>;
  export const Badge: ComponentType<any>;
  export const Avatar: ComponentType<any>;
  export const Tooltip: ComponentType<any>;
  export const Divider: ComponentType<any>;
  export const Modal: ComponentType<any> & {
    confirm: (config: any) => any;
  };
  export const Upload: ComponentType<any>;
  export const Tabs: ComponentType<any> & {
    TabPane: ComponentType<any>;
  };
  export const Row: ComponentType<any>;
  export const Col: ComponentType<any>;
  export const Alert: ComponentType<any>;
  export const InputNumber: ComponentType<any>;
  export const Switch: ComponentType<any>;
  export const Spin: ComponentType<any>;
  export const Breadcrumb: ComponentType<any> & {
    Item: ComponentType<any>;
  };
  export const Layout: ComponentType<any> & {
    Header: ComponentType<any>;
    Content: ComponentType<any>;
    Sider: ComponentType<any>;
  };
  export const Menu: ComponentType<any> & {
    Item: ComponentType<any>;
    SubMenu: ComponentType<any>;
    Divider: ComponentType<any>;
  };
  export const Dropdown: ComponentType<any>;
  export const Typography: ComponentType<any> & {
    Title: ComponentType<any>;
    Text: ComponentType<any>;
    Paragraph: ComponentType<any>;
  };
  export const Image: ComponentType<any>;
  export const Progress: ComponentType<any>;
  export const Checkbox: ComponentType<any> & {
    Group: ComponentType<any>;
  };
  export const List: ComponentType<any> & {
    Item: ComponentType<any>;
  };
  export const Popconfirm: ComponentType<any>;
  export const Radio: ComponentType<any> & {
    Group: ComponentType<any>;
  };
  export const AutoComplete: ComponentType<any>;
  export const Tree: ComponentType<any>;
  export const DatePicker: ComponentType<any>;
  export const TimePicker: ComponentType<any>;
  export const Cascader: ComponentType<any>;
  export const Transfer: ComponentType<any>;
  export const Steps: ComponentType<any> & {
    Step: ComponentType<any>;
  };
  export const Rate: ComponentType<any>;
  export const Slider: ComponentType<any>;
  export const TreeSelect: ComponentType<any>;

  // 表格相关接口
  export interface TableProps<T = any> {
    dataSource?: T[];
    columns?: any[];
    pagination?: any;
    loading?: boolean;
    onChange?: (pagination: any, filters: any, sorter: any) => void;
    rowSelection?: any;
    [key: string]: any;
  }

  // 上传组件接口
  export interface UploadProps {
    accept?: string;
    showUploadList?: boolean;
    beforeUpload?: (file: any) => boolean | Promise<boolean>;
    customRequest?: (options: any) => void;
    onChange?: (info: any) => void;
    [key: string]: any;
  }

  // Spin组件接口
  export interface SpinProps {
    spinning?: boolean;
    size?: 'small' | 'default' | 'large';
    tip?: string;
    delay?: number;
    [key: string]: any;
  }

  // 消息提示
  export const message: {
    success: (content: string) => void;
    error: (content: string) => void;
    info: (content: string) => void;
    warning: (content: string) => void;
    loading: (content: string) => void;
  };

  // 通知提示
  export const notification: {
    success: (config: any) => void;
    error: (config: any) => void;
    info: (config: any) => void;
    warning: (config: any) => void;
  };
}

// 修复 Ant Design Icons 类型问题
declare module '@ant-design/icons' {
  import { ComponentType } from 'react';
  
  export const PlusOutlined: ComponentType<any>;
  export const EditOutlined: ComponentType<any>;
  export const DeleteOutlined: ComponentType<any>;
  export const UserOutlined: ComponentType<any>;
  export const LockOutlined: ComponentType<any>;
  export const UnlockOutlined: ComponentType<any>;
  export const GlobalOutlined: ComponentType<any>;
  export const ArrowLeftOutlined: ComponentType<any>;
  export const UploadOutlined: ComponentType<any>;
  export const DownloadOutlined: ComponentType<any>;
  export const SaveOutlined: ComponentType<any>;
  export const ReloadOutlined: ComponentType<any>;
  export const SettingOutlined: ComponentType<any>;
  export const MailOutlined: ComponentType<any>;
  export const SecurityScanOutlined: ComponentType<any>;
  export const IdcardOutlined: ComponentType<any>;
  export const SearchOutlined: ComponentType<any>;
  export const WarningOutlined: ComponentType<any>;
  export const InfoCircleOutlined: ComponentType<any>;
  export const CheckCircleOutlined: ComponentType<any>;
  export const CloseCircleOutlined: ComponentType<any>;
  export const ExclamationCircleOutlined: ComponentType<any>;
  export const EyeOutlined: ComponentType<any>;
  export const EyeInvisibleOutlined: ComponentType<any>;
  export const BranchesOutlined: ComponentType<any>;
  export const BugOutlined: ComponentType<any>;
  export const LinkOutlined: ComponentType<any>;
  export const CopyOutlined: ComponentType<any>;
  export const FileOutlined: ComponentType<any>;
  export const FolderOutlined: ComponentType<any>;
  export const HomeOutlined: ComponentType<any>;
  export const MenuOutlined: ComponentType<any>;
  export const SyncOutlined: ComponentType<any>;
  export const LoadingOutlined: ComponentType<any>;
  export const RightOutlined: ComponentType<any>;
  export const LeftOutlined: ComponentType<any>;
  export const UpOutlined: ComponentType<any>;
  export const DownOutlined: ComponentType<any>;
  export const FilterOutlined: ComponentType<any>;
  export const SortAscendingOutlined: ComponentType<any>;
  export const SortDescendingOutlined: ComponentType<any>;
  export const QuestionCircleOutlined: ComponentType<any>;
  export const HeartOutlined: ComponentType<any>;
  export const StarOutlined: ComponentType<any>;
  export const TeamOutlined: ComponentType<any>;
  export const ShoppingCartOutlined: ComponentType<any>;
  export const DashboardOutlined: ComponentType<any>;
  export const BarChartOutlined: ComponentType<any>;
  export const LineChartOutlined: ComponentType<any>;
  export const PieChartOutlined: ComponentType<any>;
  export const CalendarOutlined: ComponentType<any>;
  export const ClockCircleOutlined: ComponentType<any>;
  export const EnvironmentOutlined: ComponentType<any>;
  export const PhoneOutlined: ComponentType<any>;
  export const MobileOutlined: ComponentType<any>;
  export const TabletOutlined: ComponentType<any>;
  export const LaptopOutlined: ComponentType<any>;
  export const DesktopOutlined: ComponentType<any>;
  export const PrinterOutlined: ComponentType<any>;
  export const ScanOutlined: ComponentType<any>;
  export const CameraOutlined: ComponentType<any>;
  export const VideoCameraOutlined: ComponentType<any>;
  export const AudioOutlined: ComponentType<any>;
  export const CustomerServiceOutlined: ComponentType<any>;
  export const UsergroupAddOutlined: ComponentType<any>;
  export const UserAddOutlined: ComponentType<any>;
  export const UserDeleteOutlined: ComponentType<any>;
  export const SolutionOutlined: ComponentType<any>;
  export const ReconciliationOutlined: ComponentType<any>;
  export const FileDoneOutlined: ComponentType<any>;
  export const FileProtectOutlined: ComponentType<any>;
  export const FileTextOutlined: ComponentType<any>;
  export const FilePdfOutlined: ComponentType<any>;
  export const FileWordOutlined: ComponentType<any>;
  export const FileExcelOutlined: ComponentType<any>;
  export const FilePptOutlined: ComponentType<any>;
  export const FileImageOutlined: ComponentType<any>;
  export const FileZipOutlined: ComponentType<any>;
  export const FileUnknownOutlined: ComponentType<any>;
  export const FileAddOutlined: ComponentType<any>;
  export const FileExclamationOutlined: ComponentType<any>;
  export const FileSearchOutlined: ComponentType<any>;
  export const FileSyncOutlined: ComponentType<any>;
  export const AppstoreOutlined: ComponentType<any>;
  export const AppstoreAddOutlined: ComponentType<any>;
  export const BellOutlined: ComponentType<any>;
  export const CalculatorOutlined: ComponentType<any>;
  export const BuildOutlined: ComponentType<any>;
  export const ToolOutlined: ComponentType<any>;
  export const RocketOutlined: ComponentType<any>;
  export const ExperimentOutlined: ComponentType<any>;
  export const TrophyOutlined: ComponentType<any>;
  export const CrownOutlined: ComponentType<any>;
  export const DiamondOutlined: ComponentType<any>;
  export const GiftOutlined: ComponentType<any>;
  export const RedEnvelopeOutlined: ComponentType<any>;
} 