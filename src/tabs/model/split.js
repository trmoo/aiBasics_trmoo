/* ============================================================================
 * split.js — 학습지 6~7쪽 「5.2 데이터 준비 — X·y 분리와 학습 데이터 분할」
 *
 *   ① X 와 y 를 가르는 것을 표에서 색으로 보여 준다
 *   ② 훈련 : 검증 : 평가 비율을 슬라이더로 바꾸면 막대와 행 수가 함께 바뀐다
 *   ③ k-겹 교차검증을 한 회차씩 돌려 본다 (데이터가 적을 때 왜 쓰는지)
 *
 * © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다.
 * 그 밖의 이용(재배포·2차 저작물·수업 외 목적)은 먼저 문의해 주세요.
 * 자세한 이용 범위는 이 저장소의 LICENSE 파일에 적어 두었습니다.
 * ========================================================================== */

import { h, add, clear, card, sheetHead, note, answer, quizSet, table, pyBox, fx } from '../../lib/ui.js';

export function render(root) {
  add(root, sheetHead('학습지 6~7쪽', '데이터 준비 — X·y 분리와 학습 데이터 분할',
    ['[12인기03-02]'],
    [
      '종속변수와 독립변수를 구분해 X 와 y 로 나눌 수 있다.',
      '훈련·검증·평가 데이터를 나누는 목적을 과적합과 연결해 설명할 수 있다.',
      '데이터가 적을 때 교차검증을 쓰는 까닭을 설명할 수 있다.',
    ]));

  root.append(xyCard());
  root.append(splitCard());
  root.append(cvCard());
  root.append(quizCard());
}

/* ─────────────────────────── X · y 분리 ──────────────────────────── */

function xyCard() {
  const COLS = ['공부시간', '수면시간', '결석일수', '지난시험', '이번시험'];
  const ROWS = [
    [2.5, 7.0, 0, 72, 78],
    [1.0, 6.5, 3, 55, 58],
    [4.0, 7.5, 0, 88, 92],
    [3.2, 6.0, 1, 79, 83],
    [0.5, 8.0, 2, 48, 51],
  ];
  let target = 4;

  const out = h('div', {});

  function paint() {
    clear(out);
    const head = COLS.map((c, i) => h('th', {
      style: { background: i === target ? '#ffe9c9' : '#dcebff', cursor: 'pointer' },
      onclick: () => { target = i; paint(); },
      title: '이 열을 목표(y)로 삼으려면 누르세요',
    }, c + (i === target ? ' ← y' : '')));

    const t = h('table', { class: 'tbl compact' },
      h('thead', {}, h('tr', {}, head)),
      h('tbody', {}, ROWS.map((r) => h('tr', {}, r.map((v, i) => h('td', {
        style: { background: i === target ? '#fff6e5' : '#f6faff' },
      }, String(v)))))));

    add(out, [
      h('div', { class: 'lead' }, '열 이름을 누르면 그 열이 목표(y)가 됩니다.'),
      h('div', { class: 'scroll-x' }, t),
      h('div', { class: 'row tight', style: { marginTop: '10px' } },
        h('span', { class: 'chip', style: { background: '#dcebff', color: '#1e6fd9' } },
          `X (독립변수 · 설명변수 · feature) = ${COLS.filter((_, i) => i !== target).join(', ')}`),
        h('span', { class: 'chip', style: { background: '#ffe9c9', color: '#8a6410' } },
          `y (종속변수 · 레이블 · 타깃) = ${COLS[target]}`)),
      note('', h('b', {}, '규칙은 간단합니다. '), answer('종속'),
        ' 변수를 y 로, 종속변수를 제외한 나머지 변수를 X 로 둡니다. ',
        '「무엇을 맞히고 싶은가」가 y 이고, 「그것을 맞히는 데 쓸 단서」가 모두 X 입니다.'),
    ]);
  }
  paint();

  return card('✂️ X 와 y 를 나눈다', out,
    pyBox([
      "y = df['이번시험']                  # 맞히고 싶은 것",
      "X = df.drop(columns=['이번시험'])   # 나머지 전부",
    ].join('\n')));
}

/* ───────────────────── 훈련 : 검증 : 평가 분할 ───────────────────── */

function splitCard() {
  let total = 1000;
  let train = 70; let valid = 10; // test 는 나머지

  const bar = h('div', {
    style: {
      display: 'flex', height: '46px', borderRadius: '10px', overflow: 'hidden',
      border: '1px solid var(--line)', marginTop: '12px', fontWeight: '800', color: '#fff', fontSize: '0.92rem',
    },
  });
  const info = h('div', { style: { marginTop: '12px' } });

  const trSl = h('input', { type: 'range', min: '40', max: '90', value: '70', style: { flex: '1' } });
  const vaSl = h('input', { type: 'range', min: '0', max: '40', value: '10', style: { flex: '1' } });
  const nInp = h('input', { type: 'number', value: '1000', min: '10', max: '100000', style: { width: '120px' } });

  function paint() {
    train = Number(trSl.value);
    valid = Math.min(Number(vaSl.value), 100 - train);
    vaSl.value = valid;
    total = Math.max(10, Number(nInp.value) || 1000);
    const test = 100 - train - valid;

    clear(bar);
    const seg = (pct, color, name) => (pct > 0 ? h('div', {
      style: {
        width: pct + '%', background: color, display: 'flex', alignItems: 'center',
        justifyContent: 'center', transition: 'width 0.15s', whiteSpace: 'nowrap', overflow: 'hidden',
      },
    }, pct >= 8 ? `${name} ${pct}%` : '') : null);
    add(bar, [
      seg(train, '#1e6fd9', '훈련'),
      seg(valid, '#0f9d6e', '검증'),
      seg(test, '#d9781e', '평가'),
    ]);

    clear(info);
    add(info, [
      table(['구분', '비율', '행 수', '하는 일'], [
        [h('td', { style: { fontWeight: '800', color: '#1e6fd9' } }, '훈련 (train)'),
          train + '%', Math.round(total * train / 100), h('td', { class: 'left' }, '모델 학습을 진행한다')],
        [h('td', { style: { fontWeight: '800', color: '#0f9d6e' } }, '검증 (valid)'),
          valid + '%', Math.round(total * valid / 100),
          h('td', { class: 'left' }, '모델이 업데이트될 때마다 성능을 측정한다 (여기 결과를 보고 모델을 고친다)')],
        [h('td', { style: { fontWeight: '800', color: '#d9781e' } }, '평가 (test)'),
          test + '%', Math.round(total * test / 100),
          h('td', { class: 'left' }, '최종 채택된 모델의 성능을 딱 한 번 평가한다')],
      ]),
      valid === 0
        ? note('warn', h('b', {}, '검증 데이터가 0% 입니다. '),
          '데이터의 크기가 충분하지 않을 때는 이렇게 훈련·평가 둘로만 나누고, 대신 ',
          h('b', {}, '교차검증'), ' 에서 얻은 성능 추정치를 평갓값으로 씁니다.')
        : note('ok', h('b', {}, '데이터가 충분할 때의 방식입니다. '),
          '검증 데이터를 따로 두어 모델을 고칠 때 쓰고, 평가 데이터는 마지막까지 아껴 둡니다. ',
          `지금 비율은 ${train}:${valid}:${test} 입니다. (교과서 예: 7:1:2, 6:2:2)`),
      test === 0
        ? note('bad', h('b', {}, '평가 데이터가 없습니다! '),
          '이러면 모델의 진짜 실력을 잴 방법이 없습니다. 시험 문제를 미리 다 보고 시험을 치는 셈입니다.')
        : null,
    ]);
  }

  [trSl, vaSl, nInp].forEach((el) => el.addEventListener('input', paint));

  const presets = h('div', { class: 'row tight' },
    [[70, 10, '7 : 1 : 2'], [60, 20, '6 : 2 : 2'], [80, 0, '8 : 0 : 2 (검증 없음)']].map(([t, v, lb]) => h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => { trSl.value = t; vaSl.value = v; paint(); },
    }, lb)));

  paint();

  return card('📏 학습 데이터 분할',
    h('div', { class: 'lead' },
      '나누는 목적은 두 가지입니다. ① 모델이 학습 데이터에 ', answer('과적합'),
      '(overfitting)하는 것을 막고, ② 새로운 데이터에 대해 성능을 평가하기 위해서입니다.'),
    h('div', { class: 'row' }, h('label', { class: 'field' }, '전체 행 수'), nInp, presets),
    h('div', { class: 'row', style: { marginTop: '8px' } }, h('label', { class: 'field', style: { width: '80px' } }, '훈련'), trSl),
    h('div', { class: 'row' }, h('label', { class: 'field', style: { width: '80px' } }, '검증'), vaSl),
    bar, info,
    note('bad', h('b', {}, '가장 중요한 규칙 — 겹치지 않게 나눈다. '),
      '같은 행이 훈련과 평가에 모두 들어가면, 모델은 이미 본 문제를 다시 푸는 것이라 성적이 실제보다 훨씬 좋게 나옵니다.'),
    pyBox([
      "from sklearn.model_selection import train_test_split",
      "",
      "# ① 먼저 평가(test) 20% 를 떼어 둔다",
      "X_tmp, X_test, y_tmp, y_test = train_test_split(",
      "        X, y, test_size=0.2, random_state=42, stratify=y)",
      "",
      "# ② 남은 80% 를 다시 훈련 : 검증 으로 (7:1 이 되게 1/8)",
      "X_train, X_val, y_train, y_val = train_test_split(",
      "        X_tmp, y_tmp, test_size=0.125, random_state=42)",
      "",
      "# stratify=y : 분류 문제에서 각 클래스 비율을 그대로 유지해 준다",
    ].join('\n')));
}

/* ─────────────────────────── 교차검증 ────────────────────────────── */

function cvCard() {
  let K = 5;
  let round = 0;
  const board = h('div', { style: { marginTop: '12px' } });
  const info = h('div', { style: { marginTop: '12px' } });

  /* 회차마다 나오는 「가짜 점수」 — 씨앗을 고정해 늘 같은 값이 나오게 한다 */
  const SCORES = [0.86, 0.81, 0.89, 0.84, 0.87, 0.83, 0.88, 0.85, 0.82, 0.90];

  function paint() {
    clear(board);
    const rows = [];
    for (let r = 0; r < K; r++) {
      const cells = [h('td', { style: { fontWeight: '800', background: r === round ? '#fff6e5' : '' } }, `${r + 1}회차`)];
      for (let k = 0; k < K; k++) {
        const isVal = k === r;
        cells.push(h('td', {
          style: {
            background: isVal ? '#0f9d6e' : '#dcebff',
            color: isVal ? '#fff' : '#1e6fd9',
            fontWeight: '800',
            opacity: r === round ? '1' : '0.42',
            transition: 'opacity 0.2s',
          },
        }, isVal ? '검증' : '훈련'));
      }
      cells.push(h('td', {
        class: 'mono',
        style: { fontWeight: '800', opacity: r <= round ? '1' : '0.3' },
      }, r <= round ? SCORES[r].toFixed(2) : '–'));
      rows.push(cells);
    }
    board.append(table([''].concat(Array.from({ length: K }, (_, i) => `조각 ${i + 1}`)).concat(['검증 점수']), rows, { compact: true }));

    const done = SCORES.slice(0, round + 1);
    const avg = done.reduce((s, v) => s + v, 0) / done.length;
    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `${round + 1} / ${K} 회차`),
        h('span', { class: 'chip' }, `지금까지 평균 ${fx(avg, 3)}`),
        round + 1 === K ? h('span', { class: 'chip ok' }, `최종 성능 추정치 = ${fx(avg, 3)}`) : null),
      round + 1 === K
        ? note('ok', h('b', {}, '끝났습니다. '),
          `${K}개 조각이 한 번씩 검증 데이터가 되었습니다. ${K}번의 점수를 평균한 ${fx(avg, 3)} 을 이 모델의 성능 추정치로 씁니다. `
          + '모든 데이터가 한 번씩 검증에 쓰였으므로, 어쩌다 쉬운 데이터가 검증에 걸려 점수가 좋게 나오는 일을 줄일 수 있습니다.')
        : note('', `지금은 조각 ${round + 1} 만 검증에 쓰고 나머지 ${K - 1}개로 학습합니다. [다음 회차] 를 눌러 보세요.`),
    ]);
  }

  const kSel = h('select', {
    onchange: (e) => { K = Number(e.target.value); round = 0; paint(); },
  }, [3, 4, 5, 10].map((k) => h('option', { value: k, selected: k === 5 }, `${k}-겹 (k=${k})`)));

  paint();

  return card('🔁 교차검증 (cross validation)',
    h('div', { class: 'lead' },
      '데이터 크기가 매우 작을 때는 ', answer('교차 검증'), ' 에서 얻은 성능 추정치를 평갓값으로 씁니다. ',
      '훈련 데이터를 여러 개로 나눠 그중 하나는 검증 데이터로, 나머지는 훈련 데이터로 쓰기를 반복합니다.'),
    h('div', { class: 'row' },
      h('label', { class: 'field' }, '몇 겹으로'), kSel,
      h('button', { type: 'button', class: 'btn', onclick: () => { round = (round + 1) % K; paint(); } }, '⏭ 다음 회차'),
      h('button', { type: 'button', class: 'btn gray', onclick: () => { round = 0; paint(); } }, '처음으로')),
    board, info,
    note('', h('b', {}, '왜 이렇게까지 하나요? '),
      '데이터가 100개뿐인데 20개를 검증으로 떼면, 그 20개가 우연히 쉬웠는지 어려웠는지에 따라 점수가 크게 흔들립니다. ',
      '교차검증은 모든 데이터를 한 번씩 검증에 써서 그 운을 평균으로 없앱니다. 대신 학습을 k 번 해야 해서 시간이 k 배 듭니다.'),
    pyBox([
      "from sklearn.model_selection import cross_val_score, KFold",
      "",
      "scores = cross_val_score(model, X, y, cv=5, scoring='accuracy')",
      "print(scores)          # 회차별 점수 5개",
      "print(scores.mean())   # 성능 추정치",
    ].join('\n')));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '학습 데이터를 나누는 목적은 모델이 학습 데이터에 ( ? )하는 것을 방지하기 위함입니다.',
        answer: ['과적합', '과대적합', 'overfitting', '과적합(overfitting)'],
        explain: '훈련 데이터만 잘 맞히고 새 데이터는 못 맞히는 상태를 막기 위해 나눕니다.',
        width: 180,
      },
      {
        q: '모델이 업데이트될 때마다 성능을 측정하는 데이터는?',
        answer: ['검증', '검증 데이터', 'valid', 'validation'],
        explain: '훈련(train) · 검증(valid) · 평가(test) 중 검증 데이터입니다.',
        width: 160,
      },
      {
        q: '최종 채택된 모델의 성능을 평가하는 데이터는?',
        answer: ['평가', '평가 데이터', '테스트', '테스트 데이터', 'test'],
        explain: '평가(test) 데이터는 마지막에 딱 한 번만 씁니다.',
        width: 160,
      },
      {
        q: '데이터 크기가 매우 작을 때 얻은 성능 추정치를 평갓값으로 쓰는 방법은?',
        answer: ['교차 검증', '교차검증', 'cross validation', 'k-fold', 'k겹 교차검증'],
        explain: '훈련 데이터를 k 개로 나눠 번갈아 검증에 쓰고 점수를 평균합니다.',
        width: 200,
      },
      {
        q: '종속변수를 y 로 둘 때, X 에는 무엇을 담나요?',
        type: 'choice',
        choices: ['종속변수를 제외한 나머지 변수', '모든 변수', '수치형 변수만'],
        answer: '종속변수를 제외한 나머지 변수',
        explain: '맞히고 싶은 것이 y, 맞히는 데 쓸 단서가 모두 X 입니다.',
      },
    ], { revealOnWrong: true }));
}
