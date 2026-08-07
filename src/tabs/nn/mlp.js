/* ============================================================================
 * mlp.js — 학습지 15~16쪽 「2세대(1986) 다층 퍼셉트론 · 활성화 함수」
 *
 *   ① 학습지의 다층 신경망(은닉 뉴런 2개)을 그대로 계산해 XOR 표를 채운다
 *   ② 두 직선이 평면을 세 조각으로 나눠 XOR 을 갈라내는 것을 그림으로 본다
 *   ③ 활성화 함수 그래프 — 계단·시그모이드·tanh·ReLU·Leaky ReLU
 *   ④ 소프트맥스 실험 — 점수를 확률로 바꾸면 합이 1 이 되는 것
 *   ⑤ 문제 유형별 출력층 활성화 함수·손실 함수 표
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

import { h, add, clear, card, sheetHead, note, answer, quizSet, sortQuiz, table, pyBox, fx, drawNow, pillGroup } from '../../lib/ui.js';
import { makeCanvas, scale, axes, dot, polyline, label, COLORS } from '../../lib/chart.js';

const X4 = [[0, 0], [1, 0], [0, 1], [1, 1]];
const XOR = [0, 1, 1, 0];
const step = (v) => (v > 0 ? 1 : 0);

/* 학습지에 실린 가중치 그대로 */
export const NET = {
  h1: { w: [0.6, 0.6], b: -1.0 },
  h2: { w: [1.1, 1.1], b: -1.0 },
  out: { w: [-2.0, 1.1], b: -1.0 },
};

export function render(root) {
  add(root, sheetHead('학습지 15~16쪽', '다층 신경망 — 층을 하나 더 쌓았더니',
    ['[12인기03-05]'],
    [
      '은닉층이 있으면 XOR 을 풀 수 있는 까닭을 두 직선으로 설명할 수 있다.',
      '은닉층의 활성화 함수가 왜 비선형이어야 하는지 설명할 수 있다.',
      '문제 유형에 따라 출력층 활성화 함수와 손실 함수를 고를 수 있다.',
    ]));

  root.append(xorCard());
  root.append(actCard());
  root.append(softmaxCard());
  root.append(outLayerCard());
  root.append(quizCard());
}

/* ─────────────────── ① 다층 신경망으로 XOR 풀기 ─────────────────── */

export function forward(x) {
  const z1 = NET.h1.w[0] * x[0] + NET.h1.w[1] * x[1] + NET.h1.b;
  const z2 = NET.h2.w[0] * x[0] + NET.h2.w[1] * x[1] + NET.h2.b;
  const y1 = step(z1); const y2 = step(z2);
  const zo = NET.out.w[0] * y1 + NET.out.w[1] * y2 + NET.out.b;
  return { z1, z2, y1, y2, zo, y: step(zo) };
}

function xorCard() {
  const cv = makeCanvas(330);
  const netCv = makeCanvas(230, { pad: { l: 16, r: 16, t: 16, b: 16 } });
  let sel = -1;
  const tblBox = h('div', { style: { marginTop: '12px' } });

  function paintPlane() {
    const ctx = cv.begin();
    const sx = scale(-0.35, 1.5, cv.pad.l, cv.w - cv.pad.r);
    const sy = scale(-0.35, 1.5, cv.hgt - cv.pad.b, cv.pad.t);
    axes(cv, sx, sy, { xLabel: 'x₁', yLabel: 'x₂', xTicks: [0, 1], yTicks: [0, 1] });

    /* 최종 출력이 1 인 영역을 촘촘히 칠한다 */
    for (let gx = -0.35; gx <= 1.5; gx += 0.028) {
      for (let gy = -0.35; gy <= 1.5; gy += 0.028) {
        const r = forward([gx, gy]);
        ctx.fillStyle = r.y ? 'rgba(207,48,48,0.13)' : 'rgba(30,111,217,0.10)';
        ctx.fillRect(sx(gx) - 3, sy(gy) - 3, 6, 6);
      }
    }

    /* 두 은닉 뉴런의 경계선 */
    const drawLine = (nrn, color, txt) => {
      const yAt = (x) => (-nrn.b - nrn.w[0] * x) / nrn.w[1];
      polyline(ctx, [[sx(-0.35), sy(yAt(-0.35))], [sx(1.5), sy(yAt(1.5))]], color, 3);
      label(ctx, txt, sx(1.48), sy(yAt(1.48)) - 10, { align: 'right', color, bold: true, size: 12 });
    };
    drawLine(NET.h2, COLORS.green, '뉴런 2 의 경계 (1.1x₁+1.1x₂−1.0=0)');
    drawLine(NET.h1, COLORS.purple, '뉴런 1 의 경계 (0.6x₁+0.6x₂−1.0=0)');

    X4.forEach((p, i) => {
      const r = forward(p);
      ctx.save();
      ctx.lineWidth = sel === i ? 5 : 4;
      ctx.strokeStyle = sel === i ? COLORS.gold : '#fff';
      ctx.fillStyle = XOR[i] ? COLORS.red : COLORS.blue;
      ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 16, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      label(ctx, String(r.y), sx(p[0]), sy(p[1]), { align: 'center', color: '#fff', bold: true, size: 15 });
    });
  }

  /* 신경망 구조 그림 — 고른 줄의 값이 흐르는 것을 보여 준다 */
  function paintNet() {
    const ctx = netCv.begin();
    const W = netCv.w; const H = netCv.hgt;
    const x = sel >= 0 ? X4[sel] : null;
    const r = x ? forward(x) : null;

    const cols = [W * 0.14, W * 0.5, W * 0.86];
    const inY = [H * 0.32, H * 0.68];
    const hiY = [H * 0.32, H * 0.68];
    const outY = H * 0.5;

    const line = (x1, y1, x2, y2, w, active) => {
      ctx.save();
      ctx.strokeStyle = active ? (w > 0 ? COLORS.blue : COLORS.red) : '#dfe4ec';
      ctx.lineWidth = active ? Math.min(6, 1.5 + Math.abs(w) * 1.8) : 1.5;
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.restore();
      label(ctx, fx(w, 1), (x1 + x2) / 2, (y1 + y2) / 2 - 8,
        { align: 'center', size: 11, bold: true, color: active ? (w > 0 ? COLORS.blue : COLORS.red) : '#9aa5b4' });
    };

    line(cols[0], inY[0], cols[1], hiY[0], NET.h1.w[0], !!r);
    line(cols[0], inY[1], cols[1], hiY[0], NET.h1.w[1], !!r);
    line(cols[0], inY[0], cols[1], hiY[1], NET.h2.w[0], !!r);
    line(cols[0], inY[1], cols[1], hiY[1], NET.h2.w[1], !!r);
    line(cols[1], hiY[0], cols[2], outY, NET.out.w[0], !!r);
    line(cols[1], hiY[1], cols[2], outY, NET.out.w[1], !!r);

    const node = (cx, cy, txt, sub, color) => {
      ctx.save();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = color; ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(cx, cy, 25, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      label(ctx, txt, cx, cy - 4, { align: 'center', bold: true, size: 15, color });
      if (sub) label(ctx, sub, cx, cy + 11, { align: 'center', size: 10, color: COLORS.soft });
    };

    node(cols[0], inY[0], x ? String(x[0]) : 'x₁', 'x₁', COLORS.soft);
    node(cols[0], inY[1], x ? String(x[1]) : 'x₂', 'x₂', COLORS.soft);
    node(cols[1], hiY[0], r ? String(r.y1) : 'y₁', 'b=−1.0', COLORS.purple);
    node(cols[1], hiY[1], r ? String(r.y2) : 'y₂', 'b=−1.0', COLORS.green);
    node(cols[2], outY, r ? String(r.y) : 'y', 'b=−1.0', COLORS.orange);

    label(ctx, '입력층', cols[0], H - 8, { align: 'center', color: COLORS.soft, bold: true });
    label(ctx, '은닉층', cols[1], H - 8, { align: 'center', color: COLORS.soft, bold: true });
    label(ctx, '출력층', cols[2], H - 8, { align: 'center', color: COLORS.soft, bold: true });
    if (!r) label(ctx, '아래 표에서 한 줄을 눌러 보세요', W / 2, 16, { align: 'center', color: COLORS.soft });
  }

  function paintTable() {
    clear(tblBox);
    tblBox.append(table(
      ['x₁', 'x₂', '뉴런1 가중합+b', 'y₁', '뉴런2 가중합+b', 'y₂', '출력 가중합+b', 'y (예측값)', '원하는 정답', ''],
      X4.map((p, i) => {
        const r = forward(p);
        const ok = r.y === XOR[i];
        const tr = [
          p[0], p[1],
          h('td', { class: 'mono' }, `${fx(0.6 * p[0], 1)}+${fx(0.6 * p[1], 1)}−1.0 = ${fx(r.z1, 1)}`),
          h('td', { style: { fontWeight: '800' } }, String(r.y1)),
          h('td', { class: 'mono' }, `${fx(1.1 * p[0], 1)}+${fx(1.1 * p[1], 1)}−1.0 = ${fx(r.z2, 1)}`),
          h('td', { style: { fontWeight: '800' } }, String(r.y2)),
          h('td', { class: 'mono' }, `(−2)×${r.y1} + 1.1×${r.y2} − 1.0 = ${fx(r.zo, 1)}`),
          h('td', { style: { fontWeight: '800', fontSize: '1.1rem', background: '#fff6e5' } }, String(r.y)),
          h('td', { style: { fontWeight: '800', fontSize: '1.1rem' } }, String(XOR[i])),
          ok ? h('td', { class: 'filled' }, '⭕') : h('td', { class: 'na' }, '❌'),
        ];
        return tr;
      }), { compact: true }));

    // 줄을 누르면 그 입력이 신경망을 흐르는 것을 보여 준다
    tblBox.querySelectorAll('tbody tr').forEach((tr, i) => {
      tr.style.cursor = 'pointer';
      tr.addEventListener('click', () => { sel = sel === i ? -1 : i; paintAll(); });
      if (i === sel) tr.classList.add('hl');
    });
  }

  function paintAll() { paintPlane(); paintNet(); paintTable(); }

  drawNow(paintAll);
  window.addEventListener('resize', () => { paintPlane(); paintNet(); });

  return card('🕸️ 다층 신경망으로 XOR 을 풀어 보자',
    h('div', { class: 'lead' },
      '입력층·출력층 말고 ', answer('은닉층'), ' 을 하나 두었습니다. ',
      '이것으로 선형 분류만 가능하다는 ', answer('단층'), ' 퍼셉트론의 한계를 넘습니다.'),
    netCv.el,
    tblBox,
    h('h4', {}, '평면 위에서 무슨 일이 일어났나'),
    cv.el,
    note('ok', h('b', {}, '직선 2개를 쓰면 됩니다. '),
      '은닉 뉴런 두 개가 각각 직선 하나씩을 만듭니다. 두 직선은 서로 나란해서 평면을 세 조각으로 자릅니다. ',
      '왼쪽 아래 조각에는 (0,0), 가운데 띠에는 (1,0)과 (0,1), 오른쪽 위 조각에는 (1,1) 이 들어갑니다. ',
      '출력 뉴런은 「가운데 띠에 있으면 1」이라고만 말하면 되므로 XOR 이 풀립니다.'),
    note('', h('b', {}, '신경망 학습의 목표 '),
      '문제를 해결하기 위한 파라미터(가중치, 편향)를 구하는 것입니다. ',
      '위 값들은 학습지가 미리 알려 준 답이지만, 실제로는 이 값을 기계가 스스로 찾아냅니다. ',
      '그 방법이 다음 화면의 오차 역전파입니다.'));
}

/* ────────────────────── ③ 활성화 함수 그래프 ──────────────────── */

const ACTS = [
  {
    id: 'step', nm: '계단 함수 (step)', f: (x) => (x > 0 ? 1 : 0), lo: -0.2, hi: 1.2,
    d: '0 보다 크면 1, 아니면 0. 1세대 퍼셉트론이 쓴 함수입니다.',
    bad: '값이 뚝 끊겨 미분할 수 없습니다. 그래서 역전파로 학습시킬 수 없습니다.',
  },
  {
    id: 'sigmoid', nm: '시그모이드 (Sigmoid)', f: (x) => 1 / (1 + Math.exp(-x)), lo: -0.2, hi: 1.2,
    d: '출력이 0 ~ 1 이라 「확률」로 읽을 수 있습니다. 이진 분류의 출력층에 씁니다.',
    bad: 'x 가 크거나 작으면 기울기가 거의 0 이 되어 학습 신호가 사라집니다(기울기 소실).',
  },
  {
    id: 'tanh', nm: '하이퍼볼릭 탄젠트 (tanh)', f: (x) => Math.tanh(x), lo: -1.2, hi: 1.2,
    d: '출력이 −1 ~ 1 로 0 을 중심에 둡니다. 시그모이드보다 학습이 조금 낫습니다.',
    bad: '기울기 소실 문제는 여전히 남아 있습니다. 과거에 많이 썼습니다.',
  },
  {
    id: 'relu', nm: 'ReLU ★중요★', f: (x) => Math.max(0, x), lo: -0.5, hi: 4,
    d: '음수는 0, 양수는 그대로. 계산이 아주 빠르고 기울기 소실이 적어 은닉층의 기본이 되었습니다.',
    bad: '음수 쪽 기울기가 0 이라 한번 죽은 뉴런은 되살아나지 않습니다(dying ReLU).',
  },
  {
    id: 'lrelu', nm: 'Leaky ReLU', f: (x) => (x > 0 ? x : 0.1 * x), lo: -0.7, hi: 4,
    d: 'ReLU 의 음수 쪽에 아주 작은 기울기를 남겨 둔 것입니다.',
    bad: 'ReLU 의 개선판. 죽은 뉴런 문제를 줄입니다.',
  },
];

function actCard() {
  let cur = 'relu';
  const cv = makeCanvas(280);
  const info = h('div', { style: { marginTop: '12px' } });

  const pick = pillGroup(ACTS.map((a) => ({ id: a.id, label: a.nm.split(' ')[0] })), {
    value: 'relu', onPick: (v) => { cur = v; paint(); },
  });

  function paint() {
    const a = ACTS.find((x) => x.id === cur);
    const ctx = cv.begin();
    const sx = scale(-4, 4, cv.pad.l, cv.w - cv.pad.r);
    const sy = scale(a.lo, a.hi, cv.hgt - cv.pad.b, cv.pad.t);
    axes(cv, sx, sy, { xLabel: '입력 (가중합 + 편향)', yLabel: '출력' });

    // y = 0 선
    polyline(ctx, [[sx(-4), sy(0)], [sx(4), sy(0)]], '#c9d2df', 1.5);

    const pts = [];
    for (let x = -4; x <= 4; x += 0.02) {
      if (a.id === 'step' && Math.abs(x) < 0.02) { continue; }
      pts.push([sx(x), sy(a.f(x))]);
    }
    if (a.id === 'step') {
      // 계단은 끊어 그린다
      const left = []; const right = [];
      for (let x = -4; x <= 0; x += 0.02) left.push([sx(x), sy(0)]);
      for (let x = 0.02; x <= 4; x += 0.02) right.push([sx(x), sy(1)]);
      polyline(ctx, left, COLORS.purple, 3);
      polyline(ctx, right, COLORS.purple, 3);
      ctx.save(); ctx.setLineDash([3, 3]); ctx.strokeStyle = '#c9d2df'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx(0), sy(0)); ctx.lineTo(sx(0), sy(1)); ctx.stroke(); ctx.restore();
    } else {
      polyline(ctx, pts, COLORS.purple, 3);
    }

    [-3, -1, 0, 1, 3].forEach((x) => dot(ctx, sx(x), sy(a.f(x)), 5, COLORS.orange, true));

    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        [-3, -1, 0, 1, 3].map((x) => h('span', { class: 'chip' }, `f(${x}) = ${fx(a.f(x), 3)}`))),
      h('div', { class: 'note', style: { marginTop: '10px' } }, h('b', {}, a.nm + ' — '), a.d),
      h('div', { class: 'note warn', style: { marginTop: '8px' } }, h('b', {}, '알아 둘 점 '), a.bad),
    ]);
  }

  drawNow(paint);
  window.addEventListener('resize', paint);

  return card('📈 활성화 함수',
    h('div', { class: 'lead' },
      '은닉층의 활성화 함수는 반드시 ', answer('비선형'), ' 함수(= 직선이 아닌 함수)를 써야 합니다.'),
    pick.el, h('div', { style: { height: '10px' } }), cv.el, info,
    note('bad', h('b', {}, '왜 비선형이어야 하나요? — 이것이 핵심입니다. '),
      '만약 활성화 함수가 그냥 직선이라면, 층을 아무리 많이 쌓아도 「직선에 직선을 넣은 것」이라 결국 직선 하나와 같습니다. ',
      '층을 100개 쌓아도 단층 퍼셉트론과 똑같아지는 것이지요. ',
      '중간중간 구부러뜨려 주어야만 층을 쌓는 뜻이 생깁니다.'),
    table(['자리', '쓰는 함수'], [
      [h('td', { style: { fontWeight: '800' } }, '은닉층'),
        h('td', { class: 'left' }, [h('b', {}, '★중요★ '), answer('렐루 (ReLU)'),
          ' · [참고] 개선판 Leaky ReLU · 과거에는 Sigmoid, Tanh 를 썼다'])],
      [h('td', { style: { fontWeight: '800' } }, '출력층'),
        h('td', { class: 'left' }, '문제 유형에 따라 달라진다 (아래 표)')],
    ]));
}

/* ─────────────────────── ④ 소프트맥스 실험 ─────────────────────── */

function softmaxCard() {
  let z = [2.0, 1.0, 0.5];
  const NAMES = ['고양이', '개', '토끼'];
  const out = h('div', {});

  function paint() {
    const mx = Math.max(...z);
    const ex = z.map((v) => Math.exp(v - mx));
    const sum = ex.reduce((a, b) => a + b, 0);
    const p = ex.map((v) => v / sum);

    clear(out);
    add(out, [
      h('div', { class: 'barlist' },
        NAMES.map((nm, i) => h('div', { class: 'r' },
          h('span', { class: 'nm' }, nm),
          h('input', {
            type: 'range', min: '-3', max: '5', step: '0.1', value: String(z[i]),
            style: { width: '150px' },
            oninput: (e) => { z[i] = Number(e.target.value); paint(); },
          }),
          h('span', { class: 'track', style: { maxWidth: '260px' } },
            h('span', { class: 'fill', style: { width: (p[i] * 100).toFixed(1) + '%' } })),
          h('span', { class: 'vl' }, (p[i] * 100).toFixed(1) + '%')))),
      h('div', { class: 'row tight', style: { marginTop: '10px' } },
        z.map((v, i) => h('span', { class: 'chip' }, `점수 ${NAMES[i]} = ${fx(v, 1)}`)),
        h('span', { class: 'chip on' }, `확률 합 = ${fx(p.reduce((a, b) => a + b, 0), 4)}`)),
      note('', h('b', {}, '소프트맥스가 하는 일 '),
        '모델이 낸 점수(어떤 실수든 상관없음)를 모두 양수로 만들고(exp), 전체 합으로 나눠 ',
        h('b', {}, '합이 정확히 1 인 확률'), ' 로 바꿉니다. ',
        '그래서 다중 분류의 출력층에 씁니다. 슬라이더를 움직여도 합은 언제나 1 입니다.'),
    ]);
  }
  paint();

  return card('🎲 소프트맥스 — 점수를 확률로', out,
    h('div', { class: 'formula', style: { marginTop: '10px' } },
      'softmax(zᵢ) = e^zᵢ ÷ (e^z₁ + e^z₂ + ⋯ + e^zₙ)'));
}

/* ────────────── ⑤ 문제 유형별 출력층·손실 함수 ─────────────── */

function outLayerCard() {
  return card('🎯 문제 유형에 따라 달라지는 것들',
    h('h4', {}, '출력층 활성화 함수'),
    table(['문제 유형', '출력층 활성화 함수', '출력값 형태', '쓰는 이유'], [
      ['회귀', h('td', { style: { fontWeight: '800' } }, [answer('없음 (Linear)')]),
        '실수값 (−∞ ~ ∞)', h('td', { class: 'left' }, '연속적인 값을 그대로 출력해야 하므로')],
      ['이진 분류', h('td', { style: { fontWeight: '800' } }, [answer('Sigmoid')]),
        '0 ~ 1 (확률)', h('td', { class: 'left' }, '두 클래스 중 하나일 확률을 표현')],
      ['다중 분류', h('td', { style: { fontWeight: '800' } }, [answer('Softmax')]),
        '각 클래스 확률 (합 = 1)', h('td', { class: 'left' }, '여러 클래스 중 하나를 선택')],
      [h('td', { class: 'dim' }, '[참고] 다중 레이블'), h('td', { class: 'dim' }, 'Sigmoid'),
        h('td', { class: 'dim' }, '각 클래스별 0~1 확률'), h('td', { class: 'left dim' }, '여러 클래스를 동시에 고를 수 있음')],
    ]),
    h('h4', {}, '손실 함수'),
    table(['문제 유형', '손실 함수'], [
      ['회귀', h('td', { class: 'left' }, '평균 제곱 오차(MSE), 평균 절대 오차(MAE)')],
      ['이진 분류', h('td', { class: 'left' }, '이진 교차 엔트로피 오차 (Binary Cross Entropy Error)')],
      ['다중 분류', h('td', { class: 'left' }, '범주형 교차 엔트로피 오차 (Categorical Cross Entropy Error)')],
      [h('td', { class: 'dim' }, '[참고] 다중 레이블'), h('td', { class: 'left dim' }, '이진 교차 엔트로피 오차')],
    ]),
    h('h4', {}, '직접 골라 보기'),
    sortQuiz(
      [
        { id: 'lin', label: '없음 (Linear)' },
        { id: 'sig', label: 'Sigmoid' },
        { id: 'soft', label: 'Softmax' },
      ],
      [
        { text: '내일 기온 예측', bin: 'lin' },
        { text: '스팸이냐 아니냐', bin: 'sig' },
        { text: '손글씨 숫자 0~9 맞히기', bin: 'soft' },
        { text: '집값 예측', bin: 'lin' },
        { text: '사진이 개인가 고양이인가', bin: 'sig' },
        { text: '꽃 품종 3가지 중 하나', bin: 'soft' },
      ]),
    pyBox([
      "from tensorflow import keras",
      "",
      "model = keras.Sequential([",
      "    keras.layers.Dense(32, activation='relu', input_shape=(n,)),  # 은닉층 → ReLU",
      "    keras.layers.Dense(16, activation='relu'),",
      "    keras.layers.Dense(3,  activation='softmax'),                 # 다중 분류",
      "])",
      "model.compile(optimizer='adam',",
      "              loss='categorical_crossentropy',   # 다중 분류의 손실 함수",
      "              metrics=['accuracy'])",
    ].join('\n')));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '다층 퍼셉트론에는 입력층, 출력층 외에도 무엇이 있나요?',
        answer: ['은닉층', 'hidden layer', '히든층'],
        explain: '은닉층이 있어야 비선형 문제를 풀 수 있습니다.',
        width: 160,
      },
      {
        q: '은닉층의 활성화 함수는 어떤 함수를 써야 하나요?',
        answer: ['비선형', '비선형 함수', '비선형함수'],
        explain: '직선이 아닌 함수여야 층을 쌓는 뜻이 생깁니다.',
        width: 160,
      },
      {
        q: '은닉층에서 가장 많이 쓰는 활성화 함수는? (★중요★)',
        answer: ['ReLU', '렐루', 'relu'],
        explain: '계산이 빠르고 기울기 소실이 적습니다.',
        width: 160,
      },
      {
        q: '이진 분류 문제의 출력층 활성화 함수는?',
        answer: ['Sigmoid', '시그모이드', 'sigmoid'],
        explain: '출력이 0~1 이라 확률로 읽을 수 있습니다.',
        width: 160,
      },
      {
        q: '다중 분류 문제의 출력층 활성화 함수는?',
        answer: ['Softmax', '소프트맥스', 'softmax'],
        explain: '각 클래스의 확률을 내주고 합이 1 이 됩니다.',
        width: 160,
      },
      {
        q: '회귀 문제의 출력층에는 활성화 함수를 쓰나요?',
        type: 'choice',
        choices: ['쓴다 (Sigmoid)', '쓰지 않는다 (Linear)', '쓴다 (Softmax)'],
        answer: '쓰지 않는다 (Linear)',
        explain: '연속적인 실수값을 그대로 내보내야 하므로 아무 함수도 씌우지 않습니다.',
      },
      {
        q: '다중 분류의 손실 함수는?',
        answer: ['범주형 교차 엔트로피', '범주형 교차 엔트로피 오차', 'categorical cross entropy', '교차 엔트로피'],
        explain: 'Categorical Cross Entropy Error 입니다.',
        width: 240,
      },
    ], { revealOnWrong: true }));
}
