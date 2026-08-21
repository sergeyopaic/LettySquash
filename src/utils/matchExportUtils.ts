import type { Competition, SquashMatch } from '../types/squash';
import { getMatchMode } from './matchModeUtils';
import { formatFullDateTime, formatMatchDuration } from './dateUtils';

// Static background artwork (see public/assets/match_import.jpg) — Letty & Manny
// high-fiving over a cream result panel and two navy stat panels. Box geometry below
// was measured directly against the 832x1248 source pixels; keep in sync if the art
// is ever re-exported at a different size or layout.
const TEMPLATE_URL = '/assets/match_import.jpg';
const CANVAS_W = 832;
const CANVAS_H = 1248;

const CREAM_BOX = { x: 44, y: 598, w: 744, h: 386 };
const STAT_BOX_1 = { x: 40, y: 1028, w: 350, h: 174 };
const STAT_BOX_2 = { x: 442, y: 1028, w: 350, h: 174 };

const FONT_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const NAVY = '#0f172a';
const MUTED_GOLD = '#d8b872';
const SLATE_500 = '#64748b';
const CREAM_TEXT = '#f8fafc';

let cachedTemplate: HTMLImageElement | null = null;

const loadTemplate = (): Promise<HTMLImageElement> => {
  if (cachedTemplate) return Promise.resolve(cachedTemplate);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      cachedTemplate = img;
      resolve(img);
    };
    img.onerror = () => reject(new Error('Failed to load match export template'));
    img.src = TEMPLATE_URL;
  });
};

const roundRectPath = (ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) => {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
};

// Shrinks the font size (never below minSize) until `text` fits within maxWidth,
// so long player names never overflow their box instead of getting silently clipped.
const fitFontSize = (
  ctx: CanvasRenderingContext2D,
  text: string,
  maxWidth: number,
  startSize: number,
  minSize: number,
  weight: string
): number => {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${FONT_STACK}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
};

// A quiet "eyebrow" label (small caps flanked by thin rules) rather than a heavy pill —
// the match type is context, not the headline. Score and player names carry the page.
const drawEyebrow = (ctx: CanvasRenderingContext2D, label: string, centerX: number, baselineY: number) => {
  ctx.font = `800 15px ${FONT_STACK}`;
  const textWidth = ctx.measureText(label).width;
  const gap = 14;
  const ruleLen = 36;
  const ruleY = baselineY - 5;

  ctx.strokeStyle = '#c9bfa8';
  ctx.lineWidth = 1.5;

  ctx.beginPath();
  ctx.moveTo(centerX - textWidth / 2 - gap - ruleLen, ruleY);
  ctx.lineTo(centerX - textWidth / 2 - gap, ruleY);
  ctx.stroke();

  ctx.beginPath();
  ctx.moveTo(centerX + textWidth / 2 + gap, ruleY);
  ctx.lineTo(centerX + textWidth / 2 + gap + ruleLen, ruleY);
  ctx.stroke();

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  ctx.fillStyle = SLATE_500;
  ctx.fillText(label, centerX, baselineY);
};

// A small filled dot marking the winning side — the only signal that one player beat
// the other. Names themselves stay identical in weight/color; this is the sole accent,
// so it reads as "who won" without implying "who matters more".
const drawWinnerDot = (ctx: CanvasRenderingContext2D, x: number, y: number) => {
  ctx.beginPath();
  ctx.arc(x, y, 5, 0, Math.PI * 2);
  ctx.fillStyle = MUTED_GOLD;
  ctx.fill();
};

const drawGameChips = (
  ctx: CanvasRenderingContext2D,
  games: { p1Score: number; p2Score: number }[],
  centerX: number,
  centerY: number,
  maxWidth: number
) => {
  // Sized for readability first — this club has a lot of older players, so the
  // per-game score needs to be legible at a glance, not just decorative.
  const fontSize = 22;
  ctx.font = `800 ${fontSize}px ${FONT_STACK}`;
  const padX = 18;
  const gap = 12;
  const chipH = 44;

  const texts = games.map((g) => `${g.p1Score}-${g.p2Score}`);
  let widths = texts.map((t) => ctx.measureText(t).width + padX * 2);
  let totalW = widths.reduce((a, b) => a + b, 0) + gap * (texts.length - 1);

  // Extremely long game lists (rare) shrink to fit rather than spilling past the panel.
  if (totalW > maxWidth && texts.length > 0) {
    const scale = maxWidth / totalW;
    widths = widths.map((w) => w * scale);
    totalW = maxWidth;
  }

  let cx = centerX - totalW / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';

  texts.forEach((t, i) => {
    const w = widths[i];
    roundRectPath(ctx, cx, centerY - chipH / 2, w, chipH, chipH / 2);
    ctx.fillStyle = '#ffffff';
    ctx.fill();
    ctx.lineWidth = 2;
    ctx.strokeStyle = '#d9cfb8';
    ctx.stroke();

    ctx.fillStyle = NAVY;
    ctx.fillText(t, cx + w / 2, centerY + 1);
    cx += w + gap;
  });
};

const drawStatBox = (
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  title: string,
  value: string,
  subtitle: string
) => {
  const centerX = box.x + box.w / 2;

  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  ctx.font = `800 16px ${FONT_STACK}`;
  ctx.fillStyle = MUTED_GOLD;
  ctx.fillText(title.toUpperCase(), centerX, box.y + 46);

  const valueSize = fitFontSize(ctx, value, box.w - 40, 52, 30, '900');
  ctx.font = `900 ${valueSize}px ${FONT_STACK}`;
  ctx.fillStyle = CREAM_TEXT;
  ctx.fillText(value, centerX, box.y + 108);

  if (subtitle) {
    const subSize = fitFontSize(ctx, subtitle, box.w - 40, 15, 11, '600');
    ctx.font = `600 ${subSize}px ${FONT_STACK}`;
    ctx.fillStyle = '#cbd5e1';
    ctx.fillText(subtitle, centerX, box.y + 140);
  }
};

export interface MatchExportOptions {
  match: SquashMatch;
  competitions: Competition[];
}

export const renderMatchExportCanvas = async ({
  match,
  competitions,
}: MatchExportOptions): Promise<HTMLCanvasElement> => {
  const template = await loadTemplate();

  const canvas = document.createElement('canvas');
  canvas.width = CANVAS_W;
  canvas.height = CANVAS_H;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  ctx.drawImage(template, 0, 0, CANVAS_W, CANVAS_H);

  const p1 = match.player1 || { id: 'p1', name: 'Player 1' };
  const p2 = match.player2 || { id: 'p2', name: 'Player 2' };
  const p1Games = match.p1GamesWon ?? 0;
  const p2Games = match.p2GamesWon ?? 0;
  const winnerId = match.winnerId ?? (p1Games > p2Games ? p1.id : p2Games > p1Games ? p2.id : undefined);
  const isP1Winner = winnerId === p1.id;
  const isP2Winner = winnerId === p2.id;

  const { meta } = getMatchMode(match, competitions);
  const centerX = CREAM_BOX.x + CREAM_BOX.w / 2;

  // --- Eyebrow: match type is context, drawn quiet and small ---
  drawEyebrow(ctx, meta.label.toUpperCase(), centerX, CREAM_BOX.y + 61);

  // --- Player names: identical weight and color on both sides — this is a left/right
  // slot in the score, not a ranking. The only "who won" signal is the small dot below. ---
  const nameY = CREAM_BOX.y + 113;
  const nameMaxWidth = CREAM_BOX.w / 2 - 44;
  ctx.textBaseline = 'alphabetic';

  ctx.textAlign = 'left';
  const p1Size = fitFontSize(ctx, p1.name, nameMaxWidth, 36, 20, '800');
  ctx.font = `800 ${p1Size}px ${FONT_STACK}`;
  ctx.fillStyle = NAVY;
  ctx.fillText(p1.name, CREAM_BOX.x + 32, nameY);
  const p1Width = ctx.measureText(p1.name).width;

  ctx.textAlign = 'right';
  const p2Size = fitFontSize(ctx, p2.name, nameMaxWidth, 36, 20, '800');
  ctx.font = `800 ${p2Size}px ${FONT_STACK}`;
  ctx.fillStyle = NAVY;
  ctx.fillText(p2.name, CREAM_BOX.x + CREAM_BOX.w - 32, nameY);
  const p2Width = ctx.measureText(p2.name).width;

  const dotY = nameY - Math.max(p1Size, p2Size) * 0.34;
  if (isP1Winner) drawWinnerDot(ctx, CREAM_BOX.x + 32 + p1Width + 12, dotY);
  if (isP2Winner) drawWinnerDot(ctx, CREAM_BOX.x + CREAM_BOX.w - 32 - p2Width - 12, dotY);

  // --- Score: the hero element — largest thing on the panel, flat fill with only a
  // whisper of a shadow so it still reads as part of the flat cream card, not floating. ---
  const scoreY = CREAM_BOX.y + 236;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const scoreSize = fitFontSize(ctx, `${p1Games} : ${p2Games}`, CREAM_BOX.w - 80, 118, 70, '900');
  ctx.font = `900 ${scoreSize}px ${FONT_STACK}`;

  ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
  ctx.shadowBlur = 2;
  ctx.shadowOffsetY = 1;
  ctx.fillStyle = NAVY;
  ctx.fillText(`${p1Games} : ${p2Games}`, centerX, scoreY);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  // --- Per-game breakdown as small chips, not a plain comma-list ---
  const games = match.games || [];
  if (games.length > 0) {
    drawGameChips(ctx, games, centerX, CREAM_BOX.y + 288, CREAM_BOX.w - 64);
  }

  // --- Footer: date / format, the smallest and quietest text on the panel ---
  const formatLabel =
    match.matchFormat === 'BEST_OF_5'
      ? `Best of 5 · PARS-${match.targetPoints}`
      : match.matchFormat === 'BEST_OF_3'
      ? `Best of 3 · PARS-${match.targetPoints}`
      : `Single Game · PARS-${match.targetPoints}`;
  ctx.textAlign = 'center';
  ctx.font = `600 15px ${FONT_STACK}`;
  ctx.fillStyle = SLATE_500;
  ctx.fillText(`${formatFullDateTime(match.date)}   ·   ${formatLabel}`, centerX, CREAM_BOX.y + 341);

  // --- Stat boxes ---
  const totalRallies = games.reduce((acc, g) => acc + (g.p1Score ?? 0) + (g.p2Score ?? 0), 0);
  const decisions = match.decisions || [];
  const letsCount = decisions.filter((d) => d.decision === 'YES_LET').length;
  const strokesCount = decisions.filter((d) => d.decision === 'STROKE').length;

  drawStatBox(ctx, STAT_BOX_1, 'Duration', formatMatchDuration(match.totalDurationSeconds || 0), `${games.length} game${games.length === 1 ? '' : 's'} played`);
  drawStatBox(
    ctx,
    STAT_BOX_2,
    'Rallies',
    String(totalRallies),
    decisions.length > 0 ? `${letsCount} Let · ${strokesCount} Stroke` : 'No referee appeals'
  );

  return canvas;
};

const canvasToBlob = (canvas: HTMLCanvasElement): Promise<Blob> =>
  new Promise((resolve, reject) => {
    canvas.toBlob((blob) => {
      if (blob) resolve(blob);
      else reject(new Error('Failed to encode export image'));
    }, 'image/png');
  });

// Generates the export image, then either hands it to the OS share sheet (so the user
// can drop it straight into WhatsApp on mobile) or, when Web Share isn't available,
// falls back to a plain browser download.
export const exportMatchAsImage = async (match: SquashMatch, competitions: Competition[]): Promise<void> => {
  const canvas = await renderMatchExportCanvas({ match, competitions });
  const blob = await canvasToBlob(canvas);
  const fileName = `match-${match.id}.png`;
  const file = new File([blob], fileName, { type: 'image/png' });

  const nav = navigator as Navigator & { canShare?: (data?: ShareData) => boolean };
  if (nav.canShare && nav.canShare({ files: [file] })) {
    try {
      await navigator.share({ files: [file], title: 'Squash Match Result' });
      return;
    } catch (err) {
      // AbortError = user cancelled the share sheet — treat as a no-op, not a fallback.
      if (err instanceof DOMException && err.name === 'AbortError') return;
    }
  }

  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
};
