/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_USE_MOCK_DATA: string;
  readonly VITE_API_BASE_URL: string;
  // 你可以在这里添加其他需要的环境变量类型
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
