/* ============================================================================
 * classify.js — 학습지 8쪽 + 심화 학습지 9~10쪽 「분류 모델의 성능 평가」
 *
 *   ① 혼동행렬 채우기 (심화 활동 1)
 *   ② 지표 계산기 — TP·FN·FP·TN 을 바꾸면 네 지표가 실시간으로 (심화 활동 3)
 *   ③ 3×3 → 2×2 접기 (심화 활동 2 · 붓꽃)
 *   ④ 임계값 실험실 — 정밀도와 재현율은 왜 같이 높이기 어려운가 (심화 활동 4)
 *   ⑤ 정확도의 역설 — 불량률 1% 자료로 「다 정상이라고 찍기」
 *   ⑥ 모델 X·Y·Z 중 무엇을 고를까 (심화 활동 5)
 *
 * © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다.
 * 그 밖의 이용(재배포·2차 저작물·수업 외 목적)은 먼저 문의해 주세요.
 * 자세한 이용 범위는 이 저장소의 LICENSE 파일에 적어 두었습니다.
 * ========================================================================== */

import { h, add, clear, card, sheetHead, note, answer, answerBlock, quizSet, table, pyBox, fx, drawNow, frac, slider, onResize } from '../../lib/ui.js';
import * as S from '../../lib/stats.js';
import { makeCanvas, scale, axes, polyline, label, COLORS } from '../../lib/chart.js';

const pct = (v) => (Number.isFinite(v) ? (v * 100).toFixed(1) + '%' : '–');

export function render(root) {
  add(root, sheetHead('학습지 8쪽 · 심화 9~10쪽', '분류 모델의 성능 평가',
    ['[12인기03-04]'],
    [
      '혼동행렬의 네 칸(TP·TN·FP·FN)이 무엇을 뜻하는지 설명할 수 있다.',
      '정확도·정밀도·재현율·F1 점수를 직접 계산할 수 있다.',
      '문제 상황에 따라 어떤 지표를 더 중요하게 봐야 할지 판단할 수 있다.',
    ]));

  root.append(conceptCard());
  root.append(calcCard());
  root.append(multiCard());
  root.append(thresholdCard());
  root.append(paradoxCard());
  root.append(chooseCard());
}

/* ────────────────────────── ① 혼동행렬 개념 ─────────────────────── */

function conceptCard() {
  const cell = (code, kr, desc, bg) => h('td', {
    style: { background: bg, textAlign: 'left', padding: '10px 12px' },
  },
  h('div', { style: { fontWeight: '800', fontSize: '1.1rem' } }, code),
  h('div', { style: { fontWeight: '700' } }, kr),
  h('div', { style: { fontSize: '0.88rem', color: 'var(--ink-soft)' } }, desc));

  return card('🔲 혼동행렬 (confusion matrix)',
    h('p', {}, '학습된 모델이 예측을 하면서 ', h('b', {}, '얼마나 혼동하고 있는지'), ' 나타내는 행렬입니다.'),
    table(['', '긍정(Positive)으로 예측', '부정(Negative)으로 예측'], [
      [h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, '실제 긍정(Positive)'),
        cell('TP (True Positive)', '진짜 성공', '성공을 성공이라 올바르게 예측', '#e6f6ef'),
        cell('FN (False Negative)', '놓친 성공', '성공을 실패라 잘못 예측 — 치명적 실수 2, 진짜 위험을 놓침', '#fdeaea')],
      [h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, '실제 부정(Negative)'),
        cell('FP (False Positive)', '가짜 성공', '실패를 성공이라 잘못 예측 — 치명적 실수 1, 알람 오작동', '#fdeaea'),
        cell('TN (True Negative)', '진짜 실패', '실패를 실패라고 올바르게 예측', '#e6f6ef')],
    ]),
    note('', h('b', {}, '이름 읽는 법 — 이것만 알면 안 헷갈립니다. '),
      '앞의 ', h('b', {}, 'T/F'), ' 는 「정답을 맞췄다 / 못 맞췄다」. ',
      '뒤의 ', h('b', {}, 'P/N'), ' 은 「', answer('모델'), ' 이 P / N 이라고 ', answer('예측'), ' 했다」. ',
      '그래서 False Negative 는 「모델이 Negative 라고 예측했는데 그게 틀렸다」 = 실제로는 Positive 였다는 뜻입니다.'),
    h('h4', {}, '네 가지 평가 지표'),
    table(['지표', '뜻', '수식'], [
      [h('td', { style: { fontWeight: '800' } }, '정확도 (accuracy)'),
        h('td', { class: 'left' }, '전체 데이터 중 모델이 예측해 맞힌 비율'),
        h('td', {}, [frac('TP + TN', 'TP + TN + FP + FN')])],
      [h('td', { style: { fontWeight: '800' } }, '정밀도 (precision)'),
        h('td', { class: 'left' }, 'Positive 라고 예측한 것 중 진짜 Positive 인 비율'),
        h('td', {}, [frac('TP', 'TP + FP')])],
      [h('td', { style: { fontWeight: '800' } }, '재현율 (recall)'),
        h('td', { class: 'left' }, '실제 Positive 중 모델이 Positive 로 찾아낸 비율'),
        h('td', {}, [frac('TP', 'TP + FN')])],
      [h('td', { style: { fontWeight: '800' } }, 'F1 점수'),
        h('td', { class: 'left' }, '정밀도와 재현율의 조화평균'),
        h('td', {}, [frac('2 × 정밀도 × 재현율', '정밀도 + 재현율')])],
    ]),
    note('warn', h('b', {}, '정밀도와 재현율이 헷갈릴 때는 분모를 보세요. '),
      '정밀도의 분모 TP+FP 는 ', h('b', {}, '모델이 P 라고 말한 것 전부'), ' 입니다 → 「내가 P 라고 한 말이 얼마나 정확했나」. ',
      '재현율의 분모 TP+FN 은 ', h('b', {}, '실제로 P 인 것 전부'), ' 입니다 → 「진짜 P 를 얼마나 빠짐없이 찾아냈나」.'),
    answerBlock('✅ 심화 활동 1 정답 — 혼동행렬 채우기',
      h('p', {}, '㉠ TP (True Positive) · ㉡ FN (False Negative) · ㉢ FP (False Positive) · ㉣ TN (True Negative)'),
      h('p', {}, '① 정확도 – ⓒ 전체 데이터 중 올바르게 예측한 비율'),
      h('p', {}, '② 정밀도 – ⓐ 모델이 「긍정」으로 예측한 것 중 실제로 「긍정」인 비율'),
      h('p', {}, '③ 재현율 – ⓑ 실제 「긍정」인 데이터 중 모델이 「긍정」으로 올바르게 예측한 비율'),
      h('p', {}, '④ F1 점수 – ⓓ 정밀도와 재현율의 조화 평균')));
}

/* ─────────────────────── ② 지표 계산기 ─────────────────────────── */

function calcCard() {
  let v = { tp: 15, fn: 5, fp: 10, tn: 70 };
  const out = h('div', {});
  const inputs = {};

  const mkInput = (k, labelText, bg) => {
    const inp = h('input', {
      type: 'number', min: '0', max: '9999', value: String(v[k]), class: 'mono',
      style: { width: '90px', fontWeight: '800', fontSize: '1.1rem' },
      oninput: () => { v[k] = Math.max(0, Number(inp.value) || 0); paint(); },
    });
    inputs[k] = inp;
    return h('td', { style: { background: bg } },
      h('div', { style: { fontWeight: '800', fontSize: '0.9rem', marginBottom: '4px' } }, labelText), inp);
  };

  function paint() {
    const m = S.clfMetrics(v);
    clear(out);
    add(out, [
      h('div', {
        style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' },
      },
      [
        ['정확도 (accuracy)', pct(m.accuracy), `(${v.tp}+${v.tn}) / ${m.total}`, 'ok'],
        ['정밀도 (precision)', pct(m.precision), `${v.tp} / (${v.tp}+${v.fp}) = ${v.tp}/${v.tp + v.fp}`, ''],
        ['재현율 (recall)', pct(m.recall), `${v.tp} / (${v.tp}+${v.fn}) = ${v.tp}/${v.tp + v.fn}`, ''],
        ['F1 점수', fx(m.f1, 4), '조화평균', ''],
      ].map(([k, val, sub, kind]) => h('div', { class: 'stat' + (kind ? ' ' + kind : '') },
        h('div', { class: 'k' }, k),
        h('div', { class: 'v' }, val),
        h('div', { style: { fontSize: '0.8rem', color: 'var(--ink-soft)', fontFamily: 'var(--mono)' } }, sub)))),
      h('div', { class: 'row tight', style: { marginTop: '10px' } },
        h('span', { class: 'chip' }, `전체 ${m.total}개`),
        h('span', { class: 'chip' }, `실제 Positive ${v.tp + v.fn}개`),
        h('span', { class: 'chip' }, `모델이 Positive 라 한 것 ${v.tp + v.fp}개`)),
    ]);
  }

  const presets = h('div', { class: 'row tight' },
    h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => { v = { tp: 15, fn: 5, fp: 10, tn: 70 }; Object.keys(inputs).forEach((k) => { inputs[k].value = v[k]; }); paint(); },
    }, '심화 활동 3 — 불량품 판별'),
    h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => { v = { tp: 0, fn: 20, fp: 0, tn: 980 }; Object.keys(inputs).forEach((k) => { inputs[k].value = v[k]; }); paint(); },
    }, '전부 정상이라고 찍기'),
    h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => { v = { tp: 20, fn: 0, fp: 300, tn: 680 }; Object.keys(inputs).forEach((k) => { inputs[k].value = v[k]; }); paint(); },
    }, '조금이라도 의심되면 다 잡기'));

  paint();

  return card('🧮 지표 계산기 — 네 칸을 고쳐 보세요',
    h('div', { class: 'lead' }, '기본값은 심화 학습지 [활동 3] 의 불량품 판별 문제(제품 100개)입니다.'),
    presets,
    h('div', { class: 'scroll-x', style: { marginTop: '12px' } },
      h('table', { class: 'tbl' },
        h('thead', {}, h('tr', {},
          h('th', {}, ''), h('th', {}, '불량품(Positive)으로 예측'), h('th', {}, '정상품(Negative)으로 예측'))),
        h('tbody', {},
          h('tr', {}, h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, '실제 불량품'),
            mkInput('tp', 'TP · 진짜 성공', '#e6f6ef'), mkInput('fn', 'FN · 놓친 성공', '#fdeaea')),
          h('tr', {}, h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, '실제 정상품'),
            mkInput('fp', 'FP · 가짜 성공', '#fdeaea'), mkInput('tn', 'TN · 진짜 실패', '#e6f6ef'))))),
    h('div', { style: { height: '12px' } }),
    out,
    answerBlock('✅ 심화 활동 3 정답',
      h('p', {}, '1. 정확도 = (15 + 70) / (15 + 5 + 10 + 70) = 85 / 100 = ', h('b', {}, '85%')),
      h('p', {}, '2. 정밀도 = 15 / (15 + 10) = 15 / 25 = ', h('b', {}, '60%')),
      h('p', {}, '3. 재현율 = 15 / (15 + 5) = 15 / 20 = ', h('b', {}, '75%')),
      h('p', {}, 'F1 점수 = 2 × 0.6 × 0.75 / (0.6 + 0.75) = 0.9 / 1.35 ≈ ', h('b', {}, '0.667'))),
    pyBox([
      "from sklearn.metrics import confusion_matrix, classification_report",
      "",
      "print(confusion_matrix(y_test, y_pred))",
      "print(classification_report(y_test, y_pred))",
      "#   precision / recall / f1-score / support 를 클래스별로 보여 준다",
    ].join('\n')));
}

/* ───────────── ③ 3×3 혼동행렬을 2×2 로 접기 (붓꽃) ────────────── */

const IRIS = {
  names: ['세토사', '버시컬러', '버지니카'],
  m: [
    [5, 0, 0],
    [0, 14, 0],
    [0, 1, 10],
  ],
};

function multiCard() {
  let k = 1; // 기준 클래스 — 기본은 버시컬러
  const out = h('div', {});

  function paint() {
    const f = S.foldConfusion(IRIS.m, k);
    const m = S.clfMetrics(f);
    const total = IRIS.m.flat().reduce((a, b) => a + b, 0);
    const diag = IRIS.m.reduce((s, row, i) => s + row[i], 0);

    /* 3×3 표에 색을 입혀 어떤 칸이 TP·FN·FP·TN 인지 보여 준다 */
    const rows = IRIS.m.map((row, i) => [
      h('td', { style: { fontWeight: '800', background: i === k ? '#fff6e5' : '#eef1f7' } }, IRIS.names[i]),
    ].concat(row.map((v, j) => {
      let bg = '#f6f8fc'; let tag = 'TN';
      if (i === k && j === k) { bg = '#c9ecd9'; tag = 'TP'; } else if (i === k) { bg = '#ffd9d9'; tag = 'FN'; } else if (j === k) { bg = '#ffe4c9'; tag = 'FP'; }
      return h('td', { style: { background: bg, fontWeight: '800' } },
        h('div', {}, String(v)),
        h('div', { style: { fontSize: '0.72rem', color: 'var(--ink-soft)' } }, tag));
    })));

    clear(out);
    add(out, [
      h('div', { class: 'row tight' },
        h('label', { class: 'field' }, '기준 클래스'),
        IRIS.names.map((nm, i) => h('button', {
          type: 'button', class: 'btn ' + (i === k ? '' : 'ghost') + ' small',
          onclick: () => { k = i; paint(); },
        }, nm))),
      h('div', { style: { marginTop: '12px' } },
        table(['실제 \\ 예측'].concat(IRIS.names), rows, { compact: true })),
      h('h4', {}, `${IRIS.names[k]} 기준 2×2 혼동행렬`),
      table(['', `${IRIS.names[k]} O 로 예측`, `${IRIS.names[k]} X 로 예측`], [
        [h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, `실제 ${IRIS.names[k]} O`),
          h('td', { style: { background: '#c9ecd9', fontWeight: '800' } }, `㉠ TP = ${f.tp}`),
          h('td', { style: { background: '#ffd9d9', fontWeight: '800' } }, `㉡ FN = ${f.fn}`)],
        [h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, `실제 ${IRIS.names[k]} X`),
          h('td', { style: { background: '#ffe4c9', fontWeight: '800' } }, `㉢ FP = ${f.fp}`),
          h('td', { style: { background: '#f6f8fc', fontWeight: '800' } }, `㉣ TN = ${f.tn}`)],
      ]),
      h('div', { class: 'row tight', style: { marginTop: '10px' } },
        h('span', { class: 'chip' }, `정밀도 ${pct(m.precision)}`),
        h('span', { class: 'chip' }, `재현율 ${pct(m.recall)}`),
        h('span', { class: 'chip' }, `F1 ${fx(m.f1, 3)}`),
        h('span', { class: 'chip on' }, `전체 정확도 ${pct(diag / total)} = 대각선 합 ${diag} / 전체 ${total}`)),
    ]);
  }
  paint();

  return card('🌸 다중분류 — 3×3 혼동행렬을 2×2 로 (붓꽃 분류)',
    h('div', { class: 'lead' }, '각 클래스를 기준으로 이진분류처럼 계산합니다. 기준 클래스를 바꿔 가며 색이 어떻게 옮겨 가는지 보세요.'),
    out,
    note('', h('b', {}, '규칙 세 줄 '),
      'TP → 해당 클래스의 대각선 값. ',
      'FP → 해당 ', h('b', {}, '열'), ' 에서 대각선을 뺀 나머지 합. ',
      'FN → 해당 ', h('b', {}, '행'), ' 에서 대각선을 뺀 나머지 합. 남은 것이 모두 TN 입니다.'),
    note('warn', h('b', {}, '다중분류에서 주의 '),
      '정확도는 전체를 한 번만 계산합니다 (= 대각선 합 ÷ 전체 합). ',
      '반면 정밀도와 재현율은 클래스별로 따로 계산합니다.'),
    answerBlock('✅ 심화 활동 2 정답 — 버시컬러 기준',
      h('p', {}, '㉠ TP = ', h('b', {}, '14'), ' (실제 버시컬러를 버시컬러로 예측)'),
      h('p', {}, '㉡ FN = ', h('b', {}, '0'), ' (실제 버시컬러를 다른 품종으로 예측한 것 없음)'),
      h('p', {}, '㉢ FP = ', h('b', {}, '1'), ' (실제 버지니카 1마리를 버시컬러로 잘못 예측)'),
      h('p', {}, '㉣ TN = ', h('b', {}, '15'), ' (세토사 5 + 버지니카 10)')));
}

/* ───────── ④ 임계값 실험실 — 정밀도 vs 재현율 트레이드오프 ───────── */

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

/** 모델이 매긴 점수(확률)와 진짜 정답을 만든다 — 두 무리가 조금 겹치게 */
function makeScores(seed = 777, nPos = 60, nNeg = 140) {
  const r = rng(seed);
  const out = [];
  for (let i = 0; i < nPos; i++) out.push({ y: 1, p: Math.min(0.99, Math.max(0.01, 0.66 + (r() + r() - 1) * 0.32)) });
  for (let i = 0; i < nNeg; i++) out.push({ y: 0, p: Math.min(0.99, Math.max(0.01, 0.34 + (r() + r() - 1) * 0.32)) });
  return out;
}

const SCORES = makeScores();

function confAt(scores, th) {
  let tp = 0; let fn = 0; let fp = 0; let tn = 0;
  scores.forEach((s) => {
    const pred = s.p >= th;
    if (s.y === 1 && pred) tp++;
    else if (s.y === 1 && !pred) fn++;
    else if (s.y === 0 && pred) fp++;
    else tn++;
  });
  return { tp, fn, fp, tn };
}

function thresholdCard() {
  let th = 0.5;
  const cv = makeCanvas(250, { pad: { l: 46, r: 20, t: 20, b: 38 } });
  const cvPR = makeCanvas(240, { pad: { l: 52, r: 20, t: 20, b: 38 } });
  const info = h('div', { style: { marginTop: '12px' } });

  const sl = slider('임계값 (이 값 이상이면 Positive 라고 판정)', {
    min: 0.02, max: 0.98, step: 0.01, value: 0.5,
    fmt: (v) => v.toFixed(2),
    onInput: (v) => { th = v; paint(); },
  });

  function paint() {
    /* ── 점수 분포 ── */
    const ctx = cv.begin();
    const sx = scale(0, 1, cv.pad.l, cv.w - cv.pad.r);
    const bins = 24;
    const hp = new Array(bins).fill(0); const hn = new Array(bins).fill(0);
    SCORES.forEach((s) => {
      const i = Math.min(bins - 1, Math.floor(s.p * bins));
      if (s.y) hp[i]++; else hn[i]++;
    });
    const maxH = Math.max(...hp, ...hn);
    const y0 = cv.hgt - cv.pad.b;
    const sy = scale(0, maxH * 1.15, y0, cv.pad.t);

    ctx.strokeStyle = COLORS.line; ctx.lineWidth = 1.5;
    ctx.beginPath(); ctx.moveTo(cv.pad.l, y0); ctx.lineTo(cv.w - cv.pad.r, y0); ctx.stroke();
    ctx.fillStyle = COLORS.soft; ctx.textAlign = 'center';
    [0, 0.25, 0.5, 0.75, 1].forEach((v) => ctx.fillText(v.toFixed(2), sx(v), y0 + 15));

    const bw = (cv.w - cv.pad.r - cv.pad.l) / bins;
    for (let i = 0; i < bins; i++) {
      const x = cv.pad.l + bw * i;
      ctx.fillStyle = 'rgba(30,111,217,0.55)';
      ctx.fillRect(x, sy(hn[i]), bw - 1, y0 - sy(hn[i]));
      ctx.fillStyle = 'rgba(207,48,48,0.55)';
      ctx.fillRect(x, sy(hp[i]), bw - 1, y0 - sy(hp[i]));
    }

    ctx.save();
    ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.moveTo(sx(th), y0 + 6); ctx.lineTo(sx(th), cv.pad.t); ctx.stroke();
    ctx.restore();
    label(ctx, `임계값 ${th.toFixed(2)}`, sx(th), cv.pad.t - 2, { align: 'center', bold: true });
    label(ctx, '■ 실제 Negative', cv.pad.l + 8, cv.pad.t + 10, { color: COLORS.blue, bold: true });
    label(ctx, '■ 실제 Positive', cv.pad.l + 8, cv.pad.t + 26, { color: COLORS.red, bold: true });
    label(ctx, '← 왼쪽은 Negative 로 판정', cv.pad.l + 8, y0 - 10, { color: COLORS.soft, size: 11 });
    label(ctx, 'Positive 로 판정 →', cv.w - cv.pad.r - 8, y0 - 10, { color: COLORS.soft, size: 11, align: 'right' });

    /* ── 임계값별 정밀도·재현율 곡선 ── */
    const c2 = cvPR.begin();
    const px = scale(0, 1, cvPR.pad.l, cvPR.w - cvPR.pad.r);
    const py = scale(0, 1.05, cvPR.hgt - cvPR.pad.b, cvPR.pad.t);
    axes(cvPR, px, py, { xLabel: '임계값', yLabel: '값' });

    const prec = []; const rec = []; const f1s = [];
    for (let t = 0.02; t <= 0.98; t += 0.01) {
      const m = S.clfMetrics(confAt(SCORES, t));
      if (Number.isFinite(m.precision)) prec.push([px(t), py(m.precision)]);
      rec.push([px(t), py(m.recall)]);
      if (Number.isFinite(m.f1)) f1s.push([px(t), py(m.f1)]);
    }
    polyline(c2, prec, COLORS.purple, 3);
    polyline(c2, rec, COLORS.green, 3);
    polyline(c2, f1s, COLORS.orange, 2.5, [5, 4]);
    c2.save();
    c2.strokeStyle = COLORS.ink; c2.lineWidth = 2;
    c2.beginPath(); c2.moveTo(px(th), cvPR.hgt - cvPR.pad.b); c2.lineTo(px(th), cvPR.pad.t); c2.stroke();
    c2.restore();
    label(c2, '— 정밀도', cvPR.w - cvPR.pad.r, cvPR.pad.t + 10, { align: 'right', color: COLORS.purple, bold: true });
    label(c2, '— 재현율', cvPR.w - cvPR.pad.r, cvPR.pad.t + 26, { align: 'right', color: COLORS.green, bold: true });
    label(c2, '⋯ F1', cvPR.w - cvPR.pad.r, cvPR.pad.t + 42, { align: 'right', color: COLORS.orange, bold: true });

    /* ── 지금 임계값의 혼동행렬 ── */
    const f = confAt(SCORES, th);
    const m = S.clfMetrics(f);
    clear(info);
    add(info, [
      table(['', 'P 로 예측', 'N 으로 예측'], [
        [h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, '실제 P'),
          h('td', { style: { background: '#c9ecd9', fontWeight: '800' } }, `TP ${f.tp}`),
          h('td', { style: { background: '#ffd9d9', fontWeight: '800' } }, `FN ${f.fn}`)],
        [h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, '실제 N'),
          h('td', { style: { background: '#ffe4c9', fontWeight: '800' } }, `FP ${f.fp}`),
          h('td', { style: { fontWeight: '800' } }, `TN ${f.tn}`)],
      ]),
      h('div', { class: 'row tight', style: { marginTop: '10px' } },
        h('span', { class: 'chip' }, `정확도 ${pct(m.accuracy)}`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #6b4fd8' } }, `정밀도 ${pct(m.precision)}`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #0f9d6e' } }, `재현율 ${pct(m.recall)}`),
        h('span', { class: 'chip on' }, `F1 ${fx(m.f1, 3)}`)),
      note(th <= 0.25 ? 'warn' : th >= 0.75 ? 'bad' : '',
        th <= 0.25
          ? '임계값을 낮췄더니 재현율이 올라갔습니다. 진짜 Positive 를 거의 놓치지 않습니다(FN ↓). '
            + '대신 애먼 Negative 까지 잡아서 정밀도가 떨어졌습니다(FP ↑). — 암 진단 시스템이 원하는 쪽입니다.'
          : th >= 0.75
            ? '임계값을 올렸더니 정밀도가 올라갔습니다. Positive 라고 말했으면 거의 맞습니다(FP ↓). '
              + '대신 확신이 없는 것은 넘겨 버려 놓치는 것이 늘었습니다(FN ↑). — 스팸 필터가 원하는 쪽입니다.'
            : '임계값 0.5 근처는 정밀도와 재현율의 균형점입니다. 무엇이 더 중요한지는 문제가 정해 줍니다.'),
    ]);
  }

  drawNow(paint);
  onResize(paint);

  return card('🎚️ 임계값 실험실 — 정밀도와 재현율은 왜 같이 못 올릴까',
    h('div', { class: 'lead' },
      '모델은 사실 「Positive 다 / 아니다」가 아니라 ', h('b', {}, '0~1 사이의 점수'), ' 를 냅니다. ',
      '그 점수가 얼마 이상일 때 Positive 라고 부를지 정하는 것이 임계값입니다. ',
      '아래 자료는 실제 Positive 60개, Negative 140개입니다.'),
    sl.el,
    h('div', { class: 'row tight', style: { marginTop: '6px' } },
      [[0.15, '아주 낮게 (많이 잡기)'], [0.5, '가운데'], [0.85, '아주 높게 (확실할 때만)']].map(([t, lb]) => h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => { th = t; sl.set(t); paint(); },
      }, lb))),
    cv.el,
    h('h4', {}, '임계값을 옮기면 두 지표가 반대로 움직입니다'),
    cvPR.el, info,
    h('h4', {}, '심화 활동 4 — 상황에 맞는 지표 고르기'),
    quizSet([
      {
        q: '[상황 A] 병원에서 암 환자를 진단하는 인공지능. 정밀도와 재현율 중 어느 것이 더 중요할까요?',
        type: 'choice', choices: ['정밀도', '재현율'], answer: '재현율',
        hint: '이 상황에서 FN(실제 암 환자를 건강하다고 진단)이 나면 어떤 일이 벌어질까요?',
        explain: '실제 암 환자를 건강하다고 잘못 진단(FN)하면 환자의 생명과 직결되는 치명적 결과가 납니다. '
          + '따라서 실제 암 환자를 한 명도 놓치지 않고 찾아내는 재현율이 훨씬 중요합니다. '
          + '위 실험실에서 임계값을 0.15 로 내려 보세요. FN 이 거의 0 이 됩니다.',
      },
      {
        q: '[상황 B] 이메일 서비스의 스팸 메일 필터링. 어느 지표가 더 중요할까요?',
        type: 'choice', choices: ['정밀도', '재현율'], answer: '정밀도',
        hint: '이 상황에서 FP(정상 메일을 스팸으로 분류)가 나면 어떤 일이 벌어질까요?',
        explain: '정상 메일을 스팸으로 잘못 분류(FP)하면 사용자가 중요한 업무 메일을 놓치는 큰 불편을 겪습니다. '
          + '따라서 스팸으로 분류한 것 중 진짜 스팸인 비율, 즉 정밀도를 높이는 것이 중요합니다. '
          + '위 실험실에서 임계값을 0.85 로 올려 보세요. FP 가 크게 줄어듭니다.',
      },
    ], { revealOnWrong: true }));
}

/* ────────────────── ⑤ 정확도의 역설 (불균형 데이터) ─────────────── */

function paradoxCard() {
  const N = 1000; const POS = 10; // 불량률 1%
  const out = h('div', {});
  let mode = 'all-neg';

  const MODES = {
    'all-neg': { nm: '무조건 「정상」이라고만 대답하는 모델', f: { tp: 0, fn: POS, fp: 0, tn: N - POS } },
    lazy: { nm: '조금 배운 모델 (불량 3개만 찾음)', f: { tp: 3, fn: POS - 3, fp: 4, tn: N - POS - 4 } },
    good: { nm: '잘 배운 모델 (불량 9개 찾음)', f: { tp: 9, fn: 1, fp: 25, tn: N - POS - 25 } },
  };

  function paint() {
    const f = MODES[mode].f;
    const m = S.clfMetrics(f);
    clear(out);
    add(out, [
      h('div', { class: 'row tight' },
        Object.entries(MODES).map(([id, v]) => h('button', {
          type: 'button', class: 'btn ' + (id === mode ? '' : 'ghost') + ' small',
          onclick: () => { mode = id; paint(); },
        }, v.nm))),
      h('div', {
        style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '10px', marginTop: '12px' },
      },
      [['정확도', pct(m.accuracy)], ['정밀도', pct(m.precision)], ['재현율', pct(m.recall)], ['F1 점수', fx(m.f1, 3)]]
        .map(([k, v], i) => h('div', {
          class: 'stat' + (i === 0 ? ' ok' : (v === '–' || parseFloat(v) < 40 ? ' bad' : '')),
        }, h('div', { class: 'k' }, k), h('div', { class: 'v' }, v)))),
      h('div', { style: { marginTop: '10px' } },
        table(['', '불량이라 예측', '정상이라 예측'], [
          [h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, '실제 불량'),
            h('td', { style: { background: '#c9ecd9', fontWeight: '800' } }, `TP ${f.tp}`),
            h('td', { style: { background: '#ffd9d9', fontWeight: '800' } }, `FN ${f.fn}`)],
          [h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, '실제 정상'),
            h('td', { style: { background: '#ffe4c9', fontWeight: '800' } }, `FP ${f.fp}`),
            h('td', { style: { fontWeight: '800' } }, `TN ${f.tn}`)],
        ])),
      mode === 'all-neg'
        ? note('bad', h('b', {}, '⚠️ 정확도 99.0% 인데 쓸모가 없습니다. '),
          '이 모델은 아무것도 배우지 않고 「전부 정상」이라고만 말합니다. '
          + '그런데도 정확도는 99% 입니다. 원래 99%가 정상이니까요. '
          + '재현율은 0% — 불량품을 하나도 못 찾았습니다. 정밀도는 계산조차 안 됩니다(분모가 0). '
          + '이것을 「정확도의 역설」이라고 합니다.')
        : mode === 'good'
          ? note('ok', h('b', {}, '이 모델이 훨씬 낫습니다. '),
            `정확도는 ${pct(m.accuracy)} 로 오히려 조금 낮아 보이지만, 불량품 10개 중 9개를 찾아냈습니다(재현율 90%). `
            + '불량품 검사에서 진짜 중요한 것은 이것입니다.')
          : note('warn', '불량 10개 중 3개만 찾았습니다. 정확도만 보면 여전히 99% 대이지만 재현율은 30% 입니다.'),
    ]);
  }
  paint();

  return card('🎭 정확도의 역설 — 불량률 1% 인 공장에서',
    h('div', { class: 'lead' },
      `제품 ${N}개 중 불량이 ${POS}개(1%)뿐인 자료입니다. 세 가지 모델을 견주어 보세요.`),
    out,
    note('', h('b', {}, '무엇을 배워야 하나 '),
      '한쪽 클래스가 아주 적은 ', h('b', {}, '불균형 데이터'), ' 에서는 정확도 하나만 보면 안 됩니다. ',
      '재현율·정밀도·F1 을 함께 보고, 무엇을 놓치면 안 되는 문제인지 먼저 정해야 합니다.'),
    note('warn', h('b', {}, '대책 '),
      '불균형 데이터 처리 — 적은 쪽을 늘리거나(오버샘플링) 많은 쪽을 줄이는(언더샘플링) 방법, ',
      '적은 쪽 클래스에 더 큰 가중치를 주는 방법(class_weight)을 씁니다.'));
}

/* ─────────────── ⑥ 모델 X·Y·Z 중 무엇을 고를까 ───────────────── */

function chooseCard() {
  const MODELS = [
    { nm: '모델 X', acc: 0.90, pre: 0.88, rec: 0.75, f1: 0.81 },
    { nm: '모델 Y', acc: 0.92, pre: 0.85, rec: 0.80, f1: 0.82 },
    { nm: '모델 Z', acc: 0.90, pre: 0.91, rec: 0.78, f1: 0.83 },
  ];

  const best = (key) => Math.max(...MODELS.map((m) => m[key]));
  const cell = (m, key) => h('td', {
    class: 'mono',
    style: m[key] === best(key)
      ? { background: '#e6f6ef', fontWeight: '800', color: 'var(--ok)' }
      : {},
  }, m[key].toFixed(2) + (m[key] === best(key) ? ' 👑' : ''));

  return card('🏆 심화 활동 5 — 가장 우수한 모델 고르기',
    table(['모델', '정확도', '정밀도', '재현율', 'F1 점수'],
      MODELS.map((m) => [
        h('td', { style: { fontWeight: '800' } }, m.nm),
        cell(m, 'acc'), cell(m, 'pre'), cell(m, 'rec'), cell(m, 'f1'),
      ])),
    quizSet([
      { q: '정밀도가 가장 높은 모델은?', answer: ['모델 Z', 'Z', '모델z'], explain: '모델 Z 의 0.91 이 가장 높습니다.', width: 140 },
      { q: '재현율이 가장 높은 모델은?', answer: ['모델 Y', 'Y', '모델y'], explain: '모델 Y 의 0.80 이 가장 높습니다.', width: 140 },
      { q: 'F1 점수가 가장 높은 모델은?', answer: ['모델 Z', 'Z', '모델z'], explain: '모델 Z 의 0.83 이 가장 높습니다.', width: 140 },
    ], { revealOnWrong: true }),
    answerBlock('✅ 「가장 우수한 모델」에는 정답이 하나가 아닙니다',
      h('p', {}, h('b', {}, '모델 Y 를 고른다면 — '),
        '정확도가 0.92 로 가장 높고, 실제 양성 데이터를 놓치지 않는 재현율(0.80)이 뛰어나 전반적인 탐지 능력이 우수하기 때문입니다.'),
      h('p', {}, h('b', {}, '모델 Z 를 고른다면 — '),
        '불균형한 데이터 환경에서 중요한 척도가 되는 F1 점수(0.83)가 가장 높으며, 정밀도와 재현율의 균형이 가장 잘 잡혀 있기 때문입니다.'),
      h('p', {}, '논리적 근거가 타당하면 둘 다 정답입니다. ',
        h('b', {}, '중요한 것은 「어떤 문제인가」를 먼저 말하는 것입니다.'),
        ' 암 진단이라면 재현율이 높은 Y, 스팸 필터라면 정밀도가 높은 Z 가 낫습니다.')),
    note('', h('b', {}, '수업에서 해 볼 만한 이야기 '),
      '세 모델의 정확도는 0.90, 0.92, 0.90 으로 거의 같습니다. ',
      '그런데 정밀도와 재현율은 꽤 다릅니다. 「정확도가 비슷하면 아무거나 써도 되나요?」라는 질문에 답해 보세요.'));
}
