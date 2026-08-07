/* ============================================================================
 * overfit.js — 학습지 7쪽 「5.3 모델 학습 — 손실 함수 · 과소적합과 과대적합」
 *
 * 여기서는 진짜로 모델을 학습시킨다.
 *   ① 다항식 차수를 올리면서 훈련 오차와 검증 오차가 어떻게 갈라지는지 본다
 *   ② 같은 자료로 경사하강법을 돌려, 반복 횟수(epoch)에 따라 두 오차가 갈라지는 지점
 *      = 조기 중단(early stop) 지점을 눈으로 찾는다
 *
 * 다항 회귀는 최소제곱법(정규방정식)을 가우스 소거법으로 직접 풀어 구현했다.
 * x 를 -1~1 로 옮겨 놓고 계산해 차수가 높아져도 수가 터지지 않게 했다.
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

import { h, add, clear, card, sheetHead, note, answer, quizSet, table, pyBox, fx, drawNow, slider } from '../../lib/ui.js';
import * as S from '../../lib/stats.js';
import { makeCanvas, scale, axes, dot, polyline, label, COLORS } from '../../lib/chart.js';

/* ───────────────────────── 작은 선형대수 도구 ───────────────────── */

/** 연립일차방정식 A·w = b 를 가우스 소거법으로 푼다 */
function solve(A, b) {
  const n = A.length;
  const M = A.map((row, i) => row.concat([b[i]]));
  for (let c = 0; c < n; c++) {
    // 부분 피벗팅 — 절댓값이 가장 큰 행을 위로
    let piv = c;
    for (let r = c + 1; r < n; r++) if (Math.abs(M[r][c]) > Math.abs(M[piv][c])) piv = r;
    if (Math.abs(M[piv][c]) < 1e-12) continue;
    [M[c], M[piv]] = [M[piv], M[c]];
    for (let r = 0; r < n; r++) {
      if (r === c) continue;
      const f = M[r][c] / M[c][c];
      for (let k = c; k <= n; k++) M[r][k] -= f * M[c][k];
    }
  }
  return M.map((row, i) => (Math.abs(row[i]) < 1e-12 ? 0 : row[n] / row[i]));
}

/** x 하나를 [1, x, x², …, x^deg] 로 펼친다 */
const poly = (x, deg) => Array.from({ length: deg + 1 }, (_, k) => x ** k);

/** 최소제곱법으로 다항식 계수를 구한다 (릿지 항 lam 을 조금 넣어 안정화) */
function polyFit(xs, ys, deg, lam = 1e-8) {
  const n = deg + 1;
  const A = Array.from({ length: n }, () => new Array(n).fill(0));
  const b = new Array(n).fill(0);
  xs.forEach((x, i) => {
    const p = poly(x, deg);
    for (let r = 0; r < n; r++) {
      b[r] += p[r] * ys[i];
      for (let c = 0; c < n; c++) A[r][c] += p[r] * p[c];
    }
  });
  for (let r = 0; r < n; r++) A[r][r] += lam;
  return solve(A, b);
}

const polyEval = (w, x) => w.reduce((s, c, k) => s + c * x ** k, 0);

/* ─────────────────────── 실습용 자료 만들기 ─────────────────────── */

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** 진짜 규칙: y = sin(2.4x) 에 잡음을 섞는다. x 는 -1 ~ 1 */
const TRUE = (x) => Math.sin(2.4 * x) * 1.6;

function makeData(seed = 4242) {
  const r = rng(seed);
  const train = []; const valid = [];
  for (let i = 0; i < 14; i++) {
    const x = -1 + (i / 13) * 2;
    train.push([x, TRUE(x) + (r() - 0.5) * 0.9]);
  }
  for (let i = 0; i < 14; i++) {
    const x = -0.93 + (i / 13) * 1.86;
    valid.push([x, TRUE(x) + (r() - 0.5) * 0.9]);
  }
  return { train, valid };
}

let DATA = makeData();

export function render(root) {
  DATA = makeData();

  add(root, sheetHead('학습지 7쪽', '모델 학습 — 손실 함수 · 과소적합과 과대적합',
    ['[12인기03-03]'],
    [
      '손실 함수가 무엇이고 학습이 그것을 어떻게 다루는지 설명할 수 있다.',
      '모델을 복잡하게 만들수록 훈련 오차와 검증 오차가 어떻게 갈라지는지 실험으로 확인할 수 있다.',
      '조기 중단을 해야 할 지점을 그래프에서 찾을 수 있다.',
    ]));

  root.append(lossCard());
  root.append(complexityLab());
  root.append(epochLab());
  root.append(preventCard());
  root.append(quizCard());
}

/* ───────────────────────── 손실 함수 개념 ───────────────────────── */

function lossCard() {
  return card('📉 손실 함수 (loss function)',
    h('p', {}, '신경망 학습의 목적 함수로, ', h('b', {}, '출력값(모델의 예측값)과 정답(실제값)의 차이'), ' 를 계산합니다.'),
    h('div', { class: 'formula' }, '모델 학습 = 손실 함수를 ', answer('최소화'), ' 하는 방향으로 알고리즘 안의 ', answer('가중치'), ' 를 계속 업데이트하는 과정'),
    table(['용어', '뜻'], [
      [h('td', { style: { fontWeight: '800' } }, '목적 함수'), h('td', { class: 'left' }, '최소화 또는 최대화하고 싶은 함수')],
      [h('td', { style: { fontWeight: '800' } }, '가중치'), h('td', { class: 'left' }, '출력값과 정답을 비교해 오차를 최소화하려고 값을 조금씩 조정하는 파라미터')],
      [h('td', { style: { fontWeight: '800' } }, '최적화 알고리즘 (optimizer)'), h('td', { class: 'left' }, '손실 값을 최소화하기 위해 모델의 매개변수를 조정하는 방법 (예: 경사하강법, Adam)')],
    ]),
    note('', h('b', {}, '한 문장으로 '),
      '「얼마나 틀렸는지」를 숫자 하나로 만든 것이 손실이고, 그 숫자를 줄이는 쪽으로 가중치를 조금씩 미는 것이 학습입니다.'));
}

/* ───────── ① 모델 복잡도(차수)를 올리면 무슨 일이 생기나 ───────── */

function complexityLab() {
  let deg = 1;
  const cvFit = makeCanvas(300);
  const cvErr = makeCanvas(230, { pad: { l: 52, r: 20, t: 20, b: 38 } });
  const info = h('div', { style: { marginTop: '12px' } });

  const MAXDEG = 12;

  /** 차수마다 훈련·검증 오차를 미리 계산해 둔다 */
  function sweep() {
    const xs = DATA.train.map((p) => p[0]); const ys = DATA.train.map((p) => p[1]);
    const vx = DATA.valid.map((p) => p[0]); const vy = DATA.valid.map((p) => p[1]);
    return Array.from({ length: MAXDEG }, (_, i) => {
      const d = i + 1;
      const w = polyFit(xs, ys, d);
      return {
        d,
        train: S.mse(ys, xs.map((x) => polyEval(w, x))),
        valid: S.mse(vy, vx.map((x) => polyEval(w, x))),
      };
    });
  }
  let SWEEP = sweep();

  const sl = slider('다항식 차수 (모델의 복잡도)', {
    min: 1, max: MAXDEG, value: 1,
    onInput: (v) => { deg = v; paint(); },
  });

  function paint() {
    const xs = DATA.train.map((p) => p[0]); const ys = DATA.train.map((p) => p[1]);
    const vx = DATA.valid.map((p) => p[0]); const vy = DATA.valid.map((p) => p[1]);
    const w = polyFit(xs, ys, deg);
    const trErr = S.mse(ys, xs.map((x) => polyEval(w, x)));
    const vaErr = S.mse(vy, vx.map((x) => polyEval(w, x)));

    /* ── 적합 그림 ── */
    const ctx = cvFit.begin();
    const sx = scale(-1.15, 1.15, cvFit.pad.l, cvFit.w - cvFit.pad.r);
    const sy = scale(-3.2, 3.2, cvFit.hgt - cvFit.pad.b, cvFit.pad.t);
    axes(cvFit, sx, sy, { xLabel: 'x', yLabel: 'y' });

    // 진짜 규칙 (회색 점선)
    const tp = [];
    for (let x = -1.15; x <= 1.15; x += 0.02) tp.push([sx(x), sy(TRUE(x))]);
    polyline(ctx, tp, '#b9c3d1', 2, [5, 4]);

    // 학습한 모델 (주황)
    const mp = [];
    for (let x = -1.15; x <= 1.15; x += 0.01) {
      const y = polyEval(w, x);
      mp.push([sx(x), sy(Math.max(-4, Math.min(4, y)))]);
    }
    polyline(ctx, mp, COLORS.orange, 3);

    DATA.train.forEach((p) => dot(ctx, sx(p[0]), sy(p[1]), 6, COLORS.blue, true));
    DATA.valid.forEach((p) => dot(ctx, sx(p[0]), sy(p[1]), 5.5, COLORS.green, true));

    label(ctx, '● 훈련 데이터', cvFit.w - cvFit.pad.r, cvFit.pad.t + 8, { align: 'right', color: COLORS.blue, bold: true });
    label(ctx, '● 검증 데이터', cvFit.w - cvFit.pad.r, cvFit.pad.t + 24, { align: 'right', color: COLORS.green, bold: true });
    label(ctx, '⋯ 진짜 규칙', cvFit.w - cvFit.pad.r, cvFit.pad.t + 40, { align: 'right', color: COLORS.soft });

    /* ── 차수별 오차 곡선 ── */
    const c2 = cvErr.begin();
    const maxE = Math.min(2.2, Math.max(...SWEEP.map((s) => Math.max(s.train, Math.min(s.valid, 2.2)))) * 1.15);
    const ex = scale(1, MAXDEG, cvErr.pad.l, cvErr.w - cvErr.pad.r);
    const ey = scale(0, maxE, cvErr.hgt - cvErr.pad.b, cvErr.pad.t);
    axes(cvErr, ex, ey, { xLabel: '차수', yLabel: 'MSE', xTicks: SWEEP.map((s) => s.d) });

    polyline(c2, SWEEP.map((s) => [ex(s.d), ey(Math.min(s.train, maxE))]), COLORS.blue, 3);
    polyline(c2, SWEEP.map((s) => [ex(s.d), ey(Math.min(s.valid, maxE))]), COLORS.green, 3);
    SWEEP.forEach((s) => {
      dot(c2, ex(s.d), ey(Math.min(s.train, maxE)), 4, COLORS.blue);
      dot(c2, ex(s.d), ey(Math.min(s.valid, maxE)), 4, COLORS.green);
    });

    // 지금 고른 차수 표시
    c2.save();
    c2.setLineDash([4, 4]); c2.strokeStyle = COLORS.orange; c2.lineWidth = 2;
    c2.beginPath(); c2.moveTo(ex(deg), cvErr.hgt - cvErr.pad.b); c2.lineTo(ex(deg), cvErr.pad.t); c2.stroke();
    c2.restore();

    // 검증 오차가 가장 낮은 차수 = 가장 좋은 모델
    const best = SWEEP.reduce((a, b) => (b.valid < a.valid ? b : a));
    label(c2, `가장 좋은 차수 = ${best.d}`, ex(best.d), cvErr.pad.t + 8, { align: 'center', color: COLORS.pink, bold: true });
    label(c2, '— 훈련 오차', cvErr.w - cvErr.pad.r, cvErr.pad.t + 8, { align: 'right', color: COLORS.blue, bold: true });
    label(c2, '— 검증 오차', cvErr.w - cvErr.pad.r, cvErr.pad.t + 24, { align: 'right', color: COLORS.green, bold: true });

    /* ── 진단 ── */
    const gap = vaErr - trErr;
    let kind; let msg; let cls;
    if (trErr > 0.55) {
      kind = '과소적합 (under fitting)'; cls = 'warn';
      msg = '훈련 오차부터 큽니다. 모델이 너무 단순해서 데이터의 규칙조차 못 따라가고 있습니다. '
        + '학습지 표현으로는 「학습을 너무 적게 진행한 상태」이고, 차수를 올리거나 학습 반복 횟수를 늘려 해결합니다.';
    } else if (gap > 0.35) {
      kind = '과대적합 (over fitting)'; cls = 'bad';
      msg = '훈련 오차는 작은데 검증 오차가 큽니다. 모델이 훈련 데이터의 잡음까지 외워 버려서, '
        + '처음 보는 데이터에서는 오히려 못합니다. 「모델이 훈련 데이터에 너무 편향된 상태」입니다.';
    } else {
      kind = '알맞게 맞았습니다'; cls = 'ok';
      msg = '훈련 오차와 검증 오차가 둘 다 작고 서로 비슷합니다. 이런 상태를 목표로 합니다.';
    }

    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip' }, `차수 ${deg} · 배울 계수 ${deg + 1}개`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #1e6fd9' } }, `훈련 오차(MSE) ${fx(trErr, 4)}`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #0f9d6e' } }, `검증 오차(MSE) ${fx(vaErr, 4)}`),
        h('span', { class: 'chip ' + (cls === 'ok' ? 'ok' : cls === 'bad' ? 'bad' : 'warn') }, `차이 ${fx(gap, 4)}`)),
      note(cls, h('b', {}, '진단: ' + kind + ' — '), msg),
    ]);
  }

  drawNow(paint);
  window.addEventListener('resize', paint);

  return card('🎢 과적합 실험실 — 모델을 복잡하게 만들어 보기',
    h('div', { class: 'lead' },
      '파란 점 14개(훈련)만 보고 주황 곡선을 학습시킵니다. 초록 점(검증)은 학습에 쓰지 않습니다. ',
      '차수를 1 부터 12 까지 올리면서 두 오차가 어떻게 갈라지는지 보세요.'),
    sl.el,
    h('div', { class: 'row tight', style: { marginTop: '8px' } },
      [1, 3, 5, 9, 12].map((d) => h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => { sl.set(d); deg = d; paint(); },
      }, `차수 ${d}`)),
      h('button', {
        type: 'button', class: 'btn gray small',
        onclick: () => { DATA = makeData(Math.floor(Math.random() * 99999)); SWEEP = sweep(); paint(); },
      }, '🎲 자료 새로 뽑기')),
    cvFit.el,
    h('h4', {}, '차수마다 두 오차가 어떻게 변하나'),
    cvErr.el, info,
    note('', h('b', {}, '꼭 확인할 것 — '),
      '차수를 올리면 ', h('b', {}, '훈련 오차는 계속 줄어듭니다'), '. 끝까지 줄어듭니다. ',
      '그런데 검증 오차는 어느 지점에서 바닥을 찍고 다시 올라갑니다. ',
      '학습지의 「', answer('훈련'), ' 데이터의 오차는 계속 감소하지만 ', answer('검증'), ' 데이터나 ',
      answer('테스트'), ' 데이터 오차는 감소하다가 어느 순간부터 다시 커진다」가 바로 이 그림입니다.'));
}

/* ────────── ② 학습 반복 횟수와 조기 중단 (경사하강법 실습) ────────── */

function epochLab() {
  const DEG = 9;
  const LR = 0.06;
  const EPOCHS = 900;

  const cv = makeCanvas(280, { pad: { l: 56, r: 22, t: 20, b: 38 } });
  const info = h('div', { style: { marginTop: '12px' } });
  let history = [];
  let cursor = EPOCHS;
  let timer = null;

  /** 경사하강법으로 진짜 학습을 돌리고 회차마다 두 오차를 기록한다 */
  function train() {
    const Xt = DATA.train.map((p) => poly(p[0], DEG));
    const yt = DATA.train.map((p) => p[1]);
    const Xv = DATA.valid.map((p) => poly(p[0], DEG));
    const yv = DATA.valid.map((p) => p[1]);
    let w = new Array(DEG + 1).fill(0);
    const out = [];

    const errOf = (X, y) => {
      let s = 0;
      X.forEach((x, i) => { const p = x.reduce((a, v, k) => a + v * w[k], 0); s += (p - y[i]) ** 2; });
      return s / X.length;
    };

    for (let e = 0; e <= EPOCHS; e++) {
      out.push({ e, train: errOf(Xt, yt), valid: errOf(Xv, yv) });
      // 기울기 계산 → 가중치를 조금씩 반대 방향으로 민다
      const g = new Array(DEG + 1).fill(0);
      Xt.forEach((x, i) => {
        const p = x.reduce((a, v, k) => a + v * w[k], 0);
        const d = 2 * (p - yt[i]) / Xt.length;
        for (let k = 0; k <= DEG; k++) g[k] += d * x[k];
      });
      w = w.map((v, k) => v - LR * g[k]);
    }
    return out;
  }

  function paint() {
    const ctx = cv.begin();
    const shown = history.slice(0, cursor + 1);
    const maxE = Math.max(0.4, Math.min(3, Math.max(...history.slice(1).map((r) => Math.max(r.train, r.valid))) * 1.05));
    const sx = scale(0, EPOCHS, cv.pad.l, cv.w - cv.pad.r);
    const sy = scale(0, maxE, cv.hgt - cv.pad.b, cv.pad.t);
    axes(cv, sx, sy, { xLabel: '학습 반복 횟수 (epoch)', yLabel: 'MSE' });

    polyline(ctx, shown.map((r) => [sx(r.e), sy(Math.min(r.train, maxE))]), COLORS.blue, 3);
    polyline(ctx, shown.map((r) => [sx(r.e), sy(Math.min(r.valid, maxE))]), COLORS.green, 3);

    // 검증 오차가 가장 낮았던 지점 = 조기 중단해야 할 곳
    const best = history.reduce((a, b) => (b.valid < a.valid ? b : a));
    if (cursor >= best.e) {
      ctx.save();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = COLORS.pink; ctx.lineWidth = 2.5;
      ctx.beginPath(); ctx.moveTo(sx(best.e), cv.hgt - cv.pad.b); ctx.lineTo(sx(best.e), cv.pad.t); ctx.stroke();
      ctx.restore();
      label(ctx, `조기 중단 지점 · ${best.e}회`, sx(best.e) + 6, cv.pad.t + 10, { color: COLORS.pink, bold: true });
    }

    label(ctx, '— 훈련 오차', cv.w - cv.pad.r, cv.pad.t + 10, { align: 'right', color: COLORS.blue, bold: true });
    label(ctx, '— 검증 오차', cv.w - cv.pad.r, cv.pad.t + 26, { align: 'right', color: COLORS.green, bold: true });

    const now = history[cursor];
    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `${now.e} 회 학습`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #1e6fd9' } }, `훈련 오차 ${fx(now.train, 4)}`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #0f9d6e' } }, `검증 오차 ${fx(now.valid, 4)}`),
        h('span', { class: 'chip ' + (now.valid > best.valid * 1.15 ? 'bad' : 'ok') },
          now.e < best.e ? '아직 덜 배웠습니다 (과소적합 쪽)'
            : now.valid > best.valid * 1.15 ? '지나쳐서 외우기 시작했습니다 (과대적합 쪽)'
              : '가장 좋은 지점 근처입니다')),
      note(now.e > best.e * 1.6 ? 'bad' : '',
        h('b', {}, '조기 중단(early stop) — '),
        `검증 오차는 ${best.e} 회에서 ${fx(best.valid, 4)} 로 가장 낮았습니다. `
        + '그 뒤로는 훈련 오차만 계속 줄고 검증 오차는 오히려 커집니다. '
        + '「검증 데이터 오차가 훈련 데이터 오차보다 너무 커지기 전에 학습을 중단」하는 것이 조기 중단입니다.'),
    ]);
  }

  const sl = h('input', { type: 'range', min: '0', max: String(EPOCHS), value: String(EPOCHS), style: { flex: '1' } });
  sl.addEventListener('input', () => { cursor = Number(sl.value); paint(); });

  const playBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      if (timer) { clearInterval(timer); timer = null; playBtn.textContent = '▶ 처음부터 학습시키기'; return; }
      cursor = 0; sl.value = '0'; playBtn.textContent = '⏸ 멈추기';
      timer = setInterval(() => {
        cursor = Math.min(EPOCHS, cursor + 12);
        sl.value = String(cursor);
        paint();
        if (cursor >= EPOCHS) { clearInterval(timer); timer = null; playBtn.textContent = '▶ 처음부터 학습시키기'; }
      }, 30);
    },
  }, '▶ 처음부터 학습시키기');

  history = train();
  drawNow(paint);
  window.addEventListener('resize', paint);

  return card('⏱️ 학습 반복 횟수와 조기 중단',
    h('div', { class: 'lead' },
      `9차 다항식을 경사하강법으로 ${EPOCHS} 회 학습시킨 실제 기록입니다. `,
      '슬라이더를 움직이거나 [처음부터 학습시키기] 를 눌러 두 오차가 갈라지는 순간을 찾아 보세요.'),
    h('div', { class: 'row' }, playBtn,
      h('button', {
        type: 'button', class: 'btn gray',
        onclick: () => { history = train(); cursor = EPOCHS; sl.value = String(EPOCHS); paint(); },
      }, '🔄 다시 학습')),
    h('div', { class: 'row', style: { marginTop: '8px' } }, h('label', { class: 'field' }, '반복 횟수'), sl),
    cv.el, info,
    note('', h('b', {}, '과소적합 vs 과대적합 '),
      '왼쪽 끝(적게 배움) = 과소적합, 오른쪽 끝(너무 많이 배움) = 과대적합입니다. ',
      '과소적합은 ', answer('학습 반복 횟수'), ' 를 더 늘려 해결하고, ',
      '과대적합은 반대로 적당한 지점에서 멈추게 합니다.'));
}

/* ────────────────────── 과대적합 방지 방법 표 ───────────────────── */

function preventCard() {
  return card('🛡️ 과대적합을 막는 방법 — 학습지 정리',
    table(['갈래', '방법'], [
      [h('td', { style: { fontWeight: '800' } }, '데이터 관련'),
        h('td', { class: 'left' }, '데이터 수집 확대 · 데이터 증강 · 노이즈 추가 · 데이터 정제 · 불균형 데이터 처리(언더샘플링, 오버샘플링)')],
      [h('td', { style: { fontWeight: '800' } }, '데이터 분할'),
        h('td', { class: 'left' }, '훈련/검증/테스트 분할 · 홀드아웃 · 교차검증')],
      [h('td', { style: { fontWeight: '800' } }, '모델 복잡도 제어'),
        h('td', { class: 'left' }, '모델을 더 단순하게 (위 실험에서 차수를 낮추는 것) · 규제(L1·L2)')],
      [h('td', { style: { fontWeight: '800' } }, '학습 과정 제어'),
        h('td', { class: 'left' }, [answer('조기 중단'), '(early stop) — 검증 데이터 오차가 훈련 데이터 오차보다 너무 커지기 전에 학습 중단 · 학습률 조절 · 에폭(epoch) 수 제한'])],
      [h('td', { style: { fontWeight: '800' } }, '변수 관련'),
        h('td', { class: 'left' }, '특성 선택 (핵심 속성만 남기기)')],
      [h('td', { style: { fontWeight: '800' } }, '딥러닝'),
        h('td', { class: 'left' }, '드롭아웃 — 학습할 때 일부 뉴런을 무작위로 제외')],
    ]),
    h('h4', {}, '과대적합은 왜 생기나'),
    h('ul', { style: { paddingLeft: '22px' } },
      h('li', {}, '훈련 데이터가 대표성을 갖지 않은 경우 — 반 전체를 예측해야 하는데 앞줄 학생 자료만 모은 경우'),
      h('li', {}, '훈련 데이터로 지나치게 많은 학습을 한 경우 — 위 두 번째 실험의 오른쪽 끝')),
    note('', h('b', {}, '드롭아웃이 왜 도움이 되나요? '),
      '매번 일부 뉴런을 끄면 특정 뉴런 하나에만 기대는 습관이 생기지 않습니다. ',
      '조별 과제에서 매번 다른 사람이 빠지게 하면 모두가 골고루 일하게 되는 것과 비슷합니다.'));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '모델 학습이란 손실 함수를 ( ? )하는 방향으로 가중치를 계속 업데이트하는 과정입니다.',
        answer: ['최소화', '최소'],
        explain: '손실은 「얼마나 틀렸는가」이므로 줄이는 쪽으로 갑니다.',
        width: 160,
      },
      {
        q: '학습을 너무 적게 진행해 훈련 오차부터 큰 상태를 무엇이라 하나요?',
        answer: ['과소적합', '언더피팅', 'under fitting', 'underfitting'],
        explain: '학습 반복 횟수를 더 늘리거나 모델을 복잡하게 만들어 해결합니다.',
        width: 180,
      },
      {
        q: '모델이 훈련 데이터에 너무 편향된 상태를 무엇이라 하나요?',
        answer: ['과대적합', '과적합', '오버피팅', 'over fitting', 'overfitting'],
        explain: '보통 「과적합」이라고 하면 과대적합을 뜻합니다.',
        width: 180,
      },
      {
        q: '검증 데이터 오차가 훈련 데이터 오차보다 너무 커지기 전에 학습을 중단하는 방법은?',
        answer: ['조기 중단', '조기중단', 'early stop', 'early stopping', '얼리스탑'],
        explain: '학습 과정 제어에 속하는 과대적합 방지 방법입니다.',
        width: 200,
      },
      {
        q: '딥러닝에서 일부 뉴런을 무작위로 제외해 과대적합을 막는 방법은?',
        answer: ['드롭아웃', 'dropout', '드랍아웃'],
        explain: '특정 뉴런에만 의존하지 않게 만듭니다.',
        width: 180,
      },
      {
        q: '손실 값을 최소화하기 위해 모델의 매개변수를 조정하는 알고리즘을 무엇이라 하나요?',
        answer: ['최적화 알고리즘', '옵티마이저', 'optimizer', '최적화'],
        explain: '경사하강법, Adam 등이 있습니다.',
        width: 200,
      },
    ], { revealOnWrong: true }));
}
