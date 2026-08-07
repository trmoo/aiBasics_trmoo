/* ============================================================================
 * ethics.js — 학습지 33~35쪽 「인공지능 윤리」
 *
 *   ① 윤리적 쟁점 다섯 가지와 사례 나누기
 *   ② 편향 실험실 — 학습 데이터가 한쪽으로 치우치면 실제로 무슨 일이 생기는지 계산으로
 *   ③ 모럴 머신 13 상황 — 고른 뒤 아홉 가지 축으로 우리 모둠의 성향을 그려 준다
 *   ④ 국내·해외 인공지능 윤리 기준
 *
 * 모럴 머신 활동은 「정답을 고르는 문제」가 아니라 「토의를 시작하기 위한 장치」다.
 * 화면에도 그렇게 적어 두었다. 선택 결과는 이 브라우저 안에만 있고 아무 데도 보내지 않는다.
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

import { h, add, clear, card, sheetHead, note, quizSet, sortQuiz, table, fx, slider } from '../../lib/ui.js';

export function render(root) {
  add(root, sheetHead('학습지 33~35쪽', '인공지능 윤리',
    ['[12인기05-01]', '[12인기05-02]'],
    [
      '인공지능의 윤리적 쟁점 다섯 가지를 사례와 연결해 설명할 수 있다.',
      '데이터 편향이 왜 공정성 문제를 일으키는지 수치로 설명할 수 있다.',
      '윤리적 딜레마 상황에서 자신의 판단 기준을 말하고 남의 기준과 견줄 수 있다.',
    ]));

  root.append(issueCard());
  root.append(biasCard());
  root.append(moralCard());
  root.append(standardCard());
  root.append(quizCard());
}

/* ───────────────────── ① 윤리적 쟁점 다섯 가지 ─────────────────── */

const ISSUES = [
  {
    id: 'trust', nm: '신뢰성',
    d: '인공지능의 크고 작은 실수는 인공지능 시스템에 대한 신뢰를 잃게 하고, 개인이나 특정 집단에 심각한 피해를 줄 수 있다.',
  },
  {
    id: 'fair', nm: '공정성',
    d: '사회적 편견이 반영된 부적절한 속성을 사용하거나 데이터의 양이 한쪽으로 치우쳐 균형이 맞지 않는 인공지능이 만들어지면, '
      + '특정 집단에 대한 부정확한 결과나 부당한 피해를 초래한다.',
  },
  {
    id: 'moral', nm: '윤리성',
    d: '도덕적·윤리적으로 어떤 결정을 해야 하는 난처한 상황을 윤리적 딜레마라고 한다. '
      + '인공지능을 개발하고 사용하는 인간이 윤리적 책임을 가지고 올바르게 사용하는 것이 중요하다.',
  },
  {
    id: 'trans', nm: '투명성',
    d: '사용자에게 인공지능의 의사결정과 그 과정을 설명할 수 없다면 신뢰를 잃을 뿐 아니라, '
      + '사고나 위험이 발생했을 때 책임을 명확히 할 수 없다.',
  },
  {
    id: 'safe', nm: '안전성',
    d: '자율성을 가진 인공지능이 잘못된 판단을 내리거나 오작동하지 않도록 안전하게 관리·제어할 수 있어야 하며, '
      + '외부의 악의적인 공격이나 위험에도 대비해야 한다.',
  },
];

function issueCard() {
  return card('⚖️ 인공지능의 윤리적 쟁점',
    h('p', {}, '인공지능 기술은 사회 여러 분야의 문제를 해결하고 생활을 편리하게 하지만, ',
      '원래 목적과 다르게 사용되거나 부작용이 나타납니다. ',
      '인공지능을 도입할 때 지켜야 할 사회적 규범과 도덕적 판단, 곧 ', h('b', {}, '인공지능 윤리'), ' 가 중요해진 까닭입니다.'),
    table(['쟁점', '무엇이 문제인가'],
      ISSUES.map((i) => [h('td', { style: { fontWeight: '800' } }, i.nm), h('td', { class: 'left' }, i.d)])),
    h('h4', {}, '이 사례는 어떤 쟁점일까'),
    sortQuiz(
      ISSUES.map((i) => ({ id: i.id, label: i.nm })),
      [
        { text: '채용 AI 가 특정 성별의 지원서를 계속 낮게 평가했다', bin: 'fair' },
        { text: '대출이 거절됐는데 은행도 이유를 설명하지 못한다', bin: 'trans' },
        { text: '자율주행차가 사고 직전 누구를 보호할지 정해야 한다', bin: 'moral' },
        { text: '의료 진단 AI 가 자꾸 틀려 병원이 쓰기를 그만뒀다', bin: 'trust' },
        { text: '표지판에 스티커를 붙였더니 자율주행차가 속도 제한을 잘못 읽었다', bin: 'safe' },
        { text: '음성 인식이 사투리를 쓰는 사람만 유독 못 알아듣는다', bin: 'fair' },
        { text: '추천 알고리즘이 왜 그 영상을 띄웠는지 아무도 모른다', bin: 'trans' },
        { text: '로봇 청소기가 갑자기 멈추지 않아 사람이 다칠 뻔했다', bin: 'safe' },
      ]),
    note('', h('b', {}, '한 사례가 여러 쟁점에 걸치기도 합니다. '),
      '예를 들어 「채용 AI 의 성별 편향」은 공정성 문제이면서, ',
      '왜 그런 점수를 줬는지 설명 못 한다면 투명성 문제이기도 합니다. ',
      '어느 쪽으로 담았든 왜 그렇게 생각했는지 말해 보는 것이 더 중요합니다.'));
}

/* ─────────────────── ② 편향 실험실 ────────────────────────────── */

function biasCard() {
  const TOTAL = 2000;
  let ratio = 50; // 그룹 A 의 비율(%)
  const out = h('div', {});

  /* 학습 데이터가 많을수록 성능이 오르지만, 어느 정도부터는 천천히 오르는 모양 */
  const accOf = (n) => 0.50 + 0.47 * (1 - Math.exp(-n / 220));

  const sl = slider('학습 데이터 중 그룹 A 의 비율', {
    min: 50, max: 99, value: 50, unit: '%',
    onInput: (v) => { ratio = v; paint(); },
  });

  function paint() {
    const nA = Math.round(TOTAL * ratio / 100);
    const nB = TOTAL - nA;
    const accA = accOf(nA);
    const accB = accOf(nB);
    const overall = (accA * nA + accB * nB) / TOTAL;
    const gap = accA - accB;

    clear(out);
    add(out, [
      h('div', {
        style: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(150px, 1fr))', gap: '10px' },
      },
      [
        ['그룹 A 학습 자료', `${nA}장`, ''],
        ['그룹 B 학습 자료', `${nB}장`, nB < 200 ? 'bad' : ''],
        ['그룹 A 정확도', (accA * 100).toFixed(1) + '%', 'ok'],
        ['그룹 B 정확도', (accB * 100).toFixed(1) + '%', gap > 0.15 ? 'bad' : ''],
        ['전체 정확도', (overall * 100).toFixed(1) + '%', ''],
        ['두 그룹의 격차', (gap * 100).toFixed(1) + '%p', gap > 0.15 ? 'bad' : ''],
      ].map(([k, v, kind]) => h('div', { class: 'stat' + (kind ? ' ' + kind : '') },
        h('div', { class: 'k' }, k), h('div', { class: 'v' }, v)))),

      h('div', { class: 'barlist', style: { marginTop: '14px' } },
        [['그룹 A', accA, '#1e6fd9'], ['그룹 B', accB, gap > 0.15 ? '#cf3030' : '#0f9d6e'], ['전체 평균', overall, '#5a6675']]
          .map(([nm, v, color]) => h('div', { class: 'r' },
            h('span', { class: 'nm' }, nm),
            h('span', { class: 'track' }, h('span', { class: 'fill', style: { width: (v * 100) + '%', background: color } })),
            h('span', { class: 'vl' }, (v * 100).toFixed(1) + '%')))),

      gap > 0.15
        ? note('bad', h('b', {}, '⚠️ 여기서 벌어지는 일 '),
          `전체 정확도는 ${(overall * 100).toFixed(1)}% 로 여전히 높습니다. 개발자가 이 숫자만 보고 「잘 만들었다」고 할 수 있습니다. `
          + `그런데 그룹 B 에 속한 사람에게는 ${(accB * 100).toFixed(1)}% 짜리 시스템입니다. `
          + '전체 평균이 소수 집단의 피해를 가려 버립니다. 이것이 데이터 편향이 공정성 문제가 되는 방식입니다.')
        : note('ok', '두 그룹의 자료가 균형을 이루고 있어 성능 차이가 크지 않습니다. 슬라이더를 오른쪽으로 밀어 보세요.'),
    ]);
  }
  paint();

  return card('📉 편향 실험실 — 데이터가 한쪽으로 치우치면',
    h('div', { class: 'lead' },
      `얼굴 인식 모델을 만든다고 합시다. 학습 자료 ${TOTAL}장을 두 집단(그룹 A, 그룹 B)에서 모읍니다. `,
      '한쪽 자료가 훨씬 많으면 어떤 일이 생길까요?'),
    sl.el,
    h('div', { style: { height: '10px' } }),
    out,
    note('warn', h('b', {}, '무엇을 해야 할까 '),
      '① 데이터를 모을 때부터 집단 균형을 확인한다 ② 전체 정확도뿐 아니라 ',
      h('b', {}, '집단별 정확도를 따로 재서 함께 보고한다'), ' ',
      '③ 부족한 집단의 자료를 더 모으거나 가중치를 준다. ',
      'Ⅰ 단원 「데이터 수집 시 편향성·공정성 검토」와 Ⅱ 단원 「불균형 데이터 처리」가 여기서 만납니다.'));
}

/* ───────────────────── ③ 모럴 머신 13 상황 ─────────────────────── */

const C = {
  man: { nm: '남성', ic: '👨', g: 'm', age: 'adult', sp: 'human' },
  woman: { nm: '여성', ic: '👩', g: 'f', age: 'adult', sp: 'human' },
  boy: { nm: '남자아이', ic: '👦', g: 'm', age: 'young', sp: 'human' },
  girl: { nm: '여자아이', ic: '👧', g: 'f', age: 'young', sp: 'human' },
  oldman: { nm: '노인남성', ic: '👴', g: 'm', age: 'old', sp: 'human' },
  oldwoman: { nm: '노인여성', ic: '👵', g: 'f', age: 'old', sp: 'human' },
  bigman: { nm: '비만남성', ic: '🧔', g: 'm', age: 'adult', sp: 'human', fit: 'large' },
  bigwoman: { nm: '비만여성', ic: '👩‍🦰', g: 'f', age: 'adult', sp: 'human', fit: 'large' },
  ceoM: { nm: '남성 경영자', ic: '👨‍💼', g: 'm', age: 'adult', sp: 'human', st: 'high' },
  ceoF: { nm: '여성 경영자', ic: '👩‍💼', g: 'f', age: 'adult', sp: 'human', st: 'high' },
  docM: { nm: '남성 의사', ic: '👨‍⚕️', g: 'm', age: 'adult', sp: 'human', st: 'high' },
  docF: { nm: '여성 의사', ic: '👩‍⚕️', g: 'f', age: 'adult', sp: 'human', st: 'high' },
  athM: { nm: '남성 운동선수', ic: '🏃', g: 'm', age: 'adult', sp: 'human', fit: 'fit' },
  athF: { nm: '여성 운동선수', ic: '🏃‍♀️', g: 'f', age: 'adult', sp: 'human', fit: 'fit' },
  mom: { nm: '산모', ic: '🤰', g: 'f', age: 'adult', sp: 'human' },
  homeless: { nm: '노숙자', ic: '🧍', age: 'adult', sp: 'human', st: 'low' },
  criminal: { nm: '범죄자', ic: '🦹', age: 'adult', sp: 'human', st: 'low' },
  baby: { nm: '아기', ic: '👶', age: 'young', sp: 'human' },
  dog: { nm: '개', ic: '🐕', sp: 'pet' },
  cat: { nm: '고양이', ic: '🐈', sp: 'pet' },
};

/* 13 상황 — straight(직진) / left(좌회전) 각각에서 희생되는 쪽 */
const SCENES = [
  {
    q: '어느 쪽이든 반드시 한쪽은 사망합니다. 어느 쪽을 살릴까요?',
    straight: { who: ['man', 'woman', 'boy', 'girl', 'oldman'], tag: '보행자 5명' },
    left: { who: ['man'], tag: '보행자 1명' },
    probe: ['count'],
  },
  {
    q: '직진하면 벽에 부딪혀 차 안의 탑승자가, 좌회전하면 보행자가 사망합니다.',
    straight: { who: ['man', 'woman', 'boy'], tag: '탑승자 3명 (벽 충돌)', passenger: true },
    left: { who: ['man', 'woman', 'boy'], tag: '보행자 3명' },
    probe: ['passenger'],
  },
  {
    q: '직진 쪽 보행자는 빨간불에 무단횡단 중이고, 좌회전 쪽 보행자는 신호를 지키고 있습니다.',
    straight: { who: ['man', 'woman', 'boy'], tag: '무단횡단 보행자 3명' },
    left: { who: ['man', 'woman', 'boy'], tag: '신호를 지킨 보행자 3명', lawful: true },
    probe: ['law'],
  },
  {
    q: '양쪽이 똑같습니다. 그래도 핸들을 꺾겠습니까?',
    straight: { who: ['man', 'woman', 'oldman'], tag: '보행자 3명 (그대로 직진)' },
    left: { who: ['man', 'woman', 'oldman'], tag: '보행자 3명 (핸들을 꺾음)' },
    probe: ['intervention'],
  },
  {
    q: '한쪽은 남성들, 다른 쪽은 여성들입니다.',
    straight: { who: ['man', 'man', 'boy'], tag: '남성 쪽 3명' },
    left: { who: ['woman', 'woman', 'girl'], tag: '여성 쪽 3명' },
    probe: ['gender'],
  },
  {
    q: '한쪽은 사람, 다른 쪽은 반려동물입니다.',
    straight: { who: ['man', 'woman'], tag: '사람 2명' },
    left: { who: ['dog', 'dog', 'cat'], tag: '반려동물 3마리' },
    probe: ['species'],
  },
  {
    q: '한쪽은 어린이, 다른 쪽은 노인입니다.',
    straight: { who: ['boy', 'girl'], tag: '어린이 2명' },
    left: { who: ['oldman', 'oldwoman'], tag: '노인 2명' },
    probe: ['age'],
  },
  {
    q: '한쪽은 운동선수, 다른 쪽은 비만인 사람입니다.',
    straight: { who: ['athM', 'athF'], tag: '운동선수 2명' },
    left: { who: ['bigman', 'bigwoman'], tag: '비만인 2명' },
    probe: ['fitness'],
  },
  {
    q: '한쪽은 의사와 경영자, 다른 쪽은 노숙자와 범죄자입니다.',
    straight: { who: ['docM', 'ceoF'], tag: '의사·경영자 2명' },
    left: { who: ['homeless', 'criminal'], tag: '노숙자·범죄자 2명' },
    probe: ['social'],
  },
  {
    q: '사람 한 명과 개 다섯 마리입니다.',
    straight: { who: ['man'], tag: '사람 1명' },
    left: { who: ['dog', 'dog', 'dog', 'dog', 'dog'], tag: '개 5마리' },
    probe: ['species', 'count'],
  },
  {
    q: '아기와 산모, 그리고 노인 세 명입니다.',
    straight: { who: ['baby', 'mom'], tag: '아기·산모 2명' },
    left: { who: ['oldman', 'oldwoman', 'oldman'], tag: '노인 3명' },
    probe: ['age', 'count'],
  },
  {
    q: '직진하면 탑승자 한 명이, 좌회전하면 보행자 네 명이 사망합니다.',
    straight: { who: ['man'], tag: '탑승자 1명 (벽 충돌)', passenger: true },
    left: { who: ['man', 'woman', 'oldwoman', 'boy'], tag: '보행자 4명' },
    probe: ['passenger', 'count'],
  },
  {
    q: '무단횡단하는 다섯 명과 신호를 지킨 한 명입니다.',
    straight: { who: ['man', 'woman', 'boy', 'girl', 'oldman'], tag: '무단횡단 보행자 5명' },
    left: { who: ['man'], tag: '신호를 지킨 보행자 1명', lawful: true },
    probe: ['law', 'count'],
  },
];

/* 아홉 가지 분석 축 — 학습지 35쪽 [3] 의 항목 그대로 */
const AXES = [
  { id: 'count', nm: '1. 희생 숫자의 중요도', lo: '중요하지 않음', hi: '매우 중요함' },
  { id: 'passenger', nm: '2. 승객 보호 선호도', lo: '중요하지 않음', hi: '매우 중요함' },
  { id: 'law', nm: '3. 법규 준수 여부의 선호도', lo: '중요하지 않음', hi: '매우 중요함' },
  { id: 'intervention', nm: '4. 개입에 대한 회피 선호도', lo: '중요하지 않음', hi: '매우 중요함' },
  { id: 'gender', nm: '5. 성별 선호도', lo: '남성', hi: '여성' },
  { id: 'species', nm: '6. 종에 대한 선호도', lo: '인간', hi: '애완동물' },
  { id: 'age', nm: '7. 연령 선호도', lo: '젊은이', hi: '노인' },
  { id: 'fitness', nm: '8. 체력 선호도', lo: '건강인', hi: '비만인' },
  { id: 'social', nm: '9. 사회적 가치관 선호도', lo: '높음', hi: '낮음' },
];

function moralCard() {
  /* choice[i] = 'straight' | 'left' | null — 「그쪽으로 간다 = 그쪽을 희생시킨다」 */
  let choice = new Array(SCENES.length).fill(null);
  let idx = 0;
  const body = h('div', {});
  const result = h('div', { style: { marginTop: '16px' } });

  function group(g) {
    return h('div', {
      style: {
        flex: '1', minWidth: '230px', padding: '14px', borderRadius: '12px',
        border: '2px solid var(--line)', background: '#fbfcfe',
      },
    },
    h('div', { style: { fontWeight: '800', color: 'var(--ink-soft)', marginBottom: '8px' } }, g.tag),
    h('div', { class: 'row tight' },
      g.who.map((k) => h('div', {
        style: { textAlign: 'center', minWidth: '62px' },
        title: C[k].nm,
      },
      h('div', { style: { fontSize: '2.1rem', lineHeight: '1.1' } }, C[k].ic),
      h('div', { style: { fontSize: '0.78rem', color: 'var(--ink-soft)' } }, C[k].nm)))),
    g.lawful ? h('div', { class: 'chip ok', style: { marginTop: '8px' } }, '신호를 지킴') : null,
    g.passenger ? h('div', { class: 'chip warn', style: { marginTop: '8px' } }, '차 안의 탑승자') : null);
  }

  function paint() {
    const s = SCENES[idx];
    clear(body);
    add(body, [
      h('div', { class: 'row tight' },
        SCENES.map((_, i) => h('button', {
          type: 'button',
          class: 'btn ' + (i === idx ? '' : 'ghost') + ' tiny',
          style: choice[i] ? { borderColor: 'var(--ok)', color: i === idx ? '#fff' : 'var(--ok)' } : {},
          onclick: () => { idx = i; paint(); },
        }, String(i + 1)))),
      h('div', { class: 'note', style: { marginTop: '12px' } },
        h('b', {}, `상황 ${idx + 1} / ${SCENES.length} — `), s.q),
      h('div', { class: 'row top', style: { marginTop: '12px', gap: '14px', alignItems: 'stretch' } },
        h('div', { style: { flex: '1', minWidth: '230px' } },
          group(s.straight),
          h('button', {
            type: 'button',
            class: 'btn ' + (choice[idx] === 'straight' ? '' : 'ghost'),
            style: { width: '100%', marginTop: '10px' },
            onclick: () => { choice[idx] = 'straight'; next(); },
          }, choice[idx] === 'straight' ? '✔ 이쪽을 희생시킨다 (직진)' : '직진한다')),
        h('div', { style: { flex: '1', minWidth: '230px' } },
          group(s.left),
          h('button', {
            type: 'button',
            class: 'btn ' + (choice[idx] === 'left' ? '' : 'ghost'),
            style: { width: '100%', marginTop: '10px' },
            onclick: () => { choice[idx] = 'left'; next(); },
          }, choice[idx] === 'left' ? '✔ 이쪽을 희생시킨다 (좌회전)' : '좌회전한다'))),
      h('div', { class: 'row', style: { marginTop: '12px' } },
        h('button', { type: 'button', class: 'btn gray small', onclick: () => { idx = Math.max(0, idx - 1); paint(); } }, '◀ 앞 상황'),
        h('button', { type: 'button', class: 'btn gray small', onclick: () => { idx = Math.min(SCENES.length - 1, idx + 1); paint(); } }, '다음 상황 ▶'),
        h('span', { class: 'chip' }, `${choice.filter(Boolean).length} / ${SCENES.length} 선택함`),
        h('button', {
          type: 'button', class: 'btn small',
          onclick: analyze,
        }, '📊 우리 모둠의 성향 보기'),
        h('button', {
          type: 'button', class: 'btn gray small',
          onclick: () => { choice = new Array(SCENES.length).fill(null); idx = 0; clear(result); paint(); },
        }, '처음부터')),
    ]);
  }

  function next() {
    if (idx < SCENES.length - 1) idx++;
    paint();
    if (choice.every(Boolean)) analyze();
  }

  /** 고른 결과를 아홉 축으로 정리한다 */
  function analyze() {
    const acc = {};
    AXES.forEach((a) => { acc[a.id] = { n: 0, sum: 0 }; });

    SCENES.forEach((s, i) => {
      const pick = choice[i];
      if (!pick) return;
      const saved = pick === 'straight' ? s.left : s.straight;   // 「그쪽으로 간다」 = 반대쪽을 살린다
      const killed = pick === 'straight' ? s.straight : s.left;

      const add1 = (id, v) => { acc[id].n++; acc[id].sum += v; };

      s.probe.forEach((p) => {
        if (p === 'count') {
          if (saved.who.length !== killed.who.length) add1('count', saved.who.length > killed.who.length ? 1 : 0);
        } else if (p === 'passenger') {
          const savedIsPass = !!saved.passenger;
          add1('passenger', savedIsPass ? 1 : 0);
        } else if (p === 'law') {
          add1('law', saved.lawful ? 1 : 0);
        } else if (p === 'gender') {
          const f = saved.who.filter((k) => C[k].g === 'f').length;
          const m = saved.who.filter((k) => C[k].g === 'm').length;
          if (f !== m) add1('gender', f > m ? 1 : 0);
        } else if (p === 'species') {
          const hum = saved.who.filter((k) => C[k].sp === 'human').length;
          const pet = saved.who.filter((k) => C[k].sp === 'pet').length;
          if (hum !== pet) add1('species', pet > hum ? 1 : 0);
        } else if (p === 'age') {
          const y = saved.who.filter((k) => C[k].age === 'young').length;
          const o = saved.who.filter((k) => C[k].age === 'old').length;
          if (y !== o) add1('age', o > y ? 1 : 0);
        } else if (p === 'fitness') {
          const fit = saved.who.filter((k) => C[k].fit === 'fit').length;
          const lg = saved.who.filter((k) => C[k].fit === 'large').length;
          if (fit !== lg) add1('fitness', lg > fit ? 1 : 0);
        } else if (p === 'social') {
          const hi = saved.who.filter((k) => C[k].st === 'high').length;
          const lo = saved.who.filter((k) => C[k].st === 'low').length;
          if (hi !== lo) add1('social', lo > hi ? 1 : 0);
        }
      });

      // 개입 회피는 모든 상황에서 잰다 — 직진(핸들을 꺾지 않음)을 고른 비율
      acc.intervention.n++;
      acc.intervention.sum += pick === 'straight' ? 1 : 0;
    });

    /* 가장 많이 살아남은 / 희생당한 캐릭터 */
    const savedCnt = {}; const killedCnt = {};
    SCENES.forEach((s, i) => {
      const pick = choice[i];
      if (!pick) return;
      const saved = pick === 'straight' ? s.left : s.straight;
      const killed = pick === 'straight' ? s.straight : s.left;
      saved.who.forEach((k) => { savedCnt[k] = (savedCnt[k] || 0) + 1; });
      killed.who.forEach((k) => { killedCnt[k] = (killedCnt[k] || 0) + 1; });
    });
    const top = (obj) => Object.entries(obj).sort((a, b) => b[1] - a[1]).slice(0, 4);

    clear(result);
    add(result, [
      h('h4', {}, '📊 우리 모둠의 판단 성향'),
      choice.filter(Boolean).length < SCENES.length
        ? note('warn', `아직 ${SCENES.length - choice.filter(Boolean).length}개 상황을 고르지 않았습니다. 지금까지 고른 것만으로 그린 결과입니다.`)
        : null,
      h('div', {}, AXES.map((a) => {
        const d = acc[a.id];
        const v = d.n ? d.sum / d.n : null;
        return h('div', { style: { marginBottom: '14px' } },
          h('div', { class: 'row tight', style: { justifyContent: 'space-between' } },
            h('b', {}, a.nm),
            h('span', { class: 'chip' }, d.n ? `상황 ${d.n}개로 판단` : '해당 상황 없음')),
          h('div', {
            style: {
              position: 'relative', height: '26px', marginTop: '4px', borderRadius: '8px',
              background: 'linear-gradient(90deg, #dcebff, #f4f6fa 50%, #ffe0ec)',
              border: '1px solid var(--line)',
            },
          }, v === null ? null : h('div', {
            style: {
              position: 'absolute', left: `calc(${v * 100}% - 4px)`, top: '-4px',
              width: '8px', height: '34px', background: 'var(--ink)', borderRadius: '4px',
            },
          })),
          h('div', { class: 'row', style: { justifyContent: 'space-between', fontSize: '0.85rem', color: 'var(--ink-soft)' } },
            h('span', {}, a.lo), h('span', {}, a.hi)));
      })),
      h('h4', {}, '가장 많이 살려 준 / 희생당한 캐릭터'),
      h('div', { class: 'grid2' },
        h('div', {},
          h('div', { style: { fontWeight: '800', color: 'var(--ok)', marginBottom: '6px' } }, '많이 살려 준 쪽'),
          h('div', { class: 'row tight' },
            top(savedCnt).map(([k, n]) => h('span', { class: 'chip ok' }, `${C[k].ic} ${C[k].nm} ${n}회`)))),
        h('div', {},
          h('div', { style: { fontWeight: '800', color: 'var(--bad)', marginBottom: '6px' } }, '많이 희생당한 쪽'),
          h('div', { class: 'row tight' },
            top(killedCnt).map(([k, n]) => h('span', { class: 'chip bad' }, `${C[k].ic} ${C[k].nm} ${n}회`))))),
      note('warn', h('b', {}, '이 그래프는 「채점 결과」가 아닙니다. '),
        '옳고 그름을 가리는 표가 아니라, ', h('b', {}, '내가 무엇을 기준으로 삼고 있었는지'),
        ' 를 스스로 보게 하는 거울입니다. ',
        '모둠원끼리 막대의 위치가 다르다면, 그 차이가 어디서 왔는지 이야기해 보세요.'),
      note('bad', h('b', {}, '가장 중요한 물음 '),
        '「사회적 가치관 선호도」 막대가 한쪽으로 크게 기울었다면, ',
        '그 기준을 실제 자율주행차에 프로그램으로 넣어도 될까요? ',
        '누가 「가치가 높은 사람」인지 누가 정합니까? ',
        '모럴 머신 실험이 세계적으로 던진 질문이 바로 이것입니다.'),
    ]);
    result.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  paint();

  return card('🚗 모럴 머신 — 자율주행차는 어떻게 판단해야 할까',
    h('div', { class: 'lead' },
      h('b', {}, '<조건> '),
      '자율주행 자동차는 브레이크가 고장 나 멈출 수 없습니다. 직진하거나 좌측으로 꺾어야만 하고, ',
      '판단 준거에 따라 반드시 한쪽은 모두 사망합니다.'),
    note('bad', h('b', {}, '먼저 알아 둘 것 — 이것은 「정답 맞히기」가 아닙니다. '),
      '어느 쪽을 골라도 사람이 죽는 상황이라 옳은 답이 없습니다. ',
      '이 활동의 목적은 ', h('b', {}, '내가 무의식중에 어떤 기준을 쓰고 있는지 드러내어 함께 이야기하는 것'), ' 입니다. ',
      '그리고 실제 자율주행차는 이런 식으로 「누구를 죽일지」를 미리 프로그래밍하지 않습니다. ',
      '사고를 아예 만들지 않는 것, 그리고 어떤 경우에도 최대한 감속하는 것이 우선입니다.'),
    note('', '고른 내용은 이 브라우저 안에만 있고 어디로도 보내지 않으며, 새로고침하면 사라집니다.'),
    h('div', { style: { height: '10px' } }),
    body, result);
}

/* ─────────────────── ④ 국내·해외 윤리 기준 ─────────────────────── */

function standardCard() {
  const TEN = ['인권 보장', '프라이버시 보호', '다양성 존중', '침해 금지', '공공성', '연대성', '데이터 관리', '책임성', '안전성', '투명성'];

  return card('📜 인공지능과 공존을 위한 노력',
    h('p', {}, '인공지능과 공존하려면 인간과 인공지능의 강점을 이해하고 인공지능을 적절하게 활용해야 합니다. ',
      '그 노력의 하나로 국내외에서 인공지능의 윤리적 기준을 마련하고 있습니다.'),
    h('h4', {}, '해외 — 유럽 연합'),
    h('ul', { style: { paddingLeft: '22px' } },
      h('li', {}, '2021년 유럽 연합집행위원회가 인공지능 법안을 발표하고, 2023년 유럽 연합 의회가 수정안을 채택'),
      h('li', {}, '인공지능을 ', h('b', {}, '위험 수준에 따라 4단계'), ' 로 분류하고 단계에 따라 의무 사항을 규정')),
    table(['위험 등급', '어떤 것', '규제'], [
      [h('td', { style: { fontWeight: '800', background: '#fdeaea' } }, '허용 불가 위험'),
        h('td', { class: 'left' }, '사람의 행동을 조종하는 시스템, 사회적 점수 매기기 등'),
        h('td', { class: 'left' }, '금지')],
      [h('td', { style: { fontWeight: '800', background: '#fff1e0' } }, '고위험'),
        h('td', { class: 'left' }, '채용, 대출 심사, 의료기기, 법 집행 등 사람의 삶에 큰 영향을 주는 것'),
        h('td', { class: 'left' }, '엄격한 요구 사항 (데이터 품질·문서화·사람의 감독)')],
      [h('td', { style: { fontWeight: '800', background: '#fffbe6' } }, '제한적 위험'),
        h('td', { class: 'left' }, '챗봇, 딥페이크'),
        h('td', { class: 'left' }, '투명성 의무 (AI 라는 사실을 알려야 함)')],
      [h('td', { style: { fontWeight: '800', background: '#eefaf4' } }, '최소 위험'),
        h('td', { class: 'left' }, '스팸 필터, 게임 AI'),
        h('td', { class: 'left' }, '별도 규제 없음')],
    ]),
    h('h4', {}, '국내 — 「인공지능(AI) 윤리 기준」 (2020년 12월)'),
    h('p', {}, '바람직한 인공지능 개발·활용 방향을 제시하기 위해 ', h('b', {}, '사람이 중심이 되는'), ' 인공지능 윤리 기준을 제시했습니다.'),
    h('div', { class: 'row tight' },
      h('span', { class: 'chip on' }, '3대 원칙 — 인간 존엄성 · 사회의 공공선 · 기술의 합목적성')),
    h('div', { class: 'row tight', style: { marginTop: '8px' } },
      TEN.map((t, i) => h('span', { class: 'chip' }, `${i + 1}. ${t}`))),
    note('', h('b', {}, '외우는 요령 '),
      '10대 요건은 크게 「사람을 지키는 것(인권 보장·프라이버시 보호·다양성 존중·침해 금지)」, ',
      '「사회를 지키는 것(공공성·연대성)」, ',
      '「기술을 제대로 만드는 것(데이터 관리·책임성·안전성·투명성)」으로 묶어 보면 기억하기 쉽습니다.'));
}

/* ─────────────────────────── 문제 ──────────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 확인 문제',
    quizSet([
      {
        q: '데이터의 양이 한쪽으로 치우쳐 특정 집단에 부당한 피해를 주는 문제는 어떤 쟁점인가요?',
        answer: ['공정성'],
        explain: '사회적 편견이 반영된 속성을 쓰거나 데이터가 불균형할 때 생깁니다.',
        width: 160,
      },
      {
        q: 'AI 의 의사결정 과정을 설명할 수 없어 책임 소재를 가릴 수 없는 문제는?',
        answer: ['투명성'],
        explain: '설명할 수 없으면 신뢰를 잃고, 사고가 났을 때 책임도 물을 수 없습니다.',
        width: 160,
      },
      {
        q: '도덕적·윤리적으로 어떤 결정을 해야 하는 난처한 상황을 무엇이라 하나요?',
        answer: ['윤리적 딜레마', '윤리적딜레마', '딜레마'],
        explain: '모럴 머신의 상황들이 바로 윤리적 딜레마입니다.',
        width: 200,
      },
      {
        q: '유럽 연합의 인공지능 규제 법안은 위험 수준을 몇 단계로 분류하나요?',
        answer: ['4', '4단계', '네 단계'],
        explain: '허용 불가 / 고위험 / 제한적 위험 / 최소 위험의 4단계입니다.',
        width: 120,
      },
      {
        q: '국내 「인공지능 윤리 기준」은 몇 년 몇 월에 제시되었나요? (예: 2020년 12월)',
        answer: ['2020년 12월', '2020.12', '2020년12월', '202012'],
        explain: '사람이 중심이 되는 인공지능 윤리 기준으로, 3대 원칙과 10대 요건을 담고 있습니다.',
        width: 200,
      },
      {
        q: '10대 요건에 들어가지 않는 것은?',
        type: 'choice',
        choices: ['프라이버시 보호', '책임성', '수익성'],
        answer: '수익성',
        explain: '인권 보장, 프라이버시 보호, 다양성 존중, 침해 금지, 공공성, 연대성, 데이터 관리, 책임성, 안전성, 투명성 열 가지입니다.',
      },
    ], { revealOnWrong: true }));
}
