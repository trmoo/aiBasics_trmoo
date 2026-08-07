/* ============================================================================
 * encoding.js — 학습지 5쪽 「4.6 인코딩 · 4.7 핵심 속성 추출」
 *
 *   ① 인코딩 실험실 : 같은 범주형 열을 레이블 / 원핫 두 방식으로 바꿔 표를 나란히 본다
 *   ② 잘못 쓰면 무슨 일이 : 순서 없는 범주에 레이블 인코딩을 하면 없던 크기 비교가 생긴다
 *   ③ 핵심 속성 추출 : 열을 하나씩 보며 남길지 뺄지 판정한다
 *
 * © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다.
 * 그 밖의 이용(재배포·2차 저작물·수업 외 목적)은 먼저 문의해 주세요.
 * 자세한 이용 범위는 이 저장소의 LICENSE 파일에 적어 두었습니다.
 * ========================================================================== */

import { h, add, clear, card, sheetHead, note, answer, answerBlock, quizSet, sortQuiz, table, pyBox, pillGroup } from '../../lib/ui.js';

/* 연습용 표 — 순서형 한 열(만족도)과 명목형 한 열(혈액형)을 함께 둔다 */
const SAMPLE = [
  { nm: '가', grade: '상', blood: 'A' },
  { nm: '나', grade: '하', blood: 'O' },
  { nm: '다', grade: '중', blood: 'AB' },
  { nm: '라', grade: '상', blood: 'B' },
  { nm: '마', grade: '하', blood: 'A' },
  { nm: '바', grade: '중', blood: 'O' },
];

/* 순서형은 뜻이 있는 순서대로, 명목형은 그냥 나온 순서대로 번호를 매긴다 */
const GRADE_ORDER = ['하', '중', '상'];
const BLOODS = ['A', 'B', 'AB', 'O'];

export function render(root) {
  add(root, sheetHead('학습지 5쪽', '인코딩과 핵심 속성 추출',
    ['[12인기02-03]'],
    [
      '범주형 데이터를 숫자로 바꾸는 두 방법을 구분해 쓸 수 있다.',
      '순서가 없는 범주에 레이블 인코딩을 쓰면 무엇이 잘못되는지 설명할 수 있다.',
      '모델에 넣을 속성을 고르는 다섯 가지 기준을 적용할 수 있다.',
    ]));

  root.append(lab());
  root.append(pitfallCard());
  root.append(featureCard());
  root.append(quizCard());
}

/* ─────────────────────────── 인코딩 실험실 ────────────────────────── */

function lab() {
  const out = h('div', {});
  let colId = 'grade';
  let method = 'label';

  const colPick = pillGroup([
    { id: 'grade', label: '만족도 (순서형: 하<중<상)' },
    { id: 'blood', label: '혈액형 (명목형)' },
  ], { value: 'grade', onPick: (v) => { colId = v; paint(); } });

  const mPick = pillGroup([
    { id: 'label', label: '레이블 인코딩' },
    { id: 'onehot', label: '원핫 인코딩' },
  ], { value: 'label', onPick: (v) => { method = v; paint(); } });

  function paint() {
    const isGrade = colId === 'grade';
    const cats = isGrade ? GRADE_ORDER : BLOODS;
    const label = isGrade ? '만족도' : '혈액형';
    const val = (r) => (isGrade ? r.grade : r.blood);

    clear(out);

    if (method === 'label') {
      const map = new Map(cats.map((c, i) => [c, i]));
      add(out, [
        h('h4', {}, `${label} → 레이블 인코딩`),
        h('div', { class: 'row tight' },
          cats.map((c, i) => h('span', { class: 'chip' }, `${c} → ${i}`))),
        table(['이름', label, `${label}_인코딩`],
          SAMPLE.map((r) => [r.nm, val(r), h('td', { class: 'filled' }, String(map.get(val(r))))])),
        h('div', { class: 'row tight' },
          h('span', { class: 'chip' }, `열 1개 → 열 ${1}개`),
          h('span', { class: 'chip' + (isGrade ? ' ok' : ' bad') },
            isGrade ? '✅ 순서형이라 알맞습니다' : '⚠️ 명목형에는 알맞지 않습니다')),
        isGrade
          ? note('ok', '하 < 중 < 상 이라는 진짜 순서가 0 < 1 < 2 로 그대로 옮겨졌습니다. '
            + '모델이 「상이 하보다 크다」고 이해해도 맞는 말입니다.')
          : note('bad', h('b', {}, '문제가 생겼습니다. '),
            'A=0, B=1, AB=2, O=3 이 되면 모델은 「O 가 A 보다 3만큼 크다」, 「AB 는 B 의 2배」 라고 계산합니다. '
            + '혈액형에는 그런 순서도 크기도 없는데 말입니다.'),
      ]);
    } else {
      add(out, [
        h('h4', {}, `${label} → 원핫 인코딩`),
        h('div', { class: 'lead' }, '해당하는 요소 하나만 1(True), 나머지는 모두 0(False) 으로 만듭니다.'),
        table(['이름', label].concat(cats.map((c) => `${label}_${c}`)),
          SAMPLE.map((r) => [r.nm, val(r)].concat(cats.map((c) => (
            val(r) === c
              ? h('td', { class: 'filled' }, '1')
              : h('td', { class: 'dim' }, '0')))))),
        h('div', { class: 'row tight' },
          h('span', { class: 'chip' }, `열 1개 → 열 ${cats.length}개`),
          h('span', { class: 'chip' + (isGrade ? ' warn' : ' ok') },
            isGrade ? '⚠️ 순서 정보가 사라집니다' : '✅ 명목형에 알맞습니다')),
        isGrade
          ? note('warn', '원핫으로 바꾸면 하·중·상 세 열이 서로 아무 관계 없는 것이 됩니다. '
            + '「상은 중보다 낫다」는 정보가 없어져 버립니다. 순서가 뜻을 가지는 자료에는 손해입니다.')
          : note('ok', '네 혈액형이 서로 완전히 대등해졌습니다. 어느 것도 다른 것보다 크지 않습니다. '
            + '명목형에는 이 방식이 맞습니다.'),
        note('warn', h('b', {}, '다만 — '), `범주가 ${cats.length}가지라 열이 ${cats.length}개로 늘었습니다. `
          + '만약 「좋아하는 가수」처럼 범주가 500가지라면 열이 500개가 됩니다. '
          + '이것을 차원이 폭발한다고 하며, 원핫 인코딩의 대표적인 약점입니다.'),
      ]);
    }
  }

  paint();

  return card('🔤 인코딩 실험실',
    h('div', { class: 'lead' },
      '인코딩은 ', answer('범주형'), ' 데이터를 숫자로 바꾸는 과정입니다. ',
      '모델은 숫자만 계산할 수 있으므로 반드시 거쳐야 합니다.'),
    h('div', { class: 'row' }, h('label', { class: 'field' }, '바꿀 열'), colPick.el),
    h('div', { class: 'row', style: { marginTop: '8px' } }, h('label', { class: 'field' }, '방법'), mPick.el),
    h('div', { style: { height: '8px' } }),
    out,
    pyBox([
      "# ① 레이블 인코딩 — 순서형에 알맞다",
      "df['만족도_enc'] = df['만족도'].map({'하': 0, '중': 1, '상': 2})",
      "",
      "from sklearn.preprocessing import LabelEncoder",
      "df['만족도_enc'] = LabelEncoder().fit_transform(df['만족도'])",
      "#   ↑ 주의: LabelEncoder 는 가나다순으로 번호를 매긴다. 뜻대로 하려면 map 을 쓰자.",
      "",
      "# ② 원핫 인코딩 — 명목형에 알맞다",
      "pd.get_dummies(df, columns=['혈액형'])",
    ].join('\n')));
}

/* ────────── 순서가 없는 범주에 레이블을 붙이면 생기는 일 ────────── */

function pitfallCard() {
  return card('⚠️ 어떤 인코딩을 언제 쓰나',
    table(['', '레이블 인코딩', '원핫 인코딩'], [
      [h('td', { style: { fontWeight: '800' } }, '하는 일'),
        h('td', { class: 'left' }, '범주에 0, 1, 2 … 차례로 숫자를 붙인다'),
        h('td', { class: 'left' }, '한 요소는 1, 나머지는 0 인 열을 범주 수만큼 만든다')],
      [h('td', { style: { fontWeight: '800' } }, '열의 개수'),
        h('td', {}, '1개 그대로'),
        h('td', {}, '범주 수만큼 늘어남')],
      [h('td', { style: { fontWeight: '800' } }, '알맞은 자료'),
        h('td', {}, '데이터에 순서(서열)가 있는 경우'),
        h('td', {}, '순서가 없는 범주형 데이터')],
      [h('td', { style: { fontWeight: '800' } }, '단점'),
        h('td', {}, '할당된 숫자에 따라 없던 크기 비교가 생김'),
        h('td', {}, '범주가 많으면 열이 너무 많아짐')],
    ]),
    h('h4', {}, '어느 인코딩을 쓸까 — 카드를 담아 보세요'),
    sortQuiz(
      [
        { id: 'label', label: '레이블 인코딩', hint: '순서가 있는 것' },
        { id: 'onehot', label: '원핫 인코딩', hint: '순서가 없는 것' },
      ],
      [
        { text: '학점 (A·B·C·D)', bin: 'label' },
        { text: '혈액형 (A·B·AB·O)', bin: 'onehot' },
        { text: '만족도 (상·중·하)', bin: 'label' },
        { text: '국적', bin: 'onehot' },
        { text: '옷 크기 (S·M·L·XL)', bin: 'label' },
        { text: '좋아하는 계절', bin: 'onehot' },
        { text: '영화 관람 등급 (전체·12·15·청불)', bin: 'label' },
        { text: '거주 지역 (시·도)', bin: 'onehot' },
      ]),
    answerBlock('💡 함정 문제 — 「요일」은 어느 쪽일까',
      h('p', {}, '월·화·수·목·금·토·일에는 순서가 있어 보입니다. 그래서 레이블 인코딩(월=0 … 일=6)을 하기 쉽습니다.'),
      h('p', {}, '그런데 이렇게 하면 「일요일(6)과 월요일(0)의 거리가 6」이 됩니다. ',
        '실제로는 붙어 있는 날인데 가장 먼 날이 되어 버리지요. ',
        '이런 자료를 ', h('b', {}, '순환형(cyclic)'), ' 이라 하고, 원핫 인코딩을 쓰거나 sin·cos 로 바꿔 넣습니다. ',
        '「순서가 있어 보인다」고 무조건 레이블 인코딩을 쓰면 안 되는 예입니다.')));
}

/* ─────────────────────── 핵심 속성 추출 ─────────────────────────── */

const FEATURES = [
  { nm: '주민등록번호', keep: false, why: '개인을 특정하는 정보이고 예측에 도움도 되지 않습니다. 개인정보 보호를 위해서도 반드시 뺍니다.', tag: '① 불필요한 속성 제거' },
  { nm: '학생 이름', keep: false, why: '예측에 쓸 정보가 없습니다. 이름으로 성적을 맞힐 수는 없지요.', tag: '① 불필요한 속성 제거' },
  { nm: '성별', keep: null, why: '문제의 성격에 따라 다릅니다. 건강 검진 예측이라면 필요하지만, 채용·대출 심사라면 차별을 만들 수 있어 빼는 것을 검토해야 합니다.', tag: '② 공정성 검토' },
  { nm: '키(cm)', keep: true, why: '수치형이고 예측에 쓸 만한 정보입니다.', tag: '남김' },
  { nm: '키(m)', keep: false, why: '키(cm)와 완전히 같은 정보입니다. 단위만 다를 뿐이라 중복입니다.', tag: '③ 중복 속성 분석' },
  { nm: '출석일수', keep: true, why: '결석일수와 짝이 되는 정보이지만, 둘 중 하나만 남기면 됩니다.', tag: '③ 중복 속성 분석' },
  { nm: '전 과목 평균', keep: true, why: '여러 열을 합쳐 새로 만든 속성입니다. 원래 없던 유용한 정보를 더한 것입니다.', tag: '⑤ 속성 추가' },
  { nm: '설문 응답 일시', keep: null, why: '보통은 필요 없지만, 「밤늦게 응답한 사람의 만족도가 다른가」를 보고 싶다면 시간대를 뽑아 쓸 수 있습니다.', tag: '④ 중요도 판별' },
];

function featureCard() {
  const out = h('div', {});
  const revealed = new Set();

  function paint() {
    clear(out);
    out.append(table(['속성', '남길까?', '왜'],
      FEATURES.map((f, i) => [
        h('td', { class: 'left', style: { fontWeight: '700' } }, f.nm),
        revealed.has(i)
          ? h('td', { class: f.keep === true ? 'filled' : f.keep === false ? 'na' : '' },
            f.keep === true ? '남긴다' : f.keep === false ? '뺀다' : '경우에 따라')
          : h('td', {}, h('button', {
            type: 'button', class: 'btn ghost tiny',
            onclick: () => { revealed.add(i); paint(); },
          }, '판정 보기')),
        revealed.has(i)
          ? h('td', { class: 'left' }, h('span', { class: 'chip' }, f.tag), ' ', f.why)
          : h('td', { class: 'dim' }, '먼저 스스로 생각해 보세요'),
      ])));
  }
  paint();

  return card('🎯 핵심 속성 추출 — 어떤 열을 모델에 넣을까',
    h('p', {}, h('b', {}, '핵심 속성'), ' 은 기계학습 모델의 학습 및 예측 성능에 중요한 영향을 미치는 속성입니다. ',
      '다섯 가지 기준으로 고릅니다.'),
    h('ol', { style: { paddingLeft: '24px' } },
      h('li', {}, '불필요한 속성 제거 — 주민등록번호, 이름, 학번 등'),
      h('li', {}, '공정성에 문제가 되는 속성이 있는지 검토 — 문제 성격에 따라 성별, 인종 등'),
      h('li', {}, '중복되는 속성이 없는지 분석'),
      h('li', {}, '주어진 속성의 중요도 판별'),
      h('li', {}, '더 필요한 속성이 없는지 검토하여 속성 추가')),
    h('h4', {}, '직접 판정해 보세요'),
    out,
    h('h4', {}, '무엇으로 중요도를 판별하나 — 학습지 정리'),
    table(['데이터', '방법'], [
      [h('td', { class: 'left' }, '정형 데이터 — 수치형'), h('td', {}, [answer('히트맵'), ' (상관계수로 목표값과의 관계를 본다)'])],
      [h('td', { class: 'left' }, '정형 데이터 — 범주형'), h('td', {}, [answer('산점도')])],
      [h('td', { class: 'left' }, '비정형 데이터'), h('td', {}, [answer('딥러닝'), ' 이 속성을 스스로 발견한다'])],
    ]),
    note('', h('b', {}, '비정형 데이터가 특별한 이유 '),
      '사진에서 「고양이인지 알아보는 데 중요한 속성」이 무엇인지 사람이 미리 적어 줄 수 없습니다. ',
      '귀 모양? 수염 개수? 딥러닝은 층을 거치며 그런 특징을 스스로 만들어 냅니다. ',
      '그래서 비정형 데이터에는 딥러닝을 씁니다.'));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '인코딩은 ( ? ) 데이터를 숫자로 변환하는 과정입니다.',
        answer: ['범주형', '범주형 데이터'],
        explain: '모델은 숫자만 다룰 수 있으므로 범주형은 반드시 숫자로 바꿔야 합니다.',
        width: 160,
      },
      {
        q: '범주형 데이터에 0, 1, 2 … 차례로 숫자를 할당하는 인코딩은?',
        answer: ['레이블', '레이블 인코딩', 'label', 'label encoding', '라벨', '라벨 인코딩', '순서형 인코딩', 'ordinal'],
        explain: '레이블 인코딩(label encoding, ordinal encoding)입니다.',
        width: 200,
      },
      {
        q: '1개의 요소만 1(True), 나머지는 0(False)로 만드는 인코딩은?',
        answer: ['원핫', '원핫 인코딩', 'one-hot', 'onehot', 'one hot encoding', '원-핫'],
        explain: '원핫 인코딩(one-hot encoding)입니다. 순서가 없는 범주형에 알맞습니다.',
        width: 200,
      },
      {
        q: '「혈액형 A=0, B=1, AB=2, O=3」 처럼 인코딩하면 생기는 문제는?',
        type: 'choice',
        choices: ['열이 너무 많아진다', '없던 크기 비교가 생긴다', '결측치가 늘어난다'],
        answer: '없던 크기 비교가 생긴다',
        explain: '모델이 「O 는 A 보다 3만큼 크다」고 계산해 버립니다. 혈액형에는 그런 순서가 없습니다.',
      },
      {
        q: '정형 데이터 중 수치형의 핵심 속성을 추출할 때 주로 쓰는 그림은?',
        answer: ['히트맵', 'heatmap'],
        explain: '상관계수를 색으로 보여 주는 히트맵으로 목표값과 관계가 큰 열을 찾습니다.',
        width: 160,
      },
      {
        q: '비정형 데이터의 속성을 스스로 발견하는 것은 무엇입니까?',
        answer: ['딥러닝', 'deep learning', '심층학습'],
        explain: '딥러닝은 층을 거치며 필요한 특징을 스스로 만들어 냅니다.',
        width: 160,
      },
    ], { revealOnWrong: true }));
}
