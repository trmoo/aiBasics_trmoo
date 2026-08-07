/* ============================================================================
 * vite.config.js
 *
 * © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다.
 * 그 밖의 이용(재배포·2차 저작물·수업 외 목적)은 먼저 문의해 주세요.
 * 자세한 이용 범위는 이 저장소의 LICENSE 파일에 적어 두었습니다.
 * ========================================================================== */

import { defineConfig } from 'vite';
import { viteSingleFile } from 'vite-plugin-singlefile';

// 교실 인터넷이 끊겨도 쓸 수 있도록 빌드 결과를 dist/index.html 한 파일로 묶는다.
// base: './' 는 깃허브 페이지의 하위 경로에서도 자원이 열리게 하기 위함.
export default defineConfig({
  base: './',
  plugins: [viteSingleFile()],
  server: { port: Number(process.env.PORT) || 5174 },
  // 압축할 때 /*! … */ 로 시작하는 「법적 고지」 주석은 지우지 않고 그 자리에 남긴다.
  esbuild: { legalComments: 'inline' },
  build: {
    outDir: 'dist',
    assetsInlineLimit: 100000000,
    cssCodeSplit: false,
    rollupOptions: {
      output: {
        banner: '/*! 인공지능 기초 실습실 (ai-basics-lab) | © 2026 티쳐무 · 모든 권리 보유 | '
          + '학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다. | '
          + 'https://github.com/trmoo/aiBasics_trmoo */',
      },
    },
  },
});
