/* ============================================================================
 * ui.js — 모든 탭이 함께 쓰는 화면 조각 만들기 도구
 *
 * 여기에 모아 둔 것
 *   h()          : 태그 하나를 만드는 가장 작은 도구 (다른 모든 것의 재료)
 *   card()       : 흰 상자
 *   answer()     : 학습지의 ( 괄호 정답 ) — 처음엔 가려 두고 [보기] 를 눌러야 열린다
 *   answerBlock(): 해설 문단 전체를 가리는 상자
 *   quizSet()    : 문제 여러 개 + 채점 + 힌트 + 해설
 *   sortQuiz()   : 카드를 여러 바구니에 나눠 담는 분류 문제
 *   pyBox()      : 「파이썬으로는 이렇게 씁니다」 접이 상자
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

/* ────────────────────────── 화면 수명 관리 ──────────────────────────
 * 탭이나 꼭지를 옮기면 main.js 가 화면을 통째로 지우고 다시 그린다.
 * 그런데 지워지는 것은 화면에 붙어 있던 태그뿐이라, 그 화면이 window 에 걸어 둔
 * resize 리스너와 setInterval 타이머는 그대로 살아남는다.
 * 그러면 화면을 옮길 때마다 그것들이 쌓여, 이미 사라진 캔버스를 계속 다시 그리게 된다.
 *
 * 그래서 화면 하나마다 「수명」을 하나 두고, 새 화면을 그리기 직전에 이전 것을 걷어 낸다.
 * 각 탭 모듈은 window.addEventListener 나 setInterval 을 직접 쓰지 말고
 * 아래의 onResize() · screenInterval() 을 쓴다.
 */

let screen = null;

/** main.js 가 새 화면을 그리기 직전에 부른다 — 이전 화면의 뒷정리를 한다 */
export function beginScreen() {
  if (screen) {
    screen.controller.abort();          // 걸어 둔 리스너를 브라우저가 알아서 떼어 낸다
    screen.timers.forEach(clearInterval); // 돌던 애니메이션 타이머를 멈춘다
  }
  screen = { controller: new AbortController(), timers: new Set() };
  return screen;
}

/** 창 크기가 바뀔 때 다시 그린다. 화면을 옮기면 자동으로 떨어진다. */
export function onResize(fn) {
  window.addEventListener('resize', fn, screen ? { signal: screen.controller.signal } : undefined);
}

/** setInterval 과 같지만, 화면을 옮기면 자동으로 멈춘다. */
export function screenInterval(fn, ms) {
  const id = setInterval(fn, ms);
  if (screen) screen.timers.add(id);
  return id;
}

/** screenInterval 로 만든 타이머를 손으로 멈춘다. */
export function clearScreenInterval(id) {
  clearInterval(id);
  if (screen) screen.timers.delete(id);
}

/**
 * 태그 하나를 만든다.
 *   h('div', { class: 'card' }, '글자', h('b', {}, '굵게'))
 * attrs 안에서 on으로 시작하는 키는 이벤트로 붙는다. (onclick, oninput …)
 */
export function h(tag, attrs = {}, ...kids) {
  const e = document.createElement(tag);
  for (const [k, v] of Object.entries(attrs || {})) {
    if (v === null || v === undefined || v === false) continue;
    if (k.startsWith('on') && typeof v === 'function') e.addEventListener(k.slice(2), v);
    else if (k === 'html') e.innerHTML = v;
    else if (k === 'style' && typeof v === 'object') Object.assign(e.style, v);
    else e.setAttribute(k, v === true ? '' : v);
  }
  add(e, kids);
  return e;
}

/** 자식(문자열·노드·배열·null 섞여도 됨)을 붙인다. */
export function add(parent, kids) {
  for (const k of kids.flat(9)) {
    if (k === null || k === undefined || k === false) continue;
    parent.append(k instanceof Node ? k : document.createTextNode(String(k)));
  }
  return parent;
}

/** 안을 비운다. */
export function clear(e) {
  while (e.firstChild) e.removeChild(e.firstChild);
  return e;
}

/* ─────────────────────────────── 큰 틀 조각 ──────────────────────────── */

/** 흰 상자 하나. 제목은 생략 가능. */
export function card(title, ...kids) {
  return h('section', { class: 'card' }, title ? h('h3', {}, title) : null, ...kids);
}

/** 학습지 머리 — 쪽 번호 + 제목 + 성취기준 + 배움 목표 */
export function sheetHead(no, title, stds = [], goals = []) {
  return [
    h('div', { class: 'sheet-head' },
      no ? h('span', { class: 'sheet-no' }, no) : null,
      h('h2', {}, title),
      stds.map((s) => h('span', { class: 'std', title: '2022 개정 교육과정 성취기준' }, s)),
    ),
    goals.length
      ? h('div', { class: 'goals' }, h('ul', {}, goals.map((g) => h('li', {}, g))))
      : null,
  ];
}

/** 작은 안내 상자. kind: '' | 'warn' | 'bad' | 'ok' */
export function note(kind, ...kids) {
  return h('div', { class: 'note' + (kind ? ' ' + kind : '') }, ...kids);
}

/** 「파이썬으로는 이렇게 씁니다」 접이 상자 */
export function pyBox(code, ...extra) {
  return h('details', { class: 'py' },
    h('summary', {}, '파이썬으로는 이렇게 씁니다'),
    h('div', {}, h('pre', { class: 'code' }, code), ...extra));
}

/* ──────────────────────────── ( 괄호 정답 ) ──────────────────────────── */

/**
 * 학습지의 괄호 정답. 처음에는 가려져 있고 [보기] 를 눌러야 열린다.
 * 교사가 설명할 때는 화면 위쪽 [정답 모두 보기] 로 한꺼번에 열 수 있다.
 */
export function answer(text) {
  const slot = h('span', { class: 'slot' }, text);
  const btn = h('button', { type: 'button' }, '보기');
  const box = h('span', { class: 'answer', 'data-answer': '1' }, slot, btn);
  btn.addEventListener('click', () => {
    const open = box.classList.toggle('open');
    btn.textContent = open ? '숨기기' : '보기';
  });
  return box;
}

/** 해설 문단 전체를 가리는 상자. 제목 줄을 누르면 열린다. */
export function answerBlock(label, ...kids) {
  const btn = h('button', { type: 'button', class: 'btn ghost small' }, label || '정답·해설 보기');
  const body = h('div', { class: 'body' }, ...kids);
  const box = h('div', { class: 'answer-block', 'data-answer': '1' }, btn, body);
  btn.addEventListener('click', () => {
    const open = box.classList.toggle('open');
    btn.textContent = open ? '접기' : (label || '정답·해설 보기');
  });
  return box;
}

/** 화면 안의 모든 ( 괄호 정답 ) 을 한꺼번에 열거나 닫는다. */
export function toggleAllAnswers(root, open) {
  root.querySelectorAll('.answer[data-answer]').forEach((box) => {
    box.classList.toggle('open', open);
    const b = box.querySelector('button');
    if (b) b.textContent = open ? '숨기기' : '보기';
  });
  root.querySelectorAll('.answer-block[data-answer]').forEach((box) => {
    box.classList.toggle('open', open);
    const b = box.querySelector('button');
    if (b) b.textContent = open ? '접기' : '정답·해설 보기';
  });
}

/* ──────────────────────────────── 문제 채점 ──────────────────────────── */

/** 답 비교용으로 문자열을 다듬는다 — 공백·대소문자·따옴표 차이를 무시한다. */
export function norm(s) {
  return String(s ?? '')
    .replace(/\s+/g, '')
    .replace(/[’‘]/g, "'")
    .replace(/[”“]/g, '"')
    .toLowerCase();
}

/**
 * 문제 묶음을 만든다.
 *
 * items 의 한 항목
 *   q       : 문제 (문자열 또는 노드 또는 노드 배열)
 *   type    : 'text'(기본) | 'choice' | 'ox'
 *   choices : type 이 choice 일 때 보기 배열
 *   answer  : 정답. 배열이면 그중 하나만 맞으면 정답
 *   check   : (입력값) => true/false  — answer 대신 직접 판정하고 싶을 때
 *   hint    : 힌트 문구
 *   explain : 해설 (채점 후 보임)
 *   place   : 입력칸 안내 문구
 *   width   : 입력칸 너비(px)
 */
export function quizSet(items, opts = {}) {
  const rows = [];
  const wrap = h('div', {});

  items.forEach((it, i) => {
    const row = h('div', { class: 'quiz' });
    const verdict = h('div', { class: 'verdict', style: { display: 'none' } });
    const explain = h('div', { class: 'explain', style: { display: 'none' } },
      it.explain ? [h('b', {}, '해설 '), it.explain] : null);
    let read = () => '';
    let paint = () => {};

    const qLine = h('div', { class: 'q' }, h('span', { class: 'num' }, `${i + 1}.`),
      ...(Array.isArray(it.q) ? it.q : [it.q]));

    let field;
    if (it.type === 'choice' || it.type === 'ox') {
      const choices = it.type === 'ox' ? ['O', 'X'] : it.choices;
      const btns = choices.map((c) => {
        const b = h('button', { type: 'button', class: 'btn ghost small' }, c);
        b.addEventListener('click', () => {
          btns.forEach((x) => { x.classList.add('ghost'); delete x.dataset.picked; });
          b.classList.remove('ghost');
          b.dataset.picked = '1';
        });
        return b;
      });
      field = h('div', { class: 'row tight' }, btns);
      read = () => {
        const p = btns.find((b) => b.dataset.picked);
        return p ? p.textContent : '';
      };
    } else {
      const inp = h('input', {
        type: 'text',
        class: 'mono',
        placeholder: it.place || '답 입력',
        style: { width: (it.width || 200) + 'px' },
      });
      inp.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') grade(); });
      field = h('div', { class: 'row tight' }, inp,
        it.unit ? h('span', { class: 'chip' }, it.unit) : null);
      read = () => inp.value;
      paint = (ok) => { inp.style.borderColor = ok ? 'var(--ok)' : 'var(--bad)'; };
    }

    const hintBox = it.hint ? h('div', { class: 'hintbox', style: { display: 'none' } },
      h('b', {}, '힌트 '), it.hint) : null;

    const hintBtn = it.hint
      ? h('button', {
          type: 'button', class: 'btn gray small',
          onclick: () => {
            const on = hintBox.style.display === 'none';
            hintBox.style.display = on ? 'block' : 'none';
          },
        }, '힌트')
      : null;

    function grade() {
      const v = read();
      if (norm(v) === '') return null;
      const ok = it.check
        ? !!it.check(v)
        : (Array.isArray(it.answer) ? it.answer : [it.answer]).some((a) => norm(a) === norm(v));
      row.classList.toggle('correct', ok);
      row.classList.toggle('wrong', !ok);
      verdict.style.display = 'block';
      verdict.className = 'verdict ' + (ok ? 'ok' : 'no');
      clear(verdict);
      add(verdict, [ok ? '⭕ 정답입니다.' : '❌ 다시 생각해 보세요.']);
      if (!ok && opts.revealOnWrong) {
        add(verdict, [' 정답: ', h('b', {}, String(Array.isArray(it.answer) ? it.answer[0] : it.answer))]);
      }
      if (it.explain) explain.style.display = 'block';
      paint(ok);
      return ok;
    }

    const checkBtn = h('button', { type: 'button', class: 'btn small', onclick: grade }, '확인');
    add(field, [checkBtn, hintBtn]);
    add(row, [qLine, field, hintBox, verdict, explain]);
    rows.push({ grade, reset: () => { row.className = 'quiz'; verdict.style.display = 'none'; } });
    wrap.append(row);
  });

  const scoreBox = h('span', { class: 'score' }, `0 / ${items.length}`);
  const bar = h('div', { class: 'row', style: { marginTop: '6px' } },
    h('button', {
      type: 'button', class: 'btn',
      onclick: () => {
        let ok = 0;
        rows.forEach((r) => { if (r.grade() === true) ok++; });
        scoreBox.textContent = `${ok} / ${items.length}`;
      },
    }, '전체 채점'),
    scoreBox,
  );

  return h('div', {}, wrap, bar);
}

/* ─────────────────────── 카드를 바구니에 나눠 담는 문제 ──────────────── */

/**
 * 분류 문제. 카드를 눌러 고른 뒤 바구니를 누르면 담긴다.
 * (교실 전자칠판에서는 끌어놓기보다 「누르고 → 누르기」 가 훨씬 잘 된다)
 *
 *   bins  : [{ id, label, hint }]
 *   cards : [{ text, bin }]   bin 은 정답 바구니의 id
 */
export function sortQuiz(bins, cards, opts = {}) {
  const state = cards.map((c) => ({ ...c, at: null, el: null }));
  let picked = null;

  const pool = h('div', { class: 'dropzone' }, h('div', { class: 'head' }, '아직 담지 않은 카드'));
  const binEls = new Map();
  const verdict = h('div', { class: 'row', style: { marginTop: '10px' } });

  function mkCard(s) {
    const el = h('div', { class: 'tile' }, s.text);
    el.addEventListener('click', () => {
      if (picked === s) { picked = null; el.classList.remove('picked'); return; }
      state.forEach((x) => x.el && x.el.classList.remove('picked'));
      picked = s;
      el.classList.add('picked');
    });
    s.el = el;
    return el;
  }

  function place(s, binId) {
    s.at = binId;
    s.el.classList.remove('picked', 'ok', 'no');
    picked = null;
    (binId === null ? pool : binEls.get(binId)).append(s.el);
  }

  const binBoxes = bins.map((b) => {
    const zone = h('div', { class: 'dropzone' },
      h('div', { class: 'head' }, b.label, b.hint ? h('span', { style: { fontWeight: '400' } }, ' — ' + b.hint) : null));
    binEls.set(b.id, zone);
    zone.addEventListener('click', () => {
      if (!picked) return;
      place(picked, b.id);
      clear(verdict);
    });
    return zone;
  });

  state.forEach((s) => { pool.append(mkCard(s)); });
  pool.addEventListener('click', (ev) => {
    if (!picked) return;
    if (ev.target.classList.contains('tile')) return;
    place(picked, null);
  });

  const scoreBox = h('span', { class: 'score' }, `0 / ${cards.length}`);

  const gradeBtn = h('button', {
    type: 'button', class: 'btn',
    onclick: () => {
      let ok = 0;
      state.forEach((s) => {
        const good = s.at === s.bin;
        s.el.classList.toggle('ok', good);
        s.el.classList.toggle('no', !good);
        if (good) ok++;
      });
      scoreBox.textContent = `${ok} / ${cards.length}`;
      clear(verdict);
      add(verdict, [ok === cards.length
        ? note('ok', '🎉 모두 맞혔습니다!')
        : note('warn', '빨간 카드를 다시 옮겨 보세요.')]);
    },
  }, '채점하기');

  const resetBtn = h('button', {
    type: 'button', class: 'btn gray',
    onclick: () => {
      state.forEach((s) => place(s, null));
      scoreBox.textContent = `0 / ${cards.length}`;
      clear(verdict);
    },
  }, '처음으로');

  return h('div', {},
    h('div', { class: 'lead' }, opts.lead || '카드를 누른 다음, 담을 곳을 누르세요. (다시 꺼내려면 카드를 누르고 위쪽 상자를 누릅니다)'),
    pool,
    h('div', { class: bins.length > 3 ? 'grid2' : 'grid' + Math.min(bins.length, 3), style: { marginTop: '12px', display: 'grid', gridTemplateColumns: `repeat(${Math.min(bins.length, 3)}, 1fr)`, gap: '12px' } }, binBoxes),
    h('div', { class: 'row', style: { marginTop: '12px' } }, gradeBtn, resetBtn, scoreBox),
    verdict);
}

/* ────────────────────────────── 자잘한 도구 ──────────────────────────── */

/** 숫자에 세 자리마다 콤마 */
export const comma = (n) => Number(n).toLocaleString('ko-KR');

/** 소수점 자리 맞춰 문자열로 (NaN 은 '–') */
export const fx = (n, d = 2) => (Number.isFinite(n) ? Number(n).toFixed(d) : '–');

/**
 * 캔버스를 처음 그릴 때 쓴다.
 * 먼저 곧바로 한 번 그리고(배경 탭이라 애니메이션 프레임이 오지 않아도 내용이 보이도록),
 * 화면 크기가 정해진 다음 프레임에 한 번 더 그려 해상도를 맞춘다.
 */
export function drawNow(fn) {
  try { fn(); } catch (e) { console.error(e); }
  requestAnimationFrame(fn);
}

/** 슬라이더 + 현재값 표시를 한 줄로 */
export function slider(label, { min, max, step = 1, value, unit = '', fmt = null, onInput }) {
  const show = (v) => (fmt ? fmt(Number(v)) : `${v}${unit}`);
  const out = h('b', { class: 'big-num', style: { fontSize: '1.15rem', minWidth: '76px', display: 'inline-block' } }, show(value));
  const inp = h('input', {
    type: 'range', min, max, step, value,
    style: { flex: '1', minWidth: '150px' },
    oninput: () => {
      out.textContent = show(inp.value);
      onInput(Number(inp.value));
    },
  });
  return {
    el: h('div', { class: 'row' }, h('label', { class: 'field' }, label), inp, out),
    input: inp,
    set(v) { inp.value = v; out.textContent = show(v); },
    get() { return Number(inp.value); },
  };
}

/** 여러 개 중 하나를 고르는 알약 단추 줄 */
export function pillGroup(options, { value = null, onPick }) {
  let cur = value ?? options[0].id;
  const btns = options.map((o) => h('button', {
    type: 'button',
    class: 'btn ' + (o.id === cur ? '' : 'ghost') + ' small',
    onclick: () => {
      cur = o.id;
      btns.forEach((b, i) => b.classList.toggle('ghost', options[i].id !== cur));
      onPick(cur);
    },
  }, o.label));
  return {
    el: h('div', { class: 'row tight' }, btns),
    get: () => cur,
    set(id) {
      cur = id;
      btns.forEach((b, i) => b.classList.toggle('ghost', options[i].id !== cur));
    },
  };
}

/** 표 하나 만들기. head 는 문자열 배열, rows 는 셀 배열의 배열 */
export function table(head, rows, opts = {}) {
  const t = h('table', { class: 'tbl' + (opts.compact ? ' compact' : '') });
  if (head && head.length) {
    t.append(h('thead', {}, h('tr', {}, head.map((c) => (c && c.nodeType ? h('th', {}, c) : h('th', { class: opts.leftHead ? 'left' : '' }, c))))));
  }
  const tb = h('tbody', {});
  rows.forEach((r) => {
    const tr = h('tr', {});
    r.forEach((c) => {
      if (c && c.nodeType === 1 && c.tagName === 'TD') tr.append(c);
      else tr.append(h('td', {}, c));
    });
    tb.append(tr);
  });
  t.append(tb);
  return opts.scroll === false ? t : h('div', { class: 'scroll-x' }, t);
}

/** 분수 표기 */
export function frac(top, bot) {
  return h('span', { class: 'frac' }, h('span', { class: 'top' }, top), h('span', { class: 'bot' }, bot));
}
