import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import './index.css'
import App from './App.tsx'

// 로컬/개발 환경에서 Toss RN 브릿지 상수가 없으면 `@toss/tds-mobile-ait`가 즉시 크래시 납니다.
// (예: "brandBridgeColorMode is not a constant handler")
// Toss 앱/실기기에서는 네이티브가 주입하므로, 없을 때만 안전한 기본값을 넣습니다.
if (typeof window !== 'undefined') {
  const w = window as unknown as {
    __CONSTANT_HANDLER_MAP?: Record<string, unknown>;
  };
  w.__CONSTANT_HANDLER_MAP ??= {};
  w.__CONSTANT_HANDLER_MAP.deploymentId ??= 'local';
  w.__CONSTANT_HANDLER_MAP.brandDisplayName ??= '오늘 한 줄';
  w.__CONSTANT_HANDLER_MAP.brandIcon ??=
    'https://static.toss.im/appsintoss/8211/1dafb690-4251-4735-bfe6-a9a663ba860e.png';
  w.__CONSTANT_HANDLER_MAP.brandPrimaryColor ??= '#3182F6';
  w.__CONSTANT_HANDLER_MAP.brandBridgeColorMode ??= 'basic';
  w.__CONSTANT_HANDLER_MAP.getSafeAreaTop ??= 0;
  w.__CONSTANT_HANDLER_MAP.getSafeAreaBottom ??= 0;
}

const queryClient = new QueryClient()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </StrictMode>,
)
