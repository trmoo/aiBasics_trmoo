/* ============================================================================
 * vite.config.js
 *
 * Copyright 2026 trmoo
 * SPDX-License-Identifier: Apache-2.0
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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
        banner: '/*! 인공지능 기초 실습실 (ai-basics-lab) | Copyright 2026 trmoo | '
          + 'SPDX-License-Identifier: Apache-2.0 | http://www.apache.org/licenses/LICENSE-2.0 */',
      },
    },
  },
});
