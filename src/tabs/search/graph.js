/* ============================================================================
 * graph.js — 학습지 23~26쪽 「맹목적 탐색 — 너비 우선 · 깊이 우선 · 균일 비용」
 *
 *   ① 맹목적 탐색과 정보이용 탐색 비교표
 *   ② 너비 우선 / 깊이 우선 탐색을 한 걸음씩 — OPEN·CLOSED 리스트가 함께 바뀐다
 *       · 학습지 25쪽 A~J 트리 (정답: 둘 다 탐색 횟수 10)
 *       · 지름길이 있는 도로 (깊이 우선이 왜 최단 경로를 보장하지 못하는지)
 *   ③ 균일 비용 탐색 — 학습지 26쪽 도시 a~e (정답: a-c-d-e, 비용 12)
 *
 * 학습지 25쪽 아래쪽 「A~Z 도로 그래프」는 원본이 이미지라 연결 관계를 복원할 수 없었다.
 * 대신 같은 것을 가르치는 다른 그래프를 넣었다. (앱 CLAUDE.md 참고)
 *
 * © 2026 티쳐무 · 모든 권리 보유
 * 학교 수업 목적으로만 이용해 주세요. 무단 배포와 상업적 이용을 금합니다.
 * 그 밖의 이용(재배포·2차 저작물·수업 외 목적)은 먼저 문의해 주세요.
 * 자세한 이용 범위는 이 저장소의 LICENSE 파일에 적어 두었습니다.
 * ========================================================================== */

import { h, add, clear, card, sheetHead, note, answer, answerBlock, quizSet, table, drawNow, pillGroup, clearScreenInterval, onResize, screenInterval } from '../../lib/ui.js';
import { makeCanvas, label, COLORS } from '../../lib/chart.js';

/* ─────────────────────────── 그래프 자료 ────────────────────────── */

/* 학습지 25쪽 A~J 트리 */
export const TREE_AJ = {
  start: 'A', goal: 'J',
  pos: {
    A: [0.50, 0.10], B: [0.26, 0.36], C: [0.72, 0.36],
    D: [0.26, 0.62], G: [0.54, 0.62], H: [0.72, 0.62], I: [0.90, 0.62],
    E: [0.15, 0.88], F: [0.37, 0.88], J: [0.90, 0.88],
  },
  adj: { A: ['B', 'C'], B: ['D'], C: ['G', 'H', 'I'], D: ['E', 'F'], E: [], F: [], G: [], H: [], I: ['J'], J: [] },
  nm: '학습지 25쪽 A~J 트리',
};

/* 지름길이 있는 도로 — 깊이 우선의 약점을 보여 주기 위한 그래프 */
export const ROAD = {
  start: 'A', goal: 'Z',
  pos: {
    A: [0.10, 0.22], Z: [0.90, 0.22],
    B: [0.10, 0.62], C: [0.24, 0.90], D: [0.40, 0.90],
    E: [0.58, 0.90], F: [0.74, 0.90], G: [0.90, 0.62],
  },
  adj: {
    A: ['B', 'Z'], B: ['A', 'C'], C: ['B', 'D'], D: ['C', 'E'],
    E: ['D', 'F'], F: ['E', 'G'], G: ['F', 'Z'], Z: ['A', 'G'],
  },
  nm: '지름길이 있는 도로',
};

export function render(root) {
  add(root, sheetHead('학습지 23~26쪽', '맹목적 탐색 — 너비 우선 · 깊이 우선 · 균일 비용',
    ['[12인기04-02]'],
    [
      '맹목적 탐색과 정보이용 탐색의 차이를 설명할 수 있다.',
      'OPEN 리스트와 CLOSED 리스트가 어떻게 쓰이는지 설명할 수 있다.',
      '너비 우선 탐색이 최단 경로를 보장하는 까닭을 설명할 수 있다.',
      '균일 비용 탐색으로 비용이 가장 적은 경로를 찾을 수 있다.',
    ]));

  root.append(compareCard());
  root.append(bfsDfsCard());
  root.append(ucsCard());
  root.append(quizCard());
}

/* ───────────────────── ① 두 탐색의 비교표 ─────────────────────── */

function compareCard() {
  return card('📖 맹목적 탐색 vs 정보이용 탐색',
    table(['구분', '맹목적 탐색 (Uninformed Search)', '정보이용 탐색 (Informed Search)'], [
      [h('td', { style: { fontWeight: '800' } }, '활용 정보'),
        h('td', { class: 'left' }, '목표 상태 이외의 추가 정보 없이 정해진 순서나 규칙에 따라 모든 상태를 탐색'),
        h('td', { class: 'left' }, ['목표까지의 ', answer('추정 정보'), ' 를 활용'])],
      [h('td', { style: { fontWeight: '800' } }, '판단 기준'),
        h('td', { class: 'left' }, '상태공간트리에서 레벨, g(n)'),
        h('td', { class: 'left' }, 'h(n) 또는 f(n) = g(n) + h(n)')],
      [h('td', { style: { fontWeight: '800' } }, '탐색 방식'),
        h('td', { class: 'left' }, '무작위적 / 전체적 탐색'),
        h('td', { class: 'left' }, ['목표 상태에 도달할 가능성이 높은 ', answer('유망한 경로'), ' 를 우선 선택'])],
      [h('td', { style: { fontWeight: '800' } }, '효율성'),
        h('td', { class: 'left' }, '상태 공간이 클 경우 시간이 오래 걸리고 비효율적'),
        h('td', { class: 'left' }, '불필요한 경로를 배제하여 일반적으로 빠르고 효율적')],
      [h('td', { style: { fontWeight: '800' } }, '대표 알고리즘'),
        h('td', { class: 'left' }, '너비 우선 탐색, 깊이 우선 탐색, 균일 비용 탐색'),
        h('td', { class: 'left' }, 'A* 알고리즘')],
    ]),
    h('h4', {}, '기호와 리스트'),
    table(['기호 / 이름', '뜻'], [
      [h('td', { class: 'mono', style: { fontWeight: '800' } }, 'g(n)'), h('td', { class: 'left' }, '초기 상태에서 현재 상태까지의 비용값 (누적 비용)')],
      [h('td', { class: 'mono', style: { fontWeight: '800' } }, 'h(n)'), h('td', { class: 'left' }, '휴리스틱 = 목표까지의 추정 정보')],
      [h('td', { style: { fontWeight: '800' } }, [answer('OPEN'), ' 리스트']), h('td', { class: 'left' }, '확장은 되었으나 아직 탐색하지 않은 상태들이 들어 있는 리스트')],
      [h('td', { style: { fontWeight: '800' } }, [answer('CLOSED'), ' 리스트']), h('td', { class: 'left' }, '탐색이 끝난 상태들이 들어 있는 리스트')],
    ]),
    h('h4', {}, '맹목적 탐색 세 가지'),
    table(['알고리즘', '기준', '특징'], [
      [h('td', { style: { fontWeight: '800' } }, '너비 우선 탐색 (BFS)'),
        h('td', {}, '상태공간트리에서 레벨'),
        h('td', { class: 'left' }, '가까운 노드부터 탐색, 최단 경로(간선 수 기준) 보장')],
      [h('td', { style: { fontWeight: '800' } }, '깊이 우선 탐색 (DFS)'),
        h('td', {}, '한 방향으로 끝까지'),
        h('td', { class: 'left' }, '끝까지 갔다가 되돌아옴(백트래킹), 최단 경로 보장 ✗')],
      [h('td', { style: { fontWeight: '800' } }, '균일 비용 탐색 (UCS)'),
        h('td', {}, '누적 비용 g(n)'),
        h('td', { class: 'left' }, '비용 정보가 주어졌을 때 시작 → 목표까지 최단 경로 하나를 찾음')],
    ]),
    note('', h('b', {}, '무엇이 다른가 한 줄로 '),
      '너비 우선은 「가까운 데부터 골고루」, 깊이 우선은 「일단 끝까지 가 보고 막히면 되돌아오기」, ',
      '균일 비용은 「지금까지 든 비용이 가장 적은 것부터」입니다.'));
}

/* ───────────────── ② 너비 우선 / 깊이 우선 탐색 ────────────────── */

/**
 * 탐색을 한 걸음씩 기록한다. 이미 탐색한 상태는 재방문하지 않는다.
 *
 *  · 너비 우선 : OPEN 을 큐로 쓴다. 꺼내기 전에 「이미 넣은 것」을 표시해 두므로
 *                처음 도달한 길이 곧 최단 경로가 된다.
 *  · 깊이 우선 : OPEN 을 스택으로 쓴다. 꺼낼 때 방문 표시를 하므로
 *                실제로 걸어 들어간 길이 그대로 남는다. (그래서 최단 경로가 아닐 수 있다)
 */
export function runSearch(G, mode) {
  const steps = [];
  const closed = [];
  const seen = new Set();
  let path = [];

  const snap = (open, cur, extra) => steps.push({
    open: open.slice(), closed: closed.slice(), cur, found: false, ...extra,
  });

  if (mode === 'bfs') {
    const open = [G.start];
    const parent = { [G.start]: null };
    seen.add(G.start);
    snap(open, null, {});
    let guard = 0;
    while (open.length && guard++ < 500) {
      const n = open.shift();
      closed.push(n);
      if (n === G.goal) {
        steps.push({ open: open.slice(), closed: closed.slice(), cur: n, found: true });
        let p = n;
        while (p) { path.unshift(p); p = parent[p]; }
        break;
      }
      snap(open, n, {});
      const kids = (G.adj[n] || []).filter((k) => !seen.has(k));
      kids.forEach((k) => { seen.add(k); parent[k] = n; open.push(k); });
      snap(open, n, { expanded: kids });
    }
  } else {
    /* 깊이 우선 — 스택에 「여기까지 온 길」을 함께 담아 둔다 */
    const stack = [{ n: G.start, path: [G.start] }];
    snap([G.start], null, {});
    let guard = 0;
    while (stack.length && guard++ < 800) {
      const item = stack.pop();
      if (seen.has(item.n)) continue;
      seen.add(item.n);
      closed.push(item.n);
      const openNow = stack.map((s) => s.n).filter((n, i, a) => a.indexOf(n) === i && !seen.has(n));
      if (item.n === G.goal) {
        steps.push({ open: openNow, closed: closed.slice(), cur: item.n, found: true });
        path = item.path.slice();
        break;
      }
      snap(openNow, item.n, {});
      const kids = (G.adj[item.n] || []).filter((k) => !seen.has(k));
      // 스택이라 거꾸로 넣어야 사전순으로 꺼내진다
      kids.slice().reverse().forEach((k) => stack.push({ n: k, path: item.path.concat([k]) }));
      snap(stack.map((s) => s.n).filter((n, i, a) => a.indexOf(n) === i && !seen.has(n)), item.n, { expanded: kids });
    }
  }

  return { steps, path, order: closed };
}

function bfsDfsCard() {
  let G = TREE_AJ;
  let mode = 'bfs';
  let run = runSearch(G, mode);
  let idx = 0;
  let timer = null;

  const cv = makeCanvas(360, { pad: { l: 20, r: 20, t: 20, b: 20 } });
  const info = h('div', { style: { marginTop: '12px' } });

  const gPick = pillGroup([
    { id: 'tree', label: '학습지 A~J 트리' },
    { id: 'road', label: '지름길이 있는 도로' },
  ], { value: 'tree', onPick: (v) => { G = v === 'tree' ? TREE_AJ : ROAD; reload(); } });

  const mPick = pillGroup([
    { id: 'bfs', label: '너비 우선 탐색 (BFS)' },
    { id: 'dfs', label: '깊이 우선 탐색 (DFS)' },
  ], { value: 'bfs', onPick: (v) => { mode = v; reload(); } });

  function reload() {
    if (timer) { clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 자동 재생'; }
    run = runSearch(G, mode);
    idx = 0;
    paint();
  }

  function paint() {
    const s = run.steps[idx];
    const ctx = cv.begin();
    const W = cv.w; const H = cv.hgt;
    const px = (k) => cv.pad.l + G.pos[k][0] * (W - cv.pad.l - cv.pad.r);
    const py = (k) => cv.pad.t + G.pos[k][1] * (H - cv.pad.t - cv.pad.b);

    const closedSet = new Set(s.closed);
    const openSet = new Set(s.open);

    // 간선
    Object.entries(G.adj).forEach(([a, ks]) => ks.forEach((b) => {
      if (!G.pos[b]) return;
      ctx.save();
      const both = closedSet.has(a) && (closedSet.has(b) || openSet.has(b));
      ctx.strokeStyle = both ? '#9aa5b4' : '#dfe4ec';
      ctx.lineWidth = both ? 2.5 : 1.5;
      ctx.beginPath(); ctx.moveTo(px(a), py(a)); ctx.lineTo(px(b), py(b)); ctx.stroke();
      ctx.restore();
    }));

    // 찾은 경로
    if (s.found && run.path.length > 1) {
      for (let i = 1; i < run.path.length; i++) {
        ctx.save();
        ctx.strokeStyle = COLORS.pink; ctx.lineWidth = 5;
        ctx.beginPath();
        ctx.moveTo(px(run.path[i - 1]), py(run.path[i - 1]));
        ctx.lineTo(px(run.path[i]), py(run.path[i]));
        ctx.stroke();
        ctx.restore();
      }
    }

    // 노드
    Object.keys(G.pos).forEach((k) => {
      const isCur = s.cur === k;
      const inClosed = closedSet.has(k);
      const inOpen = openSet.has(k);
      const order = s.closed.indexOf(k);
      ctx.save();
      ctx.fillStyle = isCur ? COLORS.orange : inClosed ? '#ffe9c9' : inOpen ? '#dcebff' : '#fff';
      ctx.strokeStyle = k === G.start ? COLORS.green : k === G.goal ? COLORS.red : (inClosed ? COLORS.orange : inOpen ? COLORS.blue : '#c9d2df');
      ctx.lineWidth = isCur ? 5 : 3;
      ctx.beginPath(); ctx.arc(px(k), py(k), 22, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      label(ctx, k, px(k), py(k) - 2, { align: 'center', bold: true, size: 16, color: isCur ? '#fff' : COLORS.ink });
      if (order >= 0) {
        label(ctx, `${order + 1}번째`, px(k), py(k) + 34, { align: 'center', size: 11, color: COLORS.soft, bold: true });
      }
    });

    label(ctx, `${G.nm} · 초기 상태 ${G.start} → 목표 상태 ${G.goal}`, W / 2, 12, { align: 'center', color: COLORS.soft, bold: true });

    /* 안내 */
    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `단계 ${idx} / ${run.steps.length - 1}`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #1e6fd9' } },
          `OPEN [${s.open.join(', ')}]`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #d9781e' } },
          `CLOSED [${s.closed.join(', ')}]`)),
      h('div', { style: { marginTop: '8px' } },
        s.cur === null ? note('', '초기 상태를 OPEN 리스트에 넣고 시작합니다.')
          : s.found ? note('ok', h('b', {}, `🎉 목표 상태 ${G.goal} 를 찾았습니다! `),
            `탐색 순서: ${s.closed.join(' - ')} · 탐색 횟수 ${s.closed.length} · `,
            `찾은 경로: ${run.path.join(' → ')} (간선 ${run.path.length - 1}개)`)
            : s.expanded
              ? note('', `${s.cur} 를 확장했습니다. ` + (s.expanded.length ? `자식 ${s.expanded.join(', ')} 를 OPEN 에 넣습니다.` : '갈 곳이 없습니다.'))
              : note('warn', `OPEN 리스트에서 ${mode === 'bfs' ? '맨 앞' : '맨 뒤'}의 ${s.cur} 를 꺼내 CLOSED 로 옮겼습니다.`)),
      h('div', { class: 'legend', style: { marginTop: '10px' } },
        h('span', {}, h('i', { style: { background: '#dcebff', border: '2px solid #1e6fd9' } }), 'OPEN — 아직 탐색 안 함'),
        h('span', {}, h('i', { style: { background: '#ffe9c9', border: '2px solid #d9781e' } }), 'CLOSED — 탐색 끝'),
        h('span', {}, h('i', { style: { background: '#c02f6b' } }), '찾은 경로')),
    ]);
  }

  const playBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      if (timer) { clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 자동 재생'; return; }
      if (idx >= run.steps.length - 1) idx = 0;
      playBtn.textContent = '⏸ 멈추기';
      timer = screenInterval(() => {
        idx++;
        if (idx >= run.steps.length - 1) {
          idx = run.steps.length - 1;
          clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 자동 재생';
        }
        paint();
      }, 700);
    },
  }, '▶ 자동 재생');

  /* 두 방식을 한 번에 견주는 표 */
  function compareTable() {
    const rows = [];
    [TREE_AJ, ROAD].forEach((g) => {
      const b = runSearch(g, 'bfs');
      const d = runSearch(g, 'dfs');
      rows.push([
        h('td', { class: 'left', style: { fontWeight: '800' } }, g.nm),
        h('td', { class: 'left mono' }, b.order.join('-')),
        b.order.length,
        b.path.length - 1,
        h('td', { class: 'left mono' }, d.order.join('-')),
        d.order.length,
        d.path.length - 1,
      ]);
    });
    return table(['그래프', 'BFS 탐색 순서', 'BFS 횟수', 'BFS 경로 길이', 'DFS 탐색 순서', 'DFS 횟수', 'DFS 경로 길이'], rows, { compact: true });
  }

  drawNow(paint);
  onResize(paint);

  return card('🔎 너비 우선 탐색 · 깊이 우선 탐색',
    h('div', { class: 'lead' }, '각 레벨에서 자식 상태는 알파벳 순으로 생성합니다.'),
    h('div', { class: 'row' }, h('label', { class: 'field' }, '그래프'), gPick.el),
    h('div', { class: 'row', style: { marginTop: '8px' } }, h('label', { class: 'field' }, '방법'), mPick.el),
    h('div', { class: 'row', style: { marginTop: '8px' } },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { idx = Math.max(0, idx - 1); paint(); } }, '◀ 앞으로'),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { idx = Math.min(run.steps.length - 1, idx + 1); paint(); } }, '한 걸음 ▶'),
      playBtn,
      h('button', { type: 'button', class: 'btn gray', onclick: reload }, '처음부터')),
    cv.el, info,
    h('h4', {}, '두 방법을 한눈에 견주기'),
    compareTable(),
    answerBlock('✅ 학습지 25쪽 A~J 트리 정답',
      h('p', {}, h('b', {}, '너비 우선 탐색 '), '탐색 순서: A - B - C - D - G - H - I - E - F - J / 탐색 횟수: 10'),
      h('p', {}, h('b', {}, '깊이 우선 탐색 '), '탐색 순서: A - B - D - E - F - C - G - H - I - J / 탐색 횟수: 10'),
      h('p', {}, '이 트리에서는 둘 다 10번입니다. 목표 J 가 트리의 마지막에 있어서 어느 쪽이든 다 훑어야 하기 때문입니다.')),
    note('warn', h('b', {}, '[지름길이 있는 도로] 를 눌러 보세요. '),
      'A 에서 Z 로 가는 길은 한 걸음이면 됩니다. 너비 우선은 3번 만에 찾아내고 경로도 1칸입니다. ',
      '그런데 깊이 우선은 알파벳 순으로 B 부터 들어가 버려서, 먼 길을 다 돌아 8번 만에 도착하고 경로도 7칸이 됩니다. ',
      '이것이 「깊이 우선 탐색은 최단 경로를 보장하지 못한다」는 뜻입니다.'),
    note('', h('b', {}, '학습지의 ★★★ 문장 '),
      answer('깊이'), ' 우선 탐색 시 백트래킹 전까지 한 방향으로 끝까지 들어가기 때문에, ',
      '목표 상태를 바로 찾지 못하고 매우 깊게 탐색할 수 있습니다.'));
}

/* ───────────────────── ③ 균일 비용 탐색 (UCS) ─────────────────── */

/* 학습지 26쪽 도시 a~e */
export const CITY = {
  start: 'a', goal: 'e',
  pos: { a: [0.08, 0.5], b: [0.36, 0.14], c: [0.36, 0.86], d: [0.68, 0.5], e: [0.94, 0.5] },
  edges: [
    ['a', 'b', 5], ['a', 'c', 4], ['b', 'c', 5],
    ['c', 'd', 3], ['b', 'd', 8], ['b', 'e', 9], ['d', 'e', 5],
  ],
};

/**
 * 균일 비용 탐색 — 학습지 26쪽의 알고리즘을 그대로 옮긴 것.
 *   ① 초기 상태를 OPEN 에 넣는다
 *   ③ OPEN 에서 누적 비용이 가장 작은 상태를 골라 CLOSED 로 옮긴다
 *   ④ 목표면 끝. 아니면 자식을 OPEN 에 넣는데,
 *      같은 상태가 이미 OPEN 에 있으면 더 작은 비용만 남기고,
 *      이미 CLOSED 에 있으면 아예 넣지 않는다
 * 각 걸음을 steps 에 기록해 두어 화면에서 한 단계씩 되짚어 볼 수 있게 했다.
 */
export function runUCS(nodes, edges, start, goal) {
  const adj = {};
  nodes.forEach((k) => { adj[k] = []; });
  edges.forEach(([a, b, w]) => { adj[a].push([b, w]); adj[b].push([a, w]); });
  Object.values(adj).forEach((v) => v.sort((x, y) => (x[0] < y[0] ? -1 : 1)));

  const steps = [];
  let open = [{ n: start, g: 0, path: [start] }];
  const closed = [];
  const closedSet = new Set();

  const snap = (note) => steps.push({
    open: open.map((o) => ({ n: o.n, g: o.g })),
    closed: closed.slice(),
    note,
  });
  snap('① 초기 상태를 OPEN 리스트에 넣는다.');

  let guard = 0;
  let result = null;
  while (open.length && guard++ < 200) {
    open.sort((x, y) => x.g - y.g || (x.n < y.n ? -1 : 1));
    const cur = open.shift();
    closed.push({ n: cur.n, g: cur.g });
    closedSet.add(cur.n);
    snap(`③ OPEN 에서 누적 비용이 가장 작은 ${cur.n}(${cur.g}) 를 골라 CLOSED 로 옮긴다.`);

    if (cur.n === goal) {
      result = cur;
      snap(`④ ${cur.n} 는 목표 상태다. 끝. 경로 ${cur.path.join(' - ')} · 비용 ${cur.g}`);
      break;
    }

    adj[cur.n].forEach(([nb, w]) => {
      if (closedSet.has(nb)) return;
      const g = cur.g + w;
      const exist = open.find((o) => o.n === nb);
      if (!exist) open.push({ n: nb, g, path: cur.path.concat([nb]) });
      else if (g < exist.g) { exist.g = g; exist.path = cur.path.concat([nb]); }
    });
    open = open.slice();
    snap(`②④ ${cur.n} 의 자식 상태를 OPEN 에 넣는다. (같은 상태가 있으면 더 작은 비용만 남긴다)`);
  }
  return { steps, result };
}

function ucsCard() {
  let edges = CITY.edges.map((e) => e.slice());
  let idx = 0;
  let run = null;

  const cv = makeCanvas(300, { pad: { l: 20, r: 20, t: 20, b: 20 } });
  const tblBox = h('div', { style: { marginTop: '12px' } });
  const info = h('div', { style: { marginTop: '12px' } });
  const editBox = h('div', {});

  function reload() {
    run = runUCS(Object.keys(CITY.pos), edges, CITY.start, CITY.goal);
    idx = run.steps.length - 1;
    paint();
  }

  function paint() {
    const s = run.steps[idx];
    const ctx = cv.begin();
    const W = cv.w; const H = cv.hgt;
    const px = (k) => cv.pad.l + CITY.pos[k][0] * (W - cv.pad.l - cv.pad.r);
    const py = (k) => cv.pad.t + CITY.pos[k][1] * (H - cv.pad.t - cv.pad.b);

    const closedMap = new Map(s.closed.map((c) => [c.n, c.g]));
    const openMap = new Map(s.open.map((c) => [c.n, c.g]));
    const best = run.result;
    const onPath = new Set();
    if (best && idx === run.steps.length - 1) {
      for (let i = 1; i < best.path.length; i++) onPath.add(best.path[i - 1] + best.path[i]);
    }

    edges.forEach(([a, b, w]) => {
      const hot = onPath.has(a + b) || onPath.has(b + a);
      ctx.save();
      ctx.strokeStyle = hot ? COLORS.pink : '#c9d2df';
      ctx.lineWidth = hot ? 5 : 2;
      ctx.beginPath(); ctx.moveTo(px(a), py(a)); ctx.lineTo(px(b), py(b)); ctx.stroke();
      ctx.restore();
      const mx = (px(a) + px(b)) / 2; const my = (py(a) + py(b)) / 2;
      ctx.save();
      ctx.fillStyle = '#fff'; ctx.strokeStyle = hot ? COLORS.pink : '#c9d2df'; ctx.lineWidth = 2;
      ctx.beginPath(); ctx.arc(mx, my, 14, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      label(ctx, String(w), mx, my, { align: 'center', bold: true, size: 13, color: hot ? COLORS.pink : COLORS.soft });
    });

    Object.keys(CITY.pos).forEach((k) => {
      const inClosed = closedMap.has(k);
      const inOpen = openMap.has(k);
      ctx.save();
      ctx.fillStyle = inClosed ? '#ffe9c9' : inOpen ? '#dcebff' : '#fff';
      ctx.strokeStyle = k === CITY.start ? COLORS.green : k === CITY.goal ? COLORS.red : (inClosed ? COLORS.orange : inOpen ? COLORS.blue : '#c9d2df');
      ctx.lineWidth = 3.5;
      ctx.beginPath(); ctx.arc(px(k), py(k), 24, 0, Math.PI * 2); ctx.fill(); ctx.stroke();
      ctx.restore();
      label(ctx, k, px(k), py(k) - 3, { align: 'center', bold: true, size: 17 });
      const g = inClosed ? closedMap.get(k) : inOpen ? openMap.get(k) : null;
      if (g !== null) label(ctx, `g=${g}`, px(k), py(k) + 12, { align: 'center', size: 11, color: COLORS.soft, bold: true });
    });

    /* 학습지 26쪽의 표와 같은 자리에 맞춘다 —
       ① 시작 / 자식 상태를 OPEN 에 넣은 뒤 / 목표를 찾은 순간 을 한 줄씩 적는다 */
    clear(tblBox);
    tblBox.append(table(['단계', 'OPEN 리스트', 'CLOSED 리스트'],
      run.steps
        .filter((x) => x.note.startsWith('①') || x.note.startsWith('②④') || x.note.startsWith('④'))
        .map((x, i) => [
          i + 1,
          h('td', { class: 'left mono' }, x.open.length ? x.open.map((o) => `${o.n}(${o.g})`).join(', ') : '–'),
          h('td', { class: 'left mono' }, x.closed.length ? x.closed.map((o) => `${o.n}(${o.g})`).join(', ') : '–'),
        ]), { compact: true }));

    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `단계 ${idx} / ${run.steps.length - 1}`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #1e6fd9' } },
          `OPEN ${s.open.map((o) => `${o.n}(${o.g})`).join(', ') || '–'}`),
        h('span', { class: 'chip', style: { borderLeft: '6px solid #d9781e' } },
          `CLOSED ${s.closed.map((o) => `${o.n}(${o.g})`).join(', ') || '–'}`)),
      note(idx === run.steps.length - 1 && run.result ? 'ok' : '', s.note),
      run.result && idx === run.steps.length - 1
        ? h('div', { class: 'row tight', style: { marginTop: '8px' } },
          h('span', { class: 'chip on' }, `최단 경로 ${run.result.path.join(' - ')}`),
          h('span', { class: 'chip on' }, `경로 비용 ${run.result.g}`))
        : null,
    ]);
  }

  /* 비용 편집 */
  function buildEditor() {
    clear(editBox);
    add(editBox, [
      h('div', { class: 'row tight' },
        edges.map((e, i) => h('label', { class: 'field', style: { fontSize: '0.9rem' } },
          `${e[0]}–${e[1]}`,
          h('input', {
            type: 'number', min: '1', max: '99', value: String(e[2]), class: 'mono',
            style: { width: '62px' },
            oninput: (ev) => { edges[i][2] = Math.max(1, Number(ev.target.value) || 1); reload(); },
          }))),
        h('button', {
          type: 'button', class: 'btn gray small',
          onclick: () => { edges = CITY.edges.map((e) => e.slice()); buildEditor(); reload(); },
        }, '학습지 값으로')),
    ]);
  }

  buildEditor();
  reload();
  drawNow(paint);
  onResize(paint);

  return card('💰 균일 비용 탐색 — 도시 a 에서 e 까지 가장 빠른 길',
    h('div', { class: 'lead' },
      'a, b, c, d, e 다섯 도시를 잇는 도로망입니다. 연결선의 숫자는 이동하는 데 걸리는 시간(비용)입니다. ',
      'a 를 출발해 e 까지 가는 경로 중 시간이 가장 짧은 것을 찾습니다.'),
    h('h4', {}, '균일 비용 탐색 알고리즘'),
    h('ol', { style: { paddingLeft: '24px' } },
      h('li', {}, '초기 상태가 목표 상태이면 마친다.'),
      h('li', {}, ['초기 상태에서 갈 수 있는 간선에 따라 자식 상태를 생성하여 ', answer('OPEN'), ' 리스트에 넣는다.']),
      h('li', {}, ['OPEN 리스트에서 누적 비용이 가장 작은 상태를 다음 순서로 선택하여 ', answer('CLOSED'), ' 리스트에 넣는다.']),
      h('li', {}, '선택된 상태가 목표 상태인지 테스트한다. 목표면 끝. 아니면 자식 상태를 생성해 OPEN 에 넣고 ③ 으로 돌아간다. ',
        h('b', {}, '이때 OPEN 에 똑같은 상태가 있으면 더 작은 비용을 가진 상태만 남긴다. '),
        '자식 상태가 이미 CLOSED 에 있으면 OPEN 에 넣지 않는다.')),
    h('div', { class: 'row', style: { marginTop: '10px' } },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { idx = Math.max(0, idx - 1); paint(); } }, '◀ 앞으로'),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { idx = Math.min(run.steps.length - 1, idx + 1); paint(); } }, '한 걸음 ▶'),
      h('button', { type: 'button', class: 'btn gray', onclick: () => { idx = 0; paint(); } }, '처음으로'),
      h('button', { type: 'button', class: 'btn gray', onclick: () => { idx = run.steps.length - 1; paint(); } }, '끝까지')),
    cv.el, info,
    h('h4', {}, 'OPEN · CLOSED 리스트가 바뀌는 표'),
    tblBox,
    h('h4', {}, '도로 비용을 바꿔 실험해 보세요'),
    editBox,
    answerBlock('✅ 학습지 26쪽 정답',
      h('p', {}, h('b', {}, '최단 경로 '), 'a – c – d – e'),
      h('p', {}, h('b', {}, '경로 비용 '), '4 + 3 + 5 = ', h('b', {}, '12')),
      h('p', {}, '주의할 것 두 가지 — ① 4단계에서 b 를 확장할 때 d 가 13 으로 나오지만 OPEN 에 이미 d(7) 이 있으므로 ',
        '더 작은 7 만 남깁니다. ② 5단계에서 d 를 확장할 때 e 가 12 로 나와 앞서 넣어 둔 e(14) 를 밀어냅니다.'),
      h('p', {}, '만약 여기서 「더 작은 것만 남긴다」는 규칙을 빼먹으면 a-b-e (비용 14) 를 답으로 내놓게 됩니다.')),
    note('', h('b', {}, '균일 비용 탐색 vs 너비 우선 탐색 '),
      '간선의 비용이 모두 같다면 둘은 똑같이 동작합니다. ',
      '비용이 서로 다를 때, 너비 우선은 「간선 개수」만 보므로 짧아 보이지만 비싼 길을 고를 수 있습니다. ',
      '위에서 a–b 비용을 1 로 바꿔 보면 답이 바뀌는 것을 볼 수 있습니다.'));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '확장은 되었으나 아직 탐색하지 않은 상태들이 들어 있는 리스트는?',
        answer: ['OPEN', 'open', '오픈', 'OPEN 리스트'],
        explain: '탐색이 끝난 상태들은 CLOSED 리스트에 들어갑니다.',
        width: 160,
      },
      {
        q: '가까운 노드부터 탐색해 최단 경로(간선 수 기준)를 보장하는 탐색은?',
        answer: ['너비 우선 탐색', '너비우선탐색', 'BFS', '너비 우선', 'bfs'],
        explain: '상태공간트리의 레벨 순서로 훑습니다.',
        width: 200,
      },
      {
        q: '끝까지 갔다가 되돌아오는(백트래킹) 탐색은?',
        answer: ['깊이 우선 탐색', '깊이우선탐색', 'DFS', '깊이 우선', 'dfs'],
        explain: '최단 경로를 보장하지 못합니다.',
        width: 200,
      },
      {
        q: '누적 비용 g(n) 이 가장 작은 상태부터 선택하는 탐색은?',
        answer: ['균일 비용 탐색', '균일비용탐색', 'UCS', '균일 비용', 'ucs'],
        explain: '비용 정보가 주어졌을 때 시작에서 목표까지 최단 경로 하나를 찾습니다.',
        width: 200,
      },
      {
        q: 'g(n) 은 무엇을 뜻하나요?',
        type: 'choice',
        choices: ['초기 상태에서 현재 상태까지의 누적 비용', '목표까지의 추정 비용', '전체 노드의 수'],
        answer: '초기 상태에서 현재 상태까지의 누적 비용',
        explain: '목표까지의 추정 비용은 h(n), 휴리스틱입니다.',
      },
      {
        q: '학습지 A~J 트리에서 너비 우선 탐색의 탐색 횟수는?',
        answer: ['10', '10회', '10번'],
        explain: 'A-B-C-D-G-H-I-E-F-J 로 10개를 훑습니다.',
        width: 120,
      },
    ], { revealOnWrong: true }));
}
