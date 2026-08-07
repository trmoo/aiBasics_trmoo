/* ============================================================================
 * puzzle.js — 학습지 24쪽 · 27~29쪽 「8-퍼즐로 보는 탐색 알고리즘」
 *
 *   ① 직접 풀어 보기 — 타일을 눌러 옮긴다
 *   ② 휴리스틱 계산기 — 두 가지 h(n) 을 지금 판에 대해 계산해 표로 보여 준다
 *   ③ 네 가지 탐색을 실제로 돌려 본다
 *        너비 우선 · 깊이 우선 · A*(불일치 타일 수) · A*(맨해튼 거리)
 *      → 「몇 개의 상태를 살펴봤는가」를 견주면 휴리스틱의 힘이 한눈에 보인다
 *
 * 학습지 초기 상태 2 8 3 / 1 _ 4 / 7 6 5 · 목표 상태 1 2 3 / 8 _ 4 / 7 6 5 를 그대로 썼다.
 *
 * © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다.
 * 그 밖의 이용(재배포·2차 저작물·수업 외 목적)은 먼저 문의해 주세요.
 * 자세한 이용 범위는 이 저장소의 LICENSE 파일에 적어 두었습니다.
 * ========================================================================== */

import { h, add, clear, card, sheetHead, note, answer, answerBlock, quizSet, table, comma, pillGroup, clearScreenInterval, screenInterval } from '../../lib/ui.js';

export const START = [2, 8, 3, 1, 0, 4, 7, 6, 5];
export const GOAL = [1, 2, 3, 8, 0, 4, 7, 6, 5];
const GOALKEY = GOAL.join('');

/* 빈칸이 움직이는 네 방향 */
const DIRS = {
  up: { d: -3, nm: '상(UP)', ok: (i) => i >= 3 },
  down: { d: 3, nm: '하(DOWN)', ok: (i) => i <= 5 },
  left: { d: -1, nm: '좌(LEFT)', ok: (i) => i % 3 !== 0 },
  right: { d: 1, nm: '우(RIGHT)', ok: (i) => i % 3 !== 2 },
};

export const ORDERS = {
  ccw: { nm: '상-좌-하-우 (반시계, 학습지 24쪽)', seq: ['up', 'left', 'down', 'right'] },
  udlr: { nm: '위-아래-왼쪽-오른쪽 (학습지 28쪽)', seq: ['up', 'down', 'left', 'right'] },
};

const key = (s) => s.join('');

export function moves(s, seq) {
  const i = s.indexOf(0);
  const out = [];
  seq.forEach((k) => {
    const D = DIRS[k];
    if (!D.ok(i)) return;
    const ns = s.slice();
    ns[i] = ns[i + D.d];
    ns[i + D.d] = 0;
    out.push({ st: ns, dir: k });
  });
  return out;
}

/** h₁ — 목표 상태와 일치하지 않는 숫자 타일의 수 (공백 제외) */
export const hMisplaced = (s) => s.reduce((acc, v, i) => acc + (v !== 0 && v !== GOAL[i] ? 1 : 0), 0);

/** h₂ — 각 타일이 제자리까지 가야 하는 거리(맨해튼)의 합 (공백 제외) */
export function hManhattan(s) {
  let sum = 0;
  s.forEach((v, i) => {
    if (v === 0) return;
    const g = GOAL.indexOf(v);
    sum += Math.abs(Math.floor(i / 3) - Math.floor(g / 3)) + Math.abs((i % 3) - (g % 3));
  });
  return sum;
}

/* ────────────────────────── 탐색 알고리즘들 ─────────────────────── */

const LIMIT = 200000;   // 살펴볼 상태 수 상한 (8-퍼즐의 전체 상태는 181,440 가지)
const DEPTH_LIMIT = 26; // 깊이 우선 탐색의 깊이 제한

export function searchPuzzle(start, algo, seq) {
  const t0 = performance.now();
  const parent = new Map();
  const gScore = new Map([[key(start), 0]]);
  let expanded = 0;
  let maxOpen = 1;

  if (algo === 'dfs') {
    const stack = [{ st: start, d: 0 }];
    const seen = new Set([key(start)]);
    while (stack.length && expanded < LIMIT) {
      const { st, d } = stack.pop();
      expanded++;
      maxOpen = Math.max(maxOpen, stack.length);
      if (key(st) === GOALKEY) return finish(st);
      if (d >= DEPTH_LIMIT) continue;
      const kids = moves(st, seq);
      for (let i = kids.length - 1; i >= 0; i--) {   // 스택이라 거꾸로 넣는다
        const k = key(kids[i].st);
        if (seen.has(k)) continue;
        seen.add(k);
        parent.set(k, { from: key(st), st: kids[i].st, dir: kids[i].dir });
        stack.push({ st: kids[i].st, d: d + 1 });
      }
    }
    return finish(null);
  }

  if (algo === 'bfs') {
    const q = [start];
    const seen = new Set([key(start)]);
    let head = 0;
    while (head < q.length && expanded < LIMIT) {
      const st = q[head++];
      expanded++;
      maxOpen = Math.max(maxOpen, q.length - head);
      if (key(st) === GOALKEY) return finish(st);
      moves(st, seq).forEach((m) => {
        const k = key(m.st);
        if (seen.has(k)) return;
        seen.add(k);
        parent.set(k, { from: key(st), st: m.st, dir: m.dir });
        q.push(m.st);
      });
    }
    return finish(null);
  }

  /* A* — f(n) = g(n) + h(n) */
  const hf = algo === 'astar1' ? hMisplaced : hManhattan;
  const open = [{ st: start, g: 0, f: hf(start) }];
  const closed = new Set();
  while (open.length && expanded < LIMIT) {
    open.sort((a, b) => a.f - b.f || a.g - b.g);
    const cur = open.shift();
    const ck = key(cur.st);
    if (closed.has(ck)) continue;
    closed.add(ck);
    expanded++;
    maxOpen = Math.max(maxOpen, open.length);
    if (ck === GOALKEY) return finish(cur.st);
    moves(cur.st, seq).forEach((m) => {
      const k = key(m.st);
      if (closed.has(k)) return;
      const g = cur.g + 1;
      if (gScore.has(k) && gScore.get(k) <= g) return;
      gScore.set(k, g);
      parent.set(k, { from: ck, st: m.st, dir: m.dir });
      open.push({ st: m.st, g, f: g + hf(m.st) });
    });
  }
  return finish(null);

  /** 부모 기록을 거꾸로 따라가 초기 상태부터의 길을 만든다 */
  function finish(goalSt) {
    const ms = performance.now() - t0;
    if (!goalSt) return { ok: false, expanded, maxOpen, ms, path: [] };
    const path = [];
    let k = key(goalSt);
    let guard = 0;
    while (k !== key(start) && guard++ < 500) {
      const p = parent.get(k);
      if (!p) break;
      path.unshift({ st: p.st, dir: p.dir });
      k = p.from;
    }
    path.unshift({ st: start, dir: null });
    return { ok: true, expanded, maxOpen, ms, path };
  }
}

/* ─────────────────────────── 화면 ───────────────────────────────── */

export function render(root) {
  add(root, sheetHead('학습지 24쪽 · 27~29쪽', '8-퍼즐 — 탐색 알고리즘 겨루기',
    ['[12인기04-02]', '[12인기04-03]'],
    [
      '8-퍼즐의 상태와 간선(빈칸의 이동)을 정의할 수 있다.',
      '두 가지 휴리스틱을 직접 계산할 수 있다.',
      '맹목적 탐색과 A* 가 살펴보는 상태의 수를 견주어 휴리스틱의 효과를 설명할 수 있다.',
    ]));

  root.append(playCard());
  root.append(heurCard());
  root.append(compareCard());
  root.append(quizCard());
}

/* 판 하나를 그린다 */
function board(st, { small = false, onClick = null, hi = null } = {}) {
  const b = h('div', { class: 'puz' + (small ? ' small' : '') });
  st.forEach((v, i) => {
    const good = v !== 0 && v === GOAL[i];
    b.append(h('div', {
      class: 't' + (v === 0 ? ' blank' : good ? ' good' : ''),
      style: hi === i ? { outline: '3px solid #ffd54a' } : {},
      onclick: onClick ? () => onClick(i) : null,
    }, v === 0 ? '' : String(v)));
  });
  return b;
}

let cur = START.slice();
let moveCount = 0;

/* ─────────────────────── ① 직접 풀어 보기 ──────────────────────── */

function playCard() {
  cur = START.slice();
  moveCount = 0;
  const box = h('div', {});
  const info = h('div', { style: { marginTop: '10px' } });

  function slide(i) {
    const b = cur.indexOf(0);
    const ok = (Math.abs(i - b) === 3) || (Math.abs(i - b) === 1 && Math.floor(i / 3) === Math.floor(b / 3));
    if (!ok) return;
    cur[b] = cur[i]; cur[i] = 0;
    moveCount++;
    paint();
  }

  function paint() {
    clear(box);
    add(box, [
      h('div', { class: 'row top', style: { gap: '30px' } },
        h('div', {},
          h('div', { style: { fontWeight: '800', marginBottom: '6px', color: 'var(--ink-soft)' } }, '지금 상태 (타일을 눌러 옮기세요)'),
          board(cur, { onClick: slide })),
        h('div', {},
          h('div', { style: { fontWeight: '800', marginBottom: '6px', color: 'var(--ink-soft)' } }, '목표 상태'),
          board(GOAL))),
    ]);

    const done = key(cur) === GOALKEY;
    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `${moveCount}번 옮김`),
        h('span', { class: 'chip' }, `h₁ 불일치 타일 ${hMisplaced(cur)}개`),
        h('span', { class: 'chip' }, `h₂ 맨해튼 거리 합 ${hManhattan(cur)}`)),
      done
        ? note('ok', h('b', {}, `🎉 맞췄습니다! ${moveCount}번 만에 풀었습니다. `),
          moveCount === 4 ? '최소 횟수인 4번입니다!' : '최소 횟수는 4번입니다. 다시 해 보세요.')
        : note('', '빈칸과 붙어 있는 타일만 옮길 수 있습니다. 초록색은 이미 제자리에 있는 타일입니다.'),
    ]);
  }

  paint();

  return card('🎮 8-퍼즐 직접 풀어 보기',
    h('div', { class: 'lead' },
      '숫자 타일의 이동을 하나하나 간선으로 정의할 수도 있지만, 다르게 생각하면 ',
      h('b', {}, '빈칸이 위·아래·왼쪽·오른쪽으로 이동'), ' 한다고 볼 수 있습니다. ',
      '그래서 빈칸의 이동 방향 네 가지를 간선의 조건(행동)으로 정의합니다.'),
    box, info,
    h('div', { class: 'row', style: { marginTop: '12px' } },
      h('button', { type: 'button', class: 'btn gray', onclick: () => { cur = START.slice(); moveCount = 0; paint(); } }, '초기 상태로'),
      h('button', {
        type: 'button', class: 'btn gray',
        onclick: () => {
          // 목표에서 거꾸로 무작위로 섞는다 (반드시 풀 수 있는 상태만 나온다)
          let s = GOAL.slice();
          for (let i = 0; i < 60; i++) {
            const ms = moves(s, ['up', 'down', 'left', 'right']);
            s = ms[Math.floor(Math.random() * ms.length)].st;
          }
          cur = s; moveCount = 0; paint();
        },
      }, '🎲 어려운 문제로 섞기')));
}

/* ─────────────────── ② 휴리스틱 계산기 ────────────────────────── */

function heurCard() {
  const out = h('div', {});
  const EX = [2, 8, 3, 1, 6, 4, 7, 0, 5]; // 학습지 28쪽 예시: 2 8 3 / 1 6 4 / 7 _ 5

  function calcTable(st) {
    const rows = [];
    const nums = [1, 2, 3, 4, 5, 6, 7, 8];
    const dists = nums.map((v) => {
      const i = st.indexOf(v); const g = GOAL.indexOf(v);
      return Math.abs(Math.floor(i / 3) - Math.floor(g / 3)) + Math.abs((i % 3) - (g % 3));
    });
    rows.push([h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, '타일')].concat(nums.map((v) => h('td', { style: { fontWeight: '800' } }, String(v)))));
    rows.push([h('td', { style: { fontWeight: '800', background: '#eef1f7' } }, '거리')]
      .concat(dists.map((d) => h('td', { class: d ? 'out' : '' }, String(d)))));
    return { tbl: table([], rows, { compact: true }), sum: dists.reduce((a, b) => a + b, 0), dists };
  }

  function paint() {
    const a = calcTable(cur);
    const b = calcTable(EX);
    clear(out);
    add(out, [
      h('h4', {}, '① h₁ — 목표 상태와 일치하지 않는 숫자 타일의 수 (공백 제외)'),
      h('div', { class: 'row top', style: { gap: '24px' } },
        board(cur, { small: false }),
        h('div', {},
          h('div', { class: 'row tight' },
            [1, 2, 3, 4, 5, 6, 7, 8].map((v) => h('span', {
              class: 'chip' + (cur.indexOf(v) === GOAL.indexOf(v) ? ' ok' : ' bad'),
            }, `${v} ${cur.indexOf(v) === GOAL.indexOf(v) ? '제자리' : '아님'}`)),
          ),
          h('div', { class: 'row tight', style: { marginTop: '10px' } },
            h('span', { class: 'chip on' }, `h₁(현재 판) = ${hMisplaced(cur)}`)))),

      h('h4', {}, '② h₂ — 각 타일의 목표 위치까지 거리의 합 (맨해튼 거리, 공백 제외)'),
      h('div', { class: 'row top', style: { gap: '24px' } },
        h('div', {},
          h('div', { style: { fontWeight: '800', marginBottom: '5px', color: 'var(--ink-soft)' } }, '지금 판'),
          board(cur)),
        h('div', { style: { flex: '1', minWidth: '260px' } },
          a.tbl,
          h('div', { class: 'row tight', style: { marginTop: '8px' } },
            h('span', { class: 'chip on' }, `h₂(현재 판) = ${a.dists.filter(Boolean).join(' + ') || 0} = ${a.sum}`)))),

      h('h4', {}, '학습지 28쪽 예시로 확인'),
      h('div', { class: 'row top', style: { gap: '24px' } },
        h('div', {},
          h('div', { style: { fontWeight: '800', marginBottom: '5px', color: 'var(--ink-soft)' } }, '현재 상태'),
          board(EX)),
        h('div', {},
          h('div', { style: { fontWeight: '800', marginBottom: '5px', color: 'var(--ink-soft)' } }, '목표 상태'),
          board(GOAL)),
        h('div', { style: { flex: '1', minWidth: '260px' } },
          b.tbl,
          h('div', { class: 'row tight', style: { marginTop: '8px' } },
            h('span', { class: 'chip ok' }, `h(n) = ${b.dists.filter(Boolean).join(' + ')} = ${b.sum}`)))),
    ]);
  }

  const btn = h('button', { type: 'button', class: 'btn ghost small', onclick: paint }, '🔄 위 판으로 다시 계산');
  paint();

  return card('🧭 휴리스틱 h(n) 을 직접 계산해 보기',
    h('div', { class: 'lead' },
      '휴리스틱은 신속하게 판단을 내리게 돕는 ', answer('경험적 지식'), ' 이나 추정 정보입니다. ',
      '8-퍼즐에서 h(n) 을 정하는 방법은 여러 가지가 있고, 어떻게 정하느냐에 따라 탐색의 성능이 달라집니다.'),
    h('div', { class: 'formula' }, 'f(n) = g(n) + h(n)'),
    h('div', { class: 'row tight', style: { marginTop: '8px' } },
      h('span', { class: 'chip' }, 'f(n) : 평가함수 — 최종 비용 추정치'),
      h('span', { class: 'chip' }, 'g(n) : 초기 상태에서 현재 상태까지의 실제 비용'),
      h('span', { class: 'chip' }, 'h(n) : 현재 상태에서 목표까지 남은 예상 비용')),
    h('div', { style: { height: '10px' } }),
    btn,
    out,
    note('', h('b', {}, '어느 휴리스틱이 더 좋을까요? '),
      'h₂(맨해튼)가 h₁(불일치 타일 수)보다 언제나 크거나 같습니다. ',
      '「제자리가 아닌 타일」은 적어도 1칸은 움직여야 하니까요. ',
      h('b', {}, '실제 남은 비용을 넘지 않으면서 더 큰 값을 주는 휴리스틱이 더 좋습니다'), '. ',
      '목표에서 먼 길을 더 확실하게 걸러 내기 때문입니다. 아래에서 직접 확인해 보세요.'));
}

/* ─────────────────── ③ 네 가지 탐색 겨루기 ─────────────────────── */

const ALGOS = [
  { id: 'bfs', nm: '너비 우선 탐색', kind: '맹목적' },
  { id: 'dfs', nm: `깊이 우선 탐색 (깊이 ${DEPTH_LIMIT} 제한)`, kind: '맹목적' },
  { id: 'astar1', nm: 'A* — h₁ 불일치 타일 수', kind: '정보이용' },
  { id: 'astar2', nm: 'A* — h₂ 맨해튼 거리', kind: '정보이용' },
];

function compareCard() {
  let order = 'ccw';
  let results = null;
  let replay = null;
  let step = 0;
  let timer = null;

  const out = h('div', {});
  const replayBox = h('div', { style: { marginTop: '14px' } });

  const oPick = pillGroup(Object.entries(ORDERS).map(([id, v]) => ({ id, label: v.nm })), {
    value: 'ccw', onPick: (v) => { order = v; results = null; paint(); },
  });

  function runAll() {
    const seq = ORDERS[order].seq;
    results = ALGOS.map((a) => ({ ...a, r: searchPuzzle(cur.slice(), a.id, seq) }));
    replay = null;
    paint();
  }

  function paint() {
    clear(out);
    if (!results) {
      add(out, [note('', '위 「직접 풀어 보기」의 판을 그대로 씁니다. [네 가지 탐색 모두 돌리기] 를 눌러 보세요.')]);
      clear(replayBox);
      return;
    }

    const best = Math.min(...results.filter((x) => x.r.ok).map((x) => x.r.expanded));
    add(out, [
      table(['알고리즘', '갈래', '살펴본 상태 수', 'OPEN 최대 크기', '찾은 경로 길이', '걸린 시간', ''],
        results.map((x) => [
          h('td', { class: 'left', style: { fontWeight: '800' } }, x.nm),
          h('td', {}, h('span', { class: 'chip' + (x.kind === '정보이용' ? ' ok' : '') }, x.kind)),
          h('td', {
            class: 'mono',
            style: x.r.ok && x.r.expanded === best ? { background: '#e6f6ef', fontWeight: '800', color: 'var(--ok)' } : {},
          }, comma(x.r.expanded) + (x.r.expanded >= LIMIT ? ' (상한)' : '')),
          h('td', { class: 'mono' }, comma(x.r.maxOpen)),
          h('td', { class: 'mono', style: { fontWeight: '800' } }, x.r.ok ? `${x.r.path.length - 1}번 이동` : '못 찾음'),
          h('td', { class: 'mono' }, x.r.ms.toFixed(1) + 'ms'),
          x.r.ok
            ? h('td', {}, h('button', {
              type: 'button', class: 'btn ghost tiny',
              onclick: () => { replay = x; step = 0; paintReplay(); },
            }, '풀이 보기'))
            : h('td', { class: 'dim' }, '–'),
        ])),
      h('div', { style: { marginTop: '12px' } },
        note('ok', h('b', {}, '무엇을 읽어야 하나 — 「살펴본 상태 수」 를 보세요. '),
          `너비 우선은 ${comma(results[0].r.expanded)}개를 살펴봤고, `
          + `A*(맨해튼)는 ${comma(results[3].r.expanded)}개만 살펴보고도 같은 길이의 답을 찾았습니다. `
          + '휴리스틱이 「목표에 가까워 보이는 쪽」을 먼저 열어 보게 해서, 불필요한 경로를 배제했기 때문입니다.')),
      results[1].r.ok && results[0].r.ok && results[1].r.path.length > results[0].r.path.length
        ? note('bad', h('b', {}, '깊이 우선 탐색을 보세요. '),
          `${results[1].r.path.length - 1}번 이동하는 길을 찾았습니다. 너비 우선이 찾은 ${results[0].r.path.length - 1}번보다 훨씬 깁니다. `
          + '한 방향으로 끝까지 들어갔다가 겨우 도착한 것이라, 최단 경로가 아닙니다.')
        : !results[1].r.ok
          ? note('bad', h('b', {}, '깊이 우선 탐색이 깊이 제한 안에서 답을 못 찾았습니다. '),
            `깊이 ${DEPTH_LIMIT} 까지만 들어가도록 막아 두었습니다. 제한이 없으면 브라우저가 멈출 만큼 깊이 들어갑니다.`)
          : null,
      results[2].r.ok && results[3].r.ok
        ? note('', h('b', {}, '두 휴리스틱을 견주면 '),
          `h₁(불일치 타일 수)은 ${comma(results[2].r.expanded)}개, h₂(맨해튼 거리)는 ${comma(results[3].r.expanded)}개를 살펴봤습니다. `
          + '더 정확한 추정을 주는 휴리스틱일수록 헛걸음이 줄어듭니다.')
        : null,
    ]);
  }

  function paintReplay() {
    if (!replay) { clear(replayBox); return; }
    const p = replay.r.path;
    const st = p[step].st;
    clear(replayBox);
    add(replayBox, [
      h('h4', {}, `${replay.nm} 의 풀이 — 모두 ${p.length - 1}번 이동`),
      h('div', { class: 'row top', style: { gap: '24px' } },
        board(st),
        h('div', {},
          h('div', { class: 'row tight' },
            h('span', { class: 'chip on' }, `${step} / ${p.length - 1} 걸음`),
            p[step].dir ? h('span', { class: 'chip' }, `빈칸 ${DIRS[p[step].dir].nm}`) : h('span', { class: 'chip' }, '초기 상태'),
            h('span', { class: 'chip' }, `g=${step}`),
            h('span', { class: 'chip' }, `h₂=${hManhattan(st)}`),
            h('span', { class: 'chip' }, `f=${step + hManhattan(st)}`)),
          h('div', { class: 'row', style: { marginTop: '10px' } },
            h('button', { type: 'button', class: 'btn ghost small', onclick: () => { step = Math.max(0, step - 1); paintReplay(); } }, '◀'),
            h('button', { type: 'button', class: 'btn ghost small', onclick: () => { step = Math.min(p.length - 1, step + 1); paintReplay(); } }, '▶'),
            h('button', {
              type: 'button', class: 'btn small',
              onclick: () => {
                if (timer) { clearScreenInterval(timer); timer = null; return; }
                step = 0;
                timer = screenInterval(() => {
                  step++;
                  if (step >= p.length - 1) { step = p.length - 1; clearScreenInterval(timer); timer = null; }
                  paintReplay();
                }, 600);
              },
            }, '▶ 자동 재생')))),
      h('div', { class: 'row', style: { marginTop: '12px', gap: '8px' } },
        p.map((x, i) => h('div', {
          style: { opacity: i === step ? '1' : '0.45', cursor: 'pointer' },
          onclick: () => { step = i; paintReplay(); },
        }, board(x.st, { small: true })))),
    ]);
  }

  paint();

  return card('⚔️ 네 가지 탐색을 실제로 돌려 견주기',
    h('div', { class: 'lead' },
      '위 「직접 풀어 보기」의 판이 초기 상태가 됩니다. [🎲 어려운 문제로 섞기] 를 누른 뒤 다시 돌려 보면 차이가 훨씬 커집니다.'),
    h('div', { class: 'row' }, h('label', { class: 'field' }, '자식 상태 생성 순서'), oPick.el),
    h('div', { class: 'row', style: { marginTop: '10px' } },
      h('button', { type: 'button', class: 'btn', onclick: runAll }, '⚔️ 네 가지 탐색 모두 돌리기')),
    h('div', { style: { height: '10px' } }),
    out, replayBox,
    table(['알고리즘', '기준', '특징'], [
      [h('td', { style: { fontWeight: '800' } }, 'A* 탐색'),
        h('td', { class: 'mono' }, 'g(n) + h(n)'),
        h('td', { class: 'left' }, 'g(n)+h(n) 을 사용하여 최상 우선 탐색')],
    ]));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 문제',
    quizSet([
      {
        q: '8-퍼즐에서 간선(행동)은 무엇의 이동으로 정의하나요?',
        answer: ['빈칸', '공백', '빈 칸', '빈칸의 이동'],
        explain: '숫자 타일 8개의 이동을 모두 정의하는 대신, 빈칸이 위·아래·왼쪽·오른쪽으로 움직인다고 보면 훨씬 간단합니다.',
        width: 160,
      },
      {
        q: '휴리스틱(heuristic)은 무엇을 뜻하나요?',
        answer: ['경험적 지식', '경험적지식', '추정 정보', '경험적 지식이나 추정 정보'],
        explain: '신속하게 판단을 내리게 돕는 경험적 지식이나 추정 정보입니다.',
        width: 200,
      },
      {
        q: 'f(n) = g(n) + h(n) 에서 g(n) 은?',
        type: 'choice',
        choices: ['초기 상태에서 현재 상태까지의 비용', '목표까지 남은 예상 비용', '전체 노드 수'],
        answer: '초기 상태에서 현재 상태까지의 비용',
        explain: 'h(n) 이 목표까지 남은 예상 비용(휴리스틱)입니다.',
      },
      {
        q: '학습지 28쪽 예시(2 8 3 / 1 6 4 / 7 _ 5)에서 맨해튼 거리 h(n) 은?',
        answer: ['5'],
        hint: '타일 1이 1칸, 2가 1칸, 6이 1칸, 8이 2칸 움직여야 합니다.',
        explain: '1 + 1 + 1 + 2 = 5',
        width: 120,
      },
      {
        q: 'A* 알고리즘은 맹목적 탐색과 정보이용 탐색 중 어느 쪽인가요?',
        type: 'choice',
        choices: ['맹목적 탐색', '정보이용 탐색'],
        answer: '정보이용 탐색',
        explain: '목표까지의 추정 정보 h(n) 을 씁니다.',
      },
    ], { revealOnWrong: true }),
    answerBlock('💡 왜 휴리스틱이 그렇게 중요할까',
      h('p', {}, '8-퍼즐의 상태 공간은 9!/2 = 181,440 가지입니다. 그리 크지 않지요. ',
        '그런데 15-퍼즐(4×4)은 약 10조 가지, 루빅스 큐브는 4.3×10¹⁹ 가지입니다.'),
      h('p', {}, '맹목적 탐색으로는 이런 문제를 평생 걸려도 못 풉니다. ',
        '「목표에 가까워 보이는 쪽부터 열어 보라」는 힌트 하나가 탐색 공간을 수천, 수만 분의 일로 줄여 줍니다. ',
        '위 표의 「살펴본 상태 수」 차이가 바로 그 힘입니다.')));
}
