/* ============================================================================
 * stats.js — 학습지 3장 「기술 통계」 에 나오는 계산을 그대로 담은 곳
 *
 * 사분위수는 구하는 방법이 여러 가지라 두 가지를 모두 넣었다.
 *   tukey  : 교과서·학습지 방식. 중앙값으로 반을 가르고 각 절반의 중앙값을 쓴다.
 *   linear : numpy·pandas 의 기본값. 위치를 소수로 구하고 이웃 두 값을 비례로 섞는다.
 * 같은 자료라도 두 방법의 Q1·Q3 가 다를 수 있어서, 앱은 둘을 나란히 보여 준다.
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

/** 오름차순으로 정렬한 새 배열 */
export const sorted = (a) => a.slice().sort((x, y) => x - y);

/** 평균값 — 다 더해서 개수로 나눈다 */
export const mean = (a) => (a.length ? a.reduce((s, v) => s + v, 0) / a.length : NaN);

/** 중앙값 — 정렬해서 가운데. 개수가 짝수면 가운데 둘의 평균 */
export function median(a) {
  if (!a.length) return NaN;
  const s = sorted(a);
  const m = s.length >> 1;
  return s.length % 2 ? s[m] : (s[m - 1] + s[m]) / 2;
}

/** 최빈값 — 가장 자주 나온 값. 여러 개면 모두 돌려준다 */
export function mode(a) {
  const cnt = new Map();
  a.forEach((v) => cnt.set(v, (cnt.get(v) || 0) + 1));
  let best = 0;
  cnt.forEach((c) => { if (c > best) best = c; });
  const vals = [];
  cnt.forEach((c, v) => { if (c === best) vals.push(v); });
  return { values: sorted(vals), count: best };
}

/**
 * 분산 — 각 값에서 평균을 뺀 차이를 제곱해 평균 낸 값.
 * 학습지는 「제곱의 평균」이라 했으므로 n 으로 나누는 모분산이 기본이다.
 * sample=true 로 부르면 n-1 로 나누는 표본분산(파이썬 pandas 의 기본값)이 된다.
 */
export function variance(a, sample = false) {
  if (a.length < (sample ? 2 : 1)) return NaN;
  const m = mean(a);
  const ss = a.reduce((s, v) => s + (v - m) ** 2, 0);
  return ss / (a.length - (sample ? 1 : 0));
}

/** 표준편차 — 분산의 제곱근 */
export const stdev = (a, sample = false) => Math.sqrt(variance(a, sample));

/**
 * 사분위수.
 *   method 'tukey'  : 중앙값으로 반을 가르고(가운데 값은 양쪽 모두에서 뺀다) 각 절반의 중앙값
 *   method 'linear' : numpy 기본값. 위치 h = p*(n-1) 을 구하고 이웃 두 값을 비례로 섞는다
 */
export function quartiles(a, method = 'tukey') {
  if (!a.length) return { q1: NaN, q2: NaN, q3: NaN, iqr: NaN };
  const s = sorted(a);
  if (method === 'linear') {
    const at = (p) => {
      const hpos = p * (s.length - 1);
      const lo = Math.floor(hpos);
      const hi = Math.ceil(hpos);
      return s[lo] + (s[hi] - s[lo]) * (hpos - lo);
    };
    const q1 = at(0.25); const q2 = at(0.5); const q3 = at(0.75);
    return { q1, q2, q3, iqr: q3 - q1 };
  }
  const m = s.length >> 1;
  const lower = s.slice(0, m);
  const upper = s.length % 2 ? s.slice(m + 1) : s.slice(m);
  const q1 = median(lower);
  const q2 = median(s);
  const q3 = median(upper);
  return { q1, q2, q3, iqr: q3 - q1 };
}

/**
 * 상자그림에 필요한 다섯 수치 + 이상치.
 * 학습지 정의 그대로:
 *   상단경계 = (Q3 + 1.5*IQR) 과 최댓값 중 작은 값
 *   하단경계 = (Q1 - 1.5*IQR) 과 최솟값 중 큰 값
 *   이상치   = 상단경계보다 크거나 하단경계보다 작은 값
 */
export function boxStats(a, method = 'tukey') {
  const s = sorted(a);
  const { q1, q2, q3, iqr } = quartiles(a, method);
  const lo = Math.max(q1 - 1.5 * iqr, s[0]);
  const hi = Math.min(q3 + 1.5 * iqr, s[s.length - 1]);
  const outliers = s.filter((v) => v > hi || v < lo);
  return { min: s[0], max: s[s.length - 1], q1, q2, q3, iqr, lo, hi, outliers, fenceLo: q1 - 1.5 * iqr, fenceHi: q3 + 1.5 * iqr };
}

/** 왜도 — 분포가 정규분포보다 얼마나 한쪽으로 치우쳤는가 (모집단 정의) */
export function skewness(a) {
  const n = a.length;
  if (n < 2) return NaN;
  const m = mean(a); const sd = stdev(a);
  if (!sd) return 0;
  return a.reduce((s, v) => s + ((v - m) / sd) ** 3, 0) / n;
}

/** 첨도 — 분포가 정규분포보다 얼마나 뾰족한가 (정규분포가 0 이 되도록 3 을 뺀 값) */
export function kurtosis(a) {
  const n = a.length;
  if (n < 2) return NaN;
  const m = mean(a); const sd = stdev(a);
  if (!sd) return 0;
  return a.reduce((s, v) => s + ((v - m) / sd) ** 4, 0) / n - 3;
}

/** 피어슨 상관계수 — -1 과 +1 사이. 두 변수의 선형 관계 세기 */
export function corr(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return NaN;
  const mx = mean(x.slice(0, n)); const my = mean(y.slice(0, n));
  let sxy = 0; let sxx = 0; let syy = 0;
  for (let i = 0; i < n; i++) {
    const dx = x[i] - mx; const dy = y[i] - my;
    sxy += dx * dy; sxx += dx * dx; syy += dy * dy;
  }
  if (sxx === 0 || syy === 0) return NaN;
  return sxy / Math.sqrt(sxx * syy);
}

/** 최소-최대 정규화 — 0 ~ 1 사이로 */
export function minmax(a) {
  const lo = Math.min(...a); const hi = Math.max(...a);
  const d = hi - lo;
  return a.map((v) => (d === 0 ? 0 : (v - lo) / d));
}

/** 표준화 — 평균 0, 표준편차 1 로 */
export function standardize(a) {
  const m = mean(a); const sd = stdev(a);
  return a.map((v) => (sd === 0 ? 0 : (v - m) / sd));
}

/** 히스토그램 구간별 개수 */
export function histogram(a, bins = 8, lo = null, hi = null) {
  if (!a.length) return { edges: [], counts: [] };
  const mn = lo === null ? Math.min(...a) : lo;
  const mx = hi === null ? Math.max(...a) : hi;
  const w = (mx - mn) / bins || 1;
  const counts = new Array(bins).fill(0);
  a.forEach((v) => {
    let i = Math.floor((v - mn) / w);
    if (i >= bins) i = bins - 1;
    if (i < 0) i = 0;
    counts[i]++;
  });
  const edges = Array.from({ length: bins + 1 }, (_, i) => mn + w * i);
  return { edges, counts, width: w };
}

/**
 * 최소제곱법 단순 선형회귀 — y = a*x + b 의 a, b 를 구한다.
 * 「오차를 가장 적게 하는 선」 을 실제로 계산해서 보여 주기 위한 것.
 */
export function linreg(x, y) {
  const n = Math.min(x.length, y.length);
  if (n < 2) return { a: 0, b: mean(y) || 0 };
  const mx = mean(x.slice(0, n)); const my = mean(y.slice(0, n));
  let sxy = 0; let sxx = 0;
  for (let i = 0; i < n; i++) { sxy += (x[i] - mx) * (y[i] - my); sxx += (x[i] - mx) ** 2; }
  const a = sxx === 0 ? 0 : sxy / sxx;
  return { a, b: my - a * mx };
}

/* ─────────────────────── 회귀 모델 성능 평가 지표 ────────────────────── */

/** 평균 절대 오차 — 오차의 절댓값 평균 */
export const mae = (yt, yp) => mean(yt.map((v, i) => Math.abs(v - yp[i])));

/** 평균 제곱 오차 — 오차를 제곱해 평균. 큰 오차에 훨씬 민감하다 */
export const mse = (yt, yp) => mean(yt.map((v, i) => (v - yp[i]) ** 2));

/** 제곱근 평균 제곱 오차 — MSE 의 제곱근. 단위가 원래 값과 같아진다 */
export const rmse = (yt, yp) => Math.sqrt(mse(yt, yp));

/**
 * 결정계수 R² = 1 - (설명 못한 변동 / 총 변동)
 * 학습지 표현으로는 「총 변동 중 설명된 변동의 비율」.
 */
export function r2(yt, yp) {
  const m = mean(yt);
  const ssTot = yt.reduce((s, v) => s + (v - m) ** 2, 0);
  const ssRes = yt.reduce((s, v, i) => s + (v - yp[i]) ** 2, 0);
  return ssTot === 0 ? NaN : 1 - ssRes / ssTot;
}

/* ─────────────────────── 분류 모델 성능 평가 지표 ────────────────────── */

/**
 * 혼동행렬 네 값으로 지표를 한꺼번에 구한다.
 * 학습지 정의
 *   정확도 = (TP+TN) / 전체
 *   정밀도 = TP / (TP+FP)   ← 「Positive 라고 예측한 것」 중 진짜
 *   재현율 = TP / (TP+FN)   ← 「실제 Positive」 중 찾아낸 것
 *   F1     = 정밀도와 재현율의 조화평균
 */
export function clfMetrics({ tp, fn, fp, tn }) {
  const total = tp + fn + fp + tn;
  const accuracy = total ? (tp + tn) / total : NaN;
  const precision = tp + fp ? tp / (tp + fp) : NaN;
  const recall = tp + fn ? tp / (tp + fn) : NaN;
  const f1 = Number.isFinite(precision) && Number.isFinite(recall) && precision + recall > 0
    ? (2 * precision * recall) / (precision + recall)
    : NaN;
  return { total, accuracy, precision, recall, f1 };
}

/**
 * 다중분류 혼동행렬(정사각 행렬)을 특정 클래스 기준의 2×2 로 접는다.
 *   TP = 대각선 값
 *   FN = 그 행에서 대각선을 뺀 합   (실제는 그 클래스인데 다른 것으로 예측)
 *   FP = 그 열에서 대각선을 뺀 합   (실제는 다른 것인데 그 클래스로 예측)
 *   TN = 나머지 전부
 */
export function foldConfusion(matrix, k) {
  const n = matrix.length;
  let tp = 0; let fn = 0; let fp = 0; let tn = 0;
  for (let i = 0; i < n; i++) {
    for (let j = 0; j < n; j++) {
      const v = matrix[i][j];
      if (i === k && j === k) tp += v;
      else if (i === k) fn += v;
      else if (j === k) fp += v;
      else tn += v;
    }
  }
  return { tp, fn, fp, tn };
}
