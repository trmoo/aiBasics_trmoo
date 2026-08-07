/* ============================================================================
 * scaling.js — 학습지 4쪽 「4.5 정규화(스케일링)」
 *
 *   ① 왜 필요한가 : 단위가 큰 속성이 「거리」를 혼자 차지해 버리는 것을 계산으로 보여 준다
 *   ② 최소-최대 정규화 vs 표준화 : 같은 자료를 두 방식으로 바꿔 나란히 그린다
 *   ③ 이상치가 있을 때 : 최소-최대 정규화가 나머지 값을 한쪽에 뭉개 버리는 것을 확인
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
import { makeCanvas, scale, dot, label, COLORS, ticks } from '../../lib/chart.js';

export function render(root) {
  add(root, sheetHead('학습지 4쪽', '정규화 — 수치의 단위를 맞추기',
    ['[12인기02-03]'],
    [
      '단위가 다른 속성을 그대로 두면 왜 학습이 잘못되는지 계산으로 보일 수 있다.',
      '최소-최대 정규화와 표준화의 식과 결과 범위를 구분할 수 있다.',
      '이상치가 있을 때 두 방법이 어떻게 다르게 반응하는지 설명할 수 있다.',
    ]));

  root.append(whyCard());
  root.append(compareCard());
  root.append(outlierCard());
  root.append(quizCard());
}

/* ────────────── ① 왜 필요한가 — 거리 계산으로 보여 주기 ─────────── */

const PEOPLE = [
  { nm: '가영', height: 160, study: 1.0 },
  { nm: '나은', height: 161, study: 5.0 },
  { nm: '다현', height: 178, study: 1.2 },
];

function whyCard() {
  const out = h('div', {});

  function paint() {
    const A = PEOPLE[0];
    const rowsRaw = PEOPLE.slice(1).map((p) => {
      const dh = p.height - A.height; const ds = p.study - A.study;
      return { p, dh, ds, d: Math.sqrt(dh * dh + ds * ds) };
    });

    const hs = PEOPLE.map((p) => p.height);
    const ss = PEOPLE.map((p) => p.study);
    const hn = S.minmax(hs); const sn = S.minmax(ss);
    const rowsNorm = PEOPLE.slice(1).map((p, i) => {
      const dh = hn[i + 1] - hn[0]; const ds = sn[i + 1] - sn[0];
      return { p, dh, ds, d: Math.sqrt(dh * dh + ds * ds) };
    });

    const near = (rs) => (rs[0].d < rs[1].d ? rs[0].p.nm : rs[1].p.nm);

    clear(out);
    add(out, [
      table(['이름', '키(cm)', '공부시간(h)'], PEOPLE.map((p) => [p.nm, p.height, p.study])),

      h('h4', {}, '「가영이와 가장 비슷한 사람은 누구인가」를 거리로 재 보면'),
      table(['비교', '키 차이', '공부시간 차이', '거리 = √(키차² + 시간차²)'],
        rowsRaw.map((r) => [
          `가영 ↔ ${r.p.nm}`, fx(r.dh, 1), fx(r.ds, 1),
          h('td', { class: 'mono', style: { fontWeight: '800' } }, fx(r.d, 3)),
        ])),
      note('bad', h('b', {}, `정규화하기 전 → 가장 가까운 사람은 「${near(rowsRaw)}」 `),
        '공부시간은 1시간 vs 5시간으로 4배나 차이 나는데, 키 차이(cm)가 숫자로 훨씬 커서 거리를 혼자 차지해 버렸습니다. ',
        '「특정 속성의 수치가 다른 속성보다 크면 그 속성에 ', answer('가중치'), ' 가 있다고 판단해 학습에 잘못된 영향을 준다」는 말이 이것입니다.'),

      h('h4', {}, '최소-최대 정규화로 두 속성을 0~1 로 맞추면'),
      table(['이름', '키 (0~1)', '공부시간 (0~1)'],
        PEOPLE.map((p, i) => [p.nm, fx(hn[i], 3), fx(sn[i], 3)])),
      table(['비교', '키 차이', '공부시간 차이', '거리'],
        rowsNorm.map((r) => [
          `가영 ↔ ${r.p.nm}`, fx(r.dh, 3), fx(r.ds, 3),
          h('td', { class: 'mono', style: { fontWeight: '800' } }, fx(r.d, 3)),
        ])),
      note('ok', h('b', {}, `정규화한 뒤 → 가장 가까운 사람은 「${near(rowsNorm)}」 `),
        '두 속성이 같은 무게를 갖게 되자 답이 바뀌었습니다. ',
        'KNN 처럼 거리를 쓰는 알고리즘에서는 스케일링을 빼먹으면 결과가 통째로 달라집니다.'),
    ]);
  }
  paint();

  return card('❗ 왜 단위를 맞춰야 할까',
    h('div', { class: 'lead' },
      '정규화(스케일링)는 수치형 변수끼리 비교하려고 수치의 ', answer('단위'), ' 를 맞추는 과정입니다. ',
      '아래 세 사람의 거리를 직접 계산해 보면 왜 필요한지 바로 보입니다.'),
    out);
}

/* ───────── ② 최소-최대 정규화 vs 표준화 나란히 보기 ────────── */

function compareCard() {
  let data = [45, 52, 58, 61, 63, 67, 70, 74, 78, 88];
  const input = h('input', {
    type: 'text', class: 'mono', value: data.join(', '),
    style: { flex: '1', minWidth: '260px' },
  });

  const cv = makeCanvas(280, { pad: { l: 92, r: 24, t: 22, b: 30 } });
  const tbl = h('div', { style: { marginTop: '12px' } });

  function paint() {
    const mm = S.minmax(data);
    const st = S.standardize(data);
    const ctx = cv.begin();

    const lanes = [
      { nm: '원본', vals: data, lo: Math.min(...data), hi: Math.max(...data), color: COLORS.soft },
      { nm: '최소-최대 정규화', vals: mm, lo: -0.05, hi: 1.05, color: COLORS.blue },
      { nm: '표준화', vals: st, lo: Math.min(-3, Math.min(...st) - 0.3), hi: Math.max(3, Math.max(...st) + 0.3), color: COLORS.purple },
    ];

    lanes.forEach((ln, i) => {
      const y = cv.pad.t + 40 + i * 76;
      const sx = scale(ln.lo, ln.hi, cv.pad.l, cv.w - cv.pad.r);
      ctx.strokeStyle = COLORS.line; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cv.pad.l, y); ctx.lineTo(cv.w - cv.pad.r, y); ctx.stroke();
      ctx.fillStyle = COLORS.soft; ctx.textAlign = 'center';
      ticks(ln.lo, ln.hi, 6).forEach((v) => {
        ctx.fillText(String(Math.round(v * 100) / 100), sx(v), y + 15);
      });
      ln.vals.forEach((v) => dot(ctx, sx(v), y - 12, 6, ln.color, true));
      label(ctx, ln.nm, cv.pad.l - 10, y - 12, { align: 'right', bold: true, color: ln.color, size: 13 });
      label(ctx, `평균 ${fx(S.mean(ln.vals), 2)} · 표준편차 ${fx(S.stdev(ln.vals), 2)}`,
        cv.w - cv.pad.r, y - 30, { align: 'right', color: COLORS.soft, size: 11 });
    });

    clear(tbl);
    tbl.append(table(['원본 x', '최소-최대 (x−min)/(max−min)', '표준화 (x−평균)/표준편차'],
      data.map((v, i) => [v, fx(mm[i], 3), fx(st[i], 3)]), { compact: true }));
  }

  input.addEventListener('input', () => {
    const arr = input.value.split(/[,\s]+/).map(Number).filter(Number.isFinite);
    if (arr.length >= 2) { data = arr; paint(); }
  });

  drawNow(paint);
  window.addEventListener('resize', paint);

  return card('⚖️ 최소-최대 정규화 vs 표준화',
    table(['', '최소-최대 정규화 (min-max scaling)', '표준화 (standard scaling)'], [
      [h('td', { style: { fontWeight: '800' } }, '식'),
        h('td', { class: 'mono' }, '(x − 최솟값) ÷ (최댓값 − 최솟값)'),
        h('td', { class: 'mono' }, '(x − 평균) ÷ 표준편차')],
      [h('td', { style: { fontWeight: '800' } }, '결과 범위'),
        h('td', {}, [answer('0'), ' ~ ', answer('1')]),
        h('td', {}, '평균 0, 표준편차 1 인 표준정규분포')],
      [h('td', { style: { fontWeight: '800' } }, '이상치'),
        h('td', {}, '크게 영향 받음 (이상치가 최댓값이 되어 나머지를 눌러 버림)'),
        h('td', {}, '상대적으로 덜 받음')],
      [h('td', { style: { fontWeight: '800' } }, '주로 쓰는 곳'),
        h('td', {}, '값의 범위가 정해져야 할 때 (이미지 픽셀 0~255 → 0~1, 신경망 입력)'),
        h('td', {}, '정규분포를 가정하는 모델, 거리 기반 모델')],
    ]),
    h('div', { class: 'row', style: { marginTop: '14px' } }, h('label', { class: 'field' }, '자료'), input),
    cv.el, tbl,
    pyBox([
      "from sklearn.preprocessing import MinMaxScaler, StandardScaler",
      "",
      "scaler = MinMaxScaler()      # 또는 StandardScaler()",
      "X_train_s = scaler.fit_transform(X_train)   # 훈련 데이터로 '학습 + 변환'",
      "X_test_s  = scaler.transform(X_test)        # 테스트는 '변환만'!",
    ].join('\n'),
    note('bad', h('b', {}, '⚠️ 데이터 누수 주의 '),
      '테스트 데이터에 ', h('code', { class: 'inline' }, 'fit_transform'),
      ' 을 쓰면 테스트 데이터의 최댓값·평균이 스케일러에 새어 들어갑니다. ',
      '그러면 시험 문제를 미리 본 셈이 되어 성능이 실제보다 좋게 나옵니다. 테스트에는 반드시 ',
      h('code', { class: 'inline' }, 'transform'), ' 만 씁니다.')));
}

/* ───────── ③ 이상치가 있을 때 두 방법이 어떻게 다른가 ────────── */

function outlierCard() {
  let big = 100;
  const base = [45, 52, 58, 61, 63, 67, 70, 74, 78];
  const cv = makeCanvas(210, { pad: { l: 92, r: 24, t: 20, b: 26 } });
  const msg = h('div', { style: { marginTop: '10px' } });

  const sl = slider('이상치 하나의 값', {
    min: 80, max: 900, step: 10, value: 100,
    onInput: (v) => { big = v; paint(); },
  });

  function paint() {
    const data = base.concat([big]);
    const mm = S.minmax(data);
    const st = S.standardize(data);
    const ctx = cv.begin();

    const lanes = [
      { nm: '최소-최대 정규화', vals: mm, lo: -0.05, hi: 1.05, color: COLORS.blue },
      { nm: '표준화', vals: st, lo: -3.2, hi: Math.max(3.2, Math.max(...st) + 0.3), color: COLORS.purple },
    ];
    lanes.forEach((ln, i) => {
      const y = cv.pad.t + 34 + i * 74;
      const sx = scale(ln.lo, ln.hi, cv.pad.l, cv.w - cv.pad.r);
      ctx.strokeStyle = COLORS.line; ctx.lineWidth = 1.5;
      ctx.beginPath(); ctx.moveTo(cv.pad.l, y); ctx.lineTo(cv.w - cv.pad.r, y); ctx.stroke();
      ctx.fillStyle = COLORS.soft; ctx.textAlign = 'center';
      ticks(ln.lo, ln.hi, 6).forEach((v) => ctx.fillText(String(Math.round(v * 100) / 100), sx(v), y + 14));
      ln.vals.forEach((v, k) => dot(ctx, sx(v), y - 12, k === ln.vals.length - 1 ? 8 : 6,
        k === ln.vals.length - 1 ? COLORS.red : ln.color, true));
      label(ctx, ln.nm, cv.pad.l - 10, y - 12, { align: 'right', bold: true, color: ln.color, size: 13 });
    });

    const mmSpread = Math.max(...mm.slice(0, -1)) - Math.min(...mm.slice(0, -1));
    clear(msg);
    add(msg, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip' }, `보통 값 9개가 최소-최대에서 차지하는 폭: ${fx(mmSpread, 3)} / 1`),
        h('span', { class: 'chip' }, `표준화에서 이상치의 z값: ${fx(st[st.length - 1], 2)}`)),
      mmSpread < 0.45
        ? note('bad', '이상치가 커질수록 최소-최대 정규화에서는 나머지 9개가 왼쪽 구석에 다닥다닥 뭉칩니다. '
          + '원래 45~78 사이에서 잘 퍼져 있던 차이가 거의 사라져 버립니다. '
          + '표준화 쪽은 여전히 서로 떨어져 있는 것이 보입니다.')
        : note('ok', '이상치가 아직 크지 않아 두 방법의 차이가 잘 보이지 않습니다. 슬라이더를 오른쪽 끝까지 밀어 보세요.'),
    ]);
  }

  drawNow(paint);
  window.addEventListener('resize', paint);

  return card('🔬 이상치가 있으면 어떻게 될까',
    h('div', { class: 'lead' }, '보통 값 9개(45~78)에 이상치 하나를 더했습니다. 그 값을 키우면서 두 방법을 견주어 보세요.'),
    sl.el, cv.el, msg,
    note('', h('b', {}, '학습지 문장 확인 '),
      '「표준화가 최소-최대 정규화보다는 상대적으로 이상치 영향을 덜 받는 편이다」 — ',
      '최소-최대는 식에 최댓값이 직접 들어가서 이상치가 곧 분모가 되지만, ',
      '표준화는 평균과 표준편차를 쓰므로 값 하나의 영향이 자료 개수만큼 나뉘어 옅어집니다.'));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '최소-최대 정규화를 하면 데이터의 범위는 얼마부터 얼마까지가 되나요? (예: 0~1)',
        answer: ['0~1', '0-1', '0에서1', '0~1사이'],
        explain: '(x − 최솟값) ÷ (최댓값 − 최솟값) 이므로 최솟값은 0, 최댓값은 1 이 됩니다.',
        width: 160,
      },
      {
        q: '표준화를 하면 평균은 얼마가 되나요?',
        answer: ['0'],
        explain: '평균 0, 표준편차 1 인 표준정규분포로 바뀝니다.',
        width: 120,
      },
      {
        q: '값이 20, 30, 50, 80 일 때 30 을 최소-최대 정규화하면?',
        check: (v) => Math.abs(Number(v) - (30 - 20) / (80 - 20)) < 0.005,
        answer: ['0.167'],
        hint: '(30 − 20) ÷ (80 − 20)',
        explain: '10 ÷ 60 ≈ 0.167',
        width: 140,
      },
      {
        q: '이상치의 영향을 상대적으로 덜 받는 쪽은?',
        type: 'choice',
        choices: ['최소-최대 정규화', '표준화'],
        answer: '표준화',
        explain: '최소-최대 정규화는 식에 최댓값이 그대로 들어가서 이상치에 크게 흔들립니다.',
      },
      {
        q: '스케일링을 하지 않으면, 수치가 큰 속성에 무엇이 있다고 판단해 학습에 잘못된 영향을 주나요?',
        answer: ['가중치'],
        explain: '단위가 큰 속성이 거리·손실 계산을 혼자 차지해 마치 더 중요한 속성인 것처럼 작용합니다.',
        width: 160,
      },
    ], { revealOnWrong: true }));
}
