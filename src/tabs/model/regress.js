/* ============================================================================
 * regress.js — 학습지 8쪽 「5.4-2) 회귀 모델의 성능 평가」
 *
 * 점을 끌어 옮기면 MAE·MSE·RMSE·R² 가 바로 다시 계산된다.
 * MSE 는 「오차를 한 변으로 하는 정사각형의 넓이 평균」이라, 실제로 정사각형을 그려 준다.
 * 이렇게 그려 보면 오차가 2배가 될 때 넓이가 4배가 되는 것이 눈에 보인다.
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

import { h, add, clear, card, sheetHead, note, answer, quizSet, table, pyBox, fx, drawNow, frac, pillGroup, onResize } from '../../lib/ui.js';
import * as S from '../../lib/stats.js';
import { makeCanvas, scale, axes, dot, polyline, label, COLORS } from '../../lib/chart.js';

export function render(root) {
  add(root, sheetHead('학습지 8쪽', '회귀 모델의 성능 평가 — MAE · MSE · RMSE · R²',
    ['[12인기03-04]'],
    [
      '회귀 모델의 오차를 재는 네 가지 지표의 식과 뜻을 구분할 수 있다.',
      'MSE 가 큰 오차에 훨씬 민감한 까닭을 그림으로 설명할 수 있다.',
      '결정계수의 값을 보고 모델의 설명력을 해석할 수 있다.',
    ]));

  root.append(lab());
  root.append(tableCard());
  root.append(r2Card());
  root.append(quizCard());
}

/* ─────────────────────── 지표 실험실 ────────────────────────────── */

function lab() {
  let pts = [
    [1, 2.2], [2, 3.1], [3, 3.6], [4, 5.0], [5, 5.4],
    [6, 6.8], [7, 7.1], [8, 8.4], [9, 8.9],
  ];
  let dragging = -1;
  let show = 'square';

  const cv = makeCanvas(360, { pad: { l: 46, r: 24, t: 22, b: 38 } });
  const statBox = h('div', {
    style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '12px' },
  });
  const detail = h('div', { style: { marginTop: '12px' } });

  const showPick = pillGroup([
    { id: 'square', label: 'MSE — 오차를 정사각형으로' },
    { id: 'bar', label: 'MAE — 오차를 막대로' },
    { id: 'r2', label: 'R² — 평균선과 견주기' },
  ], { value: 'square', onPick: (v) => { show = v; paint(); } });

  const sxOf = () => scale(0, 10, cv.pad.l, cv.w - cv.pad.r);
  const syOf = () => scale(0, 12, cv.hgt - cv.pad.b, cv.pad.t);

  function paint() {
    const ctx = cv.begin();
    const sx = sxOf(); const sy = syOf();
    axes(cv, sx, sy, { xLabel: 'x', yLabel: 'y' });

    const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
    const { a, b } = S.linreg(xs, ys);
    const pred = xs.map((x) => a * x + b);
    const ybar = S.mean(ys);

    /* ── 시각화 세 가지 ── */
    if (show === 'square') {
      // 오차를 한 변으로 하는 정사각형 — 화면에서는 세로 길이만큼 가로도 잡는다
      pts.forEach((p, i) => {
        const err = p[1] - pred[i];
        const px = sx(p[0]); const py = sy(p[1]); const qy = sy(pred[i]);
        const side = Math.abs(py - qy);
        ctx.save();
        ctx.fillStyle = 'rgba(207,48,48,0.16)';
        ctx.strokeStyle = 'rgba(207,48,48,0.55)';
        ctx.lineWidth = 1.5;
        const top = Math.min(py, qy);
        const left = err >= 0 ? px : px - side;
        ctx.fillRect(left, top, side, side);
        ctx.strokeRect(left, top, side, side);
        ctx.restore();
      });
    } else if (show === 'bar') {
      pts.forEach((p, i) => {
        ctx.save();
        ctx.strokeStyle = 'rgba(207,48,48,0.75)'; ctx.lineWidth = 4;
        ctx.beginPath();
        ctx.moveTo(sx(p[0]), sy(p[1])); ctx.lineTo(sx(p[0]), sy(pred[i]));
        ctx.stroke();
        ctx.restore();
      });
    } else {
      // R² 는 「평균선으로 예측했을 때보다 얼마나 나아졌나」
      polyline(ctx, [[sx(0), sy(ybar)], [sx(10), sy(ybar)]], COLORS.soft, 2.5, [6, 4]);
      label(ctx, `평균선 ȳ = ${fx(ybar, 2)}`, sx(10), sy(ybar) - 10, { align: 'right', color: COLORS.soft, bold: true });
      pts.forEach((p, i) => {
        ctx.save();
        ctx.strokeStyle = 'rgba(90,102,117,0.5)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx(p[0]) - 4, sy(p[1])); ctx.lineTo(sx(p[0]) - 4, sy(ybar)); ctx.stroke();
        ctx.strokeStyle = 'rgba(207,48,48,0.75)'; ctx.lineWidth = 3;
        ctx.beginPath(); ctx.moveTo(sx(p[0]) + 4, sy(p[1])); ctx.lineTo(sx(p[0]) + 4, sy(pred[i])); ctx.stroke();
        ctx.restore();
      });
    }

    polyline(ctx, [[sx(0), sy(b)], [sx(10), sy(a * 10 + b)]], COLORS.orange, 3);
    pts.forEach((p, i) => dot(ctx, sx(p[0]), sy(p[1]), i === dragging ? 9 : 7, i === dragging ? COLORS.orange : COLORS.blue, true));

    if (show === 'r2') {
      label(ctx, '회색 = 평균선과의 차이 (총 변동)', cv.pad.l + 10, cv.pad.t + 10, { color: COLORS.soft, bold: true });
      label(ctx, '빨강 = 회귀선과의 차이 (설명 못한 변동)', cv.pad.l + 10, cv.pad.t + 26, { color: COLORS.red, bold: true });
    }

    /* ── 지표 ── */
    const MAE = S.mae(ys, pred);
    const MSE = S.mse(ys, pred);
    const RMSE = S.rmse(ys, pred);
    const R2 = S.r2(ys, pred);

    clear(statBox);
    [['MAE 평균 절대 오차', fx(MAE, 4), ''], ['MSE 평균 제곱 오차', fx(MSE, 4), ''],
      ['RMSE 제곱근 평균 제곱오차', fx(RMSE, 4), ''], ['R² 결정계수', fx(R2, 4), R2 > 0.7 ? 'ok' : R2 < 0.3 ? 'bad' : '']]
      .forEach(([k, v, kind]) => statBox.append(
        h('div', { class: 'stat' + (kind ? ' ' + kind : '') }, h('div', { class: 'k' }, k), h('div', { class: 'v' }, v))));

    /* ── 계산 과정 표 ── */
    const ssTot = ys.reduce((s, y) => s + (y - ybar) ** 2, 0);
    const ssRes = ys.reduce((s, y, i) => s + (y - pred[i]) ** 2, 0);
    clear(detail);
    add(detail, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip' }, `회귀선 y = ${fx(a, 3)}x + ${fx(b, 3)}`),
        h('span', { class: 'chip' }, `오차 제곱합 ${fx(ssRes, 3)}`),
        h('span', { class: 'chip' }, `총 변동 ${fx(ssTot, 3)}`),
        h('span', { class: 'chip on' }, `R² = 1 − ${fx(ssRes, 2)}/${fx(ssTot, 2)} = ${fx(R2, 4)}`)),
      h('div', { class: 'scroll-x', style: { marginTop: '10px' } },
        table(['x', '실제 y', '예측 ŷ', '오차 (y − ŷ)', '|오차|', '오차²'],
          pts.map((p, i) => [
            fx(p[0], 1), fx(p[1], 2), fx(pred[i], 2),
            h('td', { class: 'mono', style: { color: Math.abs(p[1] - pred[i]) > 1 ? 'var(--bad)' : '' } }, fx(p[1] - pred[i], 3)),
            fx(Math.abs(p[1] - pred[i]), 3), fx((p[1] - pred[i]) ** 2, 3),
          ]).concat([[
            h('td', { colspan: '4', style: { fontWeight: '800', background: '#eef1f7' } }, '합계 ÷ 개수'),
            h('td', { style: { fontWeight: '800', background: '#fff6e5' } }, `MAE ${fx(MAE, 4)}`),
            h('td', { style: { fontWeight: '800', background: '#fff6e5' } }, `MSE ${fx(MSE, 4)}`),
          ]]), { compact: true })),
    ]);
  }

  /* 점 끌기 */
  function toData(ev) {
    const rect = cv.el.getBoundingClientRect();
    return [sxOf().invert(ev.clientX - rect.left), syOf().invert(ev.clientY - rect.top)];
  }
  cv.el.addEventListener('pointerdown', (ev) => {
    const [x, y] = toData(ev);
    let best = -1; let bd = 1e9;
    pts.forEach((p, i) => { const d = (p[0] - x) ** 2 + (p[1] - y) ** 2; if (d < bd) { bd = d; best = i; } });
    if (bd < 1.2) { dragging = best; cv.el.setPointerCapture(ev.pointerId); paint(); }
  });
  cv.el.addEventListener('pointermove', (ev) => {
    if (dragging < 0) return;
    const [, y] = toData(ev);
    pts[dragging][1] = Math.max(0.2, Math.min(11.8, y));
    paint();
  });
  const stop = () => { if (dragging >= 0) { dragging = -1; paint(); } };
  cv.el.addEventListener('pointerup', stop);
  cv.el.addEventListener('pointercancel', stop);

  const presets = h('div', { class: 'row tight' },
    h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => {
        pts = [[1, 2.2], [2, 3.1], [3, 3.6], [4, 5.0], [5, 5.4], [6, 6.8], [7, 7.1], [8, 8.4], [9, 8.9]];
        paint();
      },
    }, '처음 자료'),
    h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => {
        pts = [[1, 1.5], [2, 2.4], [3, 3.3], [4, 4.2], [5, 5.1], [6, 6.0], [7, 6.9], [8, 7.8], [9, 8.7]];
        paint();
      },
    }, '거의 완벽한 직선 (R² ≈ 1)'),
    h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => {
        pts = [[1, 2.2], [2, 3.1], [3, 3.6], [4, 5.0], [5, 11.5], [6, 6.8], [7, 7.1], [8, 8.4], [9, 8.9]];
        paint();
      },
    }, '이상치 하나 넣기'),
    h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => {
        pts = [[1, 6], [2, 3], [3, 9], [4, 2], [5, 7], [6, 4], [7, 10], [8, 3], [9, 8]];
        paint();
      },
    }, '아무 규칙 없음 (R² ≈ 0)'));

  drawNow(paint);
  onResize(paint);

  return card('📐 회귀 지표 실험실 — 점을 위아래로 끌어 보세요',
    h('div', { class: 'lead' }, '점을 끌면 회귀선이 다시 맞춰지고 네 지표가 함께 바뀝니다.'),
    presets,
    h('div', { class: 'row', style: { marginTop: '10px' } }, showPick.el),
    cv.el, statBox, detail,
    note('warn', h('b', {}, '[이상치 하나 넣기] 를 눌러 보세요. '),
      '점 하나만 크게 튀게 했을 때 MAE 는 조금 오르지만 MSE 는 훨씬 크게 뜁니다. ',
      'MSE 는 오차를 ', h('b', {}, '제곱'), ' 하므로 오차가 2배가 되면 4배, 3배가 되면 9배가 되기 때문입니다. ',
      '위에서 [MSE — 오차를 정사각형으로] 를 골라 보면 정사각형 하나가 다른 것들보다 압도적으로 커진 것이 보입니다.'));
}

/* ──────────────────────── 지표 정리 표 ─────────────────────────── */

function tableCard() {
  return card('📋 네 지표 정리',
    table(['지표', '뜻', '수식', '특징'], [
      [h('td', { style: { fontWeight: '800' } }, 'MAE'),
        h('td', { class: 'left' }, ['평균 ', answer('절대'), ' 오차 (Mean Absolute Error)']),
        h('td', {}, [frac('Σ |y − ŷ|', 'n')]),
        h('td', { class: 'left' }, '단위가 원래 값과 같아 해석하기 쉽다. 이상치에 덜 민감하다.')],
      [h('td', { style: { fontWeight: '800' } }, 'MSE'),
        h('td', { class: 'left' }, ['평균 ', answer('제곱'), ' 오차 (Mean Squared Error)']),
        h('td', {}, [frac('Σ (y − ŷ)²', 'n')]),
        h('td', { class: 'left' }, '큰 오차에 훨씬 큰 벌점을 준다. 단위가 제곱이 되어 해석이 어렵다.')],
      [h('td', { style: { fontWeight: '800' } }, 'RMSE'),
        h('td', { class: 'left' }, [answer('제곱근'), ' 평균 제곱오차 (Root MSE)']),
        h('td', {}, ['√ ', frac('Σ (y − ŷ)²', 'n')]),
        h('td', { class: 'left' }, 'MSE 의 장점을 살리면서 단위를 원래대로 되돌린 것.')],
      [h('td', { style: { fontWeight: '800' } }, '결정계수 R²'),
        h('td', { class: 'left' }, '모델이 데이터를 얼마나 잘 설명하는가 (0~1)'),
        h('td', {}, ['1 − ', frac('Σ (y − ŷ)²', 'Σ (y − ȳ)²')]),
        h('td', { class: 'left' }, '단위가 없어 서로 다른 문제끼리도 견줄 수 있다.')],
    ]),
    note('', h('b', {}, '방향이 반대입니다. '),
      'MAE·MSE·RMSE 는 ', h('b', {}, '작을수록'), ' 좋고, 결정계수는 ', h('b', {}, '1 에 가까울수록'), ' 좋습니다.'),
    pyBox([
      "from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score",
      "import numpy as np",
      "",
      "mae  = mean_absolute_error(y_test, y_pred)",
      "mse  = mean_squared_error(y_test, y_pred)",
      "rmse = np.sqrt(mse)",
      "r2   = r2_score(y_test, y_pred)",
    ].join('\n')));
}

/* ──────────────────────── 결정계수 해석 ───────────────────────── */

function r2Card() {
  const RANGES = [
    ['0', '모델이 예측력이 없음', '#fdeaea'],
    ['0.0 ~ 0.3', '종속변수의 변동 일부를 설명 (약한 설명력)', '#fff1e0'],
    ['0.3 ~ 0.5', '변동 중 일정 부분 설명 (중간 정도 설명력)', '#fff8e0'],
    ['0.5 ~ 0.7', '변동을 상당 부분 설명 (높은 설명력)', '#eef7e6'],
    ['0.7 ~ 1', '변동 대부분을 설명 (매우 강한 설명력)', '#e6f6ef'],
  ];

  const bar = h('div', {
    style: {
      position: 'relative', height: '44px', marginTop: '12px',
      display: 'flex', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--line)',
    },
  }, RANGES.slice(1).map(([lb, , bg], i) => h('div', {
    style: {
      flex: i === 0 ? '3' : i === 1 ? '2' : i === 2 ? '2' : '3',
      background: bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontWeight: '800', fontSize: '0.85rem', color: 'var(--ink-soft)',
    },
  }, lb)));

  return card('🎓 결정계수 R² 는 어떻게 읽나',
    h('p', {}, '회귀 모델이 실제 데이터를 어느 정도 잘 설명하고 있는지 나타내는 통계량으로, ',
      answer('총 변동'), ' 중에 ', answer('설명된 변동'), ' 의 비율을 뜻합니다.'),
    bar,
    table(['결정계수', '해석'], RANGES.map(([r, d, bg]) => [
      h('td', { style: { fontWeight: '800', background: bg } }, r),
      h('td', { class: 'left' }, d),
    ])),
    note('', h('b', {}, '조금 더 쉽게 '),
      'R² = 0.7 이라면 「y 가 오르내리는 이유의 70% 를 이 모델이 설명해 준다」는 뜻입니다. ',
      '나머지 30% 는 우리가 넣지 않은 다른 원인이거나 우연입니다.'),
    note('warn', h('b', {}, '주의 — R² 가 낮다고 늘 나쁜 모델은 아닙니다. '),
      '사람의 마음이나 사회 현상을 예측하는 문제는 R² 가 0.3 만 되어도 훌륭합니다. ',
      '반대로 물리 실험 자료에서 R² 가 0.7 이면 뭔가 잘못된 것입니다. ',
      '「이 분야에서 보통 얼마나 나오는가」와 견주어야 합니다.'));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      { q: 'MAE 는 평균 ( ? ) 오차입니다.', answer: ['절대'], explain: 'Mean Absolute Error, 오차의 절댓값을 평균 냅니다.', width: 140 },
      { q: 'MSE 는 평균 ( ? ) 오차입니다.', answer: ['제곱'], explain: 'Mean Squared Error, 오차를 제곱해 평균 냅니다.', width: 140 },
      { q: 'RMSE 는 ( ? ) 평균 제곱오차입니다.', answer: ['제곱근'], explain: 'Root Mean Squared Error, MSE 에 루트를 씌운 것입니다.', width: 140 },
      {
        q: 'MAE, MSE, RMSE 는 클수록 좋은가요, 작을수록 좋은가요?',
        type: 'choice', choices: ['클수록 좋다', '작을수록 좋다'], answer: '작을수록 좋다',
        explain: '모두 「오차」이므로 작을수록 좋습니다. 반대로 결정계수는 1 에 가까울수록 좋습니다.',
      },
      {
        q: '실제 y 가 10, 예측 ŷ 가 7 일 때 이 하나의 제곱오차는?',
        answer: ['9'], explain: '(10 − 7)² = 3² = 9', width: 120,
      },
      {
        q: '결정계수가 0.85 인 모델의 설명력은?',
        type: 'choice',
        choices: ['예측력이 없음', '중간 정도 설명력', '매우 강한 설명력'],
        answer: '매우 강한 설명력',
        explain: '0.7 ~ 1 구간이므로 종속변수의 변동 대부분을 설명합니다.',
      },
    ], { revealOnWrong: true }));
}
