/* ============================================================================
 * outlier.js — 학습지 4쪽 「4.3~4.4 이상치 탐지와 처리」
 *
 * 수직선 위의 점을 끌어 옮기면 Q1·Q3·IQR·경계값이 다시 계산되고,
 * 경계를 벗어난 점이 빨갛게 바뀐다.
 * 처리 방법 세 가지(그대로 / 행 삭제 / 경곗값으로 치환)를 눌러
 * 평균과 표준편차가 어떻게 달라지는지 견주어 본다.
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

import { h, add, clear, card, sheetHead, note, answer, quizSet, table, pyBox, fx, drawNow, onResize } from '../../lib/ui.js';
import * as S from '../../lib/stats.js';
import { makeCanvas, scale, dot, polyline, label, drawBox, COLORS, ticks } from '../../lib/chart.js';

const START = [12, 14, 15, 15, 16, 17, 18, 18, 19, 20, 21, 22, 23, 48];

export function render(root) {
  add(root, sheetHead('학습지 4쪽', '이상치 — 무리에서 튀어나온 값',
    ['[12인기02-03]'],
    [
      '이상치가 무엇이고 왜 모델 성능에 영향을 주는지 설명할 수 있다.',
      'IQR 을 이용해 이상치를 판정할 수 있다.',
      '이상치를 처리하는 세 가지 방법의 장단점을 견줄 수 있다.',
    ]));

  root.append(conceptCard());
  root.append(lab());
  root.append(regressDemo());
  root.append(quizCard());
}

/* ───────────────────────────── 개념 정리 ───────────────────────────── */

function conceptCard() {
  return card('📖 이상치란',
    h('p', {}, h('b', {}, '이상치(outlier)'), ' 는 전체 데이터의 추세·패턴 등에서 벗어난 값입니다. ',
      '이상치가 있으면 그 값도 모델 학습에 반영되어 성능에 영향을 줍니다.'),
    h('h4', {}, '1) 이상치 탐지 — 가장 널리 쓰이는 IQR 방법'),
    h('div', { class: 'formula' }, 'IQR = Q3 − Q1'),
    h('div', { class: 'formula', style: { marginLeft: '8px' } },
      'Q3 + 1.5 × IQR 보다 크거나, Q1 − 1.5 × IQR 보다 작으면 → 통계적으로 이상치'),
    h('h4', {}, '2) 이상치 처리'),
    table(['방법', '설명', '언제'], [
      ['그대로 사용', h('td', { class: 'left' }, '적당한 스케일링 기법을 적용해 그대로 씀'), h('td', { class: 'left' }, '이상치가 진짜 있을 수 있는 값일 때 (예: 프로 선수의 기록)')],
      ['행 삭제', h('td', { class: 'left' }, '이상치를 포함하는 행을 지움'), h('td', { class: 'left' }, '입력 실수 같은 명백한 오류일 때')],
      ['경곗값으로 치환', h('td', { class: 'left' }, '상단·하단 경곗값으로 바꿔 넣음'), h('td', { class: 'left' }, '데이터를 잃고 싶지 않지만 영향은 줄이고 싶을 때')],
    ]),
    note('warn', h('b', {}, '이상치 = 지워야 할 것? 아닙니다. '),
      '신용카드 부정 사용 탐지에서는 오히려 이상치가 찾아내야 할 목표입니다. ',
      '「이 값이 왜 튀는가」를 먼저 물어야 하고, 답을 모른 채 지우는 것이 가장 나쁜 처리입니다.'));
}

/* ───────────────────────────── 실험실 ─────────────────────────────── */

function lab() {
  let data = START.slice();
  let mode = 'keep';
  let dragging = -1;

  const cv = makeCanvas(230, { pad: { l: 40, r: 24, t: 24, b: 40 } });
  const stats = h('div', {
    style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: '9px', marginTop: '12px' },
  });
  const calc = h('div', { style: { marginTop: '12px' } });
  const cmp = h('div', { style: { marginTop: '12px' } });

  const sxOf = () => {
    const lo = Math.min(...data, 0);
    const hi = Math.max(...data) * 1.08;
    return scale(lo, hi, cv.pad.l, cv.w - cv.pad.r);
  };

  /** 지금 고른 처리 방법을 적용한 결과 자료 */
  function processed() {
    const bs = S.boxStats(data);
    if (mode === 'drop') return data.filter((v) => v <= bs.hi && v >= bs.lo);
    if (mode === 'clip') return data.map((v) => Math.min(bs.hi, Math.max(bs.lo, v)));
    return data.slice();
  }

  function paint() {
    const ctx = cv.begin();
    const sx = sxOf();
    const bs = S.boxStats(data);
    const y0 = cv.hgt - cv.pad.b;

    /* 눈금 */
    ctx.strokeStyle = COLORS.line; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cv.pad.l, y0); ctx.lineTo(cv.w - cv.pad.r, y0); ctx.stroke();
    ctx.fillStyle = COLORS.soft; ctx.textAlign = 'center';
    ticks(sx.domain[0], sx.domain[1], 8).forEach((v) => ctx.fillText(String(Math.round(v)), sx(v), y0 + 15));

    /* 경계 밖 영역을 옅은 빨강으로 */
    ctx.fillStyle = 'rgba(207,48,48,0.08)';
    if (bs.fenceHi < sx.domain[1]) ctx.fillRect(sx(bs.fenceHi), cv.pad.t, (cv.w - cv.pad.r) - sx(bs.fenceHi), y0 - cv.pad.t);
    if (bs.fenceLo > sx.domain[0]) ctx.fillRect(cv.pad.l, cv.pad.t, sx(bs.fenceLo) - cv.pad.l, y0 - cv.pad.t);

    /* 상자그림 */
    drawBox(cv, bs, sx, cv.pad.t + 100, 40);

    /* 경계선 */
    const fence = (v, txt, color) => {
      if (v < sx.domain[0] || v > sx.domain[1]) return;
      ctx.save();
      ctx.setLineDash([5, 4]); ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx(v), y0); ctx.lineTo(sx(v), cv.pad.t + 10); ctx.stroke();
      ctx.restore();
      label(ctx, txt, sx(v), cv.pad.t + 4, { align: 'center', color, bold: true, size: 11 });
    };
    fence(bs.fenceLo, `Q1−1.5×IQR = ${fx(bs.fenceLo, 1)}`, COLORS.red);
    fence(bs.fenceHi, `Q3+1.5×IQR = ${fx(bs.fenceHi, 1)}`, COLORS.red);

    /* 점 — 같은 값은 위로 쌓는다 */
    const stack = new Map();
    S.sorted(data).forEach((v) => {
      const k = v.toFixed(3);
      const lvl = stack.get(k) || 0;
      stack.set(k, lvl + 1);
      const bad = v > bs.hi || v < bs.lo;
      dot(ctx, sx(v), y0 - 12 - lvl * 13, dragging >= 0 && data[dragging] === v ? 8 : 6,
        bad ? COLORS.red : COLORS.blue, true);
    });

    /* 통계 카드 */
    clear(stats);
    [['Q1', fx(bs.q1, 2)], ['Q2 (중앙값)', fx(bs.q2, 2)], ['Q3', fx(bs.q3, 2)],
      ['IQR = Q3−Q1', fx(bs.iqr, 2)], ['하단경계', fx(bs.lo, 2)], ['상단경계', fx(bs.hi, 2)]]
      .forEach(([k, v]) => stats.append(h('div', { class: 'stat' }, h('div', { class: 'k' }, k), h('div', { class: 'v' }, v))));

    clear(calc);
    add(calc, [
      h('div', { class: 'formula' }, `IQR = ${fx(bs.q3, 2)} − ${fx(bs.q1, 2)} = `, h('b', {}, fx(bs.iqr, 2))),
      h('div', { class: 'formula', style: { marginLeft: '6px' } },
        `상단 = ${fx(bs.q3, 2)} + 1.5×${fx(bs.iqr, 2)} = `, h('b', {}, fx(bs.fenceHi, 2))),
      h('div', { class: 'formula', style: { marginLeft: '6px' } },
        `하단 = ${fx(bs.q1, 2)} − 1.5×${fx(bs.iqr, 2)} = `, h('b', {}, fx(bs.fenceLo, 2))),
      bs.outliers.length
        ? note('bad', h('b', {}, `🔴 이상치 ${bs.outliers.length}개 — `), bs.outliers.map((v) => fx(v, 1)).join(', '))
        : note('ok', '이상치가 없습니다. 점을 오른쪽 끝으로 끌어 보세요.'),
    ]);

    /* 처리 결과 비교 */
    const after = processed();
    clear(cmp);
    cmp.append(table(['', '개수', '평균', '표준편차', '최댓값'], [
      [h('td', { class: 'left', style: { fontWeight: '800' } }, '처리 전'),
        data.length, fx(S.mean(data), 2), fx(S.stdev(data), 2), fx(Math.max(...data), 1)],
      [h('td', { class: 'left', style: { fontWeight: '800' } },
        mode === 'keep' ? '그대로 사용' : mode === 'drop' ? '이상치 행 삭제' : '경곗값으로 치환'),
      after.length, fx(S.mean(after), 2), fx(S.stdev(after), 2), fx(Math.max(...after), 1)],
    ]));
    if (mode !== 'keep') {
      cmp.append(note('', h('b', {}, '무엇이 달라졌나 '),
        `평균이 ${fx(S.mean(data), 2)} 에서 ${fx(S.mean(after), 2)} 로, `
        + `표준편차가 ${fx(S.stdev(data), 2)} 에서 ${fx(S.stdev(after), 2)} 로 바뀌었습니다. `
        + (mode === 'drop' ? '행을 지웠으므로 자료 개수도 줄었습니다.' : '개수는 그대로 두고 값만 경계로 눌렀습니다.')));
    }
  }

  /* 점 끌기 */
  function nearest(x) {
    let best = -1; let bd = 1e9;
    data.forEach((v, i) => { const d = Math.abs(v - x); if (d < bd) { bd = d; best = i; } });
    return bd < (sxOf().domain[1] - sxOf().domain[0]) * 0.04 ? best : -1;
  }
  cv.el.addEventListener('pointerdown', (ev) => {
    const rect = cv.el.getBoundingClientRect();
    const x = sxOf().invert(ev.clientX - rect.left);
    const i = nearest(x);
    if (i >= 0) { dragging = i; cv.el.setPointerCapture(ev.pointerId); }
    else { data = S.sorted(data.concat([Math.round(x)])); }
    paint();
  });
  cv.el.addEventListener('pointermove', (ev) => {
    if (dragging < 0) return;
    const rect = cv.el.getBoundingClientRect();
    data[dragging] = Math.max(0, Math.round(sxOf().invert(ev.clientX - rect.left)));
    paint();
  });
  const stop = () => { if (dragging >= 0) { dragging = -1; data = S.sorted(data); paint(); } };
  cv.el.addEventListener('pointerup', stop);
  cv.el.addEventListener('pointercancel', stop);

  const modeBar = h('div', { class: 'row tight' },
    [['keep', '그대로 사용'], ['drop', '이상치 행 삭제'], ['clip', '경곗값으로 치환']].map(([id, lb]) => {
      const b = h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => {
          mode = id;
          modeBar.querySelectorAll('button').forEach((x) => x.classList.add('ghost'));
          b.classList.remove('ghost');
          paint();
        },
      }, lb);
      if (id === 'keep') b.classList.remove('ghost');
      return b;
    }));

  drawNow(paint);
  onResize(paint);

  return card('🔴 이상치 탐지기 (IQR)',
    h('div', { class: 'lead' }, '점을 끌어 옮기면 경계가 다시 계산됩니다. 빈 곳을 누르면 점이 하나 더해집니다. 빨간 점이 이상치입니다.'),
    cv.el, stats, calc,
    h('h4', {}, '이 이상치를 어떻게 처리할까'),
    modeBar, cmp,
    pyBox([
      "Q1 = df['값'].quantile(0.25)",
      "Q3 = df['값'].quantile(0.75)",
      "IQR = Q3 - Q1",
      "lo, hi = Q1 - 1.5*IQR, Q3 + 1.5*IQR",
      "",
      "df[(df['값'] < lo) | (df['값'] > hi)]        # 이상치만 보기",
      "df = df[(df['값'] >= lo) & (df['값'] <= hi)]  # 이상치 행 삭제",
      "df['값'] = df['값'].clip(lo, hi)             # 경곗값으로 치환",
    ].join('\n')));
}

/* ───────────── 이상치 하나가 회귀선을 얼마나 흔드는가 ───────────── */

function regressDemo() {
  const base = Array.from({ length: 11 }, (_, i) => [i + 1, (i + 1) * 0.85 + 1.2]);
  let outY = 3;
  const cv = makeCanvas(280, { pad: { l: 44, r: 20, t: 20, b: 36 } });
  const readout = h('div', { class: 'row', style: { marginTop: '10px' } });

  const sl = h('input', { type: 'range', min: '1', max: '20', step: '0.5', value: '3', style: { flex: '1' } });

  function paint() {
    outY = Number(sl.value);
    const ctx = cv.begin();
    const sx = scale(0, 13, cv.pad.l, cv.w - cv.pad.r);
    const sy = scale(0, 21, cv.hgt - cv.pad.b, cv.pad.t);

    // 축
    ctx.strokeStyle = COLORS.line; ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cv.pad.l, cv.pad.t); ctx.lineTo(cv.pad.l, cv.hgt - cv.pad.b); ctx.lineTo(cv.w - cv.pad.r, cv.hgt - cv.pad.b);
    ctx.stroke();

    const withOut = base.concat([[12, outY]]);
    const xsA = base.map((p) => p[0]); const ysA = base.map((p) => p[1]);
    const xsB = withOut.map((p) => p[0]); const ysB = withOut.map((p) => p[1]);
    const A = S.linreg(xsA, ysA);
    const B = S.linreg(xsB, ysB);

    // 이상치 없는 회귀선 (회색)
    polyline(ctx, [[sx(0), sy(A.b)], [sx(13), sy(A.a * 13 + A.b)]], '#b9c3d1', 2.5, [6, 4]);
    // 이상치 포함 회귀선 (주황)
    polyline(ctx, [[sx(0), sy(B.b)], [sx(13), sy(B.a * 13 + B.b)]], COLORS.orange, 3);

    base.forEach((p) => dot(ctx, sx(p[0]), sy(p[1]), 6, COLORS.blue, true));
    dot(ctx, sx(12), sy(outY), 9, COLORS.red, true);

    label(ctx, '회색 점선 = 빨간 점이 없을 때의 회귀선', cv.w - cv.pad.r, cv.pad.t + 8, { align: 'right', color: COLORS.soft });
    label(ctx, '주황 실선 = 빨간 점을 포함한 회귀선', cv.w - cv.pad.r, cv.pad.t + 24, { align: 'right', color: COLORS.orange, bold: true });

    const predA = ysA.map((_, i) => A.a * xsA[i] + A.b);
    const predB = ysB.map((_, i) => B.a * xsB[i] + B.b);
    clear(readout);
    add(readout, [
      h('span', { class: 'chip' }, `이상치 없을 때  y = ${fx(A.a, 2)}x + ${fx(A.b, 2)}`),
      h('span', { class: 'chip on' }, `이상치 있을 때  y = ${fx(B.a, 2)}x + ${fx(B.b, 2)}`),
      h('span', { class: 'chip' }, `기울기 차이 ${fx(Math.abs(B.a - A.a), 3)}`),
      h('span', { class: 'chip' + (S.r2(ysB, predB) < 0.8 ? ' bad' : ' ok') },
        `R²  ${fx(S.r2(ysA, predA), 3)} → ${fx(S.r2(ysB, predB), 3)}`),
    ]);
  }

  sl.addEventListener('input', paint);
  drawNow(paint);
  onResize(paint);

  return card('📉 이상치 하나가 회귀선을 얼마나 흔들까',
    h('div', { class: 'lead' }, '빨간 점의 높이를 슬라이더로 바꿔 보세요. 점 하나 때문에 선 전체가 기울어집니다.'),
    h('div', { class: 'row' }, h('label', { class: 'field' }, '빨간 점의 y 값'), sl),
    cv.el, readout,
    note('warn', '점 12개 중 단 하나만 튀어도 회귀선의 기울기와 결정계수 R² 가 크게 흔들립니다. ',
      '「이상치가 존재하면 전체 추세를 벗어나는 데이터도 모델 학습에 반영되어 모델 성능에 영향을 미친다」는 말이 이 뜻입니다.'));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '이상치 탐지에서 가장 널리 사용되는 방법은 무엇을 활용하나요? (영문 3글자)',
        answer: ['IQR', 'iqr', '사분범위'],
        explain: 'IQR = Q3 − Q1, 사분범위입니다.',
        width: 140,
      },
      {
        q: 'Q1 = 15, Q3 = 21 일 때 IQR 은?',
        answer: ['6'],
        explain: '21 − 15 = 6',
        width: 120,
      },
      {
        q: '위 값에서 상단 경곗값 Q3 + 1.5×IQR 은?',
        answer: ['30'],
        hint: '21 + 1.5 × 6',
        explain: '21 + 9 = 30. 30 보다 큰 값은 통계적으로 이상치입니다.',
        width: 120,
      },
      {
        q: '위 값에서 하단 경곗값 Q1 − 1.5×IQR 은?',
        answer: ['6'],
        explain: '15 − 9 = 6. 6 보다 작은 값은 통계적으로 이상치입니다.',
        width: 120,
      },
      {
        q: '이상치가 진짜로 있을 수 있는 값(예: 마라톤 기록의 프로 선수)이라면 어떻게 하는 것이 좋을까요?',
        type: 'choice',
        choices: ['무조건 삭제한다', '적당한 스케일링을 적용해 그대로 쓴다', '0 으로 바꾼다'],
        answer: '적당한 스케일링을 적용해 그대로 쓴다',
        explain: '이상치라고 해서 늘 오류인 것은 아닙니다. 삭제하면 진짜 정보를 잃습니다.',
      },
    ], { revealOnWrong: true }));
}
