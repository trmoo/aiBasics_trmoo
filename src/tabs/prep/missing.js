/* ============================================================================
 * missing.js — 학습지 4쪽 「4.1~4.2 결측치와 그 처리」
 *
 * 결측치가 섞인 표를 놓고, 처리 방법을 눌러 표가 실제로 어떻게 바뀌는지 본다.
 *   제거 : 행 단위 / 열 단위      → 몇 줄이 사라지는지, 손실률이 얼마인지 함께 표시
 *   대체 : 평균 / 중앙값 / 최빈값  → 채운 칸을 초록으로 표시
 *
 * © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다.
 * 그 밖의 이용(재배포·2차 저작물·수업 외 목적)은 먼저 문의해 주세요.
 * 자세한 이용 범위는 이 저장소의 LICENSE 파일에 적어 두었습니다.
 * ========================================================================== */

import { h, add, clear, card, sheetHead, note, answer, answerBlock, quizSet, table, pyBox, fx } from '../../lib/ui.js';
import * as S from '../../lib/stats.js';

/* 결측치가 섞인 연습용 표 (null 이 결측치).
   「0 은 결측치가 아니다」를 보여 주려고 결석일수에 0 을 일부러 넣어 두었다. */
const COLS = [
  { id: 'name', label: '학생', kind: 'id' },
  { id: 'height', label: '키(cm)', kind: 'num' },
  { id: 'weight', label: '몸무게(kg)', kind: 'num' },
  { id: 'absent', label: '결석일수', kind: 'num' },
  { id: 'club', label: '동아리', kind: 'cat' },
  { id: 'score', label: '수학점수', kind: 'num' },
];

const RAW = [
  ['가', 168, 58, 0, '과학', 78],
  ['나', 172, null, 2, '과학', 85],
  ['다', null, 61, 0, '음악', 66],
  ['라', 159, 50, 1, null, 91],
  ['마', 175, 70, null, '과학', null],
  ['바', 163, 55, 0, '체육', 73],
  ['사', null, null, 3, '음악', 58],
  ['아', 170, 64, 0, '과학', 88],
  ['자', 166, 57, 1, '체육', 71],
  ['차', 181, 76, null, null, 95],
  ['카', 158, 49, 0, '음악', 62],
  ['타', 174, 68, 2, '과학', 80],
];

const rows = () => RAW.map((r) => r.slice());

export function render(root) {
  add(root, sheetHead('학습지 4쪽', '결측치 — 값이 비어 있을 때',
    ['[12인기02-03]'],
    [
      '결측치가 무엇이고 왜 그대로 두면 안 되는지 설명할 수 있다.',
      '제거와 대체 중 어느 쪽이 알맞은지 상황에 따라 고를 수 있다.',
      '수치형과 범주형에 서로 다른 대푯값을 쓰는 까닭을 설명할 수 있다.',
    ]));

  root.append(conceptCard());
  root.append(lab());
  root.append(chooseCard());
  root.append(quizCard());
}

/* ───────────────────────────── 개념 정리 ───────────────────────────── */

function conceptCard() {
  return card('📖 결측치란',
    h('p', {}, '데이터에 값이 없는 것을 ', h('b', {}, '결측치(missing value)'), ' 라고 합니다. ',
      'N/A, NULL, NaN 등으로 표시됩니다.'),
    note('bad', h('b', {}, '⚠️ 0 은 결측치가 아닙니다. '),
      '「결석일수 0일」은 「0일 결석했다」는 분명한 정보입니다. ',
      '반대로 「몸무게 0kg」처럼 있을 수 없는 0 이 보이면, 그것은 결측치를 0 으로 잘못 채워 놓은 것일 수 있으니 의심해야 합니다.'),
    h('h4', {}, '왜 그냥 두면 안 되나요'),
    h('p', {}, '결측치가 남아 있으면 그 뒤의 데이터 분석과 AI 모델링을 진행할 수 없습니다. ',
      '대부분의 계산(평균, 거리, 행렬 곱)이 「값이 없음」을 다루지 못하기 때문입니다.'),
    h('h4', {}, '두 가지 처리 방법'),
    table(['방법', '언제 쓰나', '문제점'], [
      [h('td', { style: { fontWeight: '800' } }, '1) 제거 (drop)'),
        h('td', { class: 'left' }, ['데이터가 충분히 많을 때 / 결측치가 대세에 큰 영향을 주지 않을 때 / 결측치 비중이 적을 때']),
        h('td', { class: 'left' }, [answer('데이터 손실'), ' 이 반드시 생겨 데이터의 특성을 모두 반영하지 못할 수 있음'])],
      [h('td', { style: { fontWeight: '800' } }, '2) 대체 (fill)'),
        h('td', { class: 'left' }, '데이터가 충분하지 않을 때 / 어떻게든 채워 최대한 모든 데이터를 학습시키고 싶을 때'),
        h('td', { class: 'left' }, '없던 값을 만들어 넣는 것이라 분포가 실제보다 좁아질 수 있음')],
    ]),
    h('h4', {}, '무엇으로 대체하나'),
    table(['자료 유형', '대체값'], [
      ['수치형 데이터', h('td', { class: 'left' }, [answer('평균값'), ' · ', answer('중앙값'), ' · 최빈값 등의 대푯값 / 상관관계나 예측 모델의 예측값'])],
      ['범주형 데이터', h('td', { class: 'left' }, [answer('최빈값'), ' / 전체적으로 비슷한 특성을 가지는 유사 벡터값'])],
    ]));
}

/* ───────────────────────────── 실험실 ─────────────────────────────── */

function lab() {
  const out = h('div', {});
  const summary = h('div', { class: 'row', style: { marginTop: '12px' } });
  let mode = 'raw';

  const MODES = [
    { id: 'raw', label: '원본 (아무것도 안 함)' },
    { id: 'dropRow', label: '① 행 단위 제거' },
    { id: 'dropCol', label: '② 열 단위 제거' },
    { id: 'mean', label: '③ 평균값으로 대체' },
    { id: 'median', label: '④ 중앙값으로 대체' },
    { id: 'mode', label: '⑤ 최빈값으로 대체' },
  ];

  function apply() {
    let data = rows();
    let cols = COLS.slice();
    const filled = new Set(); // '행,열' 로 채운 칸 표시
    let removedRows = 0;
    let removedCols = [];

    const numIdx = COLS.map((c, i) => (c.kind === 'num' ? i : -1)).filter((i) => i >= 0);
    const catIdx = COLS.map((c, i) => (c.kind === 'cat' ? i : -1)).filter((i) => i >= 0);

    if (mode === 'dropRow') {
      const keep = data.filter((r) => r.every((v) => v !== null));
      removedRows = data.length - keep.length;
      data = keep;
    } else if (mode === 'dropCol') {
      const bad = COLS.map((c, i) => (data.some((r) => r[i] === null) ? i : -1)).filter((i) => i >= 0);
      removedCols = bad.map((i) => COLS[i].label);
      cols = COLS.filter((_, i) => !bad.includes(i));
      data = data.map((r) => r.filter((_, i) => !bad.includes(i)));
    } else if (mode !== 'raw') {
      // 수치형은 고른 대푯값으로, 범주형은 언제나 최빈값으로 채운다
      numIdx.forEach((i) => {
        const vals = data.map((r) => r[i]).filter((v) => v !== null);
        const rep = mode === 'mean' ? S.mean(vals) : mode === 'median' ? S.median(vals) : S.mode(vals).values[0];
        data.forEach((r, ri) => {
          if (r[i] === null) { r[i] = Math.round(rep * 10) / 10; filled.add(`${ri},${i}`); }
        });
      });
      catIdx.forEach((i) => {
        const vals = data.map((r) => r[i]).filter((v) => v !== null);
        const cnt = new Map();
        vals.forEach((v) => cnt.set(v, (cnt.get(v) || 0) + 1));
        let best = null; let bc = -1;
        cnt.forEach((c, v) => { if (c > bc) { bc = c; best = v; } });
        data.forEach((r, ri) => {
          if (r[i] === null) { r[i] = best; filled.add(`${ri},${i}`); }
        });
      });
    }

    /* 표 그리기 */
    const trs = data.map((r, ri) => r.map((v, ci) => {
      if (v === null) return h('td', { class: 'na' }, 'NaN');
      if (filled.has(`${ri},${ci}`)) return h('td', { class: 'filled' }, String(v));
      return h('td', {}, String(v));
    }));

    clear(out);
    out.append(table(cols.map((c) => c.label), trs, { compact: true }));

    /* 요약 */
    const totalCells = RAW.length * COLS.length;
    const naCells = RAW.reduce((s, r) => s + r.filter((v) => v === null).length, 0);
    const naRows = RAW.filter((r) => r.some((v) => v === null)).length;

    clear(summary);
    const chips = [
      h('span', { class: 'chip' }, `원본 ${RAW.length}행 × ${COLS.length}열`),
      h('span', { class: 'chip bad' }, `결측치 ${naCells}칸 (${fx((naCells / totalCells) * 100, 1)}%)`),
      h('span', { class: 'chip warn' }, `결측치가 있는 행 ${naRows}개`),
    ];
    if (mode === 'dropRow') {
      chips.push(h('span', { class: 'chip bad' }, `→ ${removedRows}행 삭제, ${data.length}행만 남음`));
      chips.push(h('span', { class: 'chip bad' }, `데이터 손실 ${fx((removedRows / RAW.length) * 100, 1)}%`));
    } else if (mode === 'dropCol') {
      chips.push(h('span', { class: 'chip bad' }, `→ ${removedCols.join(', ')} 열 삭제`));
      chips.push(h('span', { class: 'chip bad' }, `${COLS.length}열 → ${cols.length}열`));
    } else if (mode !== 'raw') {
      chips.push(h('span', { class: 'chip ok' }, `→ ${filled.size}칸 채움 (행·열 그대로)`));
    }
    add(summary, chips);

    /* 남은 자료의 평균이 어떻게 달라졌는지 — 대체의 부작용을 눈으로 */
    const hi = cols.findIndex((c) => c.id === 'height');
    if (hi >= 0) {
      const orig = RAW.map((r) => r[1]).filter((v) => v !== null);
      const now = data.map((r) => r[hi]).filter((v) => v !== null && typeof v === 'number');
      summary.append(h('div', { style: { width: '100%', marginTop: '8px' } },
        note(Math.abs(S.stdev(now) - S.stdev(orig)) > 0.6 ? 'warn' : '',
          h('b', {}, '키(cm) 열이 어떻게 변했나 — '),
          `평균 ${fx(S.mean(orig), 2)} → ${fx(S.mean(now), 2)} · `,
          `표준편차 ${fx(S.stdev(orig), 2)} → ${fx(S.stdev(now), 2)}`,
          mode === 'mean' || mode === 'median'
            ? ' · 평균은 거의 그대로인데 표준편차가 줄었습니다. 평균값으로 채우면 그 값이 한가운데에 쌓여 「흩어진 정도」가 실제보다 작아 보입니다.'
            : '')));
    }
  }

  const bar = h('div', { class: 'row tight' },
    MODES.map((m) => {
      const b = h('button', {
        type: 'button', class: 'btn ghost small',
        onclick: () => {
          mode = m.id;
          bar.querySelectorAll('button').forEach((x) => x.classList.add('ghost'));
          b.classList.remove('ghost');
          apply();
        },
      }, m.label);
      if (m.id === 'raw') b.classList.remove('ghost');
      return b;
    }));

  apply();

  return card('🧪 결측치 처리 실험실',
    h('div', { class: 'lead' }, '단추를 눌러 처리 방법을 바꿔 보세요. 빨간 칸이 결측치, 초록 칸이 새로 채워진 값입니다.'),
    bar,
    h('div', { style: { height: '12px' } }),
    out, summary,
    pyBox([
      "df.isnull().sum()          # 열마다 결측치가 몇 개인지",
      "df.dropna()                # ① 결측치가 있는 '행' 제거",
      "df.dropna(axis=1)          # ② 결측치가 있는 '열' 제거",
      "df['키'].fillna(df['키'].mean())     # ③ 평균값으로 대체",
      "df['키'].fillna(df['키'].median())   # ④ 중앙값으로 대체",
      "df['동아리'].fillna(df['동아리'].mode()[0])  # ⑤ 최빈값 (범주형)",
    ].join('\n')));
}

/* ─────────────── (가)·(나) 에 무엇을 넣을까 — 학습지 문제 ────────── */

function chooseCard() {
  const t = table(['학생', '몸무게(kg)', '동아리'], [
    ['가', '58', '과학'],
    ['나', '62', '과학'],
    ['다', h('td', { class: 'na' }, '(가) ← ?'), '음악'],
    ['라', '50', h('td', { class: 'na' }, '(나) ← ?')],
    ['마', '70', '과학'],
    ['바', '55', '체육'],
    ['사', '61', '과학'],
  ]);

  return card('❓ (가)와 (나)에 어떤 값이 적절할까? — 학습지 문제',
    t,
    quizSet([
      {
        q: '(가) 는 몸무게 열의 결측치입니다. 어떤 대푯값으로 채우는 것이 알맞을까요?',
        type: 'choice',
        choices: ['평균값 또는 중앙값', '최빈값', '0'],
        answer: '평균값 또는 중앙값',
        hint: '몸무게는 수치형(연속형) 데이터입니다.',
        explain: '수치형은 평균값·중앙값 같은 대푯값으로 채웁니다. 여기서 평균은 (58+62+50+70+55+61)/6 = 59.3kg 입니다. '
          + '이상치가 섞여 있다면 평균 대신 중앙값(59.5kg)이 더 안전합니다. 0 으로 채우면 「몸무게 0kg 인 사람」이 생겨 모델을 망칩니다.',
      },
      {
        q: '(나) 는 동아리 열의 결측치입니다. 어떤 값으로 채우는 것이 알맞을까요?',
        type: 'choice',
        choices: ['평균값', '최빈값', '중앙값'],
        answer: '최빈값',
        hint: '동아리는 범주형(명목형) 데이터입니다. 「평균 동아리」라는 말이 성립할까요?',
        explain: '범주형은 최빈값으로 채웁니다. 여기서는 「과학」이 4번으로 가장 많으므로 「과학」을 넣습니다. '
          + '범주형은 더하거나 나눌 수 없으므로 평균·중앙값을 쓸 수 없습니다.',
      },
    ], { revealOnWrong: true }),
    answerBlock('💡 한 걸음 더 — 더 나은 방법은 없을까',
      h('p', {}, '몸무게를 채울 때 「전체 평균」 대신 「키가 비슷한 학생들의 평균」을 쓰면 훨씬 정확합니다. ',
        '학습지에서 말하는 「상관관계 또는 예측 모델의 예측값으로 대체」가 바로 이것입니다.'),
      h('p', {}, '동아리도 마찬가지로 「그 학생과 비슷한 특성을 가진 학생들이 많이 든 동아리」로 채울 수 있습니다. ',
        '이것을 「유사 벡터값으로 대체」라고 부릅니다.')));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '결측치를 제거하면 쉽게 처리할 수 있지만, 반드시 ( ? )이 생겨 데이터의 특성을 모두 반영하지 못할 수 있습니다.',
        answer: ['데이터 손실', '데이터손실', '자료 손실'],
        explain: '지운 행·열에 담겨 있던 정보가 함께 사라집니다.',
        width: 200,
      },
      {
        q: '결측치는 N/A, NULL, ( ? ) 등으로 표현됩니다. (영문 3글자)',
        answer: ['NaN', 'nan'],
        explain: 'Not a Number 의 줄임말입니다.',
        width: 140,
      },
      {
        q: '0 은 결측치입니까?',
        type: 'ox',
        answer: 'X',
        explain: '0 은 「0 이라는 값」이 있는 것이므로 결측치가 아닙니다.',
      },
      {
        q: '데이터가 충분히 많고 결측치 비중이 적을 때 알맞은 처리 방법은?',
        type: 'choice',
        choices: ['제거 (drop)', '대체 (fill)'],
        answer: '제거 (drop)',
        explain: '데이터가 충분하지 않을 때는 대체를 써서 최대한 많은 데이터를 학습에 씁니다.',
      },
    ], { revealOnWrong: true }));
}
