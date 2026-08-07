/* ============================================================================
 * main.js — 인공지능 기초 실습실
 *   고등학교 2학년 「인공지능 기초」 학습지를 브라우저에서 직접 해 보는 앱.
 *
 *   화면 구성
 *     위쪽 큰 탭  = 대단원 여섯 개
 *     그 아래 알약 단추 = 학습지 꼭지
 *   주소창의 #대단원/꼭지 로 위치가 남으므로 새로고침해도 보던 곳이 그대로 열린다.
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

import './style.css';
import { h, clear, toggleAllAnswers } from './lib/ui.js';

/* Ⅰ. AI 구현 프로세스 */
import * as pipeline from './tabs/process/pipeline.js';
import * as pstats from './tabs/process/stats.js';
import * as viz from './tabs/process/viz.js';

/* Ⅱ. 데이터 전처리 */
import * as missing from './tabs/prep/missing.js';
import * as outlier from './tabs/prep/outlier.js';
import * as scaling from './tabs/prep/scaling.js';
import * as encoding from './tabs/prep/encoding.js';

/* Ⅲ. 모델링과 평가 */
import * as kinds from './tabs/model/kinds.js';
import * as split from './tabs/model/split.js';
import * as overfit from './tabs/model/overfit.js';
import * as classify from './tabs/model/classify.js';
import * as regress from './tabs/model/regress.js';
import * as algo from './tabs/model/algo.js';

/* Ⅳ. 신경망과 딥러닝 */
import * as perceptron from './tabs/nn/perceptron.js';
import * as mlp from './tabs/nn/mlp.js';
import * as backprop from './tabs/nn/backprop.js';
import * as cnn from './tabs/nn/cnn.js';

/* Ⅴ. 탐색 */
import * as space from './tabs/search/space.js';
import * as sgraph from './tabs/search/graph.js';
import * as puzzle from './tabs/search/puzzle.js';
import * as astar from './tabs/search/astar.js';

/* Ⅵ. 지식 표현·추론과 윤리 */
import * as rules from './tabs/ethics/rules.js';
import * as ethics from './tabs/ethics/ethics.js';

/* ────────────────────────────── 화면 목록 ─────────────────────────── */

const TABS = [
  {
    id: 'process', title: 'Ⅰ. AI 구현 프로세스', color: 'var(--c-proc)',
    sheets: [
      { id: 'pipeline', label: '① 프로세스와 데이터 종류', mod: pipeline },
      { id: 'stats', label: '② 기술 통계 실험실', mod: pstats },
      { id: 'viz', label: '③ 시각화와 상관계수', mod: viz },
    ],
  },
  {
    id: 'prep', title: 'Ⅱ. 데이터 전처리', color: 'var(--c-prep)',
    sheets: [
      { id: 'missing', label: '④ 결측치', mod: missing },
      { id: 'outlier', label: '⑤ 이상치 (IQR)', mod: outlier },
      { id: 'scaling', label: '⑥ 정규화·표준화', mod: scaling },
      { id: 'encoding', label: '⑦ 인코딩·핵심 속성', mod: encoding },
    ],
  },
  {
    id: 'model', title: 'Ⅲ. 모델링과 평가', color: 'var(--c-model)',
    sheets: [
      { id: 'kinds', label: '⑧ 기계학습 세 갈래', mod: kinds },
      { id: 'split', label: '⑨ 데이터 준비와 분할', mod: split },
      { id: 'overfit', label: '⑩ 학습과 과적합', mod: overfit },
      { id: 'classify', label: '⑪ 분류 모델 평가', mod: classify },
      { id: 'regress', label: '⑫ 회귀 모델 평가', mod: regress },
      { id: 'algo', label: '⑬ KNN·결정트리', mod: algo },
    ],
  },
  {
    id: 'nn', title: 'Ⅳ. 신경망과 딥러닝', color: 'var(--c-nn)',
    sheets: [
      { id: 'perceptron', label: '⑭ 퍼셉트론', mod: perceptron },
      { id: 'mlp', label: '⑮ 다층 신경망·활성화 함수', mod: mlp },
      { id: 'backprop', label: '⑯ 역전파·경사하강법', mod: backprop },
      { id: 'cnn', label: '⑰ 합성곱 신경망 (CNN)', mod: cnn },
    ],
  },
  {
    id: 'search', title: 'Ⅴ. 탐색', color: 'var(--c-search)',
    sheets: [
      { id: 'space', label: '⑱ 상태 공간·강 건너기', mod: space },
      { id: 'graph', label: '⑲ BFS·DFS·균일 비용', mod: sgraph },
      { id: 'puzzle', label: '⑳ 8-퍼즐 겨루기', mod: puzzle },
      { id: 'astar', label: '㉑ A* 길 찾기', mod: astar },
    ],
  },
  {
    id: 'ethics', title: 'Ⅵ. 지식 표현·추론과 윤리', color: 'var(--c-ethics)',
    sheets: [
      { id: 'rules', label: '㉒ 규칙 기반 추론', mod: rules },
      { id: 'ethics', label: '㉓ 인공지능 윤리·모럴 머신', mod: ethics },
    ],
  },
];

/* ────────────────────────────── 앱 그리기 ─────────────────────────── */

const app = document.getElementById('app');
let tabId = TABS[0].id;
let sheetId = TABS[0].sheets[0].id;
let answersOpen = false;

const tabBar = h('div', { class: 'tabs' });
const subNav = h('nav', { class: 'subnav' });
const main = h('main', {});

const answerBtn = h('button', {
  type: 'button', class: 'btn ghost small',
  onclick: () => {
    answersOpen = !answersOpen;
    toggleAllAnswers(main, answersOpen);
    answerBtn.textContent = answersOpen ? '🙈 정답 모두 숨기기' : '👁️ 정답 모두 보기';
  },
}, '👁️ 정답 모두 보기');

const topbar = h('header', { class: 'topbar' },
  h('div', { class: 'topbar-inner' },
    h('div', { class: 'brand' },
      h('h1', {}, '인공지능 기초 실습실'),
      h('span', { class: 'sub' }, '고등학교 2학년 「인공지능 기초」 · 학습지를 직접 해 보는 곳'),
      h('span', { class: 'spacer' }),
      answerBtn),
    tabBar));

function paintTabs() {
  clear(tabBar);
  TABS.forEach((t) => {
    tabBar.append(h('button', {
      type: 'button', role: 'tab', 'aria-selected': String(t.id === tabId),
      onclick: () => go(t.id, t.sheets[0].id),
    }, t.title));
  });
}

function paintSubNav() {
  clear(subNav);
  const tab = TABS.find((t) => t.id === tabId);
  tab.sheets.forEach((s) => {
    subNav.append(h('button', {
      type: 'button', 'aria-current': String(s.id === sheetId),
      onclick: () => go(tabId, s.id),
    }, s.label));
  });
}

function paintMain() {
  const tab = TABS.find((t) => t.id === tabId);
  const sheet = tab.sheets.find((s) => s.id === sheetId) || tab.sheets[0];
  document.documentElement.style.setProperty('--accent', tab.color);
  clear(main);
  try {
    sheet.mod.render(main);
  } catch (e) {
    main.append(h('div', { class: 'note bad' },
      h('b', {}, '이 화면을 그리는 중 문제가 생겼습니다. '), String(e && e.message)));
    console.error(e);
  }
  // 이전 화면에서 「정답 모두 보기」 를 켜 두었다면 새 화면에도 이어서 적용한다
  if (answersOpen) toggleAllAnswers(main, true);
  window.scrollTo({ top: 0 });
}

function go(t, s, fromHash) {
  tabId = t; sheetId = s;
  if (!fromHash) location.hash = `${t}/${s}`;
  paintTabs(); paintSubNav(); paintMain();
}

function readHash() {
  const [t, s] = location.hash.replace(/^#/, '').split('/');
  const tab = TABS.find((x) => x.id === t);
  if (!tab) return false;
  const sheet = tab.sheets.find((x) => x.id === s) || tab.sheets[0];
  go(tab.id, sheet.id, true);
  return true;
}

window.addEventListener('hashchange', () => readHash());

app.append(topbar, subNav, main,
  h('div', { class: 'footer' },
    h('div', {}, '인공지능 기초 실습실 · 2022 개정 교육과정 고등학교 「인공지능 기초」 · 학생 개인정보를 수집하거나 저장하지 않습니다.'),
    h('div', { style: { marginTop: '6px' } },
      'Copyright 2026 trmoo · ',
      h('a', {
        href: 'http://www.apache.org/licenses/LICENSE-2.0',
        target: '_blank', rel: 'noopener',
        style: { color: 'inherit' },
      }, 'Apache License 2.0'),
      ' 에 따라 누구나 자유롭게 쓰고 고치고 나눌 수 있습니다.')));

if (!readHash()) go(tabId, sheetId);
