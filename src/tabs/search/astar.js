/* ============================================================================
 * astar.js — 학습지 27~30쪽 「정보이용 탐색 · A* 알고리즘으로 길 찾기」
 *
 * 6×6 격자에서 출발 위치로부터 도착 위치까지 최단 경로를 찾는다.
 *   · 두 위치 간의 거리는 맨해튼 거리를 쓰고, 대각선 이동은 할 수 없다
 *   · 장애물은 뚫고 갈 수 없다
 * 칸마다 f = g + h 를 적어 두어, 알고리즘이 어느 칸을 왜 골랐는지 눈으로 따라갈 수 있다.
 *
 * 학습지 30쪽의 장애물 배치는 원본이 이미지라 그대로 옮길 수 없었다.
 * 정답에 적힌 f 값(출발 0+7, 1+8, 2+7, 1+6, 2+5, 3+4, 4+3, 5+2, 6+1, 4+5)과
 * 앞뒤가 맞도록 다시 짠 배치를 기본값으로 넣었고, 벽은 눌러서 바꿀 수 있다.
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

import { h, add, clear, card, sheetHead, note, answer, answerBlock, quizSet, table, pillGroup, clearScreenInterval, screenInterval } from '../../lib/ui.js';

const N = 6;

/* 기본 배치 — 출발 (1,0), 도착 (3,5), 벽 여섯 칸 */
const DEFAULT_WALLS = ['0,2', '1,1', '3,0', '3,1', '2,4', '4,3'];

export function render(root) {
  add(root, sheetHead('학습지 27~30쪽', 'A* 알고리즘 — 길 찾기',
    ['[12인기04-03]'],
    [
      'f(n) = g(n) + h(n) 의 뜻을 설명할 수 있다.',
      '휴리스틱이 있을 때와 없을 때 살펴보는 칸이 어떻게 달라지는지 확인할 수 있다.',
      'A* 로 6×6 격자의 최단 경로를 찾을 수 있다.',
    ]));

  root.append(conceptCard());
  root.append(gridLab());
  root.append(quizCard());
}

/* ───────────────────────────── 개념 ─────────────────────────────── */

function conceptCard() {
  return card('📖 정보이용 탐색 (휴리스틱 탐색, 지능적 탐색)',
    h('p', {}, '상태 공간에서 찾을 수 있는 정보나 경험을 이용하여 ',
      '목표 상태에 도달할 가능성을 계산하며 경로를 탐색하는 방법입니다.'),
    h('div', { class: 'formula' }, 'f(n) = g(n) + h(n)'),
    table(['기호', '뜻'], [
      [h('td', { class: 'mono', style: { fontWeight: '800' } }, 'f(n)'), h('td', { class: 'left' }, '평가함수 — 최종 비용 추정치')],
      [h('td', { class: 'mono', style: { fontWeight: '800' } }, 'g(n)'), h('td', { class: 'left' }, '초기 상태에서 현재 상태까지의 실제 비용 (거리, 시간 등)')],
      [h('td', { class: 'mono', style: { fontWeight: '800' } }, 'h(n)'), h('td', { class: 'left' }, ['현재 상태에서 목표 상태까지 남은 예상 비용 (휴리스틱값). 격자 길 찾기에서는 ', h('b', {}, '맨해튼 거리'), ' 를 쓴다'])],
    ]),
    h('div', { class: 'formula', style: { marginTop: '10px' } },
      '맨해튼 거리 = |가로 차이| + |세로 차이|   ← 대각선으로 못 가니까 실제로 걸어야 할 최소 칸 수'),
    note('', h('b', {}, 'A* 는 무엇을 하나요? '),
      'OPEN 리스트에서 ', h('b', {}, 'f 값이 가장 작은 칸'), ' 을 골라 열어 봅니다. ',
      '「지금까지 온 거리(g)」와 「앞으로 갈 거리의 짐작(h)」을 더한 값이니, ',
      '「이 칸을 거쳐 가면 전체가 대략 얼마나 걸릴까」를 뜻합니다. 그중 가장 작은 것부터 봅니다.'));
}

/* ─────────────────────────── 격자 실험실 ────────────────────────── */

function gridLab() {
  let walls = new Set(DEFAULT_WALLS);
  let start = [1, 0];
  let goal = [3, 5];
  let mode = 'wall';
  let heur = 'manhattan';
  let steps = [];
  let idx = 0;
  let timer = null;

  const boardBox = h('div', {});
  const info = h('div', { style: { marginTop: '12px' } });
  const tblBox = h('div', { style: { marginTop: '12px' } });

  const k = (r, c) => `${r},${c}`;
  const isWall = (r, c) => walls.has(k(r, c));
  const hOf = (r, c) => (heur === 'zero' ? 0 : Math.abs(r - goal[0]) + Math.abs(c - goal[1]));

  const modePick = pillGroup([
    { id: 'wall', label: '🧱 벽 그리기' },
    { id: 'start', label: '🟢 출발점 옮기기' },
    { id: 'goal', label: '🔴 도착점 옮기기' },
  ], { value: 'wall', onPick: (v) => { mode = v; } });

  const heurPick = pillGroup([
    { id: 'manhattan', label: 'h(n) = 맨해튼 거리 (A*)' },
    { id: 'zero', label: 'h(n) = 0 (균일 비용 탐색)' },
  ], { value: 'manhattan', onPick: (v) => { heur = v; run(); } });

  /** A* 를 한 걸음씩 기록한다 */
  function run() {
    steps = [];
    const g = new Map([[k(...start), 0]]);
    const parent = new Map();
    let open = [{ r: start[0], c: start[1], g: 0, f: hOf(...start) }];
    const closed = new Set();

    const snap = (cur, note) => steps.push({
      open: open.map((o) => ({ ...o })),
      closed: new Set(closed),
      g: new Map(g),
      cur,
      note,
      done: false,
    });

    snap(null, '출발점을 OPEN 리스트에 넣고 시작합니다.');

    let guard = 0;
    let found = false;
    while (open.length && guard++ < 400) {
      open.sort((a, b) => a.f - b.f || a.g - b.g || a.r - b.r || a.c - b.c);
      const cur = open.shift();
      const ck = k(cur.r, cur.c);
      if (closed.has(ck)) continue;
      closed.add(ck);

      if (cur.r === goal[0] && cur.c === goal[1]) {
        snap(cur, `도착점을 열었습니다! 경로 비용 ${cur.g}`);
        found = true;
        break;
      }
      snap(cur, `f 가 가장 작은 (${cur.r}, ${cur.c}) · f=${cur.f} (g=${cur.g}+h=${cur.f - cur.g}) 를 골라 CLOSED 로 옮깁니다.`);

      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
        const nr = cur.r + dr; const nc = cur.c + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) return;
        if (isWall(nr, nc)) return;
        const nk = k(nr, nc);
        if (closed.has(nk)) return;
        const ng = cur.g + 1;
        if (g.has(nk) && g.get(nk) <= ng) return;
        g.set(nk, ng);
        parent.set(nk, ck);
        open.push({ r: nr, c: nc, g: ng, f: ng + hOf(nr, nc) });
      });
      snap(cur, `(${cur.r}, ${cur.c}) 의 이웃 칸을 OPEN 리스트에 넣습니다.`);
    }

    /* 찾은 경로 */
    let path = [];
    if (found) {
      let p = k(...goal);
      while (p) { path.unshift(p); p = parent.get(p); }
    }
    steps.forEach((s) => { s.path = []; });
    if (steps.length) {
      steps[steps.length - 1].path = path;
      steps[steps.length - 1].done = found;
    }
    idx = steps.length - 1;
    paint();
  }

  function paint() {
    const s = steps[idx] || { open: [], closed: new Set(), g: new Map(), path: [] };
    const openMap = new Map(s.open.map((o) => [k(o.r, o.c), o]));
    const pathSet = new Set(s.path || []);

    clear(boardBox);
    const grid = h('div', { class: 'grid-board', style: { gridTemplateColumns: `repeat(${N + 1}, 62px)` } });

    // 머리글
    grid.append(h('div', { style: { height: '30px' } }));
    for (let c = 0; c < N; c++) {
      grid.append(h('div', {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--ink-soft)', height: '30px' },
      }, String(c)));
    }

    for (let r = 0; r < N; r++) {
      grid.append(h('div', {
        style: { display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: '800', color: 'var(--ink-soft)' },
      }, String(r)));
      for (let c = 0; c < N; c++) {
        const kk = k(r, c);
        const isS = r === start[0] && c === start[1];
        const isG = r === goal[0] && c === goal[1];
        const wall = isWall(r, c);
        const inClosed = s.closed.has(kk);
        const inOpen = openMap.has(kk);
        const onPath = pathSet.has(kk);
        const gv = s.g.has(kk) ? s.g.get(kk) : null;
        const hv = hOf(r, c);

        let cls = 'cellbox';
        if (wall) cls += ' wall';
        else if (isS) cls += ' start';
        else if (isG) cls += ' goal';
        else if (onPath) cls += ' path';
        else if (inClosed) cls += ' closed';
        else if (inOpen) cls += ' open';
        if (s.cur && s.cur.r === r && s.cur.c === c) cls += ' win';

        grid.append(h('div', {
          class: cls,
          style: { height: '62px' },
          onclick: () => {
            if (mode === 'wall') {
              if (isS || isG) return;
              if (walls.has(kk)) walls.delete(kk); else walls.add(kk);
            } else if (mode === 'start') {
              if (wall || isG) return;
              start = [r, c];
            } else {
              if (wall || isS) return;
              goal = [r, c];
            }
            run();
          },
        },
        wall ? h('div', { class: 'f' }, '🧱')
          : gv !== null
            ? [h('div', { class: 'f' }, String(gv + hv)), h('div', { class: 'gh' }, `${gv}+${hv}`)]
            : [h('div', { class: 'gh' }, `h=${hv}`)]));
      }
    }
    boardBox.append(grid);

    /* 안내 */
    const last = steps[steps.length - 1];
    clear(info);
    add(info, [
      h('div', { class: 'row tight' },
        h('span', { class: 'chip on' }, `단계 ${idx} / ${steps.length - 1}`),
        h('span', { class: 'chip' }, `살펴본 칸 ${s.closed.size}개`),
        h('span', { class: 'chip' }, `OPEN ${s.open.length}개`),
        last && last.done ? h('span', { class: 'chip ok' }, `최단 경로 ${last.path.length - 1}칸` ) : null),
      note(s.note && s.note.includes('도착') ? 'ok' : '', s.note || ''),
      last && last.done && idx === steps.length - 1
        ? h('div', { class: 'row tight', style: { marginTop: '8px' } },
          h('span', { class: 'chip on' },
            '최적의 경로: ' + last.path.map((p) => `(${p.replace(',', ', ')})`).join(' → ')))
        : null,
      h('div', { class: 'legend', style: { marginTop: '10px' } },
        h('span', {}, h('i', { style: { background: '#12855a' } }), '출발'),
        h('span', {}, h('i', { style: { background: '#cf3030' } }), '도착'),
        h('span', {}, h('i', { style: { background: '#dcebff' } }), 'OPEN — 값은 계산했지만 아직 안 열어 봄'),
        h('span', {}, h('i', { style: { background: '#ffe9c9' } }), 'CLOSED — 열어 본 칸'),
        h('span', {}, h('i', { style: { background: '#ffd54a' } }), '최종 경로'),
        h('span', {}, h('i', { style: { background: '#4a5464' } }), '장애물')),
      h('div', { class: 'note', style: { marginTop: '10px' } },
        h('b', {}, '칸에 적힌 숫자 '), '큰 숫자 = f(n) = g + h, 작은 숫자 = g + h 로 나눈 것입니다. ',
        '아직 안 가 본 칸에는 h 만 적혀 있습니다.'),
    ]);

    /* 두 휴리스틱 견주기 */
    clear(tblBox);
    const cmp = ['manhattan', 'zero'].map((mode2) => {
      const saved = heur; heur = mode2;
      const r = quickRun();
      heur = saved;
      return { mode2, ...r };
    });
    tblBox.append(table(['h(n)', '실제로 열어 본 칸 수', '찾은 경로 길이', '어떤 알고리즘인가'],
      cmp.map((x) => [
        h('td', { style: { fontWeight: '800' } }, x.mode2 === 'manhattan' ? '맨해튼 거리' : '0 (없음)'),
        h('td', { class: 'mono', style: { fontWeight: '800' } }, String(x.closed)),
        h('td', { class: 'mono' }, x.found ? `${x.len}칸` : '못 찾음'),
        h('td', { class: 'left' }, x.mode2 === 'manhattan' ? 'A* 알고리즘 (정보이용 탐색)' : '균일 비용 탐색 (맹목적 탐색)'),
      ])));
  }

  /** 통계만 빠르게 구한다 */
  function quickRun() {
    const g = new Map([[k(...start), 0]]);
    const parent = new Map();
    const open = [{ r: start[0], c: start[1], g: 0, f: hOf(...start) }];
    const closed = new Set();
    let guard = 0;
    while (open.length && guard++ < 400) {
      open.sort((a, b) => a.f - b.f || a.g - b.g || a.r - b.r || a.c - b.c);
      const cur = open.shift();
      const ck = k(cur.r, cur.c);
      if (closed.has(ck)) continue;
      closed.add(ck);
      if (cur.r === goal[0] && cur.c === goal[1]) {
        let p = k(...goal); let n = 0;
        while (parent.get(p)) { p = parent.get(p); n++; }
        return { closed: closed.size, found: true, len: n };
      }
      [[-1, 0], [1, 0], [0, -1], [0, 1]].forEach(([dr, dc]) => {
        const nr = cur.r + dr; const nc = cur.c + dc;
        if (nr < 0 || nr >= N || nc < 0 || nc >= N) return;
        if (isWall(nr, nc)) return;
        const nk = k(nr, nc);
        if (closed.has(nk)) return;
        const ng = cur.g + 1;
        if (g.has(nk) && g.get(nk) <= ng) return;
        g.set(nk, ng);
        parent.set(nk, ck);
        open.push({ r: nr, c: nc, g: ng, f: ng + hOf(nr, nc) });
      });
    }
    return { closed: closed.size, found: false, len: 0 };
  }

  const playBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      if (timer) { clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 자동 재생'; return; }
      idx = 0; playBtn.textContent = '⏸ 멈추기';
      paint();
      timer = screenInterval(() => {
        idx++;
        if (idx >= steps.length - 1) {
          idx = steps.length - 1;
          clearScreenInterval(timer); timer = null; playBtn.textContent = '▶ 자동 재생';
        }
        paint();
      }, 420);
    },
  }, '▶ 자동 재생');

  run();

  return card('🗺️ A* 길 찾기 격자 (6×6)',
    h('div', { class: 'lead' },
      '칸을 눌러 벽을 세우거나 지울 수 있고, 출발점과 도착점도 옮길 수 있습니다. ',
      '대각선으로는 갈 수 없고, 한 칸 이동하는 비용은 1 입니다.'),
    h('div', { class: 'row' }, h('label', { class: 'field' }, '누르면'), modePick.el),
    h('div', { class: 'row', style: { marginTop: '8px' } }, h('label', { class: 'field' }, '휴리스틱'), heurPick.el),
    h('div', { class: 'row', style: { marginTop: '10px' } },
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { idx = Math.max(0, idx - 1); paint(); } }, '◀ 앞으로'),
      h('button', { type: 'button', class: 'btn ghost', onclick: () => { idx = Math.min(steps.length - 1, idx + 1); paint(); } }, '한 걸음 ▶'),
      playBtn,
      h('button', { type: 'button', class: 'btn gray', onclick: () => { idx = steps.length - 1; paint(); } }, '끝까지'),
      h('button', {
        type: 'button', class: 'btn gray',
        onclick: () => { walls = new Set(DEFAULT_WALLS); start = [1, 0]; goal = [3, 5]; run(); },
      }, '기본 배치로'),
      h('button', {
        type: 'button', class: 'btn gray',
        onclick: () => { walls = new Set(); run(); },
      }, '벽 모두 지우기')),
    h('div', { class: 'scroll-x', style: { marginTop: '14px' } }, boardBox),
    info,
    h('h4', {}, '휴리스틱이 있을 때와 없을 때'),
    tblBox,
    note('ok', h('b', {}, '위쪽 [h(n) = 0] 을 눌러 보세요. '),
      'h 를 0 으로 두면 f = g 가 되어 ', h('b', {}, '균일 비용 탐색과 똑같아집니다'), '. ',
      '두 방법 모두 최단 경로를 찾지만, 열어 본 칸의 수가 다릅니다. ',
      'A* 는 도착점 쪽으로 뻗어 가고, h=0 은 출발점 주변으로 동그랗게 퍼져 나갑니다.'),
    note('warn', h('b', {}, '벽을 잔뜩 세워 미로를 만들어 보세요. '),
      '벽이 복잡할수록 두 방법의 차이가 줄어듭니다. 휴리스틱이 「직선거리」만 보고 벽을 모르기 때문입니다. ',
      '휴리스틱이 좋을수록 탐색이 빨라진다는 말의 뒷면입니다.'),
    answerBlock('📌 학습지 30쪽 문제와의 관계',
      h('p', {}, '학습지 30쪽의 장애물 배치 그림은 이미지라 그대로 옮길 수 없었습니다. ',
        '대신 정답에 적힌 f 값과 앞뒤가 맞는 배치를 기본값으로 넣었습니다 — ',
        '출발 (1,0)의 f는 0+7, 도착은 (3,5)이고, 최적 경로 위의 값이 ',
        h('span', { class: 'mono' }, '1+6 → 2+5 → 3+4 → 4+3 → 5+2 → 6+1'), ' 로 이어집니다.'),
      h('p', {}, '선생님께서 원본 배치를 알고 계신다면 격자를 눌러 벽을 그대로 옮겨 놓고 쓰시면 됩니다.')));
}

/* ─────────────────────────── 괄호 채우기 ──────────────────────────── */

function quizCard() {
  return card('✏️ 학습지 괄호 채우기',
    quizSet([
      {
        q: '휴리스틱은 신속하게 판단을 내리게 돕는 ( ? )이나 추정 정보를 뜻합니다.',
        answer: ['경험적 지식', '경험적지식', '경험'],
        explain: '정보이용 탐색은 이 정보를 이용해 유망한 경로를 먼저 봅니다.',
        width: 200,
      },
      {
        q: 'A* 탐색의 기준이 되는 식은? (f, g, h 로 쓰세요)',
        answer: ['f(n)=g(n)+h(n)', 'f=g+h', 'g(n)+h(n)', 'f(n) = g(n) + h(n)'],
        place: '예: f(n)=g(n)+h(n)',
        explain: 'g(n)+h(n) 을 사용하여 최상 우선 탐색을 합니다.',
        width: 220,
      },
      {
        q: '(1, 0) 에서 (3, 5) 까지의 맨해튼 거리는?',
        answer: ['7'],
        hint: '|1−3| + |0−5|',
        explain: '2 + 5 = 7 입니다. 대각선으로 못 가니 적어도 7칸은 걸어야 합니다.',
        width: 120,
      },
      {
        q: 'A* 에서 h(n) 을 0 으로 두면 어떤 알고리즘과 같아지나요?',
        type: 'choice',
        choices: ['깊이 우선 탐색', '균일 비용 탐색', '너비 우선 탐색'],
        answer: '균일 비용 탐색',
        explain: 'f = g 가 되어 누적 비용이 가장 작은 것부터 고르게 됩니다.',
      },
      {
        q: 'g(n) 이 4 이고 h(n) 이 3 이면 f(n) 은?',
        answer: ['7'],
        explain: '4 + 3 = 7',
        width: 120,
      },
    ], { revealOnWrong: true }));
}
