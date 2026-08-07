/* ============================================================================
 * space.js — 학습지 19~22쪽 「문제 해결과 탐색 · 상태 공간 트리」
 *
 *   ① 상태 공간의 개념
 *   ② 강 건너기 문제 : 직접 배를 태워 옮기면 상태가 0000 → 1111 로 바뀐다.
 *                      잘못 두면 잡아먹히고, 안전한 상태 10개로 이루어진 상태 공간 그래프가
 *                      옆에서 자라난다. 최소 7번이라는 것을 스스로 확인하게 된다.
 *   ③ 하노이 타워 : 원판 2~4개를 직접 옮기고, 2개짜리의 상태 공간 그래프(9칸)를 본다
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

import { h, add, clear, card, sheetHead, note, answer, answerBlock, quizSet, table, fx, drawNow } from '../../lib/ui.js';
import { makeCanvas, label, COLORS } from '../../lib/chart.js';

export function render(root) {
  add(root, sheetHead('학습지 19~22쪽', '문제 해결과 탐색 — 상태 공간',
    ['[12인기04-01]'],
    [
      '문제를 초기 상태와 목표 상태로 정의할 수 있다.',
      '상태 공간을 트리(또는 그래프)로 구조화할 수 있다.',
      '강 건너기 문제를 풀고 최소 이동 횟수를 설명할 수 있다.',
    ]));

  root.append(conceptCard());
  root.append(riverCard());
  root.append(hanoiCard());
  root.append(quizCard());
}

/* ───────────────────────────── 개념 ─────────────────────────────── */

function conceptCard() {
  return card('📖 문제 · 탐색 · 상태 공간',
    table(['용어', '뜻'], [
      [h('td', { style: { fontWeight: '800' } }, '문제 (problem)'),
        h('td', { class: 'left' }, [answer('현재 상태'), ' 와 ', answer('목표 상태'), ' 사이에 차이가 있어 상태 변화를 필요로 하는 상황'])],
      [h('td', { style: { fontWeight: '800' } }, '문제 해결'),
        h('td', { class: 'left' }, '다양한 선택 중 가장 효율적인 선택을 통해 목표 상태에 도달하는 것')],
      [h('td', { style: { fontWeight: '800' } }, '탐색 (search)'),
        h('td', { class: 'left' }, '컴퓨터가 문제를 자율적으로 해결하기 위해 해 혹은 해에 이르는 경로를 찾아가는 과정. '
          + '상태 공간 안에서 초기 상태로부터 목표 상태까지 최적의 경로를 찾는 과정')],
      [h('td', { style: { fontWeight: '800' } }, [answer('상태 공간')]),
        h('td', { class: 'left' }, '문제 해결 과정에서 나타날 수 있는 모든 상태의 집합. '
          + '초기 상태 = 문제가 주어진 시작 상태, 목표 상태 = 문제를 해결한 마지막 상태')],
    ]),
    h('h4', {}, '상태 공간 트리'),
    h('p', {}, '상태 공간을 트리의 형태로 구조화하여 표현한 것입니다.'),
    table(['구성 요소', '무엇을 나타내나'], [
      [h('td', { style: { fontWeight: '800' } }, '노드'), h('td', { class: 'left' }, '상태')],
      [h('td', { style: { fontWeight: '800' } }, '간선 (링크)'), h('td', { class: 'left' }, '한 상태에서 다른 상태로 가기 위한 조건 / 행동 / 연산자 / 규칙')],
      [h('td', { style: { fontWeight: '800' } }, '길이'), h('td', { class: 'left' }, '초기 상태(루트 노드)에서 현재 상태까지 거쳐 온 간선의 수')],
    ]),
    note('warn', h('b', {}, '트리가 아니라 그래프로 그려야 할 때도 있습니다. '),
      '트리에서 동일한 노드가 다시 생기면 탐색의 효율이 떨어지고 무한루프에 빠질 수 있습니다. ',
      '그래서 하노이 타워처럼 되돌아가는 길이 있는 문제는 「그래프」 구조로 나타냅니다.'));
}

/* ────────────────────────── 강 건너기 문제 ───────────────────────── */

const ACTORS = [
  { id: 0, nm: '농부', ic: '🧑‍🌾' },
  { id: 1, nm: '늑대', ic: '🐺' },
  { id: 2, nm: '양', ic: '🐑' },
  { id: 3, nm: '양배추', ic: '🥬' },
];

/** 상태를 4비트로 — [농부, 늑대, 양, 양배추], 0 = 왼쪽, 1 = 오른쪽 */
const bits = (st) => st.map((v) => String(v)).join('');

/** 농부가 없는 쪽에서 사고가 나는가 */
export function danger(st) {
  const [f, w, s, c] = st;
  if (w === s && f !== w) return '늑대가 양을 잡아먹었습니다!';
  if (s === c && f !== s) return '양이 양배추를 다 먹어 버렸습니다!';
  return null;
}

/** 안전한 상태 목록 (10개) */
export function safeStates() {
  const out = [];
  for (let i = 0; i < 16; i++) {
    const st = [(i >> 3) & 1, (i >> 2) & 1, (i >> 1) & 1, i & 1];
    if (!danger(st)) out.push(st);
  }
  return out;
}

/** 한 상태에서 갈 수 있는 안전한 상태들 (농부는 반드시 건너고, 같은 쪽 짐 하나까지) */
export function nextStates(st) {
  const out = [];
  const f = st[0];
  const cand = [null, 1, 2, 3];
  cand.forEach((take) => {
    if (take !== null && st[take] !== f) return; // 농부와 같은 쪽에 있어야 태울 수 있다
    const ns = st.slice();
    ns[0] = 1 - f;
    if (take !== null) ns[take] = 1 - f;
    if (!danger(ns)) out.push({ st: ns, take });
  });
  return out;
}

/** 너비 우선 탐색으로 최단 해를 찾는다 */
export function solveRiver() {
  const start = [0, 0, 0, 0];
  const goalKey = '1111';
  const q = [[start]];
  const seen = new Set([bits(start)]);
  while (q.length) {
    const path = q.shift();
    const cur = path[path.length - 1];
    if (bits(cur) === goalKey) return path;
    nextStates(cur).forEach(({ st }) => {
      const k = bits(st);
      if (seen.has(k)) return;
      seen.add(k);
      q.push(path.concat([st]));
    });
  }
  return null;
}

function riverCard() {
  let st = [0, 0, 0, 0];
  let boat = null; // 배에 실은 짐 (농부는 언제나 탄다)
  let history = [[0, 0, 0, 0]];
  let msg = null;
  let timer = null;

  const stage = h('div', {});
  const info = h('div', { style: { marginTop: '12px' } });
  const graphCv = makeCanvas(340, { pad: { l: 12, r: 12, t: 12, b: 12 } });

  const SOLUTION = solveRiver();

  function reset() {
    if (timer) { clearInterval(timer); timer = null; autoBtn.textContent = '🤖 컴퓨터가 풀어 주기'; }
    st = [0, 0, 0, 0]; boat = null; history = [[0, 0, 0, 0]]; msg = null;
    paint();
  }

  function cross() {
    const ns = st.slice();
    ns[0] = 1 - st[0];
    if (boat !== null) ns[boat] = 1 - st[boat];
    const bad = danger(ns);
    st = ns;
    boat = null;
    history.push(ns.slice());
    msg = bad;
    paint();
  }

  function undo() {
    if (history.length < 2) return;
    history.pop();
    st = history[history.length - 1].slice();
    boat = null; msg = null;
    paint();
  }

  function bank(side) {
    const here = ACTORS.filter((a) => st[a.id] === side && boat !== a.id);
    return h('div', { class: 'bank' },
      here.length ? here.map((a) => h('div', {
        class: 'actor' + (msg && (a.id === 2 || a.id === 3) ? ' eaten' : ''),
        title: st[0] === side || a.id === 0 ? '배에 태우려면 누르세요' : '농부가 반대편에 있습니다',
        onclick: () => {
          if (a.id === 0) return;              // 농부는 언제나 탄다
          if (st[a.id] !== st[0]) return;       // 농부와 같은 쪽에 있어야 한다
          boat = boat === a.id ? null : a.id;
          msg = null;
          paint();
        },
      }, a.ic, h('span', { class: 'nm' }, a.nm)))
        : h('span', { style: { color: 'var(--ink-soft)' } }, '아무도 없음'));
  }

  function paint() {
    const done = bits(st) === '1111';
    clear(stage);

    const boatCargo = boat === null ? '' : ACTORS[boat].ic;
    const river = h('div', { class: 'river' },
      h('div', {
        class: 'boat',
        style: { transform: `translateX(${st[0] ? 34 : -34}px)` },
      }, '🛶'),
      h('div', { style: { fontSize: '1.6rem', minHeight: '30px' } }, `🧑‍🌾${boatCargo}`),
      h('button', {
        type: 'button', class: 'btn small',
        disabled: !!msg,
        onclick: cross,
      }, st[0] ? '◀ 왼쪽으로 건너기' : '오른쪽으로 건너기 ▶'));

    add(stage, [
      h('div', {
        style: { display: 'grid', gridTemplateColumns: '1fr 190px 1fr', gap: '12px', alignItems: 'stretch' },
      },
      h('div', {}, h('div', { style: { fontWeight: '800', marginBottom: '5px', color: 'var(--ink-soft)' } }, '강 왼쪽 (출발)'), bank(0)),
      river,
      h('div', {}, h('div', { style: { fontWeight: '800', marginBottom: '5px', color: 'var(--ink-soft)' } }, '강 오른쪽 (목표)'), bank(1))),
    ]);

    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `상태 ${bits(st)}`),
        h('span', { class: 'chip' }, `농부 ${st[0] ? '오른쪽' : '왼쪽'}`),
        h('span', { class: 'chip' }, `건넌 횟수 ${history.length - 1}번`),
        boat !== null ? h('span', { class: 'chip warn' }, `배에 ${ACTORS[boat].nm} 실림`) : null),
      msg
        ? note('bad', h('b', {}, '❌ ' + msg + ' '), '농부가 없는 쪽에 둘을 함께 두면 안 됩니다. [한 번 되돌리기] 를 누르세요.')
        : done
          ? note('ok', h('b', {}, `🎉 모두 무사히 건넜습니다! ${history.length - 1}번 만에 성공했습니다. `),
            history.length - 1 === 7 ? '최소 횟수인 7번으로 풀었습니다!' : '최소 횟수는 7번입니다. 더 짧게 해 볼 수 있을까요?')
          : note('', '농부는 언제나 배를 탑니다. 태우고 싶은 것을 누른 뒤 [건너기] 를 누르세요. 배에는 농부 외에 하나만 실을 수 있습니다.'),
      h('h4', {}, '지금까지 지나온 상태 (농부 · 늑대 · 양 · 양배추)'),
      h('div', { class: 'row tight' },
        history.map((s, i) => h('span', {
          class: 'chip' + (i === history.length - 1 ? ' on' : ''),
          style: { fontFamily: 'var(--mono)' },
        }, bits(s)))),
      h('div', { class: 'scroll-x', style: { marginTop: '10px' } },
        table(['순서', '농부', '늑대', '양', '양배추', '수행 작업'],
          history.map((s, i) => {
            const prev = i ? history[i - 1] : null;
            let act = '시작';
            if (prev) {
              const moved = ACTORS.filter((a) => a.id !== 0 && s[a.id] !== prev[a.id]);
              act = `${s[0] ? '→' : '←'} 농부${moved.length ? ', ' + moved[0].nm : ' 혼자'}`;
            }
            return [
              i, ...s.map((v) => (v ? h('td', { class: 'filled' }, '오른쪽') : h('td', {}, '왼쪽'))),
              h('td', { class: 'left' }, act),
            ];
          }), { compact: true })),
    ]);

    drawGraph();
  }

  /* 안전한 상태 10개로 이루어진 상태 공간 그래프 */
  const LEVELS = [
    ['0000'], ['1010'], ['0010'], ['1110', '1011'], ['0100', '0001'], ['1101'], ['0101'], ['1111'],
  ];

  function drawGraph() {
    const ctx = graphCv.begin();
    const W = graphCv.w; const H = graphCv.hgt;
    const pos = new Map();
    const colW = (W - 40) / (LEVELS.length - 1);
    LEVELS.forEach((lv, i) => {
      lv.forEach((k, j) => {
        const y = lv.length === 1 ? H / 2 : H / 2 + (j === 0 ? -1 : 1) * 62;
        pos.set(k, [20 + colW * i, y]);
      });
    });

    const visited = new Set(history.map(bits));
    const pathPairs = new Set();
    for (let i = 1; i < history.length; i++) pathPairs.add(bits(history[i - 1]) + '|' + bits(history[i]));

    // 간선
    safeStates().forEach((s) => {
      const a = bits(s);
      if (!pos.has(a)) return;
      nextStates(s).forEach(({ st: t }) => {
        const b = bits(t);
        if (!pos.has(b)) return;
        const onPath = pathPairs.has(a + '|' + b) || pathPairs.has(b + '|' + a);
        ctx.save();
        ctx.strokeStyle = onPath ? COLORS.pink : '#dfe4ec';
        ctx.lineWidth = onPath ? 4 : 1.5;
        ctx.beginPath();
        ctx.moveTo(...pos.get(a)); ctx.lineTo(...pos.get(b));
        ctx.stroke();
        ctx.restore();
      });
    });

    // 노드
    pos.forEach(([x, y], k) => {
      const isNow = bits(st) === k;
      const seen = visited.has(k);
      ctx.save();
      ctx.fillStyle = isNow ? COLORS.pink : seen ? '#ffe0ec' : '#fff';
      ctx.strokeStyle = k === '0000' ? COLORS.green : k === '1111' ? COLORS.red : (seen ? COLORS.pink : '#c9d2df');
      ctx.lineWidth = isNow ? 4 : 2.5;
      ctx.beginPath();
      ctx.roundRect ? ctx.roundRect(x - 27, y - 15, 54, 30, 8) : ctx.rect(x - 27, y - 15, 54, 30);
      ctx.fill(); ctx.stroke();
      ctx.restore();
      label(ctx, k, x, y, { align: 'center', bold: true, size: 13, color: isNow ? '#fff' : COLORS.ink });
    });

    label(ctx, '초기 상태', pos.get('0000')[0], pos.get('0000')[1] - 26, { align: 'center', color: COLORS.green, bold: true, size: 11 });
    label(ctx, '목표 상태', pos.get('1111')[0], pos.get('1111')[1] - 26, { align: 'center', color: COLORS.red, bold: true, size: 11 });
  }

  const autoBtn = h('button', {
    type: 'button', class: 'btn ghost',
    onclick: () => {
      if (timer) { clearInterval(timer); timer = null; autoBtn.textContent = '🤖 컴퓨터가 풀어 주기'; return; }
      reset();
      autoBtn.textContent = '⏸ 멈추기';
      let i = 1;
      timer = setInterval(() => {
        if (i >= SOLUTION.length) {
          clearInterval(timer); timer = null; autoBtn.textContent = '🤖 컴퓨터가 풀어 주기'; return;
        }
        st = SOLUTION[i].slice();
        history.push(st.slice());
        i++;
        paint();
      }, 900);
    },
  }, '🤖 컴퓨터가 풀어 주기');

  drawNow(paint);
  window.addEventListener('resize', drawGraph);

  return card('🛶 강 건너기 문제',
    h('div', { class: 'lead' },
      '한 농부가 늑대, 양, 양배추를 배에 싣고 강을 건너려 합니다. 배에는 농부 외에 단 한 가지만 실을 수 있습니다. ',
      '양배추를 싣고 양과 늑대만 남겨 두면 늑대가 양을 잡아먹고, 양과 양배추만 남겨 두면 양이 양배추를 다 먹어 버립니다. ',
      '모두 안전하게 건너편으로 옮기는 방법은?'),
    stage,
    h('div', { class: 'row', style: { marginTop: '12px' } },
      h('button', { type: 'button', class: 'btn gray', onclick: undo }, '↩ 한 번 되돌리기'),
      h('button', { type: 'button', class: 'btn gray', onclick: reset }, '처음부터'),
      autoBtn),
    info,
    h('h4', {}, '상태 공간 그래프 — 안전한 상태 10개'),
    h('div', { class: 'lead' },
      '강의 왼쪽에 있으면 0, 오른쪽에 있으면 1 로 나타냅니다. 초기 상태는 ',
      h('code', { class: 'inline' }, '0000'), ', 목표 상태는 ', h('code', { class: 'inline' }, '1111'), ' 입니다. ',
      '전체 16가지 상태 중 사고가 나지 않는 것은 10가지뿐입니다. 지나온 길이 분홍색으로 칠해집니다.'),
    graphCv.el,
    answerBlock('✅ 정답 — 최소 몇 번 건너야 할까',
      h('p', {}, h('b', {}, '7번'), ' 입니다. 위 그래프에서 0000 에서 1111 까지 가는 가장 짧은 길이 간선 7개짜리입니다.'),
      h('p', {}, '길은 두 가지가 있습니다 (그래프가 좌우 대칭이라서).'),
      h('p', { class: 'mono' }, '① 0000 → 1010 → 0010 → 1110 → 0100 → 1101 → 0101 → 1111'),
      h('p', { class: 'mono' }, '② 0000 → 1010 → 0010 → 1011 → 0001 → 1101 → 0101 → 1111'),
      h('p', {}, '말로 옮기면 ① 농부+양 건너기 → ② 농부 혼자 돌아오기 → ③ 농부+늑대 건너기 → ',
        '④ 농부+양 돌아오기 → ⑤ 농부+양배추 건너기 → ⑥ 농부 혼자 돌아오기 → ⑦ 농부+양 건너기.'),
      h('p', {}, h('b', {}, '핵심은 ④ 입니다. '), '한 번 건너간 양을 다시 데리고 돌아오는 이 「뒷걸음」이 없으면 절대 풀리지 않습니다. ',
        '탐색에서 「목표에 가까워 보이는 길만 고집하면 안 된다」는 것을 보여 주는 좋은 예입니다.')));
}

/* ─────────────────────────── 하노이 타워 ────────────────────────── */

function hanoiCard() {
  let n = 3;
  let pegs = [[3, 2, 1], [], []]; // 큰 원판이 아래
  let picked = -1;
  let moves = 0;
  const stage = h('div', {});
  const info = h('div', { style: { marginTop: '10px' } });
  const graphCv = makeCanvas(300, { pad: { l: 12, r: 12, t: 12, b: 12 } });

  const COLORSET = ['#1e6fd9', '#0f9d6e', '#d9781e', '#6b4fd8'];

  function reset(size = n) {
    n = size;
    pegs = [Array.from({ length: n }, (_, i) => n - i), [], []];
    picked = -1; moves = 0;
    paint();
  }

  function clickPeg(i) {
    if (picked < 0) {
      if (pegs[i].length) picked = i;
    } else if (picked === i) {
      picked = -1;
    } else {
      const disk = pegs[picked][pegs[picked].length - 1];
      const top = pegs[i][pegs[i].length - 1];
      if (top === undefined || disk < top) {
        pegs[picked].pop();
        pegs[i].push(disk);
        moves++;
        picked = -1;
      } else {
        picked = -1;
      }
    }
    paint();
  }

  function paint() {
    clear(stage);
    const board = h('div', { class: 'row', style: { alignItems: 'flex-end', gap: '10px' } });
    ['A', 'B', 'C'].forEach((nm, i) => {
      const col = h('div', {
        style: {
          flex: '1', minHeight: '180px', display: 'flex', flexDirection: 'column-reverse',
          alignItems: 'center', gap: '4px', padding: '10px 6px 0',
          borderBottom: '8px solid #8b6f4e', borderRadius: '4px',
          background: picked === i ? '#eef4ff' : '#fbfcfe',
          cursor: 'pointer',
          position: 'relative',
        },
        onclick: () => clickPeg(i),
      },
      pegs[i].map((d, k) => h('div', {
        style: {
          width: (36 + d * 26) + 'px', height: '24px', borderRadius: '12px',
          background: COLORSET[(d - 1) % COLORSET.length], color: '#fff',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontWeight: '800', fontSize: '0.9rem',
          outline: picked === i && k === pegs[i].length - 1 ? '3px solid #d9781e' : 'none',
        },
      }, String(d))),
      h('div', {
        style: { position: 'absolute', bottom: '-30px', fontWeight: '800', color: 'var(--ink-soft)' },
      }, nm));
      board.append(col);
    });
    add(stage, [board, h('div', { style: { height: '26px' } })]);

    const done = pegs[2].length === n;
    const min = 2 ** n - 1;
    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `${moves}번 옮김`),
        h('span', { class: 'chip' }, `최소 ${min}번 (2^${n} − 1)`),
        h('span', { class: 'chip', style: { fontFamily: 'var(--mono)' } }, `상태 ${stateOf()}`)),
      done
        ? note('ok', h('b', {}, `🎉 완성! ${moves}번 만에 옮겼습니다. `),
          moves === min ? '최소 횟수입니다!' : `최소는 ${min}번입니다.`)
        : note('', '기둥을 눌러 맨 위 원판을 집고, 다른 기둥을 눌러 놓습니다. 큰 원판을 작은 원판 위에 놓을 수 없습니다.'),
    ]);
    drawGraph();
  }

  /** 상태 표기 — 1번 원판의 기둥, 2번 원판의 기둥 … 순서로 (학습지 방식) */
  function stateOf() {
    const where = [];
    for (let d = 1; d <= n; d++) {
      const i = pegs.findIndex((p) => p.includes(d));
      where.push('ABC'[i]);
    }
    return where.join('');
  }

  /* 원판 2개짜리 상태 공간 그래프 — 9칸 (학습지 22쪽) */
  const H2 = ['AA', 'BA', 'CA', 'AB', 'BB', 'CB', 'AC', 'BC', 'CC'];

  function h2Neighbors(s) {
    const out = [];
    const [d1, d2] = s.split('');
    // 1번(작은) 원판은 언제나 옮길 수 있다
    'ABC'.split('').forEach((p) => { if (p !== d1) out.push(p + d2); });
    // 2번 원판은 그 기둥에 1번이 없고, 가는 곳에도 1번이 없어야 한다
    'ABC'.split('').forEach((p) => {
      if (p === d2) return;
      if (d1 === d2) return;   // 2번 위에 1번이 얹혀 있음
      if (d1 === p) return;    // 가려는 기둥에 1번이 있음
      out.push(d1 + p);
    });
    return out;
  }

  function drawGraph() {
    const ctx = graphCv.begin();
    const W = graphCv.w; const H = graphCv.hgt;
    /* 시에르핀스키 삼각형 배치 — 꼭짓점 AA / BB / CC */
    const pos = {
      AA: [W * 0.5, 30],
      BA: [W * 0.5 - 46, 100], CA: [W * 0.5 + 46, 100],
      AB: [W * 0.5 - 92, 170], AC: [W * 0.5 + 92, 170],
      BB: [W * 0.5 - 138, 240], CB: [W * 0.5 - 46, 240],
      BC: [W * 0.5 + 46, 240], CC: [W * 0.5 + 138, 240],
    };

    const cur = n === 2 ? stateOf() : null;

    H2.forEach((s) => {
      h2Neighbors(s).forEach((t) => {
        if (!pos[t]) return;
        ctx.save();
        ctx.strokeStyle = '#c9d2df'; ctx.lineWidth = 2;
        ctx.beginPath(); ctx.moveTo(...pos[s]); ctx.lineTo(...pos[t]); ctx.stroke();
        ctx.restore();
      });
    });

    H2.forEach((s) => {
      const [x, y] = pos[s];
      const isNow = s === cur;
      ctx.save();
      ctx.fillStyle = isNow ? COLORS.pink : (s === 'AA' ? '#e6f6ef' : s === 'CC' ? '#fdeaea' : '#fff');
      ctx.strokeStyle = s === 'AA' ? COLORS.green : s === 'CC' ? COLORS.red : '#c9d2df';
      ctx.lineWidth = isNow ? 4 : 2.5;
      ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      label(ctx, s, x, y, { align: 'center', bold: true, size: 14, color: isNow ? '#fff' : COLORS.ink });
    });

    label(ctx, '초기 상태 AA', pos.AA[0], pos.AA[1] - 30, { align: 'center', color: COLORS.green, bold: true, size: 11 });
    label(ctx, '목표 상태 CC', pos.CC[0], pos.CC[1] + 36, { align: 'center', color: COLORS.red, bold: true, size: 11 });
    if (n !== 2) {
      label(ctx, '(원판 2개일 때만 지금 위치가 표시됩니다)', W / 2, H - 10, { align: 'center', color: COLORS.soft, size: 11 });
    }
  }

  reset(3);
  drawNow(paint);
  window.addEventListener('resize', drawGraph);

  return card('🗼 하노이 타워',
    h('div', { class: 'lead' },
      'A 영역의 원판을 모두 C 영역으로 보내는 것이 목적입니다. ',
      '① 한 번에 맨 위 원판 하나만 옮길 수 있다 ② 반드시 큰 원판 위에 작은 원판이 올라가야 한다.'),
    h('div', { class: 'row' },
      h('label', { class: 'field' }, '원판 수'),
      [2, 3, 4].map((k) => h('button', {
        type: 'button', class: 'btn ' + (k === n ? '' : 'ghost') + ' small',
        onclick: () => reset(k),
      }, `${k}개`)),
      h('button', { type: 'button', class: 'btn gray small', onclick: () => reset(n) }, '처음부터')),
    h('div', { style: { height: '12px' } }),
    stage, info,
    h('h4', {}, '원판 2개일 때의 상태 공간 (학습지 22쪽)'),
    h('div', { class: 'lead' },
      '상태를 「1번 원판의 기둥 위치 + 2번 원판의 기둥 위치」로 나타냅니다. ',
      '초기 상태는 ', h('code', { class: 'inline' }, 'AA'), ', 목표 상태는 ', h('code', { class: 'inline' }, 'CC'), ' 입니다. ',
      '되돌아가는 길이 있으므로 트리가 아니라 ', h('b', {}, '그래프'), ' 로 그립니다.'),
    graphCv.el,
    answerBlock('✅ 정답 — 초기 상태에서 목표 상태까지의 최단 경로',
      h('p', { class: 'mono' }, 'AA → BA → BC → CC'),
      h('p', {}, '① 1번(작은) 원판을 A → B 로 옮긴다 (AA → BA)'),
      h('p', {}, '② 2번(큰) 원판을 A → C 로 옮긴다 (BA → BC)'),
      h('p', {}, '③ 1번 원판을 B → C 로 옮긴다 (BC → CC)'),
      h('p', {}, '모두 ', h('b', {}, '3번'), ' 입니다. 원판이 n 개면 최소 이동 횟수는 2ⁿ − 1 입니다. ',
        '원판 3개면 7번, 4개면 15번이지요. 위에서 직접 확인해 보세요.')));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '문제 해결 과정에서 나타날 수 있는 모든 상태의 집합을 무엇이라 하나요?',
        answer: ['상태 공간', '상태공간', 'state space'],
        explain: '초기 상태부터 목표 상태까지, 갈 수 있는 모든 상태를 모은 것입니다.',
        width: 180,
      },
      {
        q: '상태 공간 트리에서 「노드」는 무엇을 나타내나요?',
        answer: ['상태'],
        explain: '간선(링크)은 한 상태에서 다른 상태로 가기 위한 조건·행동·규칙을 나타냅니다.',
        width: 140,
      },
      {
        q: '강 건너기 문제에서 농부가 최소 몇 번 강을 건너야 하나요?',
        answer: ['7', '7번', '7회'],
        explain: '상태 공간 그래프에서 0000 → 1111 의 최단 경로가 간선 7개입니다.',
        width: 120,
      },
      {
        q: '원판이 3개인 하노이 타워의 최소 이동 횟수는?',
        answer: ['7', '7번', '7회'],
        explain: '2³ − 1 = 7 입니다.',
        width: 120,
      },
      {
        q: '동일한 노드가 재생성되면 탐색 효율이 떨어지고 무한루프에 빠질 수 있어, 트리 대신 무엇으로 나타내나요?',
        answer: ['그래프', 'graph'],
        explain: '하노이 타워는 되돌아가는 길이 있으므로 그래프로 나타냅니다.',
        width: 140,
      },
    ], { revealOnWrong: true }));
}
