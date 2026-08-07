/* ============================================================================
 * rules.js — 학습지 31~32쪽 「지식의 표현과 추론」
 *
 * 학습지의 규칙 14개를 그대로 넣은 「추론 엔진」이다.
 * 사실을 체크하면 전방 추론(forward chaining)이 돌면서
 * 어떤 규칙이 언제 발화해 어떤 새 사실을 만들었는지 한 줄씩 보여 준다.
 * 학생이 규칙을 직접 더 만들어 넣을 수도 있다.
 *
 * © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다.
 * 그 밖의 이용(재배포·2차 저작물·수업 외 목적)은 먼저 문의해 주세요.
 * 자세한 이용 범위는 이 저장소의 LICENSE 파일에 적어 두었습니다.
 * ========================================================================== */

import { h, add, clear, card, sheetHead, note, answer, answerBlock, quizSet, table } from '../../lib/ui.js';

/* 학습지 32쪽의 규칙 14개 */
export const BASE_RULES = [
  { if: ['털이 있다'], then: '포유류이다' },
  { if: ['젖이 있다'], then: '포유류이다' },
  { if: ['깃털이 있다'], then: '새이다' },
  { if: ['난다', '알을 낳는다'], then: '새이다' },
  { if: ['포유류이다', '고기를 먹는다'], then: '육식 동물이다' },
  { if: ['포유류이다', '송곳니가 있다', '날카로운 발톱이 있다', '눈이 전방을 향해 있다'], then: '육식 동물이다' },
  { if: ['포유류이다', '발굽이 있다', '되새김질을 한다'], then: '초식 동물이다' },
  { if: ['육식 동물이다', '황갈색이다', '검은 점이 있다'], then: '치타이다' },
  { if: ['육식 동물이다', '황갈색이다', '검은 줄무늬가 있다'], then: '호랑이이다' },
  { if: ['초식 동물이다', '긴 다리와 긴 목을 가지고 있다', '황갈색이다', '검은 점이 있다'], then: '기린이다' },
  { if: ['초식 동물이다', '흰색이다', '검은 줄무늬가 있다'], then: '얼룩말이다' },
  { if: ['새이다', '날지 못한다', '긴 다리와 긴 목을 가지고 있다', '검은색과 흰색이다'], then: '타조이다' },
  { if: ['새이다', '날지 못한다', '헤엄을 친다', '검은색과 흰색이다'], then: '펭귄이다' },
  { if: ['새이다', '잘 난다'], then: '갈매기이다' },
];

/* 학생이 직접 고를 수 있는 「관찰한 사실」 */
const OBSERVABLE = [
  '털이 있다', '젖이 있다', '깃털이 있다', '난다', '알을 낳는다',
  '고기를 먹는다', '송곳니가 있다', '날카로운 발톱이 있다', '눈이 전방을 향해 있다',
  '발굽이 있다', '되새김질을 한다',
  '황갈색이다', '검은 점이 있다', '검은 줄무늬가 있다', '흰색이다', '검은색과 흰색이다',
  '긴 다리와 긴 목을 가지고 있다', '날지 못한다', '잘 난다', '헤엄을 친다',
];

const ANIMALS = ['치타이다', '호랑이이다', '기린이다', '얼룩말이다', '타조이다', '펭귄이다', '갈매기이다'];

/* 학습지 두 문제 */
const EXAMPLES = [
  { nm: '학습지 문제 ①', facts: ['털이 있다', '고기를 먹는다', '황갈색이다', '검은 줄무늬가 있다'] },
  { nm: '학습지 문제 ②', facts: ['젖이 있다', '발굽이 있다', '되새김질을 한다', '흰색이다', '검은 줄무늬가 있다'] },
  { nm: '치타', facts: ['털이 있다', '고기를 먹는다', '황갈색이다', '검은 점이 있다'] },
  { nm: '기린', facts: ['젖이 있다', '발굽이 있다', '되새김질을 한다', '긴 다리와 긴 목을 가지고 있다', '황갈색이다', '검은 점이 있다'] },
  { nm: '펭귄', facts: ['깃털이 있다', '날지 못한다', '헤엄을 친다', '검은색과 흰색이다'] },
  { nm: '갈매기', facts: ['깃털이 있다', '잘 난다'] },
];

let rules = BASE_RULES.map((r) => ({ ...r, if: r.if.slice() }));
let facts = new Set();

export function render(root) {
  rules = BASE_RULES.map((r) => ({ ...r, if: r.if.slice() }));
  facts = new Set();

  add(root, sheetHead('학습지 31~32쪽', '지식의 표현과 추론 — 규칙 기반 추론 엔진',
    ['[12인기04-04]'],
    [
      '사람의 언어로 된 지식을 IF~THEN 규칙으로 바꿔 쓸 수 있다.',
      '주어진 사실에서 새로운 사실이 생성되는 과정을 설명할 수 있다.',
      '규칙 기반 지식 표현의 한계와 그것을 신경망이 어떻게 보완하는지 말할 수 있다.',
    ]));

  root.append(conceptCard());
  root.append(engineCard());
  root.append(expertCard());
  root.append(quizCard());
}

/* ───────────────────────── 지식 표현 개념 ─────────────────────── */

function conceptCard() {
  return card('📖 컴퓨터는 지식을 어떻게 표현할까',
    h('p', {}, h('b', {}, '지식'), ' 이란 어떤 대상에 대하여 배우거나 알게 된 명확한 인식이나 이해입니다. ',
      '사람의 언어로 표현하면 인공지능이 이해하기 어려우므로, ',
      '인공지능이 이해할 수 있도록 ', answer('기호'), ' 로 표현하면 효율적으로 추론·검색·관리를 할 수 있습니다.'),
    table(['사람의 언어', '기호'], [
      [h('td', { class: 'left' }, '횡단보도는 녹색 신호일 때 건널 수 있고, 빨간색 신호일 때는 건너지 말고 기다려야 한다.'),
        h('td', { class: 'left mono' }, '규칙 1. IF 신호등이 녹색 THEN 건넌다.\n규칙 2. IF 신호등이 빨간색 THEN 기다린다.')],
    ]),
    h('h4', {}, '대표적인 방법 — ', answer('규칙 기반'), ' (IF ~ THEN)'),
    table(['꼴', '예'], [
      ['IF 상황 THEN 행동', h('td', { class: 'left' }, 'IF 불이 나다 THEN 119에 신고한다.')],
      ['IF 증거 THEN 가설', h('td', { class: 'left' }, 'IF 새끼를 낳는다 THEN 포유류이다.')],
      ['IF 전제 THEN 결론', h('td', { class: 'left' }, 'IF 열심히 공부한다 THEN 좋은 성적을 받는다.')],
      ['IF 원인 THEN 결과', h('td', { class: 'left' }, 'IF 차에 배터리가 없다 THEN 차는 시동이 걸리지 않는다.')],
    ]),
    h('p', {}, '논리연산자나 산술연산자를 함께 써서 더 다양하게 표현할 수 있습니다.'),
    h('div', { class: 'row tight' },
      h('span', { class: 'chip' }, 'IF 아침이다 AND 월요일이다 THEN 학교에 간다'),
      h('span', { class: 'chip' }, 'IF 열 > 37.5도 THEN 해열제를 먹는다'),
      h('span', { class: 'chip' }, 'IF 여름이다 AND 강수 확률 ≥ 60% THEN 우산을 가지고 나간다')),
    note('bad', h('b', {}, '규칙 기반의 한계 세 가지 '),
      '① 복잡한 지식은 명확하게 규정하기 어렵다 ② 새로운 지식을 추가하거나 수정하기 어렵다 ',
      '③ 초기에는 사람이 직접 지식을 구축해야 한다'),
    note('ok', h('b', {}, '그래서 신경망이 나왔습니다. '),
      '기계학습 기법으로 데이터에서 학습해 신경망 형태로 지식을 표현하면, ',
      '위 단점을 보완할 수 있습니다. 사람이 규칙을 다 적어 주지 않아도 되니까요. ',
      '대신 「왜 그렇게 판단했는가」를 설명하기 어려워집니다 — 이것이 Ⅵ 단원의 「투명성」 문제로 이어집니다.'));
}

/* ─────────────────────────── 추론 엔진 ────────────────────────── */

/** 전방 추론 — 더 이상 새 사실이 안 나올 때까지 규칙을 훑는다 */
export function forwardChain(startFacts, ruleList) {
  const known = new Set(startFacts);
  const log = [];
  let changed = true;
  let round = 0;
  while (changed && round++ < 30) {
    changed = false;
    ruleList.forEach((r, i) => {
      if (known.has(r.then)) return;
      if (!r.if.every((c) => known.has(c))) return;
      known.add(r.then);
      log.push({ round, rule: i + 1, cond: r.if.slice(), fact: r.then });
      changed = true;
    });
  }
  return { known, log };
}

function engineCard() {
  const factBox = h('div', { class: 'row tight' });
  const out = h('div', { style: { marginTop: '14px' } });
  const ruleBox = h('div', {});

  function paintFacts() {
    clear(factBox);
    OBSERVABLE.forEach((f) => {
      const on = facts.has(f);
      factBox.append(h('label', {
        class: 'check' + (on ? ' on' : ''),
        onclick: (ev) => {
          ev.preventDefault();
          if (facts.has(f)) facts.delete(f); else facts.add(f);
          paintFacts(); paintOut();
        },
      }, h('input', { type: 'checkbox', checked: on, tabindex: '-1' }), f));
    });
  }

  function paintOut() {
    const { known, log } = forwardChain(facts, rules);
    const derived = [...known].filter((f) => !facts.has(f));
    const found = ANIMALS.filter((a) => known.has(a));

    clear(out);
    add(out, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip' }, `주어진 사실 ${facts.size}개`),
        h('span', { class: 'chip ok' }, `새로 생성된 사실 ${derived.length}개`),
        found.length
          ? h('span', { class: 'chip on' }, `추론 결과 → ${found.map((a) => a.replace('이다', '')).join(', ')}`)
          : h('span', { class: 'chip warn' }, '아직 어떤 동물인지 알 수 없습니다')),

      log.length
        ? h('div', { style: { marginTop: '12px' } },
          h('div', { style: { fontWeight: '800', color: 'var(--ink-soft)', marginBottom: '6px' } }, '추론 과정 — 규칙이 발화한 순서'),
          h('div', {}, log.map((l, i) => h('div', {
            style: {
              padding: '9px 14px', marginBottom: '6px', borderRadius: '9px',
              background: ANIMALS.includes(l.fact) ? '#eefaf4' : '#f6f9ff',
              border: '1px solid ' + (ANIMALS.includes(l.fact) ? '#c3e8d7' : '#cfdffb'),
            },
          },
          h('b', {}, `사실 ${facts.size + i + 1}. `),
          h('b', { style: { color: ANIMALS.includes(l.fact) ? 'var(--ok)' : 'var(--accent)' } }, l.fact),
          h('span', { style: { color: 'var(--ink-soft)' } }, ` (규칙 ${l.rule})`),
          h('div', { style: { fontSize: '0.9rem', color: 'var(--ink-soft)', marginTop: '2px' } },
            `IF ${l.cond.join(' AND ')} THEN ${l.fact}`)))))
        : note('', '왼쪽 위에서 관찰한 사실을 골라 보세요. 조건이 다 맞는 규칙이 있으면 새 사실이 만들어집니다.'),

      found.length
        ? note('ok', h('b', {}, '🎉 결론 — '),
          `이 동물은 ${found.map((a) => a.replace('이다', '')).join(' 또는 ')} 입니다.`)
        : facts.size
          ? note('warn', '조건을 다 채우지 못했습니다. 규칙표를 보고 무엇이 더 필요한지 찾아보세요.')
          : null,
    ]);

    paintRules(known);
  }

  function paintRules(known) {
    clear(ruleBox);
    ruleBox.append(table(['번호', '규칙', '지금 발화하나?'],
      rules.map((r, i) => {
        const fired = known.has(r.then) && r.if.every((c) => known.has(c));
        return [
          h('td', { style: { fontWeight: '800' } }, String(i + 1)),
          h('td', { class: 'left' },
            'IF ',
            r.if.map((c, j) => [
              h('span', { style: { color: known.has(c) ? 'var(--ok)' : 'var(--ink-soft)', fontWeight: known.has(c) ? '800' : '400' } }, c),
              j < r.if.length - 1 ? h('b', { style: { color: 'var(--ink-soft)' } }, ' AND ') : null,
            ]),
            ' THEN ',
            h('b', { style: { color: known.has(r.then) ? 'var(--ok)' : 'var(--ink)' } }, r.then)),
          fired ? h('td', { class: 'filled' }, '✔ 발화') : h('td', { class: 'dim' }, '–'),
        ];
      }), { compact: true }));
  }

  /* 규칙 추가하기 */
  const newIf = h('input', { type: 'text', placeholder: '조건 (AND 로 여러 개, 예: 포유류이다 AND 헤엄을 친다)', style: { flex: '1', minWidth: '260px' } });
  const newThen = h('input', { type: 'text', placeholder: '결론 (예: 고래이다)', style: { width: '200px' } });
  const addBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      const conds = newIf.value.split(/\s+AND\s+|\s*,\s*/i).map((s) => s.trim()).filter(Boolean);
      const then = newThen.value.trim();
      if (!conds.length || !then) return;
      rules.push({ if: conds, then });
      newIf.value = ''; newThen.value = '';
      paintOut();
    },
  }, '＋ 규칙 추가');

  const presets = h('div', { class: 'row tight' },
    EXAMPLES.map((e) => h('button', {
      type: 'button', class: 'btn ghost small',
      onclick: () => { facts = new Set(e.facts); paintFacts(); paintOut(); },
    }, e.nm)),
    h('button', {
      type: 'button', class: 'btn gray small',
      onclick: () => { facts = new Set(); paintFacts(); paintOut(); },
    }, '모두 지우기'));

  paintFacts();
  paintOut();

  return card('🦁 규칙 기반 추론 엔진 — 일곱 가지 동물 구분하기',
    h('div', { class: 'lead' },
      '규칙 기반으로 표현된 지식을 이용하여 새로운 사실을 생성하고 추론해 봅시다. ',
      '관찰한 사실을 누르면 아래에서 규칙이 하나씩 발화합니다.'),
    presets,
    h('h4', {}, '관찰한 사실 (여러 개 고를 수 있습니다)'),
    factBox,
    out,
    h('h4', {}, '규칙 베이스 — 초록색은 지금 참인 조건'),
    ruleBox,
    h('h4', {}, '규칙을 직접 만들어 넣어 보세요'),
    h('div', { class: 'row' }, h('label', { class: 'field' }, 'IF'), newIf, h('label', { class: 'field' }, 'THEN'), newThen, addBtn),
    note('', h('b', {}, '해 볼 만한 것 '),
      '「IF 포유류이다 AND 헤엄을 친다 THEN 고래이다」 규칙을 넣고, ',
      '「털이 있다」와 「헤엄을 친다」를 골라 보세요. 규칙 하나만 더해도 새로운 동물을 알아봅니다. ',
      '이것이 전문가 시스템에 지식을 쌓는 방식입니다. ',
      '동시에 「동물이 만 종이면 규칙을 몇 개나 써야 할까?」 하는 한계도 느껴 보세요.'),
    answerBlock('✅ 학습지 정답',
      h('p', {}, h('b', {}, '문제 ① '), '털이 있다 / 고기를 먹는다 / 황갈색이다 / 검은 줄무늬가 있다'),
      h('p', { style: { paddingLeft: '16px' } },
        '→ 사실 5. 포유류이다 (규칙 1) → 사실 6. 육식 동물이다 (규칙 5) → 사실 7. ',
        h('b', {}, '호랑이이다'), ' (규칙 9)'),
      h('p', { style: { marginTop: '10px' } }, h('b', {}, '문제 ② '), '젖이 있다 / 발굽이 있다 / 되새김질을 한다 / 흰색이다 / 검은 줄무늬가 있다'),
      h('p', { style: { paddingLeft: '16px' } },
        '→ 사실 6. 포유류이다 (규칙 2) → 사실 7. 초식 동물이다 (규칙 7) → 사실 8. ',
        h('b', {}, '얼룩말이다'), ' (규칙 11)')));
}

/* ─────────────────────────── 전문가 시스템 ───────────────────── */

function expertCard() {
  return card('🩺 인공지능 추론 시스템',
    h('p', {}, h('b', {}, '추론'), ' 이란 하나의 판단을 근거로 다른 판단을 이끌어 내는 과정입니다.'),
    h('h4', {}, answer('전문가 시스템')),
    h('p', {}, '특정 분야의 전문 지식을 모델링하여 문제를 해결하는 시스템입니다.'),
    table(['구성 요소', '하는 일'], [
      [h('td', { style: { fontWeight: '800' } }, '사용자 인터페이스'), h('td', { class: 'left' }, '사람에게 질문하고 답을 받는 창구')],
      [h('td', { style: { fontWeight: '800' } }, '추론 엔진'), h('td', { class: 'left' }, '지식 베이스의 규칙을 훑으며 새 사실을 만들어 내는 부분 (위 실험실이 하는 일)')],
      [h('td', { style: { fontWeight: '800' } }, '지식 베이스'), h('td', { class: 'left' }, '전문가의 지식을 규칙으로 모아 둔 곳 (위의 규칙 14개)')],
    ]),
    h('h4', {}, '사례'),
    h('div', { class: 'row tight' },
      h('span', { class: 'chip on' }, '마이신 (MYCIN) — 의료 전문가 시스템'),
      h('span', { class: 'chip on' }, '퀴즈왕 왓슨 (Watson)')),
    h('h4', {}, '전문가 시스템의 한계'),
    h('ul', { style: { paddingLeft: '22px' } },
      h('li', {}, '지식 베이스 구축의 어려움'),
      h('li', {}, '지식의 갱신과 유지가 어려움'),
      h('li', {}, '데이터로부터 새로운 지식을 생성하는 기계학습의 필요성 대두')),
    note('', h('b', {}, '두 방식을 견주면 '),
      '규칙 기반은 「왜 그렇게 판단했는지」를 규칙 번호로 정확히 설명할 수 있습니다(위 추론 과정이 그렇지요). ',
      '반면 신경망은 훨씬 복잡한 지식을 스스로 배우지만 설명이 어렵습니다. ',
      '요즘은 두 가지를 섞어 쓰려는 연구가 활발합니다.'));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '컴퓨터와 사람이 동시에 이해할 수 있는 형태로 명시적으로 지식을 표현하는 방법은?',
        answer: ['기호', '기호 표현', '기호적 표현'],
        explain: '기호화하여 표현하면 효율적으로 추론·검색·관리를 할 수 있습니다.',
        width: 160,
      },
      {
        q: '기호로 지식을 표현하는 대표적인 방법은? (IF~THEN 꼴)',
        answer: ['규칙 기반', '규칙기반', '규칙 기반 표현', 'rule based'],
        explain: 'IF 조건 THEN 결론 꼴로 씁니다.',
        width: 180,
      },
      {
        q: '특정 분야의 전문 지식을 모델링하여 문제를 해결하는 시스템은?',
        answer: ['전문가 시스템', '전문가시스템', 'expert system'],
        explain: '사용자 인터페이스 · 추론 엔진 · 지식 베이스로 이루어집니다.',
        width: 200,
      },
      {
        q: '의료 분야의 대표적인 전문가 시스템 이름은?',
        answer: ['마이신', 'MYCIN', 'mycin'],
        explain: '퀴즈왕 왓슨(Watson)도 대표 사례입니다.',
        width: 160,
      },
      {
        q: '「털이 있다」와 「고기를 먹는다」에서 먼저 생성되는 새 사실은?',
        answer: ['포유류이다', '포유류'],
        explain: '규칙 1(IF 털이 있다 THEN 포유류이다)이 먼저 발화하고, 그다음 규칙 5가 육식 동물이다를 만듭니다.',
        width: 180,
      },
      {
        q: '규칙 기반 지식 표현의 단점을 신경망이 어떻게 보완하나요?',
        type: 'choice',
        choices: ['사람이 규칙을 다 적지 않아도 데이터에서 스스로 배운다', '규칙을 더 빨리 실행한다', '규칙을 더 많이 저장한다'],
        answer: '사람이 규칙을 다 적지 않아도 데이터에서 스스로 배운다',
        explain: '기계학습으로 데이터에서 학습해 신경망 형태로 지식을 표현합니다.',
      },
    ], { revealOnWrong: true }));
}
