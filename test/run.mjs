/* ============================================================================
 * test/run.mjs — 학습지에 실린 정답과 앱의 계산이 어긋나지 않는지 지키는 시험
 *
 *   실행:  npm test
 *
 * 여기 적힌 숫자는 모두 「인공지능 기초 노트 v260307.pdf」 에 정답으로 실려 있는 값이다.
 * 코드를 고치다가 이 값이 바뀌면 시험이 실패한다.
 * (화면을 그리는 함수는 부르지 않으므로 브라우저 없이 node 로 돌아간다)
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

import * as S from '../src/lib/stats.js';
import { runSearch, runUCS, TREE_AJ, ROAD, CITY } from '../src/tabs/search/graph.js';
import { searchPuzzle, moves, hMisplaced, hManhattan, START, GOAL, ORDERS } from '../src/tabs/search/puzzle.js';
import { solveRiver, safeStates, danger, nextStates } from '../src/tabs/search/space.js';
import { forwardChain, BASE_RULES } from '../src/tabs/ethics/rules.js';
import { forward as mlpForward } from '../src/tabs/nn/mlp.js';
import { convolve, pool, defaultInput } from '../src/tabs/nn/cnn.js';

let pass = 0;
let fail = 0;
const fails = [];

function ok(name, got, want) {
  const g = JSON.stringify(got);
  const w = JSON.stringify(want);
  if (g === w) { pass++; return; }
  fail++;
  fails.push(`  ✗ ${name}\n      나온 값: ${g}\n      바라는 값: ${w}`);
}

function near(name, got, want, eps = 1e-6) {
  if (Number.isFinite(got) && Math.abs(got - want) <= eps) { pass++; return; }
  fail++;
  fails.push(`  ✗ ${name}\n      나온 값: ${got}\n      바라는 값: ${want} (±${eps})`);
}

function group(nm) { console.log(`\n── ${nm}`); }

/* ══════════════ 학습지 2쪽 · 기술 통계 ══════════════ */
group('학습지 2쪽 — 자료 1,1,1,1,2,3,3,5,10');
{
  const d = [1, 1, 1, 1, 2, 3, 3, 5, 10];
  near('평균값 = 3', S.mean(d), 3);
  near('중앙값 = 2', S.median(d), 2);
  ok('최빈값 = 1', S.mode(d).values, [1]);
  near('최솟값 = 1', Math.min(...d), 1);
  near('최댓값 = 10', Math.max(...d), 10);
  near('분산 = 70/9', S.variance(d), 70 / 9, 1e-9);
  near('표준편차 = √(70/9)', S.stdev(d), Math.sqrt(70 / 9), 1e-9);

  const q = S.quartiles(d, 'tukey');
  near('Q1 = 1 (교과서 방식)', q.q1, 1);
  near('Q2 = 2', q.q2, 2);
  near('Q3 = 4 (교과서 방식)', q.q3, 4);
  near('IQR = 3', q.iqr, 3);

  const b = S.boxStats(d);
  near('상단경계 = 8.5', b.fenceHi, 8.5);
  ok('이상치 = [10]', b.outliers, [10]);
}

/* ══════════════ 학습지 4쪽 · 스케일링 ══════════════ */
group('학습지 4쪽 — 정규화·표준화');
{
  near('(30−20)/(80−20) ≈ 0.1667', S.minmax([20, 30, 50, 80])[1], 10 / 60, 1e-9);
  const st = S.standardize([2, 4, 6, 8]);
  near('표준화 후 평균 = 0', S.mean(st), 0, 1e-9);
  near('표준화 후 표준편차 = 1', S.stdev(st), 1, 1e-9);
  ok('최소-최대는 0~1 범위', [Math.min(...S.minmax([5, 9, 22])), Math.max(...S.minmax([5, 9, 22]))], [0, 1]);
}

/* ══════════════ 심화 학습지 9~10쪽 · 분류 평가 ══════════════ */
group('심화 학습지 9~10쪽 — 분류 모델 평가');
{
  const m = S.clfMetrics({ tp: 15, fn: 5, fp: 10, tn: 70 });
  near('[활동3] 정확도 = 85%', m.accuracy, 0.85);
  near('[활동3] 정밀도 = 60%', m.precision, 0.60);
  near('[활동3] 재현율 = 75%', m.recall, 0.75);
  near('[활동3] F1 = 2/3', m.f1, 2 / 3, 1e-9);

  /* [활동2] 붓꽃 3×3 → 버시컬러 기준 2×2 */
  const iris = [[5, 0, 0], [0, 14, 0], [0, 1, 10]];
  ok('[활동2] 버시컬러 TP/FN/FP/TN', S.foldConfusion(iris, 1), { tp: 14, fn: 0, fp: 1, tn: 15 });
  near('다중분류 전체 정확도 = 대각선합/전체', (5 + 14 + 10) / 30, 29 / 30);

  /* 정확도의 역설 — 전부 정상이라고 찍기 */
  const p = S.clfMetrics({ tp: 0, fn: 10, fp: 0, tn: 990 });
  near('정확도의 역설: 정확도 99%', p.accuracy, 0.99);
  near('정확도의 역설: 재현율 0%', p.recall, 0);
  ok('정확도의 역설: 정밀도는 계산 불가', Number.isFinite(p.precision), false);
}

/* ══════════════ 학습지 8쪽 · 회귀 평가 ══════════════ */
group('학습지 8쪽 — 회귀 모델 평가');
{
  const yt = [3, -0.5, 2, 7];
  const yp = [2.5, 0.0, 2, 8];
  near('MAE', S.mae(yt, yp), 0.5);
  near('MSE', S.mse(yt, yp), 0.375);
  near('RMSE = √MSE', S.rmse(yt, yp), Math.sqrt(0.375), 1e-9);
  near('R²', S.r2(yt, yp), 0.9486081370449679, 1e-9);
  near('완벽 예측이면 R² = 1', S.r2([1, 2, 3], [1, 2, 3]), 1);
}

/* ══════════════ 학습지 14~15쪽 · 퍼셉트론과 다층 신경망 ══════════════ */
group('학습지 14~15쪽 — 퍼셉트론 · 다층 신경망');
{
  /* AND 퍼셉트론 w1=1, w2=1, b=-1.5 (학습지 14쪽 표) */
  const step = (v) => (v > 0 ? 1 : 0);
  const and = ([a, b]) => step(1 * a + 1 * b - 1.5);
  ok('AND 진리표', [[0, 0], [1, 0], [0, 1], [1, 1]].map(and), [0, 0, 0, 1]);
  near('x=(1,1) 일 때 가중합+b = 0.5', 1 * 1 + 1 * 1 - 1.5, 0.5);
  near('x=(1,0) 일 때 가중합+b = -0.5', 1 * 1 + 1 * 0 - 1.5, -0.5);

  /* 다층 신경망 XOR — 학습지 15쪽 가중치 그대로 */
  const X = [[0, 0], [1, 0], [0, 1], [1, 1]];
  ok('다층 신경망 XOR 출력', X.map((x) => mlpForward(x).y), [0, 1, 1, 0]);
  ok('은닉 뉴런 y1', X.map((x) => mlpForward(x).y1), [0, 0, 0, 1]);
  ok('은닉 뉴런 y2', X.map((x) => mlpForward(x).y2), [0, 1, 1, 1]);
  near('x=(1,1) 출력 가중합 = -1.9', mlpForward([1, 1]).zo, -1.9, 1e-9);
  near('x=(1,0) 출력 가중합 = 0.1', mlpForward([1, 0]).zo, 0.1, 1e-9);
}

/* ══════════════ 학습지 18쪽 · 합성곱 ══════════════ */
group('학습지 18쪽 — 합성곱 연산');
{
  const VEDGE = [[-1, 0, 1], [-1, 0, 1], [-1, 0, 1]];
  const fm = convolve(defaultInput(), VEDGE);
  ok('입력 8×8 · 필터 3×3 → 특징맵 6×6', [fm.length, fm[0].length], [6, 6]);
  ok('0→1 경계는 양수, 1→0 경계는 음수, 일정한 곳은 0', fm[0], [0, 3, 3, 0, -3, -3]);
  ok('모든 줄이 같다 (세로 경계이므로)', fm.every((r) => JSON.stringify(r) === JSON.stringify(fm[0])), true);

  /* 크기 규칙 n − k + 1 */
  const big = Array.from({ length: 10 }, () => new Array(10).fill(1));
  ok('입력 10×10 → 8×8', [convolve(big, VEDGE).length, convolve(big, VEDGE)[0].length], [8, 8]);

  /* 풀링 */
  const src = [[1, 3, 2, 4], [5, 6, 1, 2], [2, 1, 7, 8], [0, 4, 3, 9]];
  ok('최대 풀링 2×2', pool(src, 'max'), [[6, 4], [4, 9]]);
  ok('평균 풀링 2×2', pool(src, 'avg'), [[3.75, 2.25], [1.75, 6.75]]);
}

/* ══════════════ 학습지 20쪽 · 강 건너기 ══════════════ */
group('학습지 20쪽 — 강 건너기');
{
  ok('안전한 상태는 10가지', safeStates().length, 10);
  ok('0110(농부 없이 늑대와 양)은 위험', danger([0, 1, 1, 0]) !== null, true);
  ok('0011(농부 없이 양과 양배추)은 위험', danger([0, 0, 1, 1]) !== null, true);
  ok('1010은 안전', danger([1, 0, 1, 0]), null);

  const sol = solveRiver();
  ok('최소 이동 횟수 = 7', sol.length - 1, 7);
  ok('시작은 0000', sol[0].join(''), '0000');
  ok('끝은 1111', sol[sol.length - 1].join(''), '1111');
  ok('첫 수는 농부+양 (1010)', sol[1].join(''), '1010');
  ok('모든 중간 상태가 안전', sol.every((s) => danger(s) === null), true);
  ok('한 걸음마다 농부는 반드시 건넌다',
    sol.slice(1).every((s, i) => s[0] !== sol[i][0]), true);
  ok('네 번째 상태에서 양을 다시 데려온다 (뒷걸음)',
    sol[4][2] === 0 && sol[3][2] === 1, true);
  ok('상태 하나에서 갈 수 있는 안전한 다음 상태 수 (0010)', nextStates([0, 0, 1, 0]).length, 3);
}

/* ══════════════ 학습지 25쪽 · 너비/깊이 우선 탐색 ══════════════ */
group('학습지 25쪽 — 너비 우선 · 깊이 우선 탐색');
{
  const b = runSearch(TREE_AJ, 'bfs');
  const d = runSearch(TREE_AJ, 'dfs');
  ok('BFS 탐색 순서', b.order.join('-'), 'A-B-C-D-G-H-I-E-F-J');
  ok('BFS 탐색 횟수 = 10', b.order.length, 10);
  ok('DFS 탐색 순서', d.order.join('-'), 'A-B-D-E-F-C-G-H-I-J');
  ok('DFS 탐색 횟수 = 10', d.order.length, 10);

  /* 지름길이 있는 도로 — 깊이 우선은 최단 경로를 보장하지 못한다 */
  const b2 = runSearch(ROAD, 'bfs');
  const d2 = runSearch(ROAD, 'dfs');
  ok('BFS 는 지름길을 바로 찾는다 (경로 1칸)', b2.path.length - 1, 1);
  ok('DFS 는 먼 길을 돌아간다 (경로 7칸)', d2.path.length - 1, 7);
  ok('BFS 탐색 횟수 3 · DFS 탐색 횟수 8', [b2.order.length, d2.order.length], [3, 8]);
}

/* ══════════════ 학습지 26쪽 · 균일 비용 탐색 ══════════════ */
group('학습지 26쪽 — 균일 비용 탐색 (도시 a~e)');
{
  const r = runUCS(Object.keys(CITY.pos), CITY.edges, CITY.start, CITY.goal);
  ok('최단 경로 = a-c-d-e', r.result.path.join('-'), 'a-c-d-e');
  ok('경로 비용 = 12', r.result.g, 12);

  /* 학습지 표와 같은 자리에 오는 여섯 줄 */
  const rows = r.steps
    .filter((x) => x.note.startsWith('①') || x.note.startsWith('②④') || x.note.startsWith('④'))
    .map((x) => [
      x.open.map((o) => `${o.n}(${o.g})`).join(', ') || '-',
      x.closed.map((o) => `${o.n}(${o.g})`).join(', ') || '-',
    ]);
  ok('OPEN·CLOSED 표가 6줄', rows.length, 6);
  ok('1단계', rows[0], ['a(0)', '-']);
  ok('2단계', rows[1], ['b(5), c(4)', 'a(0)']);
  ok('3단계', rows[2], ['b(5), d(7)', 'a(0), c(4)']);
  ok('4단계', rows[3], ['d(7), e(14)', 'a(0), c(4), b(5)']);
  ok('5단계', rows[4], ['e(12)', 'a(0), c(4), b(5), d(7)']);
  ok('6단계', rows[5], ['-', 'a(0), c(4), b(5), d(7), e(12)']);
}

/* ══════════════ 학습지 24 · 27~29쪽 · 8-퍼즐 ══════════════ */
group('학습지 24 · 27~29쪽 — 8-퍼즐');
{
  ok('초기 상태 2 8 3 / 1 _ 4 / 7 6 5', START.join(''), '283104765');
  ok('목표 상태 1 2 3 / 8 _ 4 / 7 6 5', GOAL.join(''), '123804765');

  /* 학습지 28쪽 예시: 2 8 3 / 1 6 4 / 7 _ 5 → 맨해튼 h(n) = 1+1+1+2 = 5 */
  const EX = [2, 8, 3, 1, 6, 4, 7, 0, 5];
  ok('학습지 28쪽 h(n) = 5', hManhattan(EX), 5);
  ok('그 상태의 불일치 타일 수', hMisplaced(EX), 4);

  ok('초기 상태의 맨해튼 거리 = 4', hManhattan(START), 4);
  ok('초기 상태의 불일치 타일 수 = 3', hMisplaced(START), 3);

  const seq = ORDERS.ccw.seq;
  ['bfs', 'astar1', 'astar2'].forEach((a) => {
    const r = searchPuzzle(START.slice(), a, seq);
    ok(`${a} 가 4번 이동으로 푼다`, [r.ok, r.path.length - 1], [true, 4]);
    ok(`${a} 의 마지막 상태가 목표`, r.path[r.path.length - 1].st.join(''), '123804765');
  });

  const bfs = searchPuzzle(START.slice(), 'bfs', seq);
  const a2 = searchPuzzle(START.slice(), 'astar2', seq);
  ok('A*(맨해튼)가 너비 우선보다 적게 살펴본다', a2.expanded < bfs.expanded, true);

  /* 중앙이 빈칸이면 네 방향 모두 갈 수 있다 */
  ok('빈칸이 가운데면 이동 4가지', moves(START, seq).length, 4);
  ok('빈칸이 모서리면 이동 2가지', moves([0, 1, 2, 3, 4, 5, 6, 7, 8], seq).length, 2);
}

/* ══════════════ 학습지 32쪽 · 규칙 기반 추론 ══════════════ */
group('학습지 32쪽 — 규칙 기반 추론');
{
  const run = (facts) => forwardChain(facts, BASE_RULES);

  const a = run(['털이 있다', '고기를 먹는다', '황갈색이다', '검은 줄무늬가 있다']);
  ok('문제① 발화 순서', a.log.map((l) => `${l.fact}(규칙${l.rule})`),
    ['포유류이다(규칙1)', '육식 동물이다(규칙5)', '호랑이이다(규칙9)']);

  const b = run(['젖이 있다', '발굽이 있다', '되새김질을 한다', '흰색이다', '검은 줄무늬가 있다']);
  ok('문제② 발화 순서', b.log.map((l) => `${l.fact}(규칙${l.rule})`),
    ['포유류이다(규칙2)', '초식 동물이다(규칙7)', '얼룩말이다(규칙11)']);

  ok('치타', run(['털이 있다', '고기를 먹는다', '황갈색이다', '검은 점이 있다']).known.has('치타이다'), true);
  ok('기린', run(['젖이 있다', '발굽이 있다', '되새김질을 한다', '긴 다리와 긴 목을 가지고 있다', '황갈색이다', '검은 점이 있다']).known.has('기린이다'), true);
  ok('타조', run(['깃털이 있다', '날지 못한다', '긴 다리와 긴 목을 가지고 있다', '검은색과 흰색이다']).known.has('타조이다'), true);
  ok('펭귄', run(['깃털이 있다', '날지 못한다', '헤엄을 친다', '검은색과 흰색이다']).known.has('펭귄이다'), true);
  ok('갈매기', run(['깃털이 있다', '잘 난다']).known.has('갈매기이다'), true);
  ok('규칙4 — 난다 AND 알을 낳는다 → 새', run(['난다', '알을 낳는다']).known.has('새이다'), true);
  ok('조건이 하나만 맞으면 발화하지 않는다', run(['난다']).log.length, 0);
  ok('사실이 없으면 아무것도 안 나온다', run([]).log.length, 0);
}

/* ══════════════ 마무리 ══════════════ */
console.log('\n' + '─'.repeat(56));
if (fail) {
  console.log(fails.join('\n'));
  console.log(`\n❌ ${pass}개 통과, ${fail}개 실패`);
  process.exit(1);
}
console.log(`✅ ${pass}가지 모두 통과했습니다.`);
