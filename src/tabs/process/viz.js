/* ============================================================================
 * viz.js — 학습지 2~3쪽 「시각화 분석」
 *
 *   ① 같은 자료를 다섯 가지 그래프로 — 막대·히스토그램·분포·상자·산점도
 *   ② 막대그래프와 히스토그램은 무엇이 다른가 (학습지 비교표)
 *   ③ 상관계수 실험실 — 점을 끌어 옮기면 r 이 실시간으로 바뀐다
 *   ④ 히트맵 — 여러 변수의 상관관계를 색으로
 *
 * 여기 쓰는 「우리 반 자료」는 학생 개인정보가 아니라 코드가 만든 가짜 자료다.
 * 씨앗값을 고정해 두어 누가 열어도 같은 자료가 나온다.
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

import { h, add, clear, card, sheetHead, note, answer, quizSet, table, pyBox, fx, drawNow, pillGroup, onResize } from '../../lib/ui.js';
import * as S from '../../lib/stats.js';
import { makeCanvas, scale, axes, dot, polyline, label, drawBox, corrColor, COLORS, ticks } from '../../lib/chart.js';

/* ─────────── 씨앗값 고정 난수 — 누가 열어도 같은 자료가 나온다 ────────── */

function rng(seed) {
  let s = seed >>> 0;
  return () => {
    s = (s * 1664525 + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

/** 정규분포 비슷한 난수 (0 근처에 몰림) */
function gauss(r) { return (r() + r() + r() + r() - 2) * 1.1; }

const SUBJECTS = ['국어', '수학', '영어', '과학', '체육'];

function makeClass(n = 30) {
  const r = rng(20260307);
  const rows = [];
  for (let i = 0; i < n; i++) {
    const height = Math.round(163 + gauss(r) * 7);
    const weight = Math.round((height - 100) * 0.86 + gauss(r) * 5.5);
    const study = Math.max(0, Math.round((2.2 + gauss(r) * 1.2) * 10) / 10);
    const game = Math.max(0, Math.round((3.4 - study * 0.55 + gauss(r) * 0.9) * 10) / 10);
    const math = Math.round(Math.min(100, Math.max(20, 46 + study * 11 + gauss(r) * 8)));
    const fav = SUBJECTS[Math.floor(r() * SUBJECTS.length)];
    rows.push({ id: i + 1, height, weight, study, game, math, fav });
  }
  return rows;
}

const DATA = makeClass(30);

const NUMCOLS = [
  { id: 'height', label: '키(cm)' },
  { id: 'weight', label: '몸무게(kg)' },
  { id: 'study', label: '공부시간(h)' },
  { id: 'game', label: '게임시간(h)' },
  { id: 'math', label: '수학점수' },
];

const col = (id) => DATA.map((d) => d[id]);

export function render(root) {
  add(root, sheetHead('학습지 2~3쪽', '시각화 분석 — 그림으로 보면 보이는 것',
    ['[12인기02-02]'],
    [
      '자료의 성질에 맞는 그래프를 골라 그릴 수 있다.',
      '막대그래프와 히스토그램의 가로축·세로축이 어떻게 다른지 설명할 수 있다.',
      '상관계수의 부호와 크기가 산점도의 모양과 어떻게 이어지는지 설명할 수 있다.',
    ]));

  root.append(dataCard());
  root.append(gallery());
  root.append(barVsHist());
  root.append(corrLab());
  root.append(heatmapCard());
  root.append(quizCard());
}

/* ─────────────────────────── 자료 미리보기 ───────────────────────── */

function dataCard() {
  const head = ['번호', '키(cm)', '몸무게(kg)', '공부시간(h)', '게임시간(h)', '수학점수', '좋아하는 과목'];
  const rows = DATA.slice(0, 8).map((d) => [d.id, d.height, d.weight, d.study, d.game, d.math, d.fav]);
  rows.push([h('td', { colspan: '7', class: 'dim' }, `⋮ (모두 ${DATA.length}행)`)]);

  return card('📋 실습용 자료 — 어느 반 30명 (코드가 만든 가짜 자료)',
    h('div', { class: 'lead' }, '실제 학생 자료가 아닙니다. 이 앱은 학생 개인정보를 수집하거나 저장하지 않습니다.'),
    table(head, rows, { compact: true }),
    pyBox([
      "df.head()        # 앞에서 5줄 훑어보기",
      "df.info()        # 행 수, 열 이름, 자료형, 결측치",
      "df.describe()    # 수치형 열의 기술 통계 한 번에",
      "df['좋아하는 과목'].value_counts()   # 범주별 개수 → 막대그래프의 재료",
    ].join('\n')));
}

/* ───────────────── 같은 자료를 다섯 가지 그래프로 ───────────────── */

const CHARTS = [
  {
    id: 'bar', label: '① 막대그래프',
    desc: ['범주', '에 대한 개수(또는 통계값)를 막대 모양으로 나타냅니다. 각 항목의 수량을 한눈에 보고, 크고 작음을 비교할 때 씁니다.'],
    use: '가로축 = 각 범주 · 세로축 = 범주별 통계 데이터',
  },
  {
    id: 'hist', label: '② 히스토그램',
    desc: ['수치형', ' 자료를 구간으로 나누고, 구간마다 몇 개가 들어 있는지를 막대로 그립니다. 자료의 특성과 분포를 보기에 좋습니다.'],
    use: '가로축 = 수치형 데이터 구간 · 세로축 = 그 구간에 든 데이터 빈도수',
  },
  {
    id: 'density', label: '③ 분포 차트',
    desc: ['분포', ' 차트(density plot)는 히스토그램을 매끄러운 곡선으로 그린 것입니다. 여러 범주를 색으로 나누어 겹쳐 그리면 분포를 견줄 수 있습니다.'],
    use: '범주별 분포를 겹쳐 비교',
  },
  {
    id: 'box', label: '④ 상자그래프',
    desc: ['사분위수', ' 를 중심으로 수치형 자료를 상자 모양으로 그립니다. 분포와 이상치를 한눈에 볼 수 있습니다.'],
    use: '상단경계 · Q3 · 중앙값 · Q1 · 하단경계 다섯 수치',
  },
  {
    id: 'scatter', label: '⑤ 산점도',
    desc: ['두 수치형 자료 사이의 관계', ' 를 점으로 보여 줍니다. 상관관계의 방향과 이상치를 함께 볼 수 있습니다.'],
    use: '가로축 = 변수 1 · 세로축 = 변수 2',
  },
];

function gallery() {
  const cv = makeCanvas(300);
  const info = h('div', { style: { marginTop: '12px' } });
  let cur = 'bar';
  let numCol = 'math';

  const picker = pillGroup(CHARTS.map((c) => ({ id: c.id, label: c.label })), {
    value: 'bar', onPick: (v) => { cur = v; paint(); },
  });

  const colSel = h('select', {
    onchange: (e) => { numCol = e.target.value; paint(); },
  }, NUMCOLS.map((c) => h('option', { value: c.id, selected: c.id === 'math' }, c.label)));

  const binsSl = h('input', { type: 'range', min: '3', max: '14', value: '7', style: { width: '150px' } });
  const binsOut = h('b', { class: 'big-num', style: { fontSize: '1.05rem' } }, '7');
  binsSl.addEventListener('input', () => { binsOut.textContent = binsSl.value; paint(); });

  function paint() {
    const ctx = cv.begin();
    const chart = CHARTS.find((c) => c.id === cur);
    const values = col(numCol);
    const colLabel = NUMCOLS.find((c) => c.id === numCol).label;

    if (cur === 'bar') drawBar(cv, ctx);
    else if (cur === 'hist') drawHist(cv, ctx, values, Number(binsSl.value), colLabel);
    else if (cur === 'density') drawDensity(cv, ctx, values, colLabel);
    else if (cur === 'box') drawBoxOnly(cv, ctx, values, colLabel);
    else drawScatter(cv, ctx);

    clear(info);
    add(info, [
      h('div', { class: 'note' }, h('b', {}, chart.label + ' — '), chart.desc[0] ? [answer(chart.desc[0]), chart.desc[1]] : null),
      h('div', { class: 'row', style: { marginTop: '8px' } }, h('span', { class: 'chip' }, chart.use)),
    ]);
  }

  /* 막대그래프 — 좋아하는 과목별 인원수 (범주형) */
  function drawBar(c, ctx) {
    const counts = SUBJECTS.map((s) => DATA.filter((d) => d.fav === s).length);
    const sy = scale(0, Math.max(...counts) + 1, c.hgt - c.pad.b, c.pad.t);
    const bw = c.plotW / SUBJECTS.length;
    axes(c, scale(0, 1, c.pad.l, c.w - c.pad.r), sy, { xTicks: [] });
    SUBJECTS.forEach((s, i) => {
      const x = c.pad.l + bw * i + bw * 0.18;
      const w = bw * 0.64;
      const y = sy(counts[i]);
      ctx.fillStyle = COLORS.blue;
      ctx.fillRect(x, y, w, c.hgt - c.pad.b - y);
      label(ctx, String(counts[i]), x + w / 2, y - 10, { align: 'center', bold: true, color: COLORS.blue });
      label(ctx, s, x + w / 2, c.hgt - c.pad.b + 14, { align: 'center', color: COLORS.soft });
    });
    label(ctx, '좋아하는 과목 (범주)', c.w - c.pad.r, c.pad.t + 6, { align: 'right', color: COLORS.soft });
  }

  /* 히스토그램 — 수치형을 구간으로 */
  function drawHist(c, ctx, values, bins, colLabel) {
    const hgram = S.histogram(values, bins);
    const sx = scale(hgram.edges[0], hgram.edges[hgram.edges.length - 1], c.pad.l, c.w - c.pad.r);
    const sy = scale(0, Math.max(...hgram.counts) + 1, c.hgt - c.pad.b, c.pad.t);
    axes(c, sx, sy, { xTicks: hgram.edges });
    hgram.counts.forEach((n, i) => {
      const x0 = sx(hgram.edges[i]); const x1 = sx(hgram.edges[i + 1]);
      const y = sy(n);
      ctx.fillStyle = 'rgba(30,111,217,0.75)';
      ctx.fillRect(x0 + 1, y, x1 - x0 - 2, c.hgt - c.pad.b - y);
      ctx.strokeStyle = COLORS.blue; ctx.lineWidth = 1;
      ctx.strokeRect(x0 + 1, y, x1 - x0 - 2, c.hgt - c.pad.b - y);
      if (n) label(ctx, String(n), (x0 + x1) / 2, y - 9, { align: 'center', bold: true, color: COLORS.blue });
    });
    label(ctx, colLabel + ' 구간', c.w - c.pad.r, c.pad.t + 6, { align: 'right', color: COLORS.soft });
  }

  /* 분포 차트 — 범주별로 겹쳐 그린 매끄러운 곡선 */
  function drawDensity(c, ctx, values, colLabel) {
    const lo = Math.min(...values) - 5; const hi = Math.max(...values) + 5;
    const sx = scale(lo, hi, c.pad.l, c.w - c.pad.r);
    const bw = (hi - lo) / 8;
    const groups = SUBJECTS.map((s) => ({ s, v: DATA.filter((d) => d.fav === s).map((d) => d[numCol]) }))
      .filter((g) => g.v.length >= 3);
    const colors = [COLORS.blue, COLORS.orange, COLORS.green, COLORS.purple, COLORS.pink];

    const dens = (arr, x) => arr.reduce((s, v) => s + Math.exp(-((x - v) ** 2) / (2 * bw * bw)), 0) / (arr.length * bw);
    let peak = 0;
    groups.forEach((g) => { for (let x = lo; x <= hi; x += (hi - lo) / 80) peak = Math.max(peak, dens(g.v, x)); });
    const sy = scale(0, peak * 1.18, c.hgt - c.pad.b, c.pad.t);
    axes(c, sx, sy, { yTicks: [] });

    groups.forEach((g, i) => {
      const pts = [];
      for (let x = lo; x <= hi; x += (hi - lo) / 120) pts.push([sx(x), sy(dens(g.v, x))]);
      polyline(ctx, pts, colors[i % colors.length], 2.5);
      label(ctx, g.s, c.pad.l + 12, c.pad.t + 12 + i * 16, { color: colors[i % colors.length], bold: true });
    });
    label(ctx, colLabel, c.w - c.pad.r, c.pad.t + 6, { align: 'right', color: COLORS.soft });
  }

  /* 상자그래프 */
  function drawBoxOnly(c, ctx, values, colLabel) {
    const bs = S.boxStats(values);
    const lo = Math.min(...values); const hi = Math.max(...values);
    const padv = (hi - lo) * 0.1;
    const sx = scale(lo - padv, hi + padv, c.pad.l, c.w - c.pad.r);
    const y0 = c.hgt - c.pad.b;
    ctx.strokeStyle = COLORS.line; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(c.pad.l, y0); ctx.lineTo(c.w - c.pad.r, y0); ctx.stroke();
    ctx.fillStyle = COLORS.soft; ctx.textAlign = 'center';
    ticks(lo - padv, hi + padv, 7).forEach((v) => ctx.fillText(String(Math.round(v * 10) / 10), sx(v), y0 + 14));

    drawBox(c, bs, sx, c.pad.t + 70, 56);
    // 실제 점도 함께 뿌려 준다 — 상자가 어디서 왔는지 보이도록
    values.forEach((v) => dot(ctx, sx(v), c.pad.t + 20, 3.5, 'rgba(30,111,217,0.45)'));
    label(ctx, `Q1 ${fx(bs.q1, 1)} · 중앙값 ${fx(bs.q2, 1)} · Q3 ${fx(bs.q3, 1)} · IQR ${fx(bs.iqr, 1)}`,
      c.pad.l, c.hgt - 8, { color: COLORS.soft });
    label(ctx, colLabel, c.w - c.pad.r, c.pad.t + 6, { align: 'right', color: COLORS.soft });
  }

  /* 산점도 — 공부시간 vs 수학점수 */
  function drawScatter(c, ctx) {
    const xs = col('study'); const ys = col('math');
    const sx = scale(Math.min(...xs) - 0.4, Math.max(...xs) + 0.4, c.pad.l, c.w - c.pad.r);
    const sy = scale(Math.min(...ys) - 6, Math.max(...ys) + 6, c.hgt - c.pad.b, c.pad.t);
    axes(c, sx, sy);
    const { a, b } = S.linreg(xs, ys);
    polyline(ctx, [[sx(sx.domain[0]), sy(a * sx.domain[0] + b)], [sx(sx.domain[1]), sy(a * sx.domain[1] + b)]], COLORS.orange, 2.5, [6, 4]);
    xs.forEach((x, i) => dot(ctx, sx(x), sy(ys[i]), 5, COLORS.blue, true));
    label(ctx, `공부시간 ↔ 수학점수 · r = ${fx(S.corr(xs, ys), 3)}`, c.w - c.pad.r, c.pad.t + 6, { align: 'right', color: COLORS.soft, bold: true });
  }

  drawNow(paint);
  onResize(paint);

  return card('📊 같은 자료를 다섯 가지 그래프로',
    picker.el,
    h('div', { class: 'row', style: { marginTop: '10px' } },
      h('label', { class: 'field' }, '수치형 열'), colSel,
      h('label', { class: 'field' }, '히스토그램 구간 수'), binsSl, binsOut),
    cv.el, info,
    pyBox([
      "import seaborn as sns",
      "sns.countplot(data=df, x='좋아하는 과목')      # ① 막대그래프",
      "sns.histplot(data=df, x='수학점수', bins=7)     # ② 히스토그램",
      "sns.kdeplot(data=df, x='수학점수', hue='좋아하는 과목')  # ③ 분포 차트",
      "sns.boxplot(data=df, y='수학점수')             # ④ 상자그래프",
      "sns.scatterplot(data=df, x='공부시간', y='수학점수')     # ⑤ 산점도",
    ].join('\n')));
}

/* ─────────────── 막대그래프 vs 히스토그램 비교표 ────────────────── */

function barVsHist() {
  return card('🔍 막대그래프와 히스토그램은 무엇이 다를까',
    table(['', '막대그래프', '히스토그램'], [
      [h('td', { style: { fontWeight: '800' } }, '가로축'),
        h('td', {}, [answer('각 범주')]),
        h('td', {}, [answer('수치형 데이터 구간')])],
      [h('td', { style: { fontWeight: '800' } }, '세로축'),
        h('td', {}, [answer('범주별 통계 데이터')]),
        h('td', {}, [answer('구간에 해당하는 빈도수')])],
      [h('td', { style: { fontWeight: '800' } }, '막대 사이'),
        h('td', {}, '띄운다 (범주는 서로 이어지지 않으므로)'),
        h('td', {}, '붙인다 (구간이 서로 이어져 있으므로)')],
      [h('td', { style: { fontWeight: '800' } }, '막대 순서'),
        h('td', {}, '바꿔도 된다'),
        h('td', {}, '바꿀 수 없다 (수의 크기 순)')],
    ]),
    note('', h('b', {}, '한 문장으로 '),
      '막대그래프는 「무엇이 몇 개인가」, 히스토그램은 「어느 구간에 몇 개가 몰려 있는가」를 봅니다. ',
      '위 갤러리에서 ① 과 ② 를 번갈아 눌러 보면 막대 사이가 붙었는지 떨어졌는지 바로 보입니다.'));
}

/* ─────────────────────── 상관계수 실험실 ────────────────────────── */

function corrLab() {
  /* 점 12개를 직접 끌어 옮기며 r 을 바꿔 본다 */
  let pts = [
    [1, 2], [2, 3], [3, 3.5], [4, 5], [5, 5.5], [6, 7],
    [7, 7.5], [8, 9], [2.5, 4], [5.5, 6], [6.5, 8], [3.5, 4.5],
  ];
  let dragging = -1;

  const cv = makeCanvas(320, { pad: { l: 46, r: 20, t: 22, b: 38 } });
  const readout = h('div', { class: 'row', style: { marginTop: '10px' } });
  const bar = h('div', { style: { marginTop: '10px' } });

  const sx = () => scale(0, 10, cv.pad.l, cv.w - cv.pad.r);
  const sy = () => scale(0, 10, cv.hgt - cv.pad.b, cv.pad.t);

  function paint() {
    const ctx = cv.begin();
    const X = sx(); const Y = sy();
    axes(cv, X, Y, { xLabel: 'x', yLabel: 'y' });

    const xs = pts.map((p) => p[0]); const ys = pts.map((p) => p[1]);
    const r = S.corr(xs, ys);
    const { a, b } = S.linreg(xs, ys);
    polyline(ctx, [[X(0), Y(b)], [X(10), Y(a * 10 + b)]], COLORS.orange, 2.5, [6, 4]);
    pts.forEach((p, i) => dot(ctx, X(p[0]), Y(p[1]), i === dragging ? 9 : 7, i === dragging ? COLORS.orange : COLORS.blue, true));

    label(ctx, `r = ${fx(r, 3)}`, cv.w - cv.pad.r, cv.pad.t + 4, { align: 'right', bold: true, size: 16, color: COLORS.blue });

    clear(readout);
    const strength = Math.abs(r) >= 0.7 ? '강한' : Math.abs(r) >= 0.3 ? '중간 정도의' : Math.abs(r) >= 0.1 ? '약한' : '거의 없는';
    const dir = r > 0.1 ? '양(+)의' : r < -0.1 ? '음(−)의' : '';
    add(readout, [
      h('span', { class: 'chip on' }, `r = ${fx(r, 3)}`),
      h('span', { class: 'chip' }, `${strength} ${dir} 상관관계`),
      h('span', { class: 'chip' }, `회귀선 y = ${fx(a, 2)}x + ${fx(b, 2)}`),
    ]);

    /* r 의 위치를 자로 보여 준다 */
    clear(bar);
    const track = h('div', {
      style: {
        position: 'relative', height: '30px', borderRadius: '8px',
        background: 'linear-gradient(90deg, #cf3030, #f1f4f9 50%, #1e6fd9)',
        border: '1px solid var(--line)',
      },
    }, h('div', {
      style: {
        position: 'absolute', left: `calc(${((r + 1) / 2) * 100}% - 3px)`, top: '-5px',
        width: '6px', height: '40px', background: 'var(--ink)', borderRadius: '3px',
      },
    }));
    add(bar, [
      track,
      h('div', { class: 'row', style: { justifyContent: 'space-between', fontSize: '0.88rem', color: 'var(--ink-soft)' } },
        h('span', {}, '−1 · 강한 음의 상관'), h('span', {}, '0 · 상관 없음'), h('span', {}, '+1 · 강한 양의 상관')),
    ]);
  }

  function toData(ev) {
    const rect = cv.el.getBoundingClientRect();
    return [sx().invert(ev.clientX - rect.left), sy().invert(ev.clientY - rect.top)];
  }

  cv.el.addEventListener('pointerdown', (ev) => {
    const [x, y] = toData(ev);
    let best = -1; let bd = 1e9;
    pts.forEach((p, i) => {
      const d = (p[0] - x) ** 2 + (p[1] - y) ** 2;
      if (d < bd) { bd = d; best = i; }
    });
    if (bd < 0.8) { dragging = best; cv.el.setPointerCapture(ev.pointerId); paint(); }
  });
  cv.el.addEventListener('pointermove', (ev) => {
    if (dragging < 0) return;
    const [x, y] = toData(ev);
    pts[dragging] = [Math.max(0, Math.min(10, x)), Math.max(0, Math.min(10, y))];
    paint();
  });
  const stop = () => { if (dragging >= 0) { dragging = -1; paint(); } };
  cv.el.addEventListener('pointerup', stop);
  cv.el.addEventListener('pointercancel', stop);

  const presets = h('div', { class: 'row tight' },
    h('button', { type: 'button', class: 'btn ghost small', onclick: () => { pts = line(1); paint(); } }, 'r ≈ +1'),
    h('button', { type: 'button', class: 'btn ghost small', onclick: () => { pts = line(-1); paint(); } }, 'r ≈ −1'),
    h('button', { type: 'button', class: 'btn ghost small', onclick: () => { pts = cloud(); paint(); } }, 'r ≈ 0'),
    h('button', { type: 'button', class: 'btn ghost small', onclick: () => { pts = curve(); paint(); } }, '곡선 관계'));

  function line(sign) {
    const r = rng(7);
    return Array.from({ length: 12 }, (_, i) => {
      const x = 0.6 + i * 0.78;
      const y = sign > 0 ? x + (r() - 0.5) * 0.7 : 10 - x + (r() - 0.5) * 0.7;
      return [x, Math.max(0.2, Math.min(9.8, y))];
    });
  }
  function cloud() {
    const r = rng(13);
    return Array.from({ length: 12 }, () => [1 + r() * 8, 1 + r() * 8]);
  }
  function curve() {
    return Array.from({ length: 12 }, (_, i) => {
      const x = 0.6 + i * 0.78;
      return [x, Math.max(0.3, Math.min(9.7, 9.5 - ((x - 5) ** 2) * 0.34))];
    });
  }

  drawNow(paint);
  onResize(paint);

  return card('🎯 상관계수 실험실 — 점을 끌어 보세요',
    h('div', { class: 'lead' },
      '상관계수는 두 변수의 ', answer('선형'), ' 관계를 −1 과 +1 사이의 수로 나타낸 것입니다. ',
      '점을 마우스로(전자칠판이면 손가락으로) 끌면 r 이 바로 바뀝니다.'),
    presets, cv.el, readout, bar,
    note('warn', h('b', {}, '[곡선 관계] 를 눌러 보세요. '),
      '눈으로 보면 x 와 y 사이에 아주 뚜렷한 규칙(포물선)이 있는데도 r 은 0 에 가깝습니다. ',
      '상관계수는 「직선 관계」만 재기 때문입니다. 그래서 숫자만 보지 말고 반드시 산점도를 함께 그려야 합니다.'),
    note('bad', h('b', {}, '또 하나 — 상관관계 ≠ 인과관계. '),
      '아이스크림 판매량과 물놀이 사고 수는 상관이 높지만, 아이스크림이 사고를 일으킨 것이 아닙니다. ',
      '둘 다 「더운 날씨」라는 세 번째 원인 때문입니다.'));
}

/* ────────────────────────── 상관 히트맵 ────────────────────────── */

function heatmapCard() {
  const grid = h('div', { class: 'scroll-x' });

  function paint() {
    const n = NUMCOLS.length;
    const rows = [];
    for (let i = 0; i < n; i++) {
      const r = [h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, NUMCOLS[i].label)];
      for (let j = 0; j < n; j++) {
        const v = S.corr(col(NUMCOLS[i].id), col(NUMCOLS[j].id));
        r.push(h('td', {
          class: 'mono',
          style: { background: corrColor(v), fontWeight: Math.abs(v) > 0.5 ? '800' : '600' },
          title: `${NUMCOLS[i].label} ↔ ${NUMCOLS[j].label}`,
        }, fx(v, 2)));
      }
      rows.push(r);
    }
    clear(grid);
    grid.append(table([''].concat(NUMCOLS.map((c) => c.label)), rows, { scroll: false, compact: true }));
  }
  paint();

  return card('🔥 히트맵 — 여러 변수의 상관관계를 색으로',
    h('div', { class: 'lead' },
      answer('히트맵'), ' 은 두 데이터 사이의 상관관계를 색으로 나타낸 그래프입니다. ',
      '값은 −1 과 +1 사이(상관계수)입니다. 대각선은 자기 자신과의 상관이라 항상 1 입니다.'),
    grid,
    h('div', { class: 'legend', style: { marginTop: '10px' } },
      h('span', {}, h('i', { style: { background: corrColor(0.9) } }), '진한 파랑 = 강한 양의 상관'),
      h('span', {}, h('i', { style: { background: corrColor(0) } }), '옅음 = 상관 거의 없음'),
      h('span', {}, h('i', { style: { background: corrColor(-0.9) } }), '진한 빨강 = 강한 음의 상관')),
    note('', h('b', {}, '읽어 보기 '),
      '「공부시간 ↔ 게임시간」은 음수입니다. 공부를 오래 한 학생일수록 게임시간이 적게 만들어 둔 자료이기 때문입니다. ',
      '「키 ↔ 몸무게」는 강한 양수입니다. 이렇게 서로 아주 비슷한 정보를 담은 두 열이 있으면, ',
      '핵심 속성 추출 단계에서 하나를 빼는 것을 생각해 볼 수 있습니다.'),
    pyBox([
      "corr = df[['키','몸무게','공부시간','게임시간','수학점수']].corr()",
      "sns.heatmap(corr, annot=True, cmap='coolwarm', vmin=-1, vmax=1)",
    ].join('\n')));
}

/* ─────────────────────────── 학습지 문제 ───────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '수치형 데이터의 구간별 빈도수를 막대로 표시한 그래프는?',
        answer: ['히스토그램', 'histogram'],
        explain: '가로축이 「구간」이고 세로축이 「그 구간에 든 개수」입니다.',
      },
      {
        q: '사분위수를 중심으로 수치형 데이터의 통계 정보를 박스 모양으로 시각화하는 그래프는?',
        answer: ['상자그래프', '상자 그래프', 'box plot', 'boxplot', '박스플롯', '상자수염그림'],
        explain: '상단경계·Q3·중앙값·Q1·하단경계 다섯 수치를 보여 줍니다.',
      },
      {
        q: '두 데이터 간의 상관관계를 색상으로 표현해 주는 그래프는?',
        answer: ['히트맵', 'heatmap', 'heat map'],
        explain: '−1 과 +1 사이의 상관계수를 색의 진하기로 나타냅니다.',
      },
      {
        q: 'IQR(사분범위)을 구하는 식은? (Q1, Q3 으로 쓰세요)',
        answer: ['Q3-Q1', 'Q3−Q1'],
        place: '예: Q3-Q1',
        explain: '제3사분위수에서 제1사분위수를 뺀 값입니다.',
      },
      {
        q: '상관계수가 −1 에 가까울수록 어떤 상관관계인가요?',
        type: 'choice',
        choices: ['강한 양의 상관관계', '강한 음의 상관관계', '상관관계 없음'],
        answer: '강한 음의 상관관계',
        explain: '+1 에 가까우면 강한 양, −1 에 가까우면 강한 음, 0 에 가까우면 상관관계가 없다는 뜻입니다.',
      },
      {
        q: '상자그래프에서 상단경계보다 크거나 하단경계보다 작은 값을 무엇이라 하나요?',
        answer: ['이상치', 'outlier', '아웃라이어'],
        explain: '전체 데이터의 추세·패턴에서 벗어난 값입니다.',
      },
    ], { revealOnWrong: true }));
}
