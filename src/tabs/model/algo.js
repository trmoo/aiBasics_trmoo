/* ============================================================================
 * algo.js — 심화 학습지 11~12쪽 「의사결정트리, k-최근접 이웃」
 *
 *   ① KNN 실험실 : ★ 를 끌어 옮기고 k 를 바꾸면 다수결 결과가 바로 바뀐다
 *                  (학습지 활동 2 — k=1 이면 ●, k=3 이면 ▲ 가 되는 상황을 그대로 담았다)
 *   ② 의사결정트리 : 타율·방어율을 넣으면 트리를 따라 내려가는 길이 색으로 표시된다
 *   ③ 루트 노드 고르기 : 어떤 질문을 먼저 하느냐에 따라 얼마나 잘 갈리는지 불순도로 견준다
 *
 * 학습지의 야구 트리 그림은 원본이 이미지라 잎(마지막 칸)의 이름까지는 알 수 없었다.
 * 정답으로 주어진 길(타율 0.210 · 방어율 0.8 → 선발 투수)이 그대로 나오도록 다시 짰다.
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

import { h, add, clear, card, sheetHead, note, answer, answerBlock, quizSet, table, pyBox, fx, drawNow, slider } from '../../lib/ui.js';
import { makeCanvas, scale, axes, dot, polyline, label, COLORS } from '../../lib/chart.js';

export function render(root) {
  add(root, sheetHead('심화 학습지 11~12쪽', 'k-최근접 이웃과 의사결정트리',
    ['[12인기03-02]'],
    [
      'KNN 이 다수결로 분류하는 과정을 직접 확인하고 k 값의 영향을 설명할 수 있다.',
      '의사결정트리가 질문을 이어 가며 분류하는 과정을 따라갈 수 있다.',
      '루트 노드를 무엇으로 정하느냐가 왜 중요한지 설명할 수 있다.',
    ]));

  root.append(knnCard());
  root.append(treeCard());
  root.append(rootCard());
  root.append(quizCard());
}

/* ─────────────────────────── ① KNN 실험실 ───────────────────────── */

/* 학습지 활동 2 의 상황을 좌표로 옮긴 것.
   ★ 에서 가장 가까운 1개는 ●, 가장 가까운 3개는 ▲ 2 + ● 1 이 되도록 잡았다. */
const KNN_PTS = [
  { x: 3.0, y: 5.0, c: 'circle' },
  { x: 3.6, y: 4.0, c: 'tri' },
  { x: 4.2, y: 5.2, c: 'tri' },
  { x: 5.4, y: 6.1, c: 'circle' },
  { x: 5.0, y: 3.0, c: 'tri' },
  { x: 6.2, y: 4.4, c: 'tri' },
  { x: 6.6, y: 6.4, c: 'circle' },
  { x: 2.1, y: 7.3, c: 'circle' },
  { x: 7.2, y: 3.3, c: 'tri' },
  { x: 4.6, y: 7.6, c: 'circle' },
];

function knnCard() {
  let star = { x: 2.0, y: 5.0 };
  let k = 1;
  let dragging = false;

  const cv = makeCanvas(340);
  const info = h('div', { style: { marginTop: '12px' } });

  const sl = slider('이웃의 수 k', {
    min: 1, max: 7, value: 1,
    onInput: (v) => { k = v; paint(); },
  });

  const sxOf = () => scale(0, 9, cv.pad.l, cv.w - cv.pad.r);
  const syOf = () => scale(2, 9, cv.hgt - cv.pad.b, cv.pad.t);

  function paint() {
    const ctx = cv.begin();
    const sx = sxOf(); const sy = syOf();
    axes(cv, sx, sy);

    const sorted = KNN_PTS
      .map((p) => ({ ...p, d: Math.hypot(p.x - star.x, p.y - star.y) }))
      .sort((a, b) => a.d - b.d);
    const near = sorted.slice(0, k);
    const radius = near[near.length - 1].d;

    // k 개를 감싸는 원
    ctx.save();
    ctx.setLineDash([6, 4]);
    ctx.strokeStyle = COLORS.orange; ctx.lineWidth = 2.5;
    ctx.beginPath();
    ctx.ellipse(sx(star.x), sy(star.y),
      Math.abs(sx(radius) - sx(0)) * 1.03, Math.abs(sy(radius) - sy(0)) * 1.03, 0, 0, Math.PI * 2);
    ctx.stroke();
    ctx.fillStyle = 'rgba(217,120,30,0.06)';
    ctx.fill();
    ctx.restore();

    // 뽑힌 이웃까지 선
    near.forEach((p) => {
      polyline(ctx, [[sx(star.x), sy(star.y)], [sx(p.x), sy(p.y)]], 'rgba(217,120,30,0.5)', 2);
    });

    // 점 그리기
    KNN_PTS.forEach((p) => {
      const inK = near.some((n) => n.x === p.x && n.y === p.y);
      const X = sx(p.x); const Y = sy(p.y);
      ctx.save();
      ctx.lineWidth = inK ? 3.5 : 2;
      if (p.c === 'tri') {
        ctx.fillStyle = inK ? COLORS.pink : 'rgba(192,47,107,0.35)';
        ctx.strokeStyle = inK ? '#fff' : 'transparent';
        ctx.beginPath();
        ctx.moveTo(X, Y - 11); ctx.lineTo(X + 10, Y + 8); ctx.lineTo(X - 10, Y + 8);
        ctx.closePath(); ctx.fill(); ctx.stroke();
      } else {
        ctx.fillStyle = inK ? COLORS.blue : 'rgba(30,111,217,0.35)';
        ctx.strokeStyle = inK ? '#fff' : 'transparent';
        ctx.beginPath(); ctx.arc(X, Y, 10, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      }
      ctx.restore();
    });

    // ★
    ctx.save();
    ctx.translate(sx(star.x), sy(star.y));
    ctx.fillStyle = '#ffd54a'; ctx.strokeStyle = COLORS.ink; ctx.lineWidth = 2.5;
    ctx.beginPath();
    for (let i = 0; i < 10; i++) {
      const ang = (Math.PI / 5) * i - Math.PI / 2;
      const r = i % 2 ? 6 : 14;
      ctx[i ? 'lineTo' : 'moveTo'](Math.cos(ang) * r, Math.sin(ang) * r);
    }
    ctx.closePath(); ctx.fill(); ctx.stroke();
    ctx.restore();

    label(ctx, '▲ 세모 그룹', cv.w - cv.pad.r, cv.pad.t + 10, { align: 'right', color: COLORS.pink, bold: true });
    label(ctx, '● 동그라미 그룹', cv.w - cv.pad.r, cv.pad.t + 26, { align: 'right', color: COLORS.blue, bold: true });
    label(ctx, '★ 새로 들어온 데이터 (끌어 보세요)', cv.w - cv.pad.r, cv.pad.t + 42, { align: 'right', color: COLORS.soft });

    // 다수결
    const tri = near.filter((p) => p.c === 'tri').length;
    const cir = near.length - tri;
    const win = tri > cir ? '세모(▲)' : cir > tri ? '동그라미(●)' : '동점!';

    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `k = ${k}`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #c02f6b' } }, `세모 ▲ ${tri}표`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #1e6fd9' } }, `동그라미 ● ${cir}표`),
        h('span', { class: 'chip ' + (win === '동점!' ? 'bad' : 'ok') }, `→ ${win} 그룹으로 분류`)),
      h('div', { class: 'scroll-x', style: { marginTop: '10px' } },
        table(['순위', '그룹', '거리', 'k 안에 들었나'],
          sorted.slice(0, 7).map((p, i) => [
            i + 1,
            p.c === 'tri' ? '▲ 세모' : '● 동그라미',
            fx(p.d, 3),
            i < k ? h('td', { class: 'filled' }, '✔ 투표') : h('td', { class: 'dim' }, '–'),
          ]), { compact: true })),
      k % 2 === 0
        ? note('bad', h('b', {}, '⚠️ k 가 짝수입니다. '),
          '분류한 개수가 같아져 동점이 생길 수 있습니다. 그래서 k 는 주로 ', answer('홀'), ' 수로 지정합니다.')
        : null,
      k === 1
        ? note('warn', 'k = 1 이면 바로 옆 점 하나에 모든 것이 달렸습니다. 그 점이 잘못 표시된 자료라면 그대로 따라갑니다.')
        : k >= 7
          ? note('warn', 'k 를 너무 크게 하면 멀리 있는 점까지 투표에 끼어들어, 어디에 두어도 개수가 많은 그룹으로만 분류됩니다.')
          : null,
    ]);
  }

  cv.el.addEventListener('pointerdown', (ev) => {
    const rect = cv.el.getBoundingClientRect();
    const x = sxOf().invert(ev.clientX - rect.left);
    const y = syOf().invert(ev.clientY - rect.top);
    if (Math.hypot(x - star.x, y - star.y) < 1.2) { dragging = true; cv.el.setPointerCapture(ev.pointerId); }
    else { star = { x, y }; }
    paint();
  });
  cv.el.addEventListener('pointermove', (ev) => {
    if (!dragging) return;
    const rect = cv.el.getBoundingClientRect();
    star = {
      x: Math.max(0.2, Math.min(8.8, sxOf().invert(ev.clientX - rect.left))),
      y: Math.max(2.2, Math.min(8.8, syOf().invert(ev.clientY - rect.top))),
    };
    paint();
  });
  const stop = () => { dragging = false; };
  cv.el.addEventListener('pointerup', stop);
  cv.el.addEventListener('pointercancel', stop);

  drawNow(paint);
  window.addEventListener('resize', paint);

  return card('⭐ k-최근접 이웃(KNN) 실험실',
    h('div', { class: 'lead' },
      '새 데이터가 들어오면 거리가 가장 가까운 k 개의 이웃을 보고 ', h('b', {}, '다수결'), ' 로 분류하는 알고리즘입니다. ',
      '학습지 [활동 2] 의 상황을 그대로 담았습니다. k 를 1 → 3 으로 바꿔 보세요.'),
    sl.el,
    h('div', { class: 'row tight', style: { marginTop: '6px' } },
      [1, 3, 5].map((v) => h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => { k = v; sl.set(v); paint(); },
      }, `k = ${v}`)),
      h('button', {
        type: 'button', class: 'btn gray small',
        onclick: () => { star = { x: 2.0, y: 5.0 }; paint(); },
      }, '★ 학습지 자리로')),
    cv.el, info,
    answerBlock('✅ 심화 활동 2 정답',
      h('p', {}, '1. k = 1 일 때 → ', h('b', {}, '동그라미(●) 그룹'), '. 가장 가까운 이웃 1개가 동그라미이기 때문입니다.'),
      h('p', {}, '2. k = 3 일 때 → ', h('b', {}, '세모(▲) 그룹'), '. 범위를 넓혀 가장 가까운 3개를 보면 세모 2개, 동그라미 1개입니다.'),
      h('p', {}, '3. 이유 — KNN 은 가장 가까운 k 개의 데이터를 확인하고, 그중 주변에 가장 많이 존재하는 데이터의 레이블을 따르는 ',
        h('b', {}, '다수결 원칙'), ' 을 사용해 새 데이터를 분류하기 때문입니다.')),
    pyBox([
      "from sklearn.neighbors import KNeighborsClassifier",
      "",
      "knn = KNeighborsClassifier(n_neighbors=3)   # k = 3",
      "knn.fit(X_train_scaled, y_train)            # ← 반드시 스케일링한 X 를 넣는다!",
      "knn.predict(X_test_scaled)",
    ].join('\n'),
    note('warn', 'KNN 은 거리로 판단하므로 스케일링을 빼먹으면 단위가 큰 속성이 결과를 혼자 정해 버립니다. '
      + '「Ⅱ 데이터 전처리 → 정규화」 탭의 첫 실험을 보세요.')));
}

/* ──────────────────────── ② 의사결정트리 따라가기 ───────────────── */

/* 학습지 [활동 3] 의 정답 길(타율 0.210, 방어율 0.8 → 선발 투수)이 그대로 나오도록 짠 트리 */
const TREE = {
  q: '타율이 0.250 초과인가?',
  test: (d) => d.avg > 0.250,
  yes: { leaf: '타자' },
  no: {
    q: '방어율이 2.0 초과인가?',
    test: (d) => d.era > 2.0,
    yes: { leaf: '중간 계투' },
    no: {
      q: '방어율이 1.0 초과인가?',
      test: (d) => d.era > 1.0,
      yes: { leaf: '마무리 투수' },
      no: { leaf: '선발 투수' },
    },
  },
};

function treeCard() {
  let avg = 0.210; let era = 0.8;
  const cv = makeCanvas(340, { pad: { l: 16, r: 16, t: 20, b: 20 } });
  const info = h('div', { style: { marginTop: '12px' } });

  const avgInp = h('input', { type: 'number', step: '0.005', min: '0', max: '0.5', value: '0.210', class: 'mono', style: { width: '110px' } });
  const eraInp = h('input', { type: 'number', step: '0.1', min: '0', max: '9', value: '0.8', class: 'mono', style: { width: '110px' } });

  /** 지금 값으로 트리를 따라간 길 */
  function walk() {
    const path = [];
    let node = TREE;
    const d = { avg, era };
    while (node && !node.leaf) {
      const r = node.test(d);
      path.push({ node, answer: r });
      node = r ? node.yes : node.no;
    }
    return { path, leaf: node ? node.leaf : '?' };
  }

  function paint() {
    avg = Number(avgInp.value) || 0;
    era = Number(eraInp.value) || 0;
    const { path, leaf } = walk();
    const onPath = new Set(path.map((p) => p.node));

    const ctx = cv.begin();
    const W = cv.w;
    const levelY = [46, 130, 214, 296];

    /** 노드 상자 하나 */
    function box(x, y, text, active, isLeaf) {
      const w = Math.max(120, ctx.measureText(text).width * 1.5 + 26);
      const hgt = isLeaf ? 34 : 40;
      ctx.save();
      ctx.fillStyle = isLeaf
        ? (active ? '#12855a' : '#eef1f7')
        : (active ? '#1e6fd9' : '#fff');
      ctx.strokeStyle = active ? (isLeaf ? '#12855a' : '#1e6fd9') : '#d8dee9';
      ctx.lineWidth = active ? 3 : 1.5;
      const r = 9;
      ctx.beginPath();
      ctx.moveTo(x - w / 2 + r, y - hgt / 2);
      ctx.arcTo(x + w / 2, y - hgt / 2, x + w / 2, y + hgt / 2, r);
      ctx.arcTo(x + w / 2, y + hgt / 2, x - w / 2, y + hgt / 2, r);
      ctx.arcTo(x - w / 2, y + hgt / 2, x - w / 2, y - hgt / 2, r);
      ctx.arcTo(x - w / 2, y - hgt / 2, x + w / 2, y - hgt / 2, r);
      ctx.closePath();
      ctx.fill(); ctx.stroke();
      ctx.restore();
      label(ctx, text, x, y, {
        align: 'center', bold: true, size: isLeaf ? 14 : 13,
        color: active ? '#fff' : (isLeaf ? '#5a6675' : '#1b2430'),
      });
      return { x, y, w, h: hgt };
    }

    function edge(from, to, txt, active) {
      ctx.save();
      ctx.strokeStyle = active ? COLORS.blue : '#d8dee9';
      ctx.lineWidth = active ? 3 : 1.5;
      ctx.beginPath();
      ctx.moveTo(from.x, from.y + from.h / 2);
      ctx.lineTo(to.x, to.y - to.h / 2);
      ctx.stroke();
      ctx.restore();
      label(ctx, txt, (from.x + to.x) / 2 + (to.x > from.x ? 16 : -16), (from.y + to.y) / 2,
        { align: 'center', bold: true, size: 12, color: active ? COLORS.blue : '#9aa5b4' });
    }

    /* 배치 — 왼쪽으로만 뻗는 트리라 자리를 손으로 잡아 준다 */
    const root = box(W * 0.5, levelY[0], TREE.q, onPath.has(TREE), false);
    const n1yes = box(W * 0.78, levelY[1], '타자', path[0] && path[0].answer === true, true);
    const n1no = box(W * 0.36, levelY[1], TREE.no.q, onPath.has(TREE.no), false);
    edge(root, n1yes, '예', path[0] && path[0].answer === true);
    edge(root, n1no, '아니요', path[0] && path[0].answer === false);

    const n2yes = box(W * 0.62, levelY[2], '중간 계투', path[1] && path[1].answer === true, true);
    const n2no = box(W * 0.24, levelY[2], TREE.no.no.q, onPath.has(TREE.no.no), false);
    edge(n1no, n2yes, '예', path[1] && path[1].answer === true);
    edge(n1no, n2no, '아니요', path[1] && path[1].answer === false);

    const n3yes = box(W * 0.44, levelY[3], '마무리 투수', path[2] && path[2].answer === true, true);
    const n3no = box(W * 0.14, levelY[3], '선발 투수', path[2] && path[2].answer === false, true);
    edge(n2no, n3yes, '예', path[2] && path[2].answer === true);
    edge(n2no, n3no, '아니요', path[2] && path[2].answer === false);

    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip' }, `타율 ${avg.toFixed(3)}`),
        h('span', { class: 'chip' }, `방어율 ${era.toFixed(1)}`),
        h('span', { class: 'chip on' }, `→ ${leaf}`)),
      h('ol', { style: { paddingLeft: '24px', marginTop: '10px' } },
        path.map((p) => h('li', {}, `[${p.node.q}] → `, h('b', {}, p.answer ? '예' : '아니요')))),
    ]);
  }

  [avgInp, eraInp].forEach((el) => el.addEventListener('input', paint));

  drawNow(paint);
  window.addEventListener('resize', paint);

  return card('🌲 의사결정트리 — 스무고개로 분류하기',
    h('div', { class: 'lead' },
      '마치 스무고개를 하듯 데이터를 분류하는 규칙(질문)을 나무 구조로 나타내어 ',
      '데이터를 분류하거나 연속적인 값을 예측하는 알고리즘입니다.'),
    h('div', { class: 'row' },
      h('label', { class: 'field' }, '타율'), avgInp,
      h('label', { class: 'field' }, '방어율'), eraInp,
      h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => { avgInp.value = '0.210'; eraInp.value = '0.8'; paint(); },
      }, '학습지 문제 값 (0.210 / 0.8)'),
      h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => { avgInp.value = '0.312'; eraInp.value = '0'; paint(); },
      }, '타율 0.312'),
      h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => { avgInp.value = '0.180'; eraInp.value = '3.4'; paint(); },
      }, '방어율 3.4')),
    cv.el, info,
    answerBlock('✅ 심화 활동 3-1 정답',
      h('p', {}, '타율이 0.210 이므로 [질문 1] 「타율이 0.250 초과인가?」에서 ', h('b', {}, '아니요'), ' 로 이동합니다.'),
      h('p', {}, '방어율이 0.8 이므로 [질문 2] 「방어율이 2.0 초과인가?」에서도 ', h('b', {}, '아니요'),
        ', 마지막 [질문 3] 「방어율이 1.0 초과인가?」에서도 ', h('b', {}, '아니요'), ' 이므로 최종적으로 ',
        h('b', {}, '선발 투수'), ' 로 분류됩니다.')),
    note('', h('b', {}, '트리의 구성 요소 '),
      '노드 = 상태(질문 또는 분류 결과) · 간선 = 한 상태에서 다른 상태로 가는 조건. ',
      '가장 위의 노드를 ', h('b', {}, '루트 노드'), ', 가장 아래의 답을 ', h('b', {}, '잎(리프) 노드'), ' 라고 합니다.'),
    note('ok', h('b', {}, '의사결정트리의 큰 장점 — 시각화 '),
      '데이터가 어떻게 분류되는지 나무처럼 가지가 뻗어 가는 구조로 보이므로, ',
      '누구나 그 결정 과정을 한눈에 직관적으로 이해하고 해석할 수 있습니다. ',
      '이런 성질을 「설명 가능하다」고 하며, Ⅵ 단원의 「투명성」과도 이어집니다.'));
}

/* ───────────── ③ 루트 노드를 무엇으로 정할 것인가 ─────────────── */

/* 12명의 선수 — 라벨은 투수(P) / 타자(B) */
const PLAYERS = [
  { avg: 0.312, era: 0.0, y: 'B' }, { avg: 0.298, era: 0.0, y: 'B' },
  { avg: 0.276, era: 0.0, y: 'B' }, { avg: 0.264, era: 0.0, y: 'B' },
  { avg: 0.301, era: 0.0, y: 'B' }, { avg: 0.288, era: 0.0, y: 'B' },
  { avg: 0.142, era: 2.8, y: 'P' }, { avg: 0.096, era: 3.6, y: 'P' },
  { avg: 0.201, era: 1.4, y: 'P' }, { avg: 0.118, era: 4.2, y: 'P' },
  { avg: 0.167, era: 2.1, y: 'P' }, { avg: 0.133, era: 3.1, y: 'P' },
];

/** 지니 불순도 — 0 이면 완전히 한 종류만 있는 것 */
function gini(arr) {
  if (!arr.length) return 0;
  const p = arr.filter((d) => d.y === 'P').length / arr.length;
  return 1 - p * p - (1 - p) * (1 - p);
}

const SPLITS = [
  { nm: '타율 > 0.250 ?', f: (d) => d.avg > 0.250, good: true },
  { nm: '방어율 > 2.0 ?', f: (d) => d.era > 2.0 },
  { nm: '타율 > 0.100 ?', f: (d) => d.avg > 0.100 },
  { nm: '타율 > 0.300 ?', f: (d) => d.avg > 0.300 },
];

function rootCard() {
  let cur = 0;
  const out = h('div', {});

  function paint() {
    const sp = SPLITS[cur];
    const yes = PLAYERS.filter(sp.f);
    const no = PLAYERS.filter((d) => !sp.f(d));
    const before = gini(PLAYERS);
    const after = (yes.length * gini(yes) + no.length * gini(no)) / PLAYERS.length;
    const gain = before - after;

    const grp = (arr, ttl) => {
      const p = arr.filter((d) => d.y === 'P').length;
      const b = arr.length - p;
      const pure = arr.length && (p === 0 || b === 0);
      return h('div', {
        style: {
          flex: '1', minWidth: '200px', padding: '12px 14px', borderRadius: '10px',
          border: `2px solid ${pure ? 'var(--ok)' : 'var(--line)'}`,
          background: pure ? '#eefaf4' : '#fbfcfe',
        },
      },
      h('div', { style: { fontWeight: '800' } }, ttl, ` (${arr.length}명)`),
      h('div', { class: 'row tight', style: { marginTop: '6px' } },
        h('span', { class: 'chip', style: { borderLeft: '6px solid #1e6fd9' } }, `투수 ${p}명`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #c02f6b' } }, `타자 ${b}명`)),
      h('div', { style: { marginTop: '8px', fontFamily: 'var(--mono)', fontWeight: '800', color: pure ? 'var(--ok)' : 'var(--ink-soft)' } },
        `불순도 ${fx(gini(arr), 4)}`, pure ? ' — 완전히 갈렸습니다! 더 물어볼 필요가 없습니다.' : ' — 아직 섞여 있어 질문을 더 해야 합니다.'));
    };

    clear(out);
    add(out, [
      h('div', { class: 'row tight' },
        SPLITS.map((s, i) => h('button', {
          type: 'button', class: 'btn ' + (i === cur ? '' : 'ghost') + ' small',
          onclick: () => { cur = i; paint(); },
        }, s.nm))),
      h('div', { class: 'row', style: { marginTop: '14px', alignItems: 'stretch' } },
        grp(yes, '「예」 로 간 무리'), grp(no, '「아니요」 로 간 무리')),
      h('div', { class: 'row tight', style: { marginTop: '12px' } },
        h('span', { class: 'chip' }, `질문 전 불순도 ${fx(before, 4)}`),
        h('span', { class: 'chip' }, `질문 후 평균 불순도 ${fx(after, 4)}`),
        h('span', { class: 'chip ' + (gain > 0.45 ? 'ok' : gain > 0.1 ? 'warn' : 'bad') }, `정보 이득 ${fx(gain, 4)}`)),
      after === 0
        ? note('ok', h('b', {}, '한 번의 질문으로 끝났습니다. '),
          '두 무리가 완전히 갈렸으므로 트리의 깊이가 1 이면 충분합니다. 이런 속성이 좋은 루트 노드입니다.')
        : note('warn', h('b', {}, '아직 섞여 있습니다. '),
          '이 질문으로 시작하면 아래에 질문을 더 붙여야 하고, 트리가 깊고 복잡해집니다.'),
    ]);
  }
  paint();

  return card('🎯 루트 노드를 무엇으로 정할까 — 정보 이득으로 견주기',
    h('div', { class: 'lead' },
      '선수 12명(투수 6, 타자 6)을 두 무리로 가르는 질문 네 가지입니다. ',
      '어느 질문으로 시작해야 가장 깔끔하게 갈리는지 눌러 비교해 보세요.'),
    out,
    note('', h('b', {}, '불순도(지니)란 '),
      '한 무리 안에 여러 종류가 얼마나 섞여 있는지를 0~0.5 사이의 수로 나타낸 것입니다. ',
      '0 이면 한 종류만 있는 것이고, 반반씩 섞이면 0.5 로 가장 큽니다. ',
      '「질문 전 불순도 − 질문 후 불순도」를 ', h('b', {}, '정보 이득'), ' 이라 하고, 트리는 이것이 가장 큰 질문을 루트로 고릅니다.'),
    answerBlock('✅ 심화 활동 3-2 정답 — 덜 중요한 속성으로 먼저 질문하면?',
      h('p', {}, '의사결정트리에서 첫 번째 질문(루트 노드)에 쓰는 속성은 데이터를 가장 잘 구분하는 기준이 되어야 합니다.'),
      h('p', {}, '변별력이 높은 속성을 첫 질문으로 쓰지 않고 덜 중요한 속성부터 물으면, ',
        '트리가 데이터를 효과적으로 구분하지 못해 ', h('b', {}, '구조가 복잡해지고 예측 성능이 떨어질 가능성이 높아집니다'), '.'),
      h('p', {}, '위에서 「타율 > 0.100 ?」을 눌러 보세요. 정보 이득이 아주 작아 두 무리가 거의 안 갈립니다.')),
    answerBlock('✅ 심화 활동 4 정답',
      h('p', {}, '1. 장점(시각화) — 데이터가 어떻게 분류되고 예측되는지 나무처럼 가지가 뻗어 가는 구조로 시각화되어 있어, ',
        '누구나 그 결정 과정을 한눈에 직관적으로 이해하고 해석하기 쉽습니다.'),
      h('p', {}, '2. 질문(트리의 깊이)이 너무 많아져 훈련 데이터에만 과도하게 맞춰지고 일반화 능력이 떨어지는 현상 → ',
        h('b', {}, '과대 적합 (Overfitting)'))),
    pyBox([
      "from sklearn.tree import DecisionTreeClassifier, plot_tree",
      "",
      "tree = DecisionTreeClassifier(max_depth=3, random_state=42)",
      "#   max_depth 를 제한하는 것이 트리의 대표적인 과적합 방지법",
      "tree.fit(X_train, y_train)",
      "plot_tree(tree, feature_names=X.columns, filled=True)   # 그림으로 보기",
      "tree.feature_importances_    # 어떤 속성이 중요했는지",
    ].join('\n')));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 심화 활동 1 — 핵심 개념 채우기',
    quizSet([
      {
        q: '거리가 가장 가까운 k 개의 이웃을 확인하고 다수결로 분류하는 알고리즘은? (㉠)',
        answer: ['K-최근접 이웃', 'KNN', 'k-최근접 이웃', 'k최근접이웃', 'knn', 'K-Nearest Neighbor'],
        explain: '입력한 데이터로부터 거리가 가장 가까운 k 개의 이웃을 확인하여, 주변에 가장 많이 존재하는 데이터의 레이블로 분류합니다.',
        width: 220,
      },
      {
        q: 'KNN 에서 k 는 동점을 피하기 위해 주로 어떤 수로 지정하나요? (㉡)',
        answer: ['홀', '홀수'],
        explain: 'k 를 짝수로 지정하면 분류한 개수가 같아져 동점이 발생할 수 있으므로 홀수로 지정하는 것이 좋습니다.',
        width: 140,
      },
      {
        q: '스무고개를 하듯 분류 규칙을 트리 구조로 나타내는 알고리즘은? (㉢)',
        answer: ['의사 결정 트리', '의사결정트리', '결정트리', '결정 트리', 'decision tree', '의사결정 트리'],
        explain: '주어진 두 답변 중 하나를 고르는 질문을 이어 가며 학습하는 알고리즘으로, 분류와 회귀에 모두 씁니다.',
        width: 220,
      },
      {
        q: '트리의 깊이가 너무 깊어져 훈련 데이터에만 맞춰지는 현상은?',
        answer: ['과대 적합', '과대적합', '과적합', 'overfitting', '오버피팅'],
        explain: '트리의 max_depth 를 제한해 막습니다.',
        width: 180,
      },
    ], { revealOnWrong: true }));
}
