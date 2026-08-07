/* ============================================================================
 * backprop.js — 학습지 16쪽 「다층 신경망 학습 알고리즘 · 3세대 딥러닝」
 *
 *   ① 경사하강법 체험 : 공이 손실 곡면을 굴러 내려간다. 학습률이 너무 크면 튕겨 나간다
 *   ② 진짜 신경망 학습 : 2-4-1 신경망을 오차 역전파로 학습시켜 XOR 을 스스로 배우게 한다
 *                        (가중치를 알려 주지 않는다! 0 근처에서 시작해 스스로 찾아낸다)
 *   ③ 순전파 → 손실 → 역전파 → 경사하강 네 단계 정리
 *   ④ 3세대 딥러닝의 탄생 배경과 층을 깊게 하는 이유
 *
 * © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다.
 * 그 밖의 이용(재배포·2차 저작물·수업 외 목적)은 먼저 문의해 주세요.
 * 자세한 이용 범위는 이 저장소의 LICENSE 파일에 적어 두었습니다.
 * ========================================================================== */

import { h, add, clear, card, sheetHead, note, answer, quizSet, table, pyBox, fx, drawNow, slider, clearScreenInterval, onResize, screenInterval } from '../../lib/ui.js';
import { makeCanvas, scale, axes, dot, polyline, label, COLORS } from '../../lib/chart.js';

export function render(root) {
  add(root, sheetHead('학습지 16쪽', '오차 역전파와 경사하강법 — 신경망은 어떻게 배우나',
    ['[12인기03-05]'],
    [
      '경사하강법에서 학습률이 너무 크거나 작으면 무슨 일이 생기는지 설명할 수 있다.',
      '역전파가 없으면 왜 신경망을 학습시킬 수 없는지 설명할 수 있다.',
      '층을 깊게 하는 까닭과 딥러닝이 3세대에 꽃핀 배경을 말할 수 있다.',
    ]));

  root.append(stepsCard());
  root.append(gdCard());
  root.append(xorTrainCard());
  root.append(deepCard());
  root.append(quizCard());
}

/* ───────────────────── ① 네 단계 정리 ────────────────────────── */

function stepsCard() {
  return card('🔄 다층 신경망은 이 네 가지로 배웁니다',
    h('p', {}, '입력이 주어지면 순방향으로 계산해 출력을 만든 뒤, 실제 출력과 원하는 출력의 오차를 계산합니다. ',
      '이 오차를 역방향으로 전파하면서 오차를 줄이는 방향으로 가중치를 바꿉니다.'),
    table(['단계', '하는 일'], [
      [h('td', { style: { fontWeight: '800' } }, ['1) ', answer('순전파')]),
        h('td', { class: 'left' }, '입력 데이터를 신경망을 통해 처리하여 최종 출력값을 계산하는 과정')],
      [h('td', { style: { fontWeight: '800' } }, ['2) ', answer('손실함수')]),
        h('td', { class: 'left' }, '예측값과 실제값의 차이를 측정하는 함수')],
      [h('td', { style: { fontWeight: '800' } }, ['3) ', answer('오차 역전파')]),
        h('td', { class: 'left' }, ['손실에 따라 역방향으로 전파하며 연결선들의 ', answer('가중치'), ' 를 조정'])],
      [h('td', { style: { fontWeight: '800' } }, ['4) ', answer('경사하강법')]),
        h('td', { class: 'left' }, ['손실을 최소화하기 위해 가중치를 업데이트하는 ', answer('최적화'), ' 알고리즘'])],
    ]),
    note('bad', h('b', {}, '역전파가 없다면? '),
      '신경망은 결과가 틀렸을 때 ', h('b', {}, '무엇을 고쳐야 하는지 알 수 없습니다'), '. ',
      '가중치가 수백만 개인데 어느 것을 얼마나 바꿔야 오차가 줄어드는지 모르니, 예측을 개선할 방법이 없습니다. ',
      '역전파는 「이 오차에 네가 얼마나 기여했는지」를 각 가중치에 거꾸로 알려 주는 방법입니다.'),
    h('h4', {}, '순전파를 좀 더 자세히 — 여섯 걸음'),
    h('ol', { style: { paddingLeft: '24px' } },
      h('li', {}, '입력 데이터를 입력층에 있는 각 뉴런의 입력으로 전달'),
      h('li', {}, [answer('입력값'), ' 과 뉴런의 ', answer('가중치'), ' 를 곱하고 ', answer('편향'), ' 을 더해 선형변환을 수행']),
      h('li', {}, ['선형변환 결과에 ', answer('ReLU'), ' 와 같은 활성화 함수를 적용해 ', answer('비선형성'), ' 을 추가']),
      h('li', {}, '은닉층 반복 처리 — 은닉층을 거치면서 데이터의 중요한 특징이 점차 추출됨'),
      h('li', {}, '출력층 계산 — 문제 유형에 맞는 활성화 함수 적용'),
      h('li', {}, '최종 출력값 반환 — 학습 중에는 손실 함수 계산에, 예측 단계에서는 결과값으로 활용')));
}

/* ──────────────────── ② 경사하강법 체험 ─────────────────────── */

function gdCard() {
  let lr = 0.15;
  let x = -2.4;
  const trail = [];
  let timer = null;

  const cv = makeCanvas(300, { pad: { l: 48, r: 22, t: 22, b: 38 } });
  const info = h('div', { style: { marginTop: '12px' } });

  /* 손실 곡선 — 구덩이가 두 개라 「지역 최솟값」도 이야기할 수 있다 */
  const L = (v) => 0.12 * v ** 4 - 0.25 * v ** 3 - 1.4 * v ** 2 + 0.6 * v + 6;
  const dL = (v) => 0.48 * v ** 3 - 0.75 * v ** 2 - 2.8 * v + 0.6;

  const lrSl = slider('학습률 η', {
    min: 0.005, max: 0.42, step: 0.005, value: 0.15,
    fmt: (v) => v.toFixed(3),
    onInput: (v) => { lr = v; },
  });

  function reset(start = -2.4) {
    if (timer) { clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 굴려 보기'; }
    x = start; trail.length = 0; trail.push(x);
    paint();
  }

  function stepOnce() {
    x -= lr * dL(x);
    x = Math.max(-12, Math.min(12, x));
    trail.push(x);
    if (trail.length > 260) trail.shift();
    paint();
  }

  function paint() {
    const ctx = cv.begin();
    const sx = scale(-4, 4.4, cv.pad.l, cv.w - cv.pad.r);
    const sy = scale(-1, 12, cv.hgt - cv.pad.b, cv.pad.t);
    axes(cv, sx, sy, { xLabel: '가중치 w', yLabel: '손실' });

    const curve = [];
    for (let v = -4; v <= 4.4; v += 0.02) curve.push([sx(v), sy(L(v))]);
    polyline(ctx, curve, COLORS.purple, 3);

    // 지나온 자취
    trail.forEach((v, i) => {
      if (Math.abs(v) > 4.4) return;
      ctx.globalAlpha = 0.15 + 0.75 * (i / Math.max(1, trail.length - 1));
      dot(ctx, sx(v), sy(L(v)), 4.5, COLORS.orange);
      ctx.globalAlpha = 1;
    });

    // 지금 자리 + 접선(기울기)
    if (Math.abs(x) <= 4.4) {
      const g = dL(x);
      const t = 0.9;
      polyline(ctx, [[sx(x - t), sy(L(x) - g * t)], [sx(x + t), sy(L(x) + g * t)]], COLORS.red, 2.5, [5, 3]);
      ctx.save();
      ctx.fillStyle = COLORS.orange; ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath(); ctx.arc(sx(x), sy(L(x)), 11, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      label(ctx, `기울기 ${fx(g, 2)}`, sx(x), sy(L(x)) - 22, { align: 'center', color: COLORS.red, bold: true });
    } else {
      label(ctx, '⚠️ 공이 화면 밖으로 튕겨 나갔습니다!', cv.w / 2, cv.pad.t + 20, { align: 'center', color: COLORS.red, bold: true, size: 16 });
    }

    clear(info);
    const diverged = Math.abs(x) > 4.4 || !Number.isFinite(x);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `w = ${fx(x, 4)}`),
        h('span', { class: 'chip' }, `손실 = ${fx(L(x), 4)}`),
        h('span', { class: 'chip' }, `기울기 = ${fx(dL(x), 4)}`),
        h('span', { class: 'chip' }, `${trail.length - 1} 걸음`)),
      h('div', { class: 'formula', style: { marginTop: '10px' } },
        `새 w = 지금 w − η × 기울기 = ${fx(x, 3)} − ${fx(lr, 3)} × ${fx(dL(x), 3)}`),
      diverged
        ? note('bad', h('b', {}, '학습률이 너무 큽니다. '),
          '한 걸음이 너무 커서 골짜기를 뛰어넘고, 반대편에서는 더 큰 기울기를 만나 점점 멀리 튕겨 나갑니다. ',
          '이것을 「발산한다」고 합니다. 학습률을 줄이고 다시 해 보세요.')
        : lr < 0.02
          ? note('warn', h('b', {}, '학습률이 너무 작습니다. '),
            '방향은 맞지만 한 걸음이 아주 작아 바닥까지 가는 데 오래 걸립니다.')
          : Math.abs(dL(x)) < 0.01
            ? note('ok', h('b', {}, '바닥에 닿았습니다. '),
              '기울기가 0 에 가까워졌습니다. 여기서는 어느 쪽으로 가도 손실이 커지므로 더 움직이지 않습니다.')
            : note('', '기울기의 반대 방향으로 조금씩 내려가고 있습니다. 기울기가 가파를수록 큰 걸음을 뗍니다.'),
    ]);
  }

  const playBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      if (timer) { clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 굴려 보기'; return; }
      playBtn.textContent = '⏸ 멈추기';
      timer = screenInterval(() => {
        stepOnce();
        if (Math.abs(dL(x)) < 0.005 || Math.abs(x) > 11 || trail.length > 250) {
          clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 굴려 보기';
        }
      }, 90);
    },
  }, '▶ 굴려 보기');

  reset();
  drawNow(paint);
  onResize(paint);

  return card('⛰️ 경사하강법 — 눈을 감고 산에서 내려오기',
    h('div', { class: 'lead' },
      '지금 서 있는 자리의 ', h('b', {}, '기울기'), ' 만 알 수 있다고 합시다. ',
      '가장 낮은 곳으로 가려면 기울기의 반대 방향으로 한 걸음 내려가면 됩니다. ',
      '그 걸음의 크기가 ', h('b', {}, '학습률'), ' 입니다.'),
    lrSl.el,
    h('div', { class: 'row', style: { marginTop: '6px' } },
      h('button', { type: 'button', class: 'btn ghost', onclick: stepOnce }, '⏭ 한 걸음'),
      playBtn,
      h('button', { type: 'button', class: 'btn gray', onclick: () => reset(-2.4) }, '왼쪽에서 다시'),
      h('button', { type: 'button', class: 'btn gray', onclick: () => reset(3.6) }, '오른쪽에서 다시')),
    h('div', { class: 'row tight', style: { marginTop: '6px' } },
      [[0.01, '아주 작게 (0.01)'], [0.15, '알맞게 (0.15)'], [0.36, '너무 크게 (0.36)']].map(([v, lb]) => h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => { lr = v; lrSl.set(v); reset(-2.4); },
      }, lb))),
    cv.el, info,
    note('warn', h('b', {}, '[오른쪽에서 다시] 를 눌러 보세요. '),
      '이 곡선에는 골짜기가 두 개 있습니다. 시작한 자리에 따라 더 얕은 골짜기(지역 최솟값)에 갇힐 수 있습니다. ',
      '실제 신경망의 손실 곡면은 차원이 수백만이라 훨씬 울퉁불퉁합니다. ',
      '그래서 Adam 같은 개선된 최적화 알고리즘이 나왔습니다.'));
}

/* ────────────── ③ 진짜 신경망이 XOR 을 스스로 배우게 ────────────── */

const XIN = [[0, 0], [1, 0], [0, 1], [1, 1]];
const YOUT = [0, 1, 1, 0];
const sig = (v) => 1 / (1 + Math.exp(-v));

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function xorTrainCard() {
  const HID = 4;
  const EPOCHS = 3000;
  const LR = 0.9;
  const SNAP = 20; // 몇 회마다 사진을 남길지

  const cvLoss = makeCanvas(230, { pad: { l: 56, r: 20, t: 20, b: 38 } });
  const cvSurf = makeCanvas(280);
  const info = h('div', { style: { marginTop: '12px' } });
  const tblBox = h('div', { style: { marginTop: '12px' } });

  let snaps = [];
  let cursor = 0;
  let timer = null;

  /** 2-4-1 신경망을 오차 역전파로 학습시키고 회차마다 가중치를 저장한다 */
  function trainAll(seed) {
    const r = rng(seed);
    // 가중치 초기화 — 작은 난수 (모두 0 으로 두면 모든 뉴런이 똑같이 움직여 배우지 못한다)
    let W1 = Array.from({ length: HID }, () => [r() * 2 - 1, r() * 2 - 1]);
    let b1 = Array.from({ length: HID }, () => r() * 2 - 1);
    let W2 = Array.from({ length: HID }, () => r() * 2 - 1);
    let b2 = r() * 2 - 1;

    const out = [];
    const record = (e) => {
      let loss = 0;
      XIN.forEach((x, i) => {
        const hn = W1.map((w, k) => sig(w[0] * x[0] + w[1] * x[1] + b1[k]));
        const o = sig(hn.reduce((s, v, k) => s + v * W2[k], 0) + b2);
        loss += (o - YOUT[i]) ** 2;
      });
      out.push({
        e,
        loss: loss / 4,
        W1: W1.map((w) => w.slice()),
        b1: b1.slice(),
        W2: W2.slice(),
        b2,
      });
    };

    record(0);
    for (let e = 1; e <= EPOCHS; e++) {
      // 배치 전체에 대한 기울기를 모은다
      const gW1 = Array.from({ length: HID }, () => [0, 0]);
      const gb1 = new Array(HID).fill(0);
      const gW2 = new Array(HID).fill(0);
      let gb2 = 0;

      XIN.forEach((x, i) => {
        /* ── 순전파 ── */
        const z1 = W1.map((w, k) => w[0] * x[0] + w[1] * x[1] + b1[k]);
        const a1 = z1.map(sig);
        const z2 = a1.reduce((s, v, k) => s + v * W2[k], 0) + b2;
        const a2 = sig(z2);

        /* ── 역전파 — 출력에서 시작해 거꾸로 ── */
        const dz2 = (a2 - YOUT[i]) * a2 * (1 - a2); // 손실 × 시그모이드 미분
        for (let k = 0; k < HID; k++) gW2[k] += dz2 * a1[k];
        gb2 += dz2;

        for (let k = 0; k < HID; k++) {
          const da1 = dz2 * W2[k];               // 오차가 은닉 뉴런으로 거슬러 온다
          const dz1 = da1 * a1[k] * (1 - a1[k]);
          gW1[k][0] += dz1 * x[0];
          gW1[k][1] += dz1 * x[1];
          gb1[k] += dz1;
        }
      });

      /* ── 경사하강 — 기울기 반대 방향으로 조금 ── */
      W1 = W1.map((w, k) => [w[0] - LR * gW1[k][0] / 4, w[1] - LR * gW1[k][1] / 4]);
      b1 = b1.map((v, k) => v - LR * gb1[k] / 4);
      W2 = W2.map((v, k) => v - LR * gW2[k] / 4);
      b2 -= LR * gb2 / 4;

      if (e % SNAP === 0) record(e);
    }
    return out;
  }

  function predict(s, x) {
    const a1 = s.W1.map((w, k) => sig(w[0] * x[0] + w[1] * x[1] + s.b1[k]));
    return sig(a1.reduce((acc, v, k) => acc + v * s.W2[k], 0) + s.b2);
  }

  function paint() {
    const s = snaps[cursor];

    /* ── 손실 곡선 ── */
    const ctx = cvLoss.begin();
    const maxL = Math.max(...snaps.map((v) => v.loss)) * 1.1;
    const sx = scale(0, EPOCHS, cvLoss.pad.l, cvLoss.w - cvLoss.pad.r);
    const sy = scale(0, maxL, cvLoss.hgt - cvLoss.pad.b, cvLoss.pad.t);
    axes(cvLoss, sx, sy, { xLabel: '학습 반복 횟수 (epoch)', yLabel: '손실' });
    polyline(ctx, snaps.slice(0, cursor + 1).map((v) => [sx(v.e), sy(v.loss)]), COLORS.purple, 3);
    dot(ctx, sx(s.e), sy(s.loss), 7, COLORS.orange, true);

    /* ── 결정 곡면 ── */
    const c2 = cvSurf.begin();
    const px = scale(-0.25, 1.25, cvSurf.pad.l, cvSurf.w - cvSurf.pad.r);
    const py = scale(-0.25, 1.25, cvSurf.hgt - cvSurf.pad.b, cvSurf.pad.t);
    axes(cvSurf, px, py, { xLabel: 'x₁', yLabel: 'x₂', xTicks: [0, 1], yTicks: [0, 1] });
    for (let gx = -0.25; gx <= 1.25; gx += 0.025) {
      for (let gy = -0.25; gy <= 1.25; gy += 0.025) {
        const p = predict(s, [gx, gy]);
        c2.fillStyle = `rgba(${Math.round(30 + p * 177)},${Math.round(111 - p * 63)},${Math.round(217 - p * 169)},0.30)`;
        c2.fillRect(px(gx) - 3, py(gy) - 3, 6.5, 6.5);
      }
    }
    XIN.forEach((x, i) => {
      c2.save();
      c2.lineWidth = 4; c2.strokeStyle = '#fff';
      c2.fillStyle = YOUT[i] ? COLORS.red : COLORS.blue;
      c2.beginPath(); c2.arc(px(x[0]), py(x[1]), 15, 0, Math.PI * 2); c2.fill(); c2.stroke();
      c2.restore();
      label(c2, fx(predict(s, x), 2), px(x[0]), py(x[1]), { align: 'center', color: '#fff', bold: true, size: 12 });
    });
    label(c2, '동그라미 안 숫자 = 모델의 예측값', cvSurf.w - cvSurf.pad.r, cvSurf.pad.t + 8,
      { align: 'right', color: COLORS.soft });

    /* ── 표와 안내 ── */
    const correct = XIN.filter((x, i) => (predict(s, x) > 0.5 ? 1 : 0) === YOUT[i]).length;
    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `${s.e} 에폭`),
        h('span', { class: 'chip' }, `손실 ${fx(s.loss, 5)}`),
        h('span', { class: 'chip ' + (correct === 4 ? 'ok' : 'bad') }, `${correct} / 4 맞음`)),
      s.e === 0
        ? note('warn', '아직 아무것도 배우지 않았습니다. 가중치는 작은 난수뿐이라 네 점 모두 0.5 근처를 답합니다.')
        : correct === 4 && s.loss < 0.02
          ? note('ok', h('b', {}, '🎉 스스로 XOR 을 배웠습니다. '),
            '앞 화면에서는 가중치를 사람이 알려 주었지만, 여기서는 아무도 알려 주지 않았습니다. '
            + '오차를 거꾸로 흘려보내며 가중치를 조금씩 고쳤을 뿐인데 답을 찾아냈습니다. 이것이 오차 역전파의 힘입니다.')
          : note('', '손실이 줄어들면서 색깔 지도가 서서히 대각선 모양으로 갈라집니다.'),
    ]);

    clear(tblBox);
    tblBox.append(table(['x₁', 'x₂', '모델의 예측 (0~1)', '0.5 기준 판정', '정답'],
      XIN.map((x, i) => {
        const p = predict(s, x);
        const pred = p > 0.5 ? 1 : 0;
        return [
          x[0], x[1],
          h('td', { class: 'mono', style: { fontWeight: '800' } }, fx(p, 4)),
          h('td', { class: pred === YOUT[i] ? 'filled' : 'na' }, String(pred)),
          YOUT[i],
        ];
      }), { compact: true }));
  }

  const sl = h('input', { type: 'range', min: '0', max: '0', value: '0', style: { flex: '1' } });
  sl.addEventListener('input', () => { cursor = Number(sl.value); paint(); });

  function load(seed) {
    if (timer) { clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 학습 보기'; }
    snaps = trainAll(seed);
    sl.max = String(snaps.length - 1);
    cursor = snaps.length - 1;
    sl.value = String(cursor);
    paint();
  }

  const playBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      if (timer) { clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 학습 보기'; return; }
      cursor = 0; sl.value = '0'; playBtn.textContent = '⏸ 멈추기';
      timer = screenInterval(() => {
        cursor = Math.min(snaps.length - 1, cursor + 1);
        sl.value = String(cursor);
        paint();
        if (cursor >= snaps.length - 1) { clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 학습 보기'; }
      }, 28);
    },
  }, '▶ 학습 보기');

  load(1234);
  drawNow(paint);
  onResize(paint);

  return card('🧪 신경망이 XOR 을 스스로 배우는 것을 지켜보기',
    h('div', { class: 'lead' },
      `은닉 뉴런 ${HID}개짜리 신경망을 오차 역전파로 ${EPOCHS} 회 학습시킨 실제 기록입니다. `,
      '가중치를 알려 주지 않았습니다. 작은 난수에서 시작해 스스로 찾아냈습니다.'),
    h('div', { class: 'row' }, playBtn,
      h('button', {
        type: 'button', class: 'btn gray',
        onclick: () => load(Math.floor(Math.random() * 99999)),
      }, '🎲 다른 초깃값으로 다시')),
    h('div', { class: 'row', style: { marginTop: '8px' } }, h('label', { class: 'field' }, '학습 진행'), sl),
    cvLoss.el,
    h('div', { style: { marginTop: '14px' } }, cvSurf.el),
    info, tblBox,
    note('warn', h('b', {}, '[다른 초깃값으로 다시] 를 여러 번 눌러 보세요. '),
      '어떤 초깃값에서는 빨리 배우고, 어떤 초깃값에서는 오래 걸리거나 한쪽 골짜기에 갇히기도 합니다. ',
      '가중치를 모두 0 으로 두면 아예 배우지 못합니다. 모든 뉴런이 똑같이 움직여 서로 구별되지 않기 때문입니다.'),
    pyBox([
      "from tensorflow import keras",
      "import numpy as np",
      "",
      "X = np.array([[0,0],[1,0],[0,1],[1,1]])",
      "y = np.array([0, 1, 1, 0])          # XOR",
      "",
      "model = keras.Sequential([",
      "    keras.layers.Dense(4, activation='sigmoid', input_shape=(2,)),  # 은닉층",
      "    keras.layers.Dense(1, activation='sigmoid'),                    # 출력층",
      "])",
      "model.compile(optimizer=keras.optimizers.SGD(0.9), loss='mse')",
      "model.fit(X, y, epochs=3000, verbose=0)   # 여기서 순전파·역전파가 자동으로 돈다",
      "print(model.predict(X).round(3))",
    ].join('\n')));
}

/* ─────────────── ④ 3세대 딥러닝 ────────────────────────────── */

function deepCard() {
  return card('🏔️ 3세대(2006) — 심층 신경망 = 딥러닝',
    h('p', {}, '은닉층이 ', h('b', {}, '2개 이상'), ' 이면 딥러닝(심층학습)이라고 부릅니다. ',
      '학습지 표현으로는 「심층 ', answer('퍼셉트론'), '」입니다.'),
    h('h4', {}, '탄생 배경 세 가지'),
    table(['', '무엇이 갖춰졌나'], [
      ['①', h('td', { class: 'left' }, '방대한 데이터 (Big Data) — 인터넷과 스마트폰이 데이터를 쏟아냈다')],
      ['②', h('td', { class: 'left' }, '학습을 잘 할 수 있는 계산 방법(알고리즘)의 발달 — ReLU, 드롭아웃, 더 나은 초기화')],
      ['③', h('td', { class: 'left' }, '기계(GPU = 그래픽카드)의 발전 — 행렬 및 벡터 계산에 특화되어 있어 신경망 계산이 수십 배 빨라졌다')],
    ]),
    h('h4', {}, '층을 깊게 하는 이유'),
    h('ol', { style: { paddingLeft: '24px' } },
      h('li', {}, '정확도 향상'),
      h('li', {}, ['각 층에서 학습해야 할 문제를 ', answer('단순한 문제'), ' 로 쪼갤 수 있다'])),
    note('', h('b', {}, '「단순한 문제로 쪼갠다」가 무슨 뜻인가요? '),
      '얼굴을 알아본다고 합시다. 첫 층은 「밝고 어두운 경계」만 찾습니다. ',
      '둘째 층은 그 경계를 모아 「눈꼬리, 콧날」 같은 조각을 만듭니다. ',
      '셋째 층은 그 조각을 모아 「눈, 코, 입」을 만들고, 넷째 층이 「얼굴」을 봅니다. ',
      '한 층이 처음부터 「얼굴」을 찾으려 하면 너무 어렵지만, 이렇게 나누면 각 층의 일은 아주 단순합니다.'),
    note('warn', h('b', {}, '깊다고 늘 좋은 것은 아닙니다. '),
      '층이 지나치게 깊으면 학습이 잘 되지 않고 성능이 오히려 떨어지는 경우도 있습니다. ',
      '오차가 거슬러 올라가면서 점점 옅어져 앞쪽 층까지 닿지 않기 때문입니다(기울기 소실).'),
    h('h4', {}, '인공신경망의 대표 활용 분야'),
    h('div', { class: 'row tight' },
      h('span', { class: 'chip on' }, '컴퓨터 비전'),
      h('span', { class: 'chip on' }, '음성 인식')));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '입력 데이터를 신경망에 통과시켜 최종 출력값을 계산하는 과정은?',
        answer: ['순전파', 'forward', 'forward propagation'],
        explain: '입력층 → 은닉층 → 출력층 순서로 앞으로 흘러갑니다.',
        width: 160,
      },
      {
        q: '손실에 따라 역방향으로 전파하며 연결선들의 가중치를 조정하는 것은?',
        answer: ['오차 역전파', '역전파', '오차역전파', '오류역전파', 'backpropagation'],
        explain: '역전파가 없으면 무엇을 고쳐야 할지 알 수 없습니다.',
        width: 200,
      },
      {
        q: '손실을 최소화하기 위해 가중치를 업데이트하는 최적화 알고리즘은?',
        answer: ['경사하강법', '경사 하강법', 'gradient descent', '기울기하강법'],
        explain: '기울기의 반대 방향으로 조금씩 내려갑니다.',
        width: 200,
      },
      {
        q: '은닉층이 몇 개 이상이면 딥러닝이라고 하나요?',
        answer: ['2', '2개', '두개', '2개 이상'],
        explain: '은닉층이 2개 이상이면 심층 신경망, 곧 딥러닝입니다.',
        width: 140,
      },
      {
        q: '딥러닝 탄생 배경 중 「행렬 및 벡터 계산에 특화된 기계」는 무엇인가요?',
        answer: ['GPU', 'gpu', '그래픽카드', '그래픽 카드'],
        explain: 'GPU(그래픽카드)가 신경망 계산 속도를 크게 끌어올렸습니다.',
        width: 160,
      },
      {
        q: '학습률이 너무 크면 어떤 일이 생기나요?',
        type: 'choice',
        choices: ['학습이 아주 느려진다', '골짜기를 뛰어넘어 발산할 수 있다', '아무 일도 없다'],
        answer: '골짜기를 뛰어넘어 발산할 수 있다',
        explain: '위 실험에서 학습률 0.36 으로 두면 공이 화면 밖으로 튕겨 나갑니다.',
      },
    ], { revealOnWrong: true }));
}
