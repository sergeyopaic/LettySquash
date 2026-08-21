import type { Competition, SquashMatch } from '../types/squash';
import { getMatchMode } from './matchModeUtils';
import { formatFullDateTime, formatMatchDuration } from './dateUtils';

// Background artwork (see public/assets/match_report_*.jpeg) — Letty high-fiving an
// opponent mascot over an empty stretch of court. Unlike the old match_import.jpg, none
// of these have a container baked in — the cream result panel and the stat panels below
// are drawn entirely in code (see MASCOT_CREAM_BOX / drawStatBox), so recoloring or resizing
// them is a constant change here, not a re-export from a design tool. Exported so the
// export-picker UI can render a preview of each one and let the user choose; render/
// export calls fall back to a random pick when no specific one is requested.
export const EXPORT_TEMPLATE_URLS = [
  '/assets/match_report_croco.jpeg',
  '/assets/match_report_dog.jpeg',
  '/assets/match_report_kiwi.jpeg',
  '/assets/match_report_rat.jpeg',
];

// A no-mascot alternative — flat navy fill instead of one of the court photos, for
// people sharing to a context where the mascot art doesn't fit. Not part of
// EXPORT_TEMPLATE_URLS (and never in the random pick) since it's a deliberate opt-out,
// not another equally-random skin — pass it explicitly via templateUrl.
export const EXPORT_NAVY_TEMPLATE_ID = 'navy';

const MASCOT_CANVAS_W = 842;
const MASCOT_CANVAS_H = 1264;

// Sized and positioned for the mascot backgrounds — all four have the mascots ending
// (feet/shadow) at roughly the same height, leaving the bottom ~50% of the frame empty.
const MASCOT_CREAM_BOX = { x: 45, y: 630, w: 752, h: 490 };

// The navy variant has no mascot art to leave room for, so the canvas is just tall
// enough for the panel + stat row — much closer to square than the mascot version.
const NAVY_CANVAS_W = 842;
const NAVY_CANVAS_H = 680;
const NAVY_CREAM_BOX = { x: 45, y: 36, w: 752, h: 490 };

// The camera variant: a user-supplied photo (see customPhoto), standard portrait shape
// like a normal phone photo. It fills the whole canvas (same shape as the mascot
// backgrounds) and the card overlays its lower portion exactly like the mascot art does
// — there's no separate colored section, the containers just sit on top of the photo.

const FONT_STACK = '-apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, Helvetica, Arial, sans-serif';

const NAVY = '#0f172a';
const CREAM = '#faf3e2';
const MUTED_GOLD = '#d8b872';
const SLATE_500 = '#64748b';
const CREAM_TEXT = '#f8fafc';

const templateCache = new Map<string, HTMLImageElement>();

const loadTemplate = (url: string): Promise<HTMLImageElement> => {
  const cached = templateCache.get(url);
  if (cached) return Promise.resolve(cached);
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      templateCache.set(url, img);
      resolve(img);
    };
    img.onerror = () => reject(new Error(`Failed to load match export template: ${url}`));
    img.src = url;
  });
};

const pickRandomTemplateUrl = (): string =>
  EXPORT_TEMPLATE_URLS[Math.floor(Math.random() * EXPORT_TEMPLATE_URLS.length)];

// Draws `img` into the (dx, dy, dw, dh) rect with "object-fit: cover" behavior —
// scaled to fill the rect completely, cropping whichever axis overflows, instead of
// squashing an arbitrary camera-photo aspect ratio to fit.
const drawCoverImage = (
  ctx: CanvasRenderingContext2D,
  img: HTMLImageElement,
  dx: number,
  dy: number,
  dw: number,
  dh: number
) => {
  const imgRatio = img.naturalWidth / img.naturalHeight;
  const targetRatio = dw / dh;
  let sx = 0;
  let sy = 0;
  let sw = img.naturalWidth;
  let sh = img.naturalHeight;

  if (imgRatio > targetRatio) {
    sw = img.naturalHeight * targetRatio;
    sx = (img.naturalWidth - sw) / 2;
  } else {
    sh = img.naturalWidth / targetRatio;
    sy = (img.naturalHeight - sh) / 2;
  }

  ctx.drawImage(img, sx, sy, sw, sh, dx, dy, dw, dh);
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
  ctx.font = `800 19px ${FONT_STACK}`;
  const textWidth = ctx.measureText(label).width;
  const gap = 18;
  const ruleLen = 46;
  const ruleY = baselineY - 6;

  ctx.strokeStyle = '#c9bfa8';
  ctx.lineWidth = 2;

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
  ctx.arc(x, y, 6, 0, Math.PI * 2);
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
  const fontSize = 28;
  ctx.font = `800 ${fontSize}px ${FONT_STACK}`;
  const padX = 23;
  const gap = 15;
  const chipH = 55;

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

// No small category title above the number — a big value with a big bold caption
// underneath naming EXACTLY what it counts (e.g. "4" only reads clearly next to
// "GAMES PLAYED", not next to something like "BEST OF 5" describing the format instead).
const drawStatBox = (
  ctx: CanvasRenderingContext2D,
  box: { x: number; y: number; w: number; h: number },
  value: string,
  label: string
) => {
  roundRectPath(ctx, box.x, box.y, box.w, box.h, 14);
  ctx.fillStyle = NAVY;
  ctx.fill();
  ctx.lineWidth = 3;
  ctx.strokeStyle = '#ffffff';
  ctx.stroke();

  const centerX = box.x + box.w / 2;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';

  const valueSize = fitFontSize(ctx, value, box.w - 20, 36, 20, '900');
  ctx.font = `900 ${valueSize}px ${FONT_STACK}`;
  ctx.fillStyle = CREAM_TEXT;
  ctx.fillText(value, centerX, box.y + 48);

  const labelUpper = label.toUpperCase();
  const labelSize = fitFontSize(ctx, labelUpper, box.w - 16, 15, 9, '800');
  ctx.font = `800 ${labelSize}px ${FONT_STACK}`;
  ctx.fillStyle = MUTED_GOLD;
  ctx.fillText(labelUpper, centerX, box.y + 75);
};

export interface MatchExportOptions {
  match: SquashMatch;
  competitions: Competition[];
  // Forces a specific background (see EXPORT_TEMPLATE_URLS / EXPORT_NAVY_TEMPLATE_ID) —
  // used by the style-picker preview grid and by the final export once the user has
  // chosen one. Ignored when customPhoto is set. Omit both to get a random mascot
  // background, which is only ever used for one-off previews outside the picker flow.
  templateUrl?: string;
  // A photo the user just took/picked (see ExportPhotoPickerModal's camera option) —
  // takes priority over templateUrl when set.
  customPhoto?: HTMLImageElement;
}

export const renderMatchExportCanvas = async ({
  match,
  competitions,
  templateUrl,
  customPhoto,
}: MatchExportOptions): Promise<HTMLCanvasElement> => {
  const isPhoto = Boolean(customPhoto);
  const isNavy = !isPhoto && templateUrl === EXPORT_NAVY_TEMPLATE_ID;

  // The photo variant reuses the mascot canvas shape exactly (standard portrait photo,
  // card overlaid on the lower portion) — only what gets drawn as the background differs.
  const canvasW = isNavy ? NAVY_CANVAS_W : MASCOT_CANVAS_W;
  const canvasH = isNavy ? NAVY_CANVAS_H : MASCOT_CANVAS_H;
  const creamBox = isNavy ? NAVY_CREAM_BOX : MASCOT_CREAM_BOX;

  const canvas = document.createElement('canvas');
  canvas.width = canvasW;
  canvas.height = canvasH;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('Canvas 2D context unavailable');

  if (isPhoto) {
    drawCoverImage(ctx, customPhoto!, 0, 0, canvasW, canvasH);
  } else if (isNavy) {
    ctx.fillStyle = NAVY;
    ctx.fillRect(0, 0, canvasW, canvasH);
  } else {
    const template = await loadTemplate(templateUrl ?? pickRandomTemplateUrl());
    ctx.drawImage(template, 0, 0, canvasW, canvasH);
  }

  const p1 = match.player1 || { id: 'p1', name: 'Player 1' };
  const p2 = match.player2 || { id: 'p2', name: 'Player 2' };
  const p1Games = match.p1GamesWon ?? 0;
  const p2Games = match.p2GamesWon ?? 0;
  const winnerId = match.winnerId ?? (p1Games > p2Games ? p1.id : p2Games > p1Games ? p2.id : undefined);
  const isP1Winner = winnerId === p1.id;
  const isP2Winner = winnerId === p2.id;

  const { meta } = getMatchMode(match, competitions);
  const centerX = creamBox.x + creamBox.w / 2;

  // The cream panel itself — flat fill with a navy border, drawn fresh every time so its
  // color/size/radius are just the constants above, not baked into a background image.
  roundRectPath(ctx, creamBox.x, creamBox.y, creamBox.w, creamBox.h, 20);
  ctx.fillStyle = CREAM;
  ctx.fill();
  ctx.lineWidth = 4;
  ctx.strokeStyle = NAVY;
  ctx.stroke();

  drawEyebrow(ctx, meta.label.toUpperCase(), centerX, creamBox.y + 49);

  // Names are uppercased for a scoreboard feel, and both share one font size (the
  // smaller of the two) so a long name next to a short one still reads as a matched
  // pair rather than two mismatched headlines.
  const p1Name = p1.name.toUpperCase();
  const p2Name = p2.name.toUpperCase();
  const nameMaxWidth = creamBox.w - 110;
  ctx.textBaseline = 'alphabetic';
  ctx.textAlign = 'center';

  const p1RawSize = fitFontSize(ctx, p1Name, nameMaxWidth, 45, 25, '800');
  const p2RawSize = fitFontSize(ctx, p2Name, nameMaxWidth, 45, 25, '800');
  const nameSize = Math.min(p1RawSize, p2RawSize);
  ctx.font = `800 ${nameSize}px ${FONT_STACK}`;
  ctx.fillStyle = NAVY;

  // Name 1, then the score, then name 2 — the score sits between the two names instead
  // of the names sitting flush on top of each other, which read as cramped.
  const name1Y = creamBox.y + 109;
  ctx.fillText(p1Name, centerX, name1Y);
  const p1Width = ctx.measureText(p1Name).width;

  const dotOffsetY = nameSize * 0.34;
  if (isP1Winner) drawWinnerDot(ctx, centerX + p1Width / 2 + 15, name1Y - dotOffsetY);

  // The hero element — biggest thing on the panel, flat fill with only a whisper of a
  // shadow so it still reads as part of the flat cream card, not floating above it.
  const scoreY = creamBox.y + 255;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'alphabetic';
  const scoreSize = fitFontSize(ctx, `${p1Games} : ${p2Games}`, creamBox.w - 90, 165, 98, '900');
  ctx.font = `900 ${scoreSize}px ${FONT_STACK}`;

  ctx.shadowColor = 'rgba(15, 23, 42, 0.15)';
  ctx.shadowBlur = 3;
  ctx.shadowOffsetY = 2;
  ctx.fillStyle = NAVY;
  ctx.fillText(`${p1Games} : ${p2Games}`, centerX, scoreY);
  ctx.shadowColor = 'transparent';
  ctx.shadowBlur = 0;
  ctx.shadowOffsetY = 0;

  ctx.font = `800 ${nameSize}px ${FONT_STACK}`;
  const name2Y = creamBox.y + 325;
  ctx.fillStyle = NAVY;
  ctx.fillText(p2Name, centerX, name2Y);
  const p2Width = ctx.measureText(p2Name).width;
  if (isP2Winner) drawWinnerDot(ctx, centerX + p2Width / 2 + 15, name2Y - dotOffsetY);

  // Per-game breakdown as small chips, not a plain comma-list.
  const games = match.games || [];
  if (games.length > 0) {
    drawGameChips(ctx, games, centerX, creamBox.y + 389, creamBox.w - 32);
  }

  // Footer: date / format, the smallest and quietest text on the panel.
  const formatLabel =
    match.matchFormat === 'BEST_OF_5'
      ? `Best of 5 · PARS-${match.targetPoints}`
      : match.matchFormat === 'BEST_OF_3'
      ? `Best of 3 · PARS-${match.targetPoints}`
      : `Single Game · PARS-${match.targetPoints}`;
  ctx.textAlign = 'center';
  ctx.font = `600 19px ${FONT_STACK}`;
  ctx.fillStyle = SLATE_500;
  ctx.fillText(`${formatFullDateTime(match.date)}   ·   ${formatLabel}`, centerX, creamBox.y + 455);

  // --- Four stat boxes below the panel (was two, oversized) ---
  const totalRallies = games.reduce((acc, g) => acc + (g.p1Score ?? 0) + (g.p2Score ?? 0), 0);
  const decisions = match.decisions || [];

  const rowY = creamBox.y + creamBox.h + 20;
  const rowH = 95;
  const boxGap = 12;
  const boxW = (creamBox.w - boxGap * 3) / 4;
  const stats: [string, string][] = [
    [formatMatchDuration(match.totalDurationSeconds || 0), 'Duration'],
    [String(totalRallies), 'Total Points'],
    [String(games.length), 'Games Played'],
    [String(decisions.length), 'Appeals'],
  ];
  stats.forEach(([value, label], i) => {
    const box = { x: creamBox.x + i * (boxW + boxGap), y: rowY, w: boxW, h: rowH };
    drawStatBox(ctx, box, value, label);
  });

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
// falls back to a plain browser download. Pass templateUrl to use the background the
// user picked in the style picker (omitted falls back to a random one), or customPhoto
// for the camera option — customPhoto takes priority when both are set.
export const exportMatchAsImage = async (
  match: SquashMatch,
  competitions: Competition[],
  templateUrl?: string,
  customPhoto?: HTMLImageElement
): Promise<void> => {
  const canvas = await renderMatchExportCanvas({ match, competitions, templateUrl, customPhoto });
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
