/* ============================================================================
 * stats.js — 학습지 2쪽 「비시각화 분석: 기술 통계」
 *
 * 자료를 고치면 평균·중앙값·최빈값·분산·표준편차·사분위수가 곧바로 다시 계산되고,
 * 점 그래프와 상자그림도 함께 움직인다.
 * 기본값은 학습지에 실린 자료 1, 1, 1, 1, 2, 3, 3, 5, 10 이다.
 *   → 평균 3 / 중앙값 2 / 최빈값 1 / 최솟값 1 / 최댓값 10
 *
 * © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다.
 * 그 밖의 이용(재배포·2차 저작물·수업 외 목적)은 먼저 문의해 주세요.
 * 자세한 이용 범위는 이 저장소의 LICENSE 파일에 적어 두었습니다.
 * ========================================================================== */

import { h, add, clear, card, sheetHead, note, answer, answerBlock, quizSet, table, pyBox, fx, drawNow, pillGroup, onResize } from '../../lib/ui.js';
import * as S from '../../lib/stats.js';
import { makeCanvas, scale, axes, dot, polyline, label, drawBox, COLORS, ticks } from '../../lib/chart.js';

/* 학습지에 실린 자료 */
const SHEET = [1, 1, 1, 1, 2, 3, 3, 5, 10];

const PRESETS = [
  { id: 'sheet', label: '학습지 자료', data: SHEET },
  { id: 'sym', label: '좌우 대칭', data: [2, 3, 4, 4, 5, 5, 5, 6, 6, 7, 8] },
  { id: 'right', label: '오른쪽 꼬리', data: [1, 1, 2, 2, 2, 3, 3, 4, 6, 9, 14] },
  { id: 'out', label: '이상치 하나', data: [4, 5, 5, 6, 6, 6, 7, 7, 8, 30] },
  { id: 'flat', label: '고르게 퍼짐', data: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10] },
];

let data = SHEET.slice();
let qMethod = 'tukey';

export function render(root) {
  data = SHEET.slice();
  qMethod = 'tukey';

  add(root, sheetHead('학습지 2쪽', '기술 통계 실험실 — 모여 있는가, 흩어져 있는가',
    ['[12인기02-02]'],
    [
      '자료가 어떻게 「모여」 있는지 나타내는 평균값·중앙값·최빈값을 구할 수 있다.',
      '자료가 어떻게 「흩어져」 있는지 나타내는 분산·표준편차·사분위수를 구할 수 있다.',
      '평균과 중앙값이 이상치에 서로 다르게 반응하는 까닭을 설명할 수 있다.',
    ]));

  root.append(lab());
  root.append(varianceCard());
  root.append(shapeCard());
  root.append(quizCard());
}

/* ─────────────────────────── 실험실 본체 ─────────────────────────── */

function lab() {
  const input = h('input', {
    type: 'text', class: 'mono', value: data.join(', '),
    style: { flex: '1', minWidth: '260px' },
  });

  const dotCv = makeCanvas(190, { pad: { l: 40, r: 20, t: 18, b: 34 } });
  const boxCv = makeCanvas(150, { pad: { l: 40, r: 20, t: 26, b: 34 } });

  const statGrid = h('div', {
    style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(122px, 1fr))', gap: '9px', marginTop: '14px' },
  });

  const qBox = h('div', { style: { marginTop: '14px' } });
  const msg = h('div', { style: { marginTop: '12px' } });

  const methodPick = pillGroup([
    { id: 'tukey', label: '교과서 방식' },
    { id: 'linear', label: 'numpy·pandas 방식' },
  ], { value: 'tukey', onPick: (v) => { qMethod = v; paint(); } });

  function setData(arr) {
    data = arr;
    input.value = arr.join(', ');
    paint();
  }

  function readInput() {
    const arr = input.value.split(/[,\s]+/).map(Number).filter((v) => Number.isFinite(v));
    if (arr.length) { data = arr; paint(); }
  }
  input.addEventListener('input', readInput);

  /* 점 그래프 위를 누르면 그 자리에 값을 하나 더한다 */
  dotCv.el.addEventListener('click', (ev) => {
    const r = dotCv.el.getBoundingClientRect();
    const x = ev.clientX - r.left;
    const { sx } = lastScale;
    if (!sx) return;
    const v = Math.round(sx.invert(x) * 10) / 10;
    setData(S.sorted(data.concat([v])));
  });

  let lastScale = {};

  function paint() {
    /* ── 통계값 ── */
    const n = data.length;
    const m = S.mean(data);
    const md = S.median(data);
    const mo = S.mode(data);
    const va = S.variance(data);
    const sd = S.stdev(data);
    const q = S.quartiles(data, qMethod);
    const bs = S.boxStats(data, qMethod);

    clear(statGrid);
    const cells = [
      ['개수 n', n, ''],
      ['평균값 mean', fx(m, 3), 'ok'],
      ['중앙값 median', fx(md, 3), 'ok'],
      ['최빈값 mode', mo.values.join(', ') + ` (${mo.count}번)`, 'ok'],
      ['최솟값 min', fx(Math.min(...data), 2), ''],
      ['최댓값 max', fx(Math.max(...data), 2), ''],
      ['분산 variance', fx(va, 3), ''],
      ['표준편차 std', fx(sd, 3), ''],
      ['제1사분위수 Q1', fx(q.q1, 3), ''],
      ['제2사분위수 Q2', fx(q.q2, 3), ''],
      ['제3사분위수 Q3', fx(q.q3, 3), ''],
      ['사분범위 IQR', fx(q.iqr, 3), ''],
      ['왜도 skewness', fx(S.skewness(data), 3), ''],
      ['첨도 kurtosis', fx(S.kurtosis(data), 3), ''],
    ];
    cells.forEach(([k, v, kind]) => {
      statGrid.append(h('div', { class: 'stat' + (kind ? ' ' + kind : '') },
        h('div', { class: 'k' }, k), h('div', { class: 'v' }, String(v))));
    });

    /* ── 사분위수 두 방식 비교 ── */
    const tk = S.quartiles(data, 'tukey');
    const ln = S.quartiles(data, 'linear');
    clear(qBox);
    add(qBox, [
      table(['구하는 방법', 'Q1', 'Q2 (중앙값)', 'Q3', 'IQR'], [
        [h('td', { class: 'left' }, ['교과서 방식 ', h('span', { class: 'chip' }, '반을 갈라 각 절반의 중앙값')]),
          fx(tk.q1, 3), fx(tk.q2, 3), fx(tk.q3, 3), fx(tk.iqr, 3)],
        [h('td', { class: 'left' }, ['numpy·pandas 방식 ', h('span', { class: 'chip' }, '위치를 소수로 잡아 비례 배분')]),
          fx(ln.q1, 3), fx(ln.q2, 3), fx(ln.q3, 3), fx(ln.iqr, 3)],
      ]),
      Math.abs(tk.q1 - ln.q1) > 1e-9 || Math.abs(tk.q3 - ln.q3) > 1e-9
        ? note('warn', h('b', {}, '두 값이 다릅니다. '),
          '사분위수는 구하는 규칙이 여러 가지라 자료에 따라 값이 달라질 수 있습니다. ',
          '학습지 문제를 풀 때는 교과서 방식으로, ',
          h('code', { class: 'inline' }, 'df.describe()'),
          ' 결과와 맞춰 볼 때는 numpy 방식으로 보세요.')
        : note('ok', '이 자료에서는 두 방식의 값이 같습니다.'),
    ]);

    /* ── 이상치 안내 ── */
    clear(msg);
    add(msg, [
      h('div', { class: 'formula' },
        '상단경계 = min( Q3 + 1.5×IQR , 최댓값 ) = min( ',
        fx(bs.fenceHi, 2), ' , ', fx(bs.max, 2), ' ) = ', h('b', {}, fx(bs.hi, 2))),
      h('div', { class: 'formula', style: { marginLeft: '8px' } },
        '하단경계 = max( Q1 − 1.5×IQR , 최솟값 ) = max( ',
        fx(bs.fenceLo, 2), ' , ', fx(bs.min, 2), ' ) = ', h('b', {}, fx(bs.lo, 2))),
      bs.outliers.length
        ? note('bad', h('b', {}, `🔴 이상치 ${bs.outliers.length}개 — `), bs.outliers.join(', '),
          ' · 경계를 벗어난 값입니다. 평균이 이 값에 끌려가는지 보세요.')
        : note('ok', '이 자료에는 IQR 기준 이상치가 없습니다.'),
      h('div', { class: 'note', style: { marginTop: '10px' } },
        h('b', {}, '평균 vs 중앙값 '),
        `평균 ${fx(m, 2)} · 중앙값 ${fx(md, 2)} — `,
        Math.abs(m - md) < 0.15
          ? '거의 같습니다. 자료가 좌우로 고르게 퍼져 있다는 뜻입니다.'
          : (m > md
            ? '평균이 중앙값보다 큽니다. 오른쪽에 큰 값이 있어 평균이 그쪽으로 끌려갔습니다(오른쪽 꼬리).'
            : '평균이 중앙값보다 작습니다. 왼쪽에 작은 값이 있어 평균이 그쪽으로 끌려갔습니다(왼쪽 꼬리).')),
    ]);

    drawDots(m, md);
    drawBoxPlot(bs);
  }

  /* ── 점 그래프 ── */
  function drawDots(m, md) {
    const ctx = dotCv.begin();
    const lo = Math.min(...data); const hi = Math.max(...data);
    const padv = (hi - lo || 1) * 0.12;
    const sx = scale(lo - padv, hi + padv, dotCv.pad.l, dotCv.w - dotCv.pad.r);
    lastScale = { sx };

    // 가로축
    const y0 = dotCv.hgt - dotCv.pad.b;
    ctx.strokeStyle = COLORS.line; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(dotCv.pad.l, y0); ctx.lineTo(dotCv.w - dotCv.pad.r, y0); ctx.stroke();
    ctx.fillStyle = COLORS.soft; ctx.textAlign = 'center';
    ticks(lo - padv, hi + padv, 7).forEach((v) => {
      ctx.strokeStyle = COLORS.grid;
      ctx.beginPath(); ctx.moveTo(sx(v), y0); ctx.lineTo(sx(v), dotCv.pad.t); ctx.stroke();
      ctx.fillStyle = COLORS.soft;
      ctx.fillText(String(Math.round(v * 100) / 100), sx(v), y0 + 14);
    });

    // 같은 값은 위로 쌓는다
    const stack = new Map();
    S.sorted(data).forEach((v) => {
      const k = v.toFixed(4);
      const lvl = stack.get(k) || 0;
      stack.set(k, lvl + 1);
      dot(ctx, sx(v), y0 - 11 - lvl * 15, 6, COLORS.blue, true);
    });

    // 평균선·중앙값선
    const mark = (v, color, txt) => {
      ctx.save();
      ctx.setLineDash([5, 4]);
      ctx.strokeStyle = color; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.moveTo(sx(v), y0 + 4); ctx.lineTo(sx(v), dotCv.pad.t); ctx.stroke();
      ctx.restore();
      label(ctx, txt, sx(v), dotCv.pad.t + 6, { color, align: 'center', bold: true, size: 12 });
    };
    mark(m, COLORS.orange, `평균 ${fx(m, 2)}`);
    mark(md, COLORS.green, `중앙값 ${fx(md, 2)}`);
  }

  /* ── 상자그림 ── */
  function drawBoxPlot(bs) {
    const ctx = boxCv.begin();
    const lo = Math.min(...data); const hi = Math.max(...data);
    const padv = (hi - lo || 1) * 0.12;
    const sx = scale(lo - padv, hi + padv, boxCv.pad.l, boxCv.w - boxCv.pad.r);
    const y0 = boxCv.hgt - boxCv.pad.b;

    ctx.strokeStyle = COLORS.line; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(boxCv.pad.l, y0); ctx.lineTo(boxCv.w - boxCv.pad.r, y0); ctx.stroke();
    ctx.fillStyle = COLORS.soft; ctx.textAlign = 'center';
    ticks(lo - padv, hi + padv, 7).forEach((v) => {
      ctx.fillText(String(Math.round(v * 100) / 100), sx(v), y0 + 14);
    });

    drawBox(boxCv, bs, sx, boxCv.pad.t + 40, 46);

    // 눈금 이름표
    const tag = (v, txt) => label(ctx, txt, sx(v), boxCv.pad.t + 8, { color: COLORS.soft, align: 'center', size: 11 });
    tag(bs.q1, 'Q1'); tag(bs.q2, '중앙값'); tag(bs.q3, 'Q3');
    tag(bs.lo, '하단경계'); tag(bs.hi, '상단경계');
  }

  const presetBar = h('div', { class: 'row tight' },
    PRESETS.map((p) => h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => setData(p.data.slice()),
    }, p.label)),
    h('button', {
      type: 'button', class: 'btn gray small',
      onclick: () => setData(S.sorted(data.slice(0, -1)).length ? data.slice(0, -1) : data),
    }, '마지막 하나 빼기'));

  drawNow(paint);
  onResize(paint);

  return card('🔢 기술 통계 실험실',
    h('div', { class: 'lead' }, '숫자를 고치거나 점 그래프를 눌러 값을 더해 보세요. 모든 통계량이 곧바로 다시 계산됩니다.'),
    h('div', { class: 'row' }, h('label', { class: 'field' }, '자료'), input),
    h('div', { class: 'row', style: { marginTop: '8px' } }, presetBar),
    h('div', { style: { marginTop: '14px' } },
      h('b', { style: { color: 'var(--ink-soft)' } }, '점 그래프 '),
      h('span', { style: { color: 'var(--ink-soft)', fontSize: '0.9rem' } }, '— 그래프 아무 곳이나 누르면 그 값이 하나 더해집니다'),
      dotCv.el),
    h('div', { style: { marginTop: '14px' } },
      h('b', { style: { color: 'var(--ink-soft)' } }, '상자그림 (box plot)'),
      boxCv.el),
    statGrid,
    h('h4', {}, '사분위수는 구하는 방법이 두 가지입니다'),
    h('div', { class: 'row' }, h('label', { class: 'field' }, '위 표에 쓸 방법'), methodPick.el),
    qBox,
    msg,
    pyBox([
      "df['점수'].mean()      # 평균값",
      "df['점수'].median()    # 중앙값",
      "df['점수'].mode()      # 최빈값 (여러 개일 수 있어 Series 로 나온다)",
      "df['점수'].var()       # 분산   (기본은 n-1 로 나누는 표본분산!)",
      "df['점수'].var(ddof=0) # 학습지의 분산 (n 으로 나눔)",
      "df['점수'].std()       # 표준편차",
      "df['점수'].quantile([0.25, 0.5, 0.75])  # 사분위수",
      "df['점수'].skew(), df['점수'].kurt()     # 왜도, 첨도",
      "df.describe()          # 위의 것들을 한 번에",
    ].join('\n'),
    note('warn', h('b', {}, '주의 '), 'pandas 의 ', h('code', { class: 'inline' }, 'var()'),
      ' 는 기본이 표본분산(n−1 로 나눔)입니다. 학습지의 「제곱의 평균」과 값이 다르게 나오니 ',
      h('code', { class: 'inline' }, 'ddof=0'), ' 을 넣어야 같아집니다.')));
}

/* ────────────────── 분산 계산 과정을 한 줄씩 보여 주기 ───────────── */

function varianceCard() {
  const out = h('div', {});

  function paint() {
    const m = S.mean(data);
    const rows = S.sorted(data).map((v) => [
      v, fx(v - m, 3), fx((v - m) ** 2, 3),
    ]);
    const ss = data.reduce((s, v) => s + (v - m) ** 2, 0);
    clear(out);
    add(out, [
      h('div', { class: 'formula' }, '분산 = ',
        '{ (각 값 − 평균)² 을 모두 더한 값 } ÷ 개수 = ',
        h('b', {}, fx(ss, 3)), ' ÷ ', h('b', {}, String(data.length)),
        ' = ', h('b', { style: { color: 'var(--accent)' } }, fx(ss / data.length, 4))),
      h('div', { class: 'formula', style: { marginTop: '8px' } },
        '표준편차 = √분산 = ', h('b', { style: { color: 'var(--accent)' } }, fx(Math.sqrt(ss / data.length), 4))),
      h('div', { style: { marginTop: '12px' } },
        table(['값 x', `편차 (x − ${fx(m, 3)})`, '편차의 제곱'], rows.concat([[
          h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, '합계'),
          h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, fx(rows.reduce((s, r) => s + Number(r[1]), 0), 3)),
          h('td', { style: { fontWeight: '800', background: '#fff6e5' } }, fx(ss, 3)),
        ]]), { compact: true })),
      note('', h('b', {}, '편차의 합은 왜 항상 0 인가요? '),
        '평균은 「자료의 무게중심」이라서, 평균보다 큰 쪽의 넘치는 양과 작은 쪽의 모자란 양이 정확히 같습니다. ',
        '그래서 그냥 더하면 0 이 되어 버리고, 흩어진 정도를 재려면 제곱해서 부호를 없애야 합니다.'),
    ]);
  }

  const btn = h('button', { type: 'button', class: 'btn ghost small', onclick: paint }, '🔄 지금 자료로 다시 계산');
  paint();

  return card('🧮 분산은 이렇게 계산됩니다',
    h('div', { class: 'lead' }, '위 실험실의 자료를 바꾼 뒤 아래 단추를 누르면 계산 과정이 다시 그려집니다.'),
    btn, h('div', { style: { height: '10px' } }), out);
}

/* ─────────────────── 왜도·첨도 그림으로 이해하기 ─────────────────── */

function shapeCard() {
  const cv = makeCanvas(230, { pad: { l: 40, r: 20, t: 16, b: 34 } });
  let skew = 0; let kurt = 0;

  const skewSl = h('input', { type: 'range', min: '-1.2', max: '1.2', step: '0.05', value: '0', style: { flex: '1' } });
  const kurtSl = h('input', { type: 'range', min: '-1', max: '2.5', step: '0.05', value: '0', style: { flex: '1' } });
  const readout = h('div', { class: 'row', style: { marginTop: '8px' } });

  /* 왜도·첨도를 손으로 조절해 모양을 보여 주기 위한 간단한 분포 함수.
     정규분포에 기울기(skew)와 뾰족함(kurt)을 섞어 만든 「모양 보기용」 곡선이다. */
  function shape(x) {
    const s = 1 / (1 + 0.55 * kurt);
    const base = Math.exp(-(x * x) / (2 * s * s));
    const tilt = 1 + skew * (x / 3);
    return base * Math.max(0, tilt);
  }

  function paint() {
    skew = Number(skewSl.value); kurt = Number(kurtSl.value);
    const ctx = cv.begin();
    const sx = scale(-4, 4, cv.pad.l, cv.w - cv.pad.r);
    const sy = scale(0, 1.15, cv.hgt - cv.pad.b, cv.pad.t);
    axes(cv, sx, sy, { yTicks: [] });

    // 정규분포(회색 점선)
    const norm = [];
    for (let x = -4; x <= 4; x += 0.05) norm.push([sx(x), sy(Math.exp(-(x * x) / 2))]);
    polyline(ctx, norm, '#b9c3d1', 2, [5, 4]);

    // 지금 모양
    const pts = [];
    for (let x = -4; x <= 4; x += 0.05) pts.push([sx(x), sy(shape(x))]);
    polyline(ctx, pts, COLORS.purple, 3);

    label(ctx, '회색 점선 = 정규분포', cv.w - cv.pad.r, cv.pad.t + 8, { align: 'right', color: COLORS.soft });

    clear(readout);
    add(readout, [
      h('span', { class: 'chip' + (Math.abs(skew) < 0.06 ? '' : ' warn') },
        skew > 0.06 ? '왜도 > 0 · 오른쪽 꼬리가 길다 (평균 > 중앙값)'
          : skew < -0.06 ? '왜도 < 0 · 왼쪽 꼬리가 길다 (평균 < 중앙값)'
            : '왜도 ≈ 0 · 좌우 대칭'),
      h('span', { class: 'chip' + (Math.abs(kurt) < 0.06 ? '' : ' warn') },
        kurt > 0.06 ? '첨도 > 0 · 정규분포보다 뾰족하고 꼬리가 두껍다'
          : kurt < -0.06 ? '첨도 < 0 · 정규분포보다 납작하다'
            : '첨도 ≈ 0 · 정규분포와 비슷한 뾰족함'),
    ]);
  }

  skewSl.addEventListener('input', paint);
  kurtSl.addEventListener('input', paint);
  drawNow(paint);
  onResize(paint);

  return card('📐 왜도와 첨도 — 분포의 「모양」',
    h('div', { class: 'lead' },
      '왜도(skewness)는 정규분포보다 얼마나 ', answer('비대칭'), ' 한가, ',
      '첨도(kurtosis)는 정규분포보다 얼마나 ', answer('뾰족'), ' 한가를 나타냅니다.'),
    h('div', { class: 'row' }, h('label', { class: 'field', style: { width: '110px' } }, '왜도'), skewSl),
    h('div', { class: 'row' }, h('label', { class: 'field', style: { width: '110px' } }, '첨도'), kurtSl),
    cv.el, readout,
    note('', h('b', {}, '왜 중요한가요? '),
      '왜도가 크면 평균 하나만 보고 판단하면 안 됩니다. 예를 들어 우리 반 용돈이 오른쪽 꼬리를 가진다면(한 명이 아주 많이 받음) ',
      '평균 용돈은 대부분의 학생보다 높게 나옵니다. 이럴 때는 중앙값을 함께 봐야 합니다.'));
}

/* ─────────────────────────── 학습지 문제 ─────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 문제 — 자료 1, 1, 1, 1, 2, 3, 3, 5, 10',
    h('div', { class: 'lead' }, '위 실험실에서 [학습지 자료] 를 누르면 같은 자료로 확인할 수 있습니다.'),
    quizSet([
      { q: '평균값은?', answer: ['3'], hint: '모두 더하면 27, 개수는 9개입니다.', explain: '27 ÷ 9 = 3', width: 120 },
      { q: '중앙값은?', answer: ['2'], hint: '9개이므로 정렬했을 때 다섯 번째 값입니다.', explain: '1 1 1 1 [2] 3 3 5 10 → 2', width: 120 },
      { q: '최빈값은?', answer: ['1'], hint: '가장 여러 번 나온 값을 찾습니다.', explain: '1 이 네 번으로 가장 많습니다.', width: 120 },
      { q: '최솟값은?', answer: ['1'], width: 120 },
      { q: '최댓값은?', answer: ['10'], width: 120 },
      {
        q: '분산은? (소수 둘째 자리까지)',
        check: (v) => Math.abs(Number(v) - 70 / 9) < 0.02,
        answer: ['7.78'],
        hint: '편차의 제곱을 모두 더하면 70 입니다. 그것을 9 로 나누세요.',
        explain: '편차 −2,−2,−2,−2,−1,0,0,2,7 → 제곱 4,4,4,4,1,0,0,4,49 = 70. 70 ÷ 9 ≈ 7.78',
        width: 140,
      },
      {
        q: '표준편차는? (소수 둘째 자리까지)',
        check: (v) => Math.abs(Number(v) - Math.sqrt(70 / 9)) < 0.02,
        answer: ['2.79'],
        hint: '분산의 제곱근입니다.',
        explain: '√7.78 ≈ 2.79',
        width: 140,
      },
      {
        q: '교과서 방식으로 구한 제1사분위수 Q1 은?',
        answer: ['1'],
        hint: '중앙값(2) 앞쪽 절반 1, 1, 1, 1 의 중앙값입니다.',
        explain: '앞 절반 [1,1,1,1] 의 중앙값 = (1+1)/2 = 1',
        width: 120,
      },
      {
        q: '교과서 방식으로 구한 제3사분위수 Q3 은?',
        answer: ['4'],
        hint: '중앙값 뒤쪽 절반 3, 3, 5, 10 의 중앙값입니다.',
        explain: '뒤 절반 [3,3,5,10] 의 중앙값 = (3+5)/2 = 4',
        width: 120,
      },
      {
        q: 'IQR 을 이용해 판정할 때 이 자료의 이상치는?',
        answer: ['10'],
        hint: 'Q3 + 1.5×IQR 을 넘는 값을 찾습니다. IQR = 4 − 1 = 3.',
        explain: '상단경계 = 4 + 1.5×3 = 8.5. 8.5 를 넘는 값은 10 하나입니다.',
        width: 120,
      },
    ], { revealOnWrong: true }),
    answerBlock('💡 이 문제가 노리는 것',
      h('p', {}, '평균(3)보다 중앙값(2)이 작습니다. 자료 끝에 있는 10 하나가 평균을 위로 끌어올렸기 때문입니다. ',
        '10 을 지우고 다시 계산해 보면 평균이 2.125 로 떨어지지만 중앙값은 1.5 로 조금밖에 안 움직입니다.'),
      h('p', {}, '이것이 「이상치가 있을 때는 평균보다 중앙값이 믿을 만하다」는 말의 뜻이고, ',
        '뒤에 나오는 결측치 대체에서 평균 대신 중앙값을 쓰는 이유이기도 합니다.')));
}
