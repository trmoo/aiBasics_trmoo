/* ============================================================================
 * kinds.js — 학습지 5~6쪽 「5.1 모델 선택 · 기계학습의 세 갈래」
 *
 *   ① 기계학습 계통도와 모델 선택 기준
 *   ② 분류와 회귀는 무엇이 다른가 — 같은 점들 위에 「경계선」과 「추세선」을 함께 그린다
 *   ③ k-평균 군집화 직접 돌려 보기 — 정답 없이 스스로 무리를 짓는 것을 눈으로 확인
 *   ④ 상황 카드를 지도 / 비지도 / 강화 로 나누기
 *
 * © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다.
 * 그 밖의 이용(재배포·2차 저작물·수업 외 목적)은 먼저 문의해 주세요.
 * 자세한 이용 범위는 이 저장소의 LICENSE 파일에 적어 두었습니다.
 * ========================================================================== */

import { h, add, clear, card, sheetHead, note, answer, quizSet, sortQuiz, table, pyBox, fx, drawNow, pillGroup, slider, clearScreenInterval, onResize, screenInterval } from '../../lib/ui.js';
import * as S from '../../lib/stats.js';
import { makeCanvas, scale, axes, dot, polyline, label, COLORS } from '../../lib/chart.js';

function rng(seed) {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

export function render(root) {
  add(root, sheetHead('학습지 5~6쪽', '기계학습의 세 갈래와 모델 선택',
    ['[12인기03-01]', '[12인기03-02]'],
    [
      '지도학습·비지도학습·강화학습을 구분하고 알맞은 예를 들 수 있다.',
      '분류 모델과 회귀 모델의 차이를 결과값의 종류로 설명할 수 있다.',
      '정답 없이도 학습이 되는 군집화의 과정을 직접 돌려 보고 설명할 수 있다.',
    ]));

  root.append(treeCard());
  root.append(clsRegCard());
  root.append(kmeansCard());
  root.append(sortCard());
  root.append(quizCard());
}

/* ────────────────────────── 기계학습 계통도 ───────────────────────── */

function treeCard() {
  return card('🌳 기계학습 계통도',
    table(['기계학습 유형', '', '기계학습 알고리즘'], [
      [h('td', { rowspan: '2', style: { fontWeight: '800', background: '#eef4ff' } }, '지도학습'),
        h('td', { style: { fontWeight: '700' } }, '분류'),
        h('td', { class: 'left' }, '결정트리, 로지스틱 회귀, k-최근접 이웃 등')],
      [h('td', { style: { fontWeight: '700' } }, '회귀'), h('td', { class: 'left' }, '선형회귀 등')],
      [h('td', { rowspan: '2', style: { fontWeight: '800', background: '#eefaf4' } }, '비지도학습'),
        h('td', { style: { fontWeight: '700' } }, '군집'),
        h('td', { class: 'left' }, 'k-평균 군집화, 계층적 군집화 등')],
      [h('td', { style: { fontWeight: '700' } }, '연관'), h('td', { class: 'left' }, '연관 규칙 분석(Apriori 등)')],
      [h('td', { colspan: '2', style: { fontWeight: '800', background: '#fff6e5' } }, '강화학습'),
        h('td', { class: 'left' }, 'Q-learning 등')],
    ]),
    h('h4', {}, '어떤 모델을 고를까'),
    table(['데이터', '고를 모델'], [
      [h('td', { class: 'left' }, '이미지·음성·자연어 같은 비정형 데이터'), h('td', {}, [answer('딥러닝'), ' 모델'])],
      [h('td', { class: 'left' }, '표 형태 데이터나 비교적 단순한 예측 문제'), h('td', {}, [answer('기계학습'), ' 모델'])],
    ]),
    h('h4', {}, '세 갈래를 한 줄로'),
    table(['유형', '무엇을 주고 배우게 하나', '한 줄 설명'], [
      [h('td', { style: { fontWeight: '800' } }, '지도학습'),
        h('td', { class: 'left' }, '데이터 + 정답(레이블)'),
        h('td', { class: 'left' }, '문제와 답을 함께 주고 규칙을 찾게 한다')],
      [h('td', { style: { fontWeight: '800' } }, '비지도학습'),
        h('td', { class: 'left' }, '데이터만 (정답 없음)'),
        h('td', { class: 'left' }, '문제만 주고 스스로 무리를 짓거나 함께 나타나는 것을 찾게 한다')],
      [h('td', { style: { fontWeight: '800' } }, '강화학습'),
        h('td', { class: 'left' }, [answer('환경'), ' 과 보상 규칙']),
        h('td', { class: 'left' }, [answer('시행착오'), ' 를 거치며 최대의 ', answer('보상'), ' 을 얻는 행동을 스스로 배운다'])],
    ]),
    note('', h('b', {}, '강화학습이 특별한 점 '),
      '주어진 데이터나 환경에 대한 사전지식 없이 스스로 학습하고 적응합니다. ',
      '로봇 자율제어, 컴퓨터 게임, 금융 거래 전략 수립 등에 씁니다. ',
      '「정답」 대신 「점수」를 주고, 점수를 많이 받는 길을 스스로 찾아내게 하는 방식입니다.'));
}

/* ─────────────── 분류 vs 회귀 — 같은 점 위에 두 그림 ────────────── */

function clsRegCard() {
  const cv = makeCanvas(310);
  let mode = 'cls';

  const pick = pillGroup([
    { id: 'cls', label: '분류 (classification)' },
    { id: 'reg', label: '회귀 (regression)' },
  ], { value: 'cls', onPick: (v) => { mode = v; paint(); } });

  const info = h('div', { style: { marginTop: '12px' } });

  /* 분류용: 두 무리 / 회귀용: 하나의 추세 */
  const r1 = rng(11);
  const A = Array.from({ length: 18 }, () => [1.5 + r1() * 3.2, 5.5 + r1() * 3.6]);
  const B = Array.from({ length: 18 }, () => [5.2 + r1() * 3.4, 1.4 + r1() * 3.4]);
  const r2 = rng(29);
  const REG = Array.from({ length: 22 }, (_, i) => {
    const x = 0.6 + i * 0.42;
    return [x, Math.max(0.4, Math.min(9.6, 1.4 + x * 0.82 + (r2() - 0.5) * 2.2))];
  });

  function paint() {
    const ctx = cv.begin();
    const sx = scale(0, 10, cv.pad.l, cv.w - cv.pad.r);
    const sy = scale(0, 10, cv.hgt - cv.pad.b, cv.pad.t);
    axes(cv, sx, sy, { xLabel: '독립변수 x', yLabel: 'y' });

    clear(info);

    if (mode === 'cls') {
      // 두 무리를 가르는 직선 (손으로 정한 결정 경계)
      polyline(ctx, [[sx(0), sy(9.4)], [sx(10), sy(-0.6)]], COLORS.orange, 3);
      // 경계 양쪽을 옅게 칠한다
      ctx.save();
      ctx.globalAlpha = 0.08;
      ctx.fillStyle = COLORS.blue;
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(9.4)); ctx.lineTo(sx(10), sy(-0.6)); ctx.lineTo(sx(0), sy(-0.6));
      ctx.closePath(); ctx.fill();
      ctx.fillStyle = COLORS.pink;
      ctx.beginPath();
      ctx.moveTo(sx(0), sy(9.4)); ctx.lineTo(sx(10), sy(-0.6)); ctx.lineTo(sx(10), sy(10)); ctx.lineTo(sx(0), sy(10));
      ctx.closePath(); ctx.fill();
      ctx.restore();

      A.forEach((p) => dot(ctx, sx(p[0]), sy(p[1]), 6, COLORS.pink, true));
      B.forEach((p) => dot(ctx, sx(p[0]), sy(p[1]), 6, COLORS.blue, true));
      label(ctx, '결정 경계 — 데이터를 구분하는 선', cv.w - cv.pad.r, cv.pad.t + 8, { align: 'right', color: COLORS.orange, bold: true });

      add(info, [
        h('div', { class: 'row tight' },
          h('span', { class: 'chip on' }, '결과값 = 범주형'),
          h('span', { class: 'chip' }, '분홍이냐 파랑이냐'),
          h('span', { class: 'chip' }, '개·고양이 (이진) / 사과·복숭아·바나나 (다중)')),
        note('', h('b', {}, '분류 모델은 '), '명확하게 나눠진 ', answer('범주형'),
          '(categorical)인 결과값을 예측합니다. 기계는 이것을 「데이터를 구분하는 경계를 나누는 선(함수)」으로 표현합니다.'),
      ]);
    } else {
      const xs = REG.map((p) => p[0]); const ys = REG.map((p) => p[1]);
      const { a, b } = S.linreg(xs, ys);
      // 오차(잔차)를 세로 선으로 보여 준다
      ctx.save();
      ctx.strokeStyle = 'rgba(207,48,48,0.45)'; ctx.lineWidth = 1.5;
      REG.forEach((p) => {
        ctx.beginPath();
        ctx.moveTo(sx(p[0]), sy(p[1]));
        ctx.lineTo(sx(p[0]), sy(a * p[0] + b));
        ctx.stroke();
      });
      ctx.restore();
      polyline(ctx, [[sx(0), sy(b)], [sx(10), sy(a * 10 + b)]], COLORS.orange, 3);
      REG.forEach((p) => dot(ctx, sx(p[0]), sy(p[1]), 6, COLORS.green, true));
      label(ctx, `추세선 y = ${fx(a, 2)}x + ${fx(b, 2)}`, cv.w - cv.pad.r, cv.pad.t + 8, { align: 'right', color: COLORS.orange, bold: true });
      label(ctx, '빨간 세로선 = 오차', cv.w - cv.pad.r, cv.pad.t + 24, { align: 'right', color: COLORS.red });

      const pred = xs.map((x) => a * x + b);
      add(info, [
        h('div', { class: 'row tight' },
          h('span', { class: 'chip on' }, '결과값 = 수치형'),
          h('span', { class: 'chip' }, `오차 제곱합 ${fx(ys.reduce((s, y, i) => s + (y - pred[i]) ** 2, 0), 2)}`),
          h('span', { class: 'chip' }, `R² ${fx(S.r2(ys, pred), 3)}`)),
        note('', h('b', {}, '회귀 모델은 '), '연속적인 ', answer('수치형'),
          '으로 이루어진 데이터를 예측합니다. 기계는 「증가하고 감소하는 규칙을 찾고, 오차를 가장 적게 하는 선(함수)」으로 표현합니다.'),
        note('ok', h('b', {}, '단순 회귀와 다중 회귀 '),
          '독립변수가 1개면 단순 선형회귀, 2개 이상이면 다중 선형회귀입니다. ',
          '다중이 되면 선이 아니라 평면(또는 더 높은 차원의 면)이 됩니다.'),
      ]);
    }
  }

  drawNow(paint);
  onResize(paint);

  return card('📈 분류와 회귀는 무엇이 다를까',
    h('div', { class: 'lead' }, '둘 다 「데이터를 가장 잘 대변하는 함수」를 찾는 일입니다. 다만 그 함수가 하는 일이 다릅니다.'),
    pick.el, h('div', { style: { height: '10px' } }), cv.el, info,
    table(['', '분류', '회귀'], [
      [h('td', { style: { fontWeight: '800' } }, '예측하는 것'), '범주 (개/고양이)', '수치 (몸무게, 집값, 주가)'],
      [h('td', { style: { fontWeight: '800' } }, '기계가 찾는 함수'), '데이터를 구분하는 경계선', '오차를 가장 적게 하는 선'],
      [h('td', { style: { fontWeight: '800' } }, '평가 지표'), '정확도·정밀도·재현율·F1', 'MAE·MSE·RMSE·R²'],
    ]),
    note('', h('b', {}, '용어 정리 '),
      '독립변수 = 설명변수 = feature = X · 종속변수 = 반응변수 = 레이블 = 타깃변수 = y. ',
      '모델은 X 의 패턴을 학습해 y 를 예측하는 함수입니다.'));
}

/* ─────────────────── k-평균 군집화 직접 돌려 보기 ────────────────── */

function kmeansCard() {
  const cv = makeCanvas(330);
  const stepBox = h('div', { style: { marginTop: '10px' } });
  let K = 3;
  let pts = [];
  let cents = [];
  let assign = [];
  let step = 0; // 0: 시작 전, 홀수: 배정 끝, 짝수: 중심 이동 끝
  let timer = null;

  const CL = [COLORS.blue, COLORS.pink, COLORS.green, COLORS.orange, COLORS.purple];

  function makePoints() {
    const r = rng(2026);
    const centers = [[2.4, 7.2], [7.4, 7.0], [5.0, 2.4]];
    pts = [];
    centers.forEach((c) => {
      for (let i = 0; i < 22; i++) {
        pts.push([
          Math.max(0.3, Math.min(9.7, c[0] + (r() + r() + r() - 1.5) * 1.5)),
          Math.max(0.3, Math.min(9.7, c[1] + (r() + r() + r() - 1.5) * 1.5)),
        ]);
      }
    });
  }

  function reset(seed = 5) {
    const r = rng(seed);
    cents = Array.from({ length: K }, () => [1 + r() * 8, 1 + r() * 8]);
    assign = pts.map(() => -1);
    step = 0;
    paint();
  }

  /** 한 걸음: 배정 → 중심 이동 을 번갈아 한다 */
  function next() {
    if (step % 2 === 0) {
      // ① 각 점을 가장 가까운 중심에 배정
      assign = pts.map((p) => {
        let best = 0; let bd = 1e9;
        cents.forEach((c, i) => {
          const d = (p[0] - c[0]) ** 2 + (p[1] - c[1]) ** 2;
          if (d < bd) { bd = d; best = i; }
        });
        return best;
      });
    } else {
      // ② 각 무리의 평균 자리로 중심을 옮김
      cents = cents.map((c, i) => {
        const mine = pts.filter((_, k) => assign[k] === i);
        if (!mine.length) return c;
        return [S.mean(mine.map((p) => p[0])), S.mean(mine.map((p) => p[1]))];
      });
    }
    step++;
    paint();
  }

  function paint() {
    const ctx = cv.begin();
    const sx = scale(0, 10, cv.pad.l, cv.w - cv.pad.r);
    const sy = scale(0, 10, cv.hgt - cv.pad.b, cv.pad.t);
    axes(cv, sx, sy);

    // 배정된 점은 무리 색으로, 아직이면 회색으로
    pts.forEach((p, i) => {
      const c = assign[i] >= 0 ? CL[assign[i] % CL.length] : '#b9c3d1';
      if (assign[i] >= 0) {
        // 중심까지 옅은 선을 그어 「어디에 속했는지」 보이게 한다
        ctx.save();
        ctx.globalAlpha = 0.18; ctx.strokeStyle = c; ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(sx(p[0]), sy(p[1]));
        ctx.lineTo(sx(cents[assign[i]][0]), sy(cents[assign[i]][1]));
        ctx.stroke();
        ctx.restore();
      }
      dot(ctx, sx(p[0]), sy(p[1]), 5, c, true);
    });

    // 중심
    cents.forEach((c, i) => {
      ctx.save();
      ctx.translate(sx(c[0]), sy(c[1]));
      ctx.fillStyle = CL[i % CL.length];
      ctx.strokeStyle = '#fff'; ctx.lineWidth = 3;
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const ang = (Math.PI / 5) * k - Math.PI / 2;
        const rad = k % 2 ? 5 : 12;
        ctx[k ? 'lineTo' : 'moveTo'](Math.cos(ang) * rad, Math.sin(ang) * rad);
      }
      ctx.closePath(); ctx.fill(); ctx.stroke();
      ctx.restore();
    });

    const inertia = assign.every((a) => a >= 0)
      ? pts.reduce((s, p, i) => s + (p[0] - cents[assign[i]][0]) ** 2 + (p[1] - cents[assign[i]][1]) ** 2, 0)
      : NaN;

    clear(stepBox);
    add(stepBox, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `단계 ${step}`),
        h('span', { class: 'chip' }, step === 0 ? '중심을 아무 곳에나 놓았습니다'
          : step % 2 === 1 ? '① 각 점을 가장 가까운 중심에 배정했습니다'
            : '② 각 무리의 평균 자리로 중심을 옮겼습니다'),
        Number.isFinite(inertia) ? h('span', { class: 'chip' }, `무리 안 거리 제곱합 ${fx(inertia, 1)} (작을수록 잘 뭉침)`) : null),
      cents.map((c, i) => h('span', {
        class: 'chip', style: { marginRight: '6px', borderLeft: `6px solid ${CL[i % CL.length]}` },
      }, `무리 ${i + 1} · ${assign.filter((a) => a === i).length}개 · 중심 (${fx(c[0], 2)}, ${fx(c[1], 2)})`)),
    ]);
  }

  const kSl = slider('무리의 수 k', {
    min: 2, max: 5, value: 3,
    onInput: (v) => { K = v; reset(5); },
  });

  const autoBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      if (timer) { clearScreenInterval(timer); timer = null; autoBtn.textContent = '▶ 자동으로 돌리기'; return; }
      autoBtn.textContent = '⏸ 멈추기';
      timer = screenInterval(() => {
        const before = JSON.stringify(cents);
        next();
        if (step > 2 && step % 2 === 0 && JSON.stringify(cents) === before) {
          clearScreenInterval(timer); timer = null; autoBtn.textContent = '▶ 자동으로 돌리기';
        }
        if (step > 40) { clearScreenInterval(timer); timer = null; autoBtn.textContent = '▶ 자동으로 돌리기'; }
      }, 700);
    },
  }, '▶ 자동으로 돌리기');

  makePoints();
  reset(5);
  drawNow(paint);
  onResize(paint);

  return card('🔵 k-평균 군집화 — 정답 없이 스스로 무리 짓기',
    h('div', { class: 'lead' },
      answer('군집화'), '(clustering)는 유사한 특성을 가진 데이터끼리 그룹으로 묶는 비지도학습입니다. ',
      '아래 점들에는 ', h('b', {}, '정답표가 없습니다'), '. 그런데도 알고리즘이 무리를 찾아냅니다.'),
    kSl.el,
    h('div', { class: 'row', style: { marginTop: '8px' } },
      h('button', { type: 'button', class: 'btn ghost', onclick: next }, '⏭ 한 걸음만'),
      autoBtn,
      h('button', { type: 'button', class: 'btn gray', onclick: () => { if (timer) { clearScreenInterval(timer); timer = null; autoBtn.textContent = '▶ 자동으로 돌리기'; } reset(Math.floor(Math.random() * 9999)); } }, '🎲 중심 다시 놓기')),
    cv.el, stepBox,
    note('', h('b', {}, 'k-평균이 하는 일은 딱 두 가지의 반복입니다. '),
      '① 모든 점을 가장 가까운 중심에 배정한다. ② 각 무리의 평균 자리로 중심을 옮긴다. ',
      '중심이 더 이상 움직이지 않으면 끝입니다. [한 걸음만] 을 눌러 두 동작이 번갈아 일어나는 것을 보세요.'),
    note('warn', h('b', {}, '중심을 다시 놓아 보세요. '),
      '처음 중심을 어디에 두느냐에 따라 결과가 달라질 수 있습니다. ',
      '이것이 k-평균의 약점이라, 실제 라이브러리는 여러 번 돌려 가장 잘 뭉친 결과를 고릅니다.'),
    h('h4', {}, '비지도학습의 또 한 갈래 — 연관 분석'),
    h('p', {}, answer('연관 분석'), '(association analysis)은 데이터에서 함께 나타나는 항목들의 관계를 찾습니다. ',
      '「기저귀를 산 고객이 맥주도 함께 사더라」처럼 「A 를 하면 B 도 함께 나타난다」는 규칙을 찾는 것입니다. ',
      '최소 지지도를 이용하는 ', h('b', {}, 'Apriori'), ' 가 대표 알고리즘입니다.'),
    pyBox([
      "from sklearn.cluster import KMeans",
      "km = KMeans(n_clusters=3, n_init=10, random_state=42)",
      "df['무리'] = km.fit_predict(X)   # y(정답)를 넣지 않는다!",
      "km.cluster_centers_             # 각 무리의 중심 좌표",
      "km.inertia_                     # 무리 안 거리 제곱합 (작을수록 잘 뭉침)",
    ].join('\n')));
}

/* ──────────────────── 상황 카드 나누기 ─────────────────────────── */

function sortCard() {
  return card('🗂️ 이 상황은 어떤 학습일까',
    sortQuiz(
      [
        { id: 'sup-c', label: '지도학습 · 분류' },
        { id: 'sup-r', label: '지도학습 · 회귀' },
        { id: 'unsup', label: '비지도학습' },
        { id: 'rl', label: '강화학습' },
      ],
      [
        { text: '사진이 개인지 고양이인지 맞히기', bin: 'sup-c' },
        { text: '아파트 면적·층수로 매매가 예측', bin: 'sup-r' },
        { text: '고객을 비슷한 무리로 묶어 마케팅', bin: 'unsup' },
        { text: '바둑 두면서 이기는 수를 스스로 익히기', bin: 'rl' },
        { text: '메일이 스팸인지 아닌지 판정', bin: 'sup-c' },
        { text: '내일 최고 기온 예측', bin: 'sup-r' },
        { text: '함께 팔리는 물건 짝 찾기', bin: 'unsup' },
        { text: '로봇 팔이 넘어지지 않게 걷는 법 익히기', bin: 'rl' },
        { text: '손글씨 숫자 0~9 알아보기', bin: 'sup-c' },
        { text: '공부시간으로 시험 점수 예측', bin: 'sup-r' },
        { text: '뉴스 기사를 주제별로 자동 묶기', bin: 'unsup' },
        { text: '게임에서 점수를 최대로 얻는 조작 익히기', bin: 'rl' },
      ]),
    note('', h('b', {}, '가르는 요령 '),
      '① 정답표(레이블)가 있나? 없으면 비지도. ② 있다면 답이 「범주」인가 「숫자」인가? 범주면 분류, 숫자면 회귀. ',
      '③ 정답 대신 「점수(보상)」를 주고 스스로 해 보게 하나? 그러면 강화학습.'));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '분류 모델은 명확하게 나눠진 ( ? )인 결과값을 예측합니다.',
        answer: ['범주형', '범주'],
        explain: '개·고양이(이진), 사과·복숭아·바나나(다중) 같은 범주입니다.',
        width: 160,
      },
      {
        q: '회귀 모델은 연속적인 ( ? )으로 이루어진 데이터를 예측합니다.',
        answer: ['수치형', '수치'],
        explain: '몸무게로 키 예측, 부동산 가격 예측, 주가 예측 등입니다.',
        width: 160,
      },
      {
        q: '유사한 특성을 가진 데이터끼리 그룹화하는 비지도학습은?',
        answer: ['군집화', '군집', 'clustering', '클러스터링'],
        explain: 'k-means 는 k 개의 무리로 나누는 대표적인 군집화 알고리즘입니다.',
        width: 180,
      },
      {
        q: '최소 지지도 개념을 활용해 연관규칙을 찾는 대표 알고리즘은?',
        answer: ['Apriori', '아프리오리', '에이프리오리'],
        explain: '연관 분석(association analysis)의 대표 알고리즘입니다.',
        width: 180,
      },
      {
        q: '강화학습은 ( ? )과 상호작용하며 시행착오를 통해 최대의 보상을 얻는 행동을 스스로 학습합니다.',
        answer: ['환경', 'environment'],
        explain: '에이전트가 환경 안에서 행동하고, 그 결과로 보상을 받으며 배웁니다.',
        width: 160,
      },
      {
        q: '독립변수가 2개 이상인 선형회귀를 무엇이라 하나요?',
        answer: ['다중 선형회귀', '다중선형회귀', '다중회귀', '다중 회귀'],
        explain: '독립변수가 1개면 단순 선형회귀입니다.',
        width: 200,
      },
    ], { revealOnWrong: true }));
}
