/* ============================================================================
 * perceptron.js — 학습지 13~14쪽 「1세대(1958) 단층 퍼셉트론」
 *
 *   ① 뉴런과 퍼셉트론의 구조, 임계값에서 편향으로
 *   ② 퍼셉트론 실험실 : w1·w2·b 를 움직이면 결정 경계 직선이 따라 움직인다
 *                       AND·OR 은 직선 하나로 갈리고, XOR 은 아무리 해도 안 갈린다
 *   ③ 퍼셉트론 학습 알고리즘을 실제로 돌린다
 *                       AND·OR 은 몇 회 만에 수렴하고, XOR 은 영원히 수렴하지 않는다
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

import { h, add, clear, card, sheetHead, note, answer, quizSet, table, pyBox, fx, drawNow, slider, pillGroup, clearScreenInterval, onResize, screenInterval } from '../../lib/ui.js';
import { makeCanvas, scale, axes, polyline, label, COLORS } from '../../lib/chart.js';

/* 논리 연산 세 가지의 정답표 */
const GATES = {
  AND: { nm: 'AND — 둘 다 1이면 1', y: [0, 0, 0, 1] },
  OR: { nm: 'OR — 둘 중 하나라도 1이면 1', y: [0, 1, 1, 1] },
  XOR: { nm: 'XOR — 둘 중 하나만 1이면 1', y: [0, 1, 1, 0] },
};
const X = [[0, 0], [1, 0], [0, 1], [1, 1]];

/** 계단 함수 — 0 보다 크면 1, 아니면 0 */
const step = (v) => (v > 0 ? 1 : 0);

export function render(root) {
  add(root, sheetHead('학습지 13~14쪽', '퍼셉트론 — 인공신경망의 시초 (1958)',
    ['[12인기03-05]'],
    [
      '뉴런의 작동 원리가 퍼셉트론의 수식으로 어떻게 옮겨졌는지 설명할 수 있다.',
      '임계값 대신 편향을 쓰는 까닭을 설명할 수 있다.',
      '단층 퍼셉트론이 XOR 을 학습할 수 없는 까닭을 그림으로 보일 수 있다.',
    ]));

  root.append(neuronCard());
  root.append(lab());
  root.append(learnCard());
  root.append(quizCard());
}

/* ────────────────────── 뉴런 → 퍼셉트론 ───────────────────────── */

function neuronCard() {
  return card('🧠 뉴런에서 퍼셉트론으로',
    h('p', {}, h('b', {}, '인공 신경망(ANN)'), ' 은 인간의 뇌가 정보를 인식하고 학습하는 방식, ',
      '즉 뉴런과 시냅스의 작동 원리를 모방한 인공지능 모델입니다.'),
    table(['뉴런', '인공신경망'], [
      [h('td', { class: 'left' }, '전기 입력을 받아 또 다른 전기 신호를 발생시킨다'),
        h('td', { class: 'left' }, '인공신경망(분류/예측기)이 입력을 받아 어떤 처리를 통해 결과를 출력한다')],
      [h('td', { class: 'left' }, '입력받았을 때 즉시 반응하지 않고, 입력이 누적되어 어떤 수준(분계점)에 도달해야 전기 신호를 발생(활성화)한다'),
        h('td', { class: 'left' }, '입력 신호를 받아 누적된 입력이 분계점을 넘어설 때 출력신호를 생성하는 활성화 함수를 쓴다')],
    ]),
    h('h4', {}, '수학으로 옮기면'),
    h('p', {}, '뉴런에서는 ', answer('입력'), ' 신호의 ', answer('가중치'), ' 합이 어떤 ', answer('임계값'),
      ' 을 넘는 경우에만 활성화되어 1 을 출력합니다. 그렇지 않으면 0 을 출력합니다. (계단함수)'),
    h('div', { class: 'formula' }, 'w₁x₁ + w₂x₂ + ⋯ + wₙxₙ > Θ 이면 1, 아니면 0'),
    h('div', { class: 'formula', style: { marginTop: '6px' } },
      'w₁x₁ + w₂x₂ + ⋯ + wₙxₙ ', answer('− Θ'), ' > 0 이면 1, 아니면 0'),
    note('', h('b', {}, '왜 편향(bias)을 도입했나요? '),
      '「> Θ」 는 부등식의 오른쪽에 값이 남아 있어 계산이 번거롭습니다. ',
      'Θ 를 왼쪽으로 옮겨 −Θ 를 그냥 상수 하나로 보면 「합 > 0」 이라는 깔끔한 꼴이 됩니다. ',
      '이 −Θ 를 ', answer('편향'), '(bias, b) 라고 부릅니다. ',
      '즉 편향은 임계값의 부호를 바꿔 옮겨 놓은 것일 뿐입니다.'),
    h('h4', {}, '퍼셉트론 학습 알고리즘'),
    h('p', {}, answer('학습률'), ', ', answer('오차'), ', ', answer('입력값'), ' 에 비례하여 가중치를 조금씩 수정하는 규칙입니다.'),
    h('div', { class: 'formula' }, 'wᵢ ← wᵢ + η × (정답 − 예측) × xᵢ'),
    table(['무엇', '왜 곱하나'], [
      [h('td', { style: { fontWeight: '800' } }, '① 학습률 η'),
        h('td', { class: 'left' }, '가중치를 얼마나 크게 수정할지 조절해서, 학습이 너무 흔들리거나 너무 느려지는 것을 막기 위해')],
      [h('td', { style: { fontWeight: '800' } }, '② 오차 (정답 − 예측)'),
        h('td', { class: 'left' }, '정답과 예측이 얼마나 다른지에 따라 수정할지 말지, 그리고 어느 방향으로 수정할지를 정하기 위해')],
      [h('td', { style: { fontWeight: '800' } }, '③ 입력값 xᵢ'),
        h('td', { class: 'left' }, '출력에 큰 영향을 준 입력일수록 그 가중치를 더 크게 수정하기 위해')],
    ]),
    note('ok', h('b', {}, '오차가 0 이면? '),
      '식 전체가 0 이 되어 가중치가 그대로 있습니다. 즉 ', h('b', {}, '맞힌 문제는 건드리지 않고 틀린 문제만 고칩니다'), '.'));
}

/* ───────────────────────── 퍼셉트론 실험실 ────────────────────── */

function lab() {
  let gate = 'AND';
  let w1 = 1; let w2 = 1; let b = -1.5;

  const cv = makeCanvas(320);
  const tblBox = h('div', { style: { marginTop: '12px' } });
  const msg = h('div', { style: { marginTop: '10px' } });

  const gatePick = pillGroup(Object.keys(GATES).map((k) => ({ id: k, label: k })), {
    value: 'AND', onPick: (v) => { gate = v; paint(); },
  });

  const s1 = slider('w₁ (x₁ 의 가중치)', { min: -3, max: 3, step: 0.1, value: 1, fmt: (v) => v.toFixed(1), onInput: (v) => { w1 = v; paint(); } });
  const s2 = slider('w₂ (x₂ 의 가중치)', { min: -3, max: 3, step: 0.1, value: 1, fmt: (v) => v.toFixed(1), onInput: (v) => { w2 = v; paint(); } });
  const sb = slider('b (편향)', { min: -3, max: 3, step: 0.1, value: -1.5, fmt: (v) => v.toFixed(1), onInput: (v) => { b = v; paint(); } });

  function paint() {
    const target = GATES[gate].y;
    const ctx = cv.begin();
    const sx = scale(-0.35, 1.35, cv.pad.l, cv.w - cv.pad.r);
    const sy = scale(-0.35, 1.35, cv.hgt - cv.pad.b, cv.pad.t);
    axes(cv, sx, sy, { xLabel: 'x₁', yLabel: 'x₂', xTicks: [0, 1], yTicks: [0, 1] });

    /* 결정 경계 : w1*x1 + w2*x2 + b = 0 */
    const pts = [];
    if (Math.abs(w2) > 1e-6) {
      const yAt = (x) => (-b - w1 * x) / w2;
      pts.push([sx(-0.35), sy(yAt(-0.35))], [sx(1.35), sy(yAt(1.35))]);
    } else if (Math.abs(w1) > 1e-6) {
      const xAt = -b / w1;
      pts.push([sx(xAt), sy(-0.35)], [sx(xAt), sy(1.35)]);
    }

    /* 두 영역을 옅게 칠한다 — 촘촘히 찍어 보는 방식 */
    for (let gx = -0.35; gx <= 1.35; gx += 0.045) {
      for (let gy = -0.35; gy <= 1.35; gy += 0.045) {
        const on = step(w1 * gx + w2 * gy + b);
        ctx.fillStyle = on ? 'rgba(207,48,48,0.10)' : 'rgba(30,111,217,0.10)';
        ctx.fillRect(sx(gx) - 3, sy(gy) - 3, 6, 6);
      }
    }
    if (pts.length) polyline(ctx, pts, COLORS.orange, 3);

    /* 네 점 */
    let correct = 0;
    X.forEach((p, i) => {
      const out = step(w1 * p[0] + w2 * p[1] + b);
      const ok = out === target[i];
      if (ok) correct++;
      const cx = sx(p[0]); const cy = sy(p[1]);
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = ok ? '#fff' : COLORS.gold;
      ctx.fillStyle = target[i] ? COLORS.red : COLORS.blue;
      ctx.beginPath(); ctx.arc(cx, cy, 15, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      label(ctx, String(target[i]), cx, cy, { align: 'center', color: '#fff', bold: true, size: 15 });
      if (!ok) label(ctx, '✗', cx + 20, cy - 16, { color: COLORS.gold, bold: true, size: 18 });
    });

    label(ctx, '● 정답이 1 인 점', cv.w - cv.pad.r, cv.pad.t + 10, { align: 'right', color: COLORS.red, bold: true });
    label(ctx, '● 정답이 0 인 점', cv.w - cv.pad.r, cv.pad.t + 26, { align: 'right', color: COLORS.blue, bold: true });

    /* 계산표 — 학습지의 표를 그대로 */
    clear(tblBox);
    tblBox.append(table(
      ['x₁', 'x₂', 'w₁·x₁ + w₂·x₂', 'b', '합 + b', '계단함수 출력', '정답', ''],
      X.map((p, i) => {
        const wsum = w1 * p[0] + w2 * p[1];
        const z = wsum + b;
        const out = step(z);
        const ok = out === target[i];
        return [
          p[0], p[1],
          h('td', { class: 'mono' }, `${fx(w1, 1)}×${p[0]} + ${fx(w2, 1)}×${p[1]} = ${fx(wsum, 2)}`),
          h('td', { class: 'mono' }, fx(b, 1)),
          h('td', { class: 'mono', style: { fontWeight: '800' } }, fx(z, 2)),
          h('td', { style: { fontWeight: '800', fontSize: '1.1rem' } }, String(out)),
          h('td', { style: { fontWeight: '800', fontSize: '1.1rem' } }, String(target[i])),
          ok ? h('td', { class: 'filled' }, '⭕') : h('td', { class: 'na' }, '❌'),
        ];
      })));

    clear(msg);
    add(msg, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip ' + (correct === 4 ? 'ok' : 'bad') }, `4개 중 ${correct}개 맞음`),
        h('span', { class: 'chip' }, `결정 경계: ${fx(w1, 1)}x₁ + ${fx(w2, 1)}x₂ + ${fx(b, 1)} = 0`)),
      correct === 4
        ? note('ok', '🎉 네 점을 모두 맞혔습니다! 직선 하나가 두 색을 완전히 갈라 놓았습니다.')
        : gate === 'XOR'
          ? note('bad', h('b', {}, '아무리 움직여도 안 됩니다. '),
            'XOR 은 빨간 점 두 개가 대각선으로 마주 보고 있어서, ',
            h('b', {}, '직선 하나로는 절대 갈라낼 수 없습니다'), '. ',
            '이것이 퍼셉트론 하나로는 ', answer('선형 분류'), ' 문제는 풀 수 있지만 비선형 문제는 풀 수 없다는 한계입니다.')
          : note('warn', '아직 다 맞히지 못했습니다. 슬라이더를 움직여 직선을 옮겨 보세요.'),
    ]);
  }

  drawNow(paint);
  onResize(paint);

  return card('🎛️ 퍼셉트론 실험실 — 직선 하나로 갈라 보기',
    h('div', { class: 'lead' }, '가중치와 편향을 움직이면 결정 경계 직선이 따라 움직입니다. 네 점을 모두 올바른 쪽에 놓아 보세요.'),
    h('div', { class: 'row' }, h('label', { class: 'field' }, '논리 연산'), gatePick.el,
      h('span', { class: 'chip' }, GATES[gate] ? GATES[gate].nm : '')),
    h('div', { style: { height: '8px' } }),
    s1.el, s2.el, sb.el,
    h('div', { class: 'row tight', style: { marginTop: '6px' } },
      h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => { w1 = 1; w2 = 1; b = -1.5; s1.set(1); s2.set(1); sb.set(-1.5); paint(); },
      }, '학습지 AND 예시 (1, 1, −1.5)'),
      h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => { w1 = 1; w2 = 1; b = -0.5; s1.set(1); s2.set(1); sb.set(-0.5); paint(); },
      }, 'OR 예시 (1, 1, −0.5)')),
    cv.el, tblBox, msg,
    note('', h('b', {}, '한 가지만 더 — '),
      '편향 b 를 움직이면 직선이 ', h('b', {}, '평행하게 밀리고'), ', 가중치 w 를 움직이면 직선이 ',
      h('b', {}, '기울어집니다'), '. 그래서 편향은 「얼마나 쉽게 활성화될까」를, 가중치는 「어느 입력을 더 중요하게 볼까」를 정합니다.'));
}

/* ─────────────────── 퍼셉트론 학습 알고리즘 돌리기 ──────────────── */

function learnCard() {
  let gate = 'AND';
  let lr = 0.3;
  let w = [0, 0]; let b = 0;
  let epoch = 0; let logs = [];
  let timer = null;

  const cv = makeCanvas(280);
  const logBox = h('div', { class: 'scroll-y', style: { marginTop: '12px' } });
  const msg = h('div', { style: { marginTop: '10px' } });

  const gatePick = pillGroup(Object.keys(GATES).map((k) => ({ id: k, label: k })), {
    value: 'AND', onPick: (v) => { gate = v; reset(); },
  });
  const lrSl = slider('학습률 η', { min: 0.05, max: 1, step: 0.05, value: 0.3, fmt: (v) => v.toFixed(2), onInput: (v) => { lr = v; } });

  function reset() {
    if (timer) { clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 학습시키기'; }
    w = [0, 0]; b = 0; epoch = 0; logs = [];
    paint();
  }

  /** 한 에폭 = 네 문제를 한 번씩 풀며 틀린 것만 고친다 */
  function oneEpoch() {
    const target = GATES[gate].y;
    let changed = 0;
    const rows = [];
    X.forEach((p, i) => {
      const z = w[0] * p[0] + w[1] * p[1] + b;
      const out = step(z);
      const err = target[i] - out;
      if (err !== 0) {
        w = [w[0] + lr * err * p[0], w[1] + lr * err * p[1]];
        b += lr * err;
        changed++;
      }
      rows.push({ x: p, out, y: target[i], err });
    });
    epoch++;
    logs.unshift({ epoch, changed, w: w.slice(), b, rows });
    if (logs.length > 40) logs.pop();
    paint();
    return changed;
  }

  function paint() {
    const target = GATES[gate].y;
    const ctx = cv.begin();
    const sx = scale(-0.35, 1.35, cv.pad.l, cv.w - cv.pad.r);
    const sy = scale(-0.35, 1.35, cv.hgt - cv.pad.b, cv.pad.t);
    axes(cv, sx, sy, { xLabel: 'x₁', yLabel: 'x₂', xTicks: [0, 1], yTicks: [0, 1] });

    if (Math.abs(w[1]) > 1e-6) {
      const yAt = (x) => (-b - w[0] * x) / w[1];
      polyline(ctx, [[sx(-0.35), sy(yAt(-0.35))], [sx(1.35), sy(yAt(1.35))]], COLORS.orange, 3);
    } else if (Math.abs(w[0]) > 1e-6) {
      polyline(ctx, [[sx(-b / w[0]), sy(-0.35)], [sx(-b / w[0]), sy(1.35)]], COLORS.orange, 3);
    }

    let correct = 0;
    X.forEach((p, i) => {
      const out = step(w[0] * p[0] + w[1] * p[1] + b);
      const ok = out === target[i];
      if (ok) correct++;
      ctx.save();
      ctx.lineWidth = 4;
      ctx.strokeStyle = ok ? '#fff' : COLORS.gold;
      ctx.fillStyle = target[i] ? COLORS.red : COLORS.blue;
      ctx.beginPath(); ctx.arc(sx(p[0]), sy(p[1]), 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      label(ctx, String(target[i]), sx(p[0]), sy(p[1]), { align: 'center', color: '#fff', bold: true, size: 14 });
    });

    clear(msg);
    add(msg, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `${epoch} 에폭`),
        h('span', { class: 'chip' }, `w₁ = ${fx(w[0], 2)}`),
        h('span', { class: 'chip' }, `w₂ = ${fx(w[1], 2)}`),
        h('span', { class: 'chip' }, `b = ${fx(b, 2)}`),
        h('span', { class: 'chip ' + (correct === 4 ? 'ok' : 'bad') }, `${correct} / 4 맞음`)),
      correct === 4
        ? note('ok', h('b', {}, `✅ ${epoch} 에폭 만에 학습이 끝났습니다. `),
          '가중치가 더 이상 바뀌지 않습니다. 이것이 「가중치가 변경되지 않을 때까지 반복」의 끝입니다.')
        : gate === 'XOR' && epoch > 12
          ? note('bad', h('b', {}, `❌ ${epoch} 에폭이 지나도 끝나지 않습니다. `),
            'XOR 은 직선 하나로 갈릴 수 없으므로, 이 학습 규칙은 영원히 가중치를 고치고 또 고칩니다. ',
            '아래 기록을 보면 같은 값 근처를 계속 맴돌고 있습니다. ',
            h('b', {}, '이 한계가 1969년 인공지능 연구의 첫 번째 겨울을 불러왔습니다.'))
          : null,
    ]);

    clear(logBox);
    logBox.append(table(['에폭', '고친 횟수', 'w₁', 'w₂', 'b', '네 문제 결과 (예측→정답)'],
      logs.map((l) => [
        l.epoch, l.changed, fx(l.w[0], 2), fx(l.w[1], 2), fx(l.b, 2),
        h('td', { class: 'left mono', style: { fontSize: '0.85rem' } },
          l.rows.map((r) => `(${r.x[0]},${r.x[1]}) ${r.out}→${r.y}${r.err ? ' ✗' : ' ✓'}`).join('  ')),
      ]), { compact: true, scroll: false }));
  }

  const playBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      if (timer) { clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 학습시키기'; return; }
      playBtn.textContent = '⏸ 멈추기';
      timer = screenInterval(() => {
        const changed = oneEpoch();
        if (changed === 0 || epoch > 60) {
          clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 학습시키기';
        }
      }, 420);
    },
  }, '▶ 학습시키기');

  reset();
  drawNow(paint);
  onResize(paint);

  return card('🤖 퍼셉트론이 스스로 배우게 하기',
    h('div', { class: 'lead' },
      '가중치와 편향을 모두 0 에서 시작해, 틀린 문제만 고치는 규칙을 반복합니다. ',
      'AND 와 OR 은 몇 에폭 만에 끝나지만, XOR 은 어떻게 될까요?'),
    h('div', { class: 'row' }, h('label', { class: 'field' }, '논리 연산'), gatePick.el),
    lrSl.el,
    h('div', { class: 'row', style: { marginTop: '6px' } },
      h('button', { type: 'button', class: 'btn ghost', onclick: oneEpoch }, '⏭ 한 에폭만'),
      playBtn,
      h('button', { type: 'button', class: 'btn gray', onclick: reset }, '처음으로')),
    cv.el, msg,
    h('h4', {}, '학습 기록 (최근 것이 위)'),
    logBox,
    pyBox([
      "import numpy as np",
      "",
      "X = np.array([[0,0],[1,0],[0,1],[1,1]])",
      "y = np.array([0, 0, 0, 1])        # AND",
      "w, b, lr = np.zeros(2), 0.0, 0.3",
      "",
      "for epoch in range(20):",
      "    changed = 0",
      "    for xi, yi in zip(X, y):",
      "        out = 1 if (w @ xi + b) > 0 else 0   # 계단함수",
      "        err = yi - out",
      "        if err != 0:",
      "            w += lr * err * xi              # ← 학습률 × 오차 × 입력값",
      "            b += lr * err",
      "            changed += 1",
      "    if changed == 0:",
      "        print('수렴!', epoch); break",
    ].join('\n')));
}

/* ─────────────────────────── 진리표 채우기 ─────────────────────── */

function quizCard() {
  return card('✏️ 학습지 진리표 채우기',
    h('div', { class: 'lead' }, 'AND, OR, XOR 의 정답을 직접 채워 보세요.'),
    quizSet([
      { q: 'x₁=0, x₂=0 일 때 x₁ AND x₂ 는?', answer: ['0'], width: 100 },
      { q: 'x₁=1, x₂=1 일 때 x₁ AND x₂ 는?', answer: ['1'], width: 100 },
      { q: 'x₁=1, x₂=0 일 때 x₁ OR x₂ 는?', answer: ['1'], width: 100 },
      { q: 'x₁=0, x₂=0 일 때 x₁ OR x₂ 는?', answer: ['0'], width: 100 },
      { q: 'x₁=1, x₂=0 일 때 x₁ XOR x₂ 는?', answer: ['1'], explain: '둘 중 하나만 1 이므로 1 입니다.', width: 100 },
      { q: 'x₁=1, x₂=1 일 때 x₁ XOR x₂ 는?', answer: ['0'], explain: '둘 다 1 이면 「하나만 1」이 아니므로 0 입니다.', width: 100 },
      {
        q: 'w₁=1, w₂=1, b=−1.5 일 때 x₁=1, x₂=1 의 가중합 + b 는?',
        answer: ['0.5', '+0.5'],
        explain: '1×1 + 1×1 = 2, 2 + (−1.5) = 0.5 → 0 보다 크므로 출력 1',
        width: 120,
      },
      {
        q: '퍼셉트론 하나로는 어떤 문제를 해결할 수 있나요?',
        type: 'choice',
        choices: ['선형 분류 문제', '비선형 문제', '모든 문제'],
        answer: '선형 분류 문제',
        explain: '직선(또는 평면) 하나로 갈릴 수 있는 문제만 풀 수 있습니다. XOR 같은 비선형 문제는 풀 수 없습니다.',
      },
    ], { revealOnWrong: true }));
}
