/* ============================================================================
 * cnn.js — 학습지 17~18쪽 「합성곱 신경망 (CNN)」
 *
 *   ① 컴퓨터 비전 활용 사례와 기존 신경망의 한계
 *   ② 합성곱 연산기 : 8×8 격자를 직접 칠하고 필터를 슬라이딩시켜 6×6 특징맵을 만든다
 *                     한 칸씩 옮겨 가며 곱셈 아홉 개의 계산식을 그대로 보여 준다
 *   ③ 풀링 연산기 : 최대 풀링 / 평균 풀링
 *
 * 학습지 18쪽 예제(입력 8×8, 필터 [-1 0 1] 반복, 출력 6×6)를 그대로 다룰 수 있게 했다.
 * 원본 입력 그림은 이미지라 값을 읽을 수 없어, 세로 경계가 두 번 나타나는 자료를 기본으로 넣었다.
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

import { h, add, clear, card, sheetHead, note, answer, quizSet, table, pyBox, fx, pillGroup, clearScreenInterval, screenInterval } from '../../lib/ui.js';

const N = 8;
const K = 3;
const OUT = N - K + 1; // 6

/* 필터 (커널) — 이미지에서 특징을 추출하는 가중치 묶음 */
const FILTERS = {
  vedge: {
    nm: '세로 경계 검출', k: [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]],
    d: '학습지 18쪽 예제의 필터입니다. 오른쪽 값에서 왼쪽 값을 뺍니다. '
      + '0 → 1 로 바뀌는 세로 경계에서는 양수, 1 → 0 으로 바뀌는 경계에서는 음수, 값이 일정한 곳에서는 0 이 나옵니다.',
  },
  hedge: {
    nm: '가로 경계 검출', k: [[-1, -1, -1], [0, 0, 0], [1, 1, 1]],
    d: '아래쪽 값에서 위쪽 값을 뺍니다. 위아래로 값이 바뀌는 가로 경계를 찾아냅니다.',
  },
  blur: {
    nm: '흐리게 (블러)', k: [[1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9], [1 / 9, 1 / 9, 1 / 9]],
    d: '주변 아홉 칸의 평균을 냅니다. 잔잔한 잡음이 사라지고 그림이 뭉개집니다.',
  },
  sharp: {
    nm: '또렷하게 (샤픈)', k: [[0, -1, 0], [-1, 5, -1], [0, -1, 0]],
    d: '가운데를 강조하고 이웃을 뺍니다. 경계가 더 도드라집니다.',
  },
};

/* 기본 입력 — 가운데에 세로 띠가 있어 경계가 두 번 나타난다 */
export function defaultInput() {
  return Array.from({ length: N }, () => Array.from({ length: N }, (_, c) => (c >= 3 && c <= 5 ? 1 : 0)));
}

/**
 * 합성곱 연산 — 입력과 필터에서 대응하는 원소끼리 곱한 뒤 총합을 구한다.
 * 필터를 한 칸씩 슬라이딩하므로 입력 n×n · 필터 k×k → 출력 (n−k+1)×(n−k+1) 이 된다.
 */
export function convolve(img, kernel) {
  const n = img.length;
  const k = kernel.length;
  const m = n - k + 1;
  const out = [];
  for (let r = 0; r < m; r++) {
    const row = [];
    for (let c = 0; c < m; c++) {
      let s = 0;
      for (let i = 0; i < k; i++) for (let j = 0; j < k; j++) s += img[r + i][c + j] * kernel[i][j];
      row.push(s);
    }
    out.push(row);
  }
  return out;
}

/** 풀링 — 2×2 씩 묶어 최댓값(max) 또는 평균(avg) 하나로 줄인다 */
export function pool(src, mode = 'max') {
  const n = src.length;
  const m = Math.floor(n / 2);
  const out = [];
  for (let r = 0; r < m; r++) {
    const row = [];
    for (let c = 0; c < m; c++) {
      const v = [src[2 * r][2 * c], src[2 * r][2 * c + 1], src[2 * r + 1][2 * c], src[2 * r + 1][2 * c + 1]];
      row.push(mode === 'max' ? Math.max(...v) : v.reduce((a, b) => a + b, 0) / 4);
    }
    out.push(row);
  }
  return out;
}

export function render(root) {
  add(root, sheetHead('학습지 17~18쪽', '합성곱 신경망 (CNN)',
    ['[12인기03-05]'],
    [
      '기존 인공 신경망이 이미지를 다룰 때 무엇을 잃는지 설명할 수 있다.',
      '합성곱 연산을 직접 계산해 특징맵을 만들 수 있다.',
      '풀링 연산이 무엇을 하는지 설명할 수 있다.',
    ]));

  root.append(visionCard());
  root.append(convLab());
  root.append(poolCard());
  root.append(quizCard());
}

/* ─────────────────────── 컴퓨터 비전 · CNN 구조 ────────────────── */

function visionCard() {
  return card('👁️ 컴퓨터 비전과 CNN 의 구조',
    h('p', {}, '컴퓨터가 이미지나 비디오에서 객체를 인식하는 방법을 연구하는 분야를 ',
      h('b', {}, '컴퓨터 비전'), ' 이라고 합니다.'),
    table(['활용 사례', '무엇을 하나'], [
      [h('td', { style: { fontWeight: '800' } }, '① 객체 탐지 (object detection)'),
        h('td', { class: 'left' }, '이미지나 비디오에서 특정 객체의 위치를 찾아내는 기술')],
      [h('td', { style: { fontWeight: '800' } }, '② 객체 세그멘테이션 (object segmentation)'),
        h('td', { class: 'left' }, '객체의 픽셀별 경계를 정확하게 구분하여 분할하는 기술')],
      [h('td', { style: { fontWeight: '800' } }, '③ 자세 추정 (pose estimation)'),
        h('td', { class: 'left' }, '사람 또는 객체의 관절 위치를 추정하고 자세를 파악하는 기술')],
    ]),
    h('h4', {}, '객체 탐지 vs 객체 세그멘테이션'),
    table(['항목', '객체 탐지', '객체 세그멘테이션'], [
      ['위치 표현', h('td', {}, [answer('사각형 박스')]), h('td', {}, [answer('픽셀 단위')])],
      ['정확도', h('td', {}, [answer('대략적 위치')]), h('td', {}, [answer('매우 정확한 모양')])],
      ['계산량', '비교적 적음', '많음'],
      ['난이도', '중간', '더 어려움'],
    ]),
    h('h4', {}, '기존 인공 신경망의 한계'),
    h('p', {}, '이미지는 ', answer('가로'), ' · ', answer('세로'), ' · ', answer('색상(채널)'),
      ' 같은 3차원 정보를 담고 있는데, 기존 신경망에 넣으려면 이것을 평평한 1차원으로 펴야(평탄화) 합니다. ',
      '그러면 다차원 형상을 무시하고 모든 입력을 동등한 뉴런으로 취급하게 되어 ',
      h('b', {}, '형상에 담긴 정보를 살릴 수 없습니다'), '.'),
    note('ok', h('b', {}, '합성곱 신경망의 장점 '),
      '① 물체의 위치와 방향에 관계없이 물체의 고유한 특징을 학습합니다. ',
      '② 이미지의 공간적 특징(형상 정보)을 유지하면서 특징을 추출합니다.'),
    h('h4', {}, 'CNN 의 구조'),
    table(['단계', '무엇'], [
      [h('td', { style: { fontWeight: '800' } }, '1) 특징 추출'),
        h('td', { class: 'left' }, [answer('합성곱 층'), ' — ', answer('풀링 층'), ' 의 반복'])],
      [h('td', { style: { fontWeight: '800' } }, '2) 분류'),
        h('td', { class: 'left' }, ['기존 인공 신경망의 다층 퍼셉트론 (완전 연결 계층)'])],
    ]),
    note('', h('b', {}, '깊어지면 무엇이 달라지나요? '),
      '합성곱 신경망이 깊어지면 점점 더 ', answer('추상화'), ' 된 다층의 특징이 추출됩니다. ',
      '앞쪽 층은 선과 경계, 중간 층은 눈·코 같은 부품, 뒤쪽 층은 얼굴 전체를 봅니다.'));
}

/* ────────────────────────── 합성곱 연산기 ─────────────────────── */

function convLab() {
  let img = defaultInput();
  let fid = 'vedge';
  let pos = 0; // 0 ~ 35 (6×6)
  let timer = null;

  const inBox = h('div', {});
  const kBox = h('div', {});
  const outBox = h('div', {});
  const calc = h('div', { style: { marginTop: '12px' } });

  const fPick = pillGroup(Object.entries(FILTERS).map(([id, f]) => ({ id, label: f.nm })), {
    value: 'vedge', onPick: (v) => { fid = v; paint(); },
  });

  /** 특징맵 전체를 계산한다 */
  const feature = () => convolve(img, FILTERS[fid].k);

  /** 특징맵 값에 따른 색 — 양수는 빨강, 음수는 파랑 */
  function fcolor(v, mx) {
    if (Math.abs(v) < 1e-9) return '#f4f6fa';
    const t = Math.min(1, Math.abs(v) / (mx || 1));
    return v > 0 ? `rgba(207,48,48,${0.15 + t * 0.7})` : `rgba(30,111,217,${0.15 + t * 0.7})`;
  }

  function paint() {
    const k = FILTERS[fid].k;
    const fm = feature();
    const pr = Math.floor(pos / OUT); const pc = pos % OUT;
    const mx = Math.max(...fm.flat().map(Math.abs), 1);

    /* ── 입력 8×8 ── */
    clear(inBox);
    const grid = h('div', { class: 'grid-board', style: { gridTemplateColumns: `repeat(${N}, 38px)` } });
    for (let r = 0; r < N; r++) {
      for (let c = 0; c < N; c++) {
        const inWin = r >= pr && r < pr + K && c >= pc && c < pc + K;
        const cell = h('div', {
          class: 'cellbox' + (img[r][c] ? ' on' : ''),
          style: {
            height: '38px', fontSize: '1rem',
            outline: inWin ? '3px solid #d9781e' : 'none',
            outlineOffset: '-2px',
            zIndex: inWin ? '2' : '1',
            position: 'relative',
          },
          onclick: () => { img[r][c] = img[r][c] ? 0 : 1; paint(); },
        }, String(img[r][c]));
        grid.append(cell);
      }
    }
    inBox.append(grid);

    /* ── 필터 3×3 ── */
    clear(kBox);
    const kg = h('div', { class: 'grid-board', style: { gridTemplateColumns: `repeat(${K}, 52px)` } });
    k.forEach((row) => row.forEach((v) => {
      kg.append(h('div', {
        class: 'cellbox',
        style: {
          height: '46px', fontSize: '0.95rem',
          background: v > 0 ? '#ffe0e0' : v < 0 ? '#dcebff' : '#f1f4f9',
          fontWeight: '800',
        },
      }, fid === 'blur' ? '1/9' : String(v)));
    }));
    kBox.append(kg);

    /* ── 출력 6×6 ── */
    clear(outBox);
    const og = h('div', { class: 'grid-board', style: { gridTemplateColumns: `repeat(${OUT}, 46px)` } });
    for (let r = 0; r < OUT; r++) {
      for (let c = 0; c < OUT; c++) {
        const done = r * OUT + c <= pos;
        og.append(h('div', {
          class: 'cellbox',
          style: {
            height: '42px', fontSize: '0.9rem',
            background: done ? fcolor(fm[r][c], mx) : '#fbfcfe',
            color: done ? 'var(--ink)' : '#c9d2df',
            outline: r === pr && c === pc ? '3px solid #d9781e' : 'none',
            outlineOffset: '-2px',
            fontWeight: '800',
          },
          onclick: () => { pos = r * OUT + c; paint(); },
        }, done ? fx(fm[r][c], fid === 'blur' ? 2 : 0) : '·'));
      }
    }
    outBox.append(og);

    /* ── 지금 칸의 계산식 ── */
    const terms = [];
    for (let i = 0; i < K; i++) {
      for (let j = 0; j < K; j++) {
        terms.push(`${img[pr + i][pc + j]}×${fid === 'blur' ? '(1/9)' : k[i][j]}`);
      }
    }
    clear(calc);
    add(calc, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `특징맵 (${pr}, ${pc}) 칸`),
        h('span', { class: 'chip' }, `= ${fx(fm[pr][pc], 3)}`)),
      h('pre', { class: 'code', style: { marginTop: '8px', fontSize: '0.9rem' } },
        terms.join(' + ') + '\n  = ' + fx(fm[pr][pc], 3)),
      h('div', { class: 'note' }, h('b', {}, FILTERS[fid].nm + ' — '), FILTERS[fid].d),
    ]);
  }

  const playBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      if (timer) { clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 처음부터 슬라이딩'; return; }
      pos = 0; playBtn.textContent = '⏸ 멈추기';
      paint();
      timer = screenInterval(() => {
        pos++;
        if (pos >= OUT * OUT) { pos = OUT * OUT - 1; clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 처음부터 슬라이딩'; }
        paint();
      }, 160);
    },
  }, '▶ 처음부터 슬라이딩');

  const presets = h('div', { class: 'row tight' },
    h('button', { type: 'button', class: 'btn ghost small', onclick: () => { img = defaultInput(); pos = 0; paint(); } }, '세로 띠'),
    h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => {
        img = Array.from({ length: N }, (_, r) => Array.from({ length: N }, () => (r >= 3 && r <= 5 ? 1 : 0)));
        pos = 0; paint();
      },
    }, '가로 띠'),
    h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => {
        img = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => ((r >= 2 && r <= 5 && c >= 2 && c <= 5) ? 1 : 0)));
        pos = 0; paint();
      },
    }, '네모'),
    h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => {
        img = Array.from({ length: N }, (_, r) => Array.from({ length: N }, (_, c) => (Math.abs(r - c) <= 1 ? 1 : 0)));
        pos = 0; paint();
      },
    }, '대각선'),
    h('button', { type: 'button', class: 'btn gray small', onclick: () => { img = Array.from({ length: N }, () => new Array(N).fill(0)); pos = 0; paint(); } }, '모두 지우기'));

  paint();

  return card('🔍 합성곱 연산기 — 직접 칠하고 필터를 굴려 보세요',
    h('div', { class: 'lead' },
      '합성곱 연산은 입력과 필터(커널)에 ', h('b', {}, '대응하는 원소끼리 곱한 후 그 총합'), ' 을 구하면서 특징맵을 만듭니다. ',
      '입력 격자의 칸을 누르면 0 ↔ 1 이 바뀝니다.'),
    presets,
    h('div', { class: 'row', style: { marginTop: '10px' } }, h('label', { class: 'field' }, '필터'), fPick.el),
    h('div', { class: 'row top', style: { marginTop: '14px', gap: '22px' } },
      h('div', {}, h('div', { style: { fontWeight: '800', marginBottom: '6px', color: 'var(--ink-soft)' } }, `입력 데이터 ${N}×${N}`), inBox),
      h('div', {}, h('div', { style: { fontWeight: '800', marginBottom: '6px', color: 'var(--ink-soft)' } }, `필터(커널) ${K}×${K}`), kBox),
      h('div', {}, h('div', { style: { fontWeight: '800', marginBottom: '6px', color: 'var(--ink-soft)' } }, `특징맵 ${OUT}×${OUT}`), outBox)),
    h('div', { class: 'row', style: { marginTop: '12px' } },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { pos = Math.max(0, pos - 1); paint(); } }, '◀ 앞 칸'),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { pos = Math.min(OUT * OUT - 1, pos + 1); paint(); } }, '다음 칸 ▶'),
      playBtn),
    calc,
    note('', h('b', {}, '왜 8×8 이 6×6 이 되나요? '),
      `필터 ${K}×${K} 가 한 칸씩 슬라이딩하면 가로로 ${N} − ${K} + 1 = ${OUT} 자리, 세로로도 ${OUT} 자리밖에 놓을 수 없습니다. `,
      '그래서 출력이 작아집니다. 크기를 유지하려면 가장자리에 0 을 두르는 「패딩」을 씁니다.'),
    note('ok', h('b', {}, '커널이란 '),
      '이미지에서 특징을 추출하는 필터로, ', h('b', {}, '가중치 값으로 구성'), '됩니다. ',
      '여기서는 사람이 만든 필터를 골랐지만, 실제 CNN 에서는 이 아홉 개의 숫자를 ',
      h('b', {}, '학습으로 스스로 찾아냅니다'), '. 앞 화면에서 본 오차 역전파가 이 숫자들을 고쳐 나갑니다.'),
    pyBox([
      "from tensorflow import keras",
      "",
      "model = keras.Sequential([",
      "    keras.layers.Conv2D(32, (3,3), activation='relu', input_shape=(28,28,1)),",
      "    keras.layers.MaxPooling2D((2,2)),      # 최대 풀링",
      "    keras.layers.Conv2D(64, (3,3), activation='relu'),",
      "    keras.layers.MaxPooling2D((2,2)),",
      "    keras.layers.Flatten(),                # 여기서 평탄화 (분류 단계로)",
      "    keras.layers.Dense(10, activation='softmax'),",
      "])",
    ].join('\n')));
}

/* ──────────────────────────── 풀링 ──────────────────────────── */

function poolCard() {
  let src = [
    [1, 3, 2, 4, 0, 1],
    [5, 6, 1, 2, 3, 0],
    [2, 1, 7, 8, 1, 2],
    [0, 4, 3, 9, 2, 1],
    [6, 2, 1, 0, 5, 3],
    [1, 0, 2, 4, 1, 7],
  ];
  let mode = 'max';
  const out = h('div', {});

  const mPick = pillGroup([
    { id: 'max', label: '최대 풀링 (max)' },
    { id: 'avg', label: '평균 풀링 (average)' },
  ], { value: 'max', onPick: (v) => { mode = v; paint(); } });

  function paint() {
    const n = src.length;
    const m = n / 2;
    const res = pool(src, mode);
    /* 최대 풀링일 때 어느 칸이 뽑혔는지 표시하려고 자리를 따로 찾아 둔다 */
    const picked = new Set();
    if (mode === 'max') {
      for (let r = 0; r < m; r++) {
        for (let c = 0; c < m; c++) {
          const four = [[2 * r, 2 * c], [2 * r, 2 * c + 1], [2 * r + 1, 2 * c], [2 * r + 1, 2 * c + 1]];
          const vals = four.map(([a, b]) => src[a][b]);
          const best = four[vals.indexOf(Math.max(...vals))];
          picked.add(`${best[0]},${best[1]}`);
        }
      }
    }

    const grid = h('div', { class: 'grid-board', style: { gridTemplateColumns: `repeat(${n}, 44px)` } });
    for (let r = 0; r < n; r++) {
      for (let c = 0; c < n; c++) {
        const blockR = Math.floor(r / 2); const blockC = Math.floor(c / 2);
        const tint = (blockR + blockC) % 2 ? '#eef4ff' : '#fff8ec';
        grid.append(h('div', {
          class: 'cellbox',
          style: {
            height: '42px', fontSize: '1rem',
            background: mode === 'max' && picked.has(`${r},${c}`) ? '#c9ecd9' : tint,
            fontWeight: mode === 'max' && picked.has(`${r},${c}`) ? '800' : '600',
          },
          onclick: () => { src[r][c] = (src[r][c] + 1) % 10; paint(); },
        }, String(src[r][c])));
      }
    }

    const og = h('div', { class: 'grid-board', style: { gridTemplateColumns: `repeat(${m}, 58px)` } });
    res.forEach((row) => row.forEach((v) => {
      og.append(h('div', {
        class: 'cellbox',
        style: { height: '54px', fontSize: '1.05rem', background: '#e6f6ef', fontWeight: '800' },
      }, fx(v, mode === 'avg' ? 2 : 0)));
    }));

    clear(out);
    add(out, [
      h('div', { class: 'row top', style: { gap: '28px' } },
        h('div', {}, h('div', { style: { fontWeight: '800', marginBottom: '6px', color: 'var(--ink-soft)' } },
          `특징맵 ${n}×${n} (칸을 누르면 값이 +1)`), grid),
        h('div', {}, h('div', { style: { fontWeight: '800', marginBottom: '6px', color: 'var(--ink-soft)' } },
          `풀링 결과 ${m}×${m}`), og)),
      h('div', { class: 'row tight', style: { marginTop: '12px' } },
        h('span', { class: 'chip' }, `칸 수 ${n * n}개 → ${m * m}개 (¼ 로 줄었습니다)`),
        mode === 'max' ? h('span', { class: 'chip ok' }, '초록 칸 = 각 2×2 에서 뽑힌 최댓값') : null),
    ]);
  }
  paint();

  return card('🧱 풀링 연산 — 특징맵을 줄이기',
    h('div', { class: 'lead' },
      '풀링 연산은 각 특징맵의 해상도(크기)를 줄여 줍니다. ',
      h('b', {}, '최대 풀링'), ' 이나 ', h('b', {}, '평균 풀링'), ' 을 주로 씁니다.'),
    mPick.el,
    h('div', { style: { height: '12px' } }),
    out,
    note('', h('b', {}, '왜 줄이나요? '),
      '① 계산량이 크게 줄어듭니다. ② 특징의 자리가 조금 흔들려도 같은 값이 나와서, ',
      '물체가 살짝 옆으로 옮겨져도 같은 것으로 알아봅니다. ',
      '③ 넓은 범위를 한 칸이 대표하게 되어 뒤쪽 층이 더 큰 그림을 볼 수 있습니다.'));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 문제',
    quizSet([
      {
        q: 'CNN 의 특징 추출 단계는 어떤 두 층의 반복인가요? (「A - B」 꼴로)',
        answer: ['합성곱 층-풀링 층', '합성곱층-풀링층', '합성곱-풀링', '합성곱 - 풀링'],
        place: '예: OO 층 - OO 층',
        explain: '합성곱 층 → 풀링 층 을 여러 번 반복해 특징을 뽑고, 마지막에 다층 퍼셉트론으로 분류합니다.',
        width: 220,
      },
      {
        q: '이미지에서 특징을 추출하는 필터로, 가중치 값으로 구성된 것은?',
        answer: ['커널', 'kernel', '필터', 'filter'],
        explain: '커널(필터)의 값은 학습으로 정해집니다.',
        width: 160,
      },
      {
        q: '입력 8×8 에 필터 3×3 을 한 칸씩 슬라이딩하면 특징맵의 크기는? (예: 6×6)',
        answer: ['6×6', '6x6', '6*6', '6 × 6'],
        explain: '8 − 3 + 1 = 6 이므로 6×6 입니다.',
        width: 140,
      },
      {
        q: '입력 10×10 에 필터 3×3 을 한 칸씩 슬라이딩하면?',
        answer: ['8×8', '8x8', '8*8', '8 × 8'],
        explain: '10 − 3 + 1 = 8',
        width: 140,
      },
      {
        q: '[-1 0 1] 형태가 반복된 필터는 무엇을 검출하나요?',
        type: 'choice',
        choices: ['세로 경계', '가로 경계', '대각선'],
        answer: '세로 경계',
        explain: '오른쪽 값에서 왼쪽 값을 빼므로 가로 방향으로 값이 바뀌는 곳, 즉 세로 경계에서 큰 값이 나옵니다.',
      },
      {
        q: '이 필터를 썼을 때 0 → 1 로 바뀌는 경계에서는 어떤 값이 나오나요?',
        type: 'choice',
        choices: ['양수', '음수', '0'],
        answer: '양수',
        explain: '(오른쪽 1) − (왼쪽 0) = 양수. 반대로 1 → 0 인 경계에서는 음수, 값이 일정한 곳에서는 0 이 나옵니다.',
      },
      {
        q: '객체의 위치를 사각형 박스로 나타내는 기술은?',
        answer: ['객체 탐지', '객체탐지', 'object detection', '객체 검출'],
        explain: '픽셀 단위로 정확한 모양까지 구분하는 것은 객체 세그멘테이션입니다.',
        width: 180,
      },
    ], { revealOnWrong: true }));
}
