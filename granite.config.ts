import { defineConfig } from '@apps-in-toss/web-framework/config';

export default defineConfig({
  appName: 'wq-dayline',
  brand: {
    displayName: '오늘 한 줄', // 화면에 노출될 앱의 한글 이름으로 바꿔주세요.
    primaryColor: '#3182F6', // 화면에 노출될 앱의 기본 색상으로 바꿔주세요.
    icon: 'https://static.toss.im/appsintoss/8211/1dafb690-4251-4735-bfe6-a9a663ba860e.png', // 화면에 노출될 앱의 아이콘 이미지 주소로 바꿔주세요.
  },
  web: {
    host: '172.20.10.2',
    port: Number(process.env.VITE_PORT) || 5173,
    commands: {
      dev: process.env.MODE ? `vite --host --mode ${process.env.MODE}` : 'vite --host',
      build: process.env.MODE ? `tsc -b && vite build --mode ${process.env.MODE}` : 'tsc -b && vite build',
    },
  },
  permissions: [],
  outdir: 'dist',
});
