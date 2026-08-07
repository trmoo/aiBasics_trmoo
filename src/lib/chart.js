/* ============================================================================
 * chart.js — 캔버스에 그림을 그리는 작은 도구 모음
 *
 * 외부 그래프 라이브러리를 쓰지 않고 직접 그린다.
 * 교실 인터넷이 끊겨도 열리게 하려는 것이고,
 * 학생이 코드를 열어 「그래프도 결국 좌표 계산이구나」 를 볼 수 있게 하려는 뜻도 있다.
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

import { h } from './ui.js';

export const COLORS = {
  ink: '#1b2430',
  soft: '#5a6675',
  line: '#d8dee9',
  grid: '#eef1f7',
  blue: '#1e6fd9',
  green: '#0f9d6e',
  orange: '#d9781e',
  purple: '#6b4fd8',
  pink: '#c02f6b',
  teal: '#2f7d8c',
  red: '#cf3030',
  gold: '#b8860b',
};

/**
 * 캔버스를 하나 만들고, 좌표 변환까지 붙여서 돌려준다.
 * 화면 해상도(devicePixelRatio)에 맞춰 크기를 잡아 글자가 흐려지지 않게 한다.
 */
export function makeCanvas(height = 300, { pad = { l: 46, r: 16, t: 16, b: 36 } } = {}) {
  const cv = h('canvas', { class: 'stage', style: { height: height + 'px' } });
  const api = {
    el: cv,
    pad,
    w: 0,
    hgt: height,
    ctx: null,
    /** 캔버스 크기를 지금 화면에 맞추고 배경을 지운다 */
    begin() {
      const dpr = window.devicePixelRatio || 1;
      const cssW = cv.clientWidth || cv.parentElement?.clientWidth || 600;
      cv.width = Math.round(cssW * dpr);
      cv.height = Math.round(height * dpr);
      const ctx = cv.getContext('2d');
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.clearRect(0, 0, cssW, height);
      api.w = cssW;
      api.hgt = height;
      api.ctx = ctx;
      ctx.font = '12px "Malgun Gothic", sans-serif';
      ctx.textBaseline = 'middle';
      return ctx;
    },
    get plotW() { return api.w - pad.l - pad.r; },
    get plotH() { return height - pad.t - pad.b; },
  };
  return api;
}

/** 값 범위(dom)와 픽셀 범위(px)를 잇는 자 */
export function scale(d0, d1, p0, p1) {
  const span = d1 - d0 || 1;
  const f = (v) => p0 + ((v - d0) / span) * (p1 - p0);
  f.invert = (p) => d0 + ((p - p0) / (p1 - p0 || 1)) * span;
  f.domain = [d0, d1];
  return f;
}

/** 눈금 값을 보기 좋은 간격으로 만든다 (0, 0.5, 1 … 처럼) */
export function ticks(lo, hi, n = 5) {
  const span = hi - lo;
  if (!Number.isFinite(span) || span === 0) return [lo];
  const raw = span / n;
  const mag = 10 ** Math.floor(Math.log10(raw));
  const norm = raw / mag;
  const step = (norm >= 7.5 ? 10 : norm >= 3.5 ? 5 : norm >= 1.5 ? 2 : 1) * mag;
  const start = Math.ceil(lo / step) * step;
  const out = [];
  for (let v = start; v <= hi + step * 1e-9; v += step) out.push(Math.round(v / step) * step);
  return out;
}

/** 가로·세로 축과 옅은 눈금선 */
export function axes(c, sx, sy, { xLabel = '', yLabel = '', xTicks = null, yTicks = null, fmtX = null, fmtY = null } = {}) {
  const ctx = c.ctx;
  const [x0, x1] = [c.pad.l, c.w - c.pad.r];
  const [y0, y1] = [c.hgt - c.pad.b, c.pad.t];

  const tx = xTicks || ticks(sx.domain[0], sx.domain[1], 6);
  const ty = yTicks || ticks(sy.domain[0], sy.domain[1], 5);

  ctx.strokeStyle = COLORS.grid;
  ctx.lineWidth = 1;
  ctx.fillStyle = COLORS.soft;
  ctx.textAlign = 'center';

  tx.forEach((v) => {
    const x = sx(v);
    ctx.beginPath(); ctx.moveTo(x, y0); ctx.lineTo(x, y1); ctx.stroke();
    ctx.fillText(fmtX ? fmtX(v) : fmtNum(v), x, y0 + 14);
  });

  ctx.textAlign = 'right';
  ty.forEach((v) => {
    const y = sy(v);
    ctx.beginPath(); ctx.moveTo(x0, y); ctx.lineTo(x1, y); ctx.stroke();
    ctx.fillText(fmtY ? fmtY(v) : fmtNum(v), x0 - 7, y);
  });

  ctx.strokeStyle = COLORS.line;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(x0, y1); ctx.lineTo(x0, y0); ctx.lineTo(x1, y0);
  ctx.stroke();

  ctx.fillStyle = COLORS.soft;
  if (xLabel) { ctx.textAlign = 'right'; ctx.fillText(xLabel, x1, y0 + 26); }
  if (yLabel) { ctx.textAlign = 'left'; ctx.fillText(yLabel, x0 - 40, y1 - 6); }
}

/** 숫자를 짧게 */
export function fmtNum(v) {
  if (!Number.isFinite(v)) return '';
  if (Math.abs(v) >= 1000) return Math.round(v).toLocaleString('ko-KR');
  if (Number.isInteger(v)) return String(v);
  return String(Math.round(v * 100) / 100);
}

/** 점 하나 */
export function dot(ctx, x, y, r = 4, color = COLORS.blue, ring = false) {
  ctx.beginPath();
  ctx.arc(x, y, r, 0, Math.PI * 2);
  ctx.fillStyle = color;
  ctx.fill();
  if (ring) { ctx.strokeStyle = '#fff'; ctx.lineWidth = 1.5; ctx.stroke(); }
}

/** 선 잇기 */
export function polyline(ctx, pts, color = COLORS.blue, width = 2, dash = null) {
  if (pts.length < 2) return;
  ctx.save();
  if (dash) ctx.setLineDash(dash);
  ctx.beginPath();
  ctx.moveTo(pts[0][0], pts[0][1]);
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i][0], pts[i][1]);
  ctx.strokeStyle = color;
  ctx.lineWidth = width;
  ctx.lineJoin = 'round';
  ctx.stroke();
  ctx.restore();
}

/** 글자 (기본 왼쪽 정렬) */
export function label(ctx, text, x, y, { color = COLORS.ink, align = 'left', size = 12, bold = false } = {}) {
  ctx.font = `${bold ? '700 ' : ''}${size}px "Malgun Gothic", sans-serif`;
  ctx.fillStyle = color;
  ctx.textAlign = align;
  ctx.fillText(text, x, y);
  ctx.font = '12px "Malgun Gothic", sans-serif';
}

/** 상자그림 하나를 가로로 그린다 */
export function drawBox(c, s, sx, y, height = 46) {
  const ctx = c.ctx;
  const half = height / 2;

  // 수염
  ctx.strokeStyle = COLORS.soft;
  ctx.lineWidth = 1.5;
  ctx.beginPath();
  ctx.moveTo(sx(s.lo), y); ctx.lineTo(sx(s.q1), y);
  ctx.moveTo(sx(s.q3), y); ctx.lineTo(sx(s.hi), y);
  ctx.moveTo(sx(s.lo), y - half * 0.5); ctx.lineTo(sx(s.lo), y + half * 0.5);
  ctx.moveTo(sx(s.hi), y - half * 0.5); ctx.lineTo(sx(s.hi), y + half * 0.5);
  ctx.stroke();

  // 상자 (Q1 ~ Q3)
  const bx = sx(s.q1); const bw = Math.max(1, sx(s.q3) - sx(s.q1));
  ctx.fillStyle = '#dcebff';
  ctx.strokeStyle = COLORS.blue;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.rect(bx, y - half, bw, height);
  ctx.fill(); ctx.stroke();

  // 중앙값
  ctx.strokeStyle = COLORS.orange;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(sx(s.q2), y - half); ctx.lineTo(sx(s.q2), y + half);
  ctx.stroke();

  // 이상치
  s.outliers.forEach((v) => {
    ctx.beginPath();
    ctx.arc(sx(v), y, 5, 0, Math.PI * 2);
    ctx.fillStyle = '#fff';
    ctx.fill();
    ctx.strokeStyle = COLORS.red;
    ctx.lineWidth = 2;
    ctx.stroke();
  });
}

/** 상관계수 값을 색으로 (히트맵용) — 음수는 빨강, 양수는 파랑 */
export function corrColor(r) {
  if (!Number.isFinite(r)) return '#f1f4f9';
  const t = Math.min(1, Math.abs(r));
  const a = 0.12 + t * 0.75;
  return r >= 0 ? `rgba(30,111,217,${a})` : `rgba(207,48,48,${a})`;
}
