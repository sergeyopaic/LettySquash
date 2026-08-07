import React from 'react';

// ─── Палитра ───────────────────────────────────────────────────────────────
const C = {
  navy: '#1e3a8a',
  amber: '#fbbf24',
  dark: '#0f172a',
  muted: '#e2e8f0',
  slate400: '#94a3b8',
  slate500: '#64748b',
  white: '#ffffff',
  navyLight: '#dbeafe',
  amberLight: '#fef3c7',
};

// ─── Вспомогательные SVG-утилиты ───────────────────────────────────────────

/** Маленький кружок-бейдж с номером для траекторий */
function Badge({ x, y, n }: { x: number; y: number; n: number }) {
  return (
    <g>
      <circle cx={x} cy={y} r={7} fill={C.navy} />
      <text
        x={x}
        y={y}
        textAnchor="middle"
        dominantBaseline="central"
        fill={C.white}
        fontSize={8}
        fontWeight={700}
        fontFamily="monospace"
      >
        {n}
      </text>
    </g>
  );
}

/** Стрелка на конце линии (маркер-def id) */
function ArrowMarker({ id, color }: { id: string; color: string }) {
  return (
    <marker
      id={id}
      markerWidth={8}
      markerHeight={8}
      refX={6}
      refY={3}
      orient="auto"
    >
      <path d="M0,0 L0,6 L8,3 z" fill={color} />
    </marker>
  );
}

// ─── Размерная выноска (горизонтальная или вертикальная) ───────────────────
function DimLabel({
  x1, y1, x2, y2, label, side = 'left', mono = true,
}: {
  x1: number; y1: number; x2: number; y2: number;
  label: string; side?: 'left' | 'right' | 'top' | 'bottom'; mono?: boolean;
}) {
  const mx = (x1 + x2) / 2;
  const my = (y1 + y2) / 2;
  const isVert = Math.abs(x1 - x2) < 2;
  const tx = isVert ? (side === 'left' ? x1 - 6 : x1 + 6) : mx;
  const ty = isVert ? my : (side === 'top' ? y1 - 6 : y1 + 6);
  const anchor = isVert ? (side === 'left' ? 'end' : 'start') : 'middle';
  return (
    <g>
      {/* Выносная линия */}
      <line x1={x1} y1={y1} x2={x2} y2={y2} stroke={C.slate400} strokeWidth={0.6} strokeDasharray="2,2" />
      {/* Концевые засечки */}
      {isVert ? (
        <>
          <line x1={x1 - 3} y1={y1} x2={x1 + 3} y2={y1} stroke={C.slate400} strokeWidth={0.8} />
          <line x1={x1 - 3} y1={y2} x2={x1 + 3} y2={y2} stroke={C.slate400} strokeWidth={0.8} />
        </>
      ) : (
        <>
          <line x1={x1} y1={y1 - 3} x2={x1} y2={y1 + 3} stroke={C.slate400} strokeWidth={0.8} />
          <line x1={x2} y1={y2 - 3} x2={x2} y2={y2 + 3} stroke={C.slate400} strokeWidth={0.8} />
        </>
      )}
      <text
        x={tx}
        y={ty}
        textAnchor={anchor}
        dominantBaseline="central"
        fill={C.slate400}
        fontSize={7}
        fontFamily={mono ? 'monospace' : 'sans-serif'}
      >
        {label}
      </text>
    </g>
  );
}

// ─── Карточка-обёртка ───────────────────────────────────────────────────────
function DiagramCard({
  children,
  caption,
  defaultCaption,
}: {
  children: React.ReactNode;
  caption?: string;
  defaultCaption: string;
}) {
  const text = caption ?? defaultCaption;
  const isFault = text.includes('✕') || text.includes('Fault') || text.includes('FAULT') || text.includes('ILLEGAL');
  const isLegal = !isFault && (text.includes('✓') || text.includes('LEGAL'));

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-3.5 shadow-sm w-full">
      {children}
      <p
        className={`mt-2 text-[11px] text-center font-semibold leading-tight ${
          isFault
            ? 'text-rose-600'
            : isLegal
            ? 'text-emerald-700'
            : 'text-slate-500'
        }`}
      >
        {text}
      </p>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// КОМПОНЕНТ 1 — FrontWallDiagram
// Вид передней стенки спереди, пропорции WSF
// ═══════════════════════════════════════════════════════════════════════════

// Реальные размеры WSF (м):
// Ширина: 6.4 м, Высота: 4.57 м
// Tin: 0–0.48 м (нижняя полоса)
// Board line: 0.48 м
// Service line: 1.78 м
// Out line: 4.57 м

// SVG-координаты: ширина 200, высота масштабируется пропорционально
// viewBox с отступами для выносок слева и сверху

const FW_W = 6.4;   // real width
const FW_H = 4.57;  // real height
const FW_SVG_W = 180; // wall width in SVG
const FW_SVG_H = FW_SVG_W * (FW_H / FW_W); // ~128
const FW_OX = 56;   // left offset (for dimension labels)
const FW_OY = 18;   // top offset

// Convert real meters to SVG pixels
const fwY = (m: number) => FW_OY + FW_SVG_H - (m / FW_H) * FW_SVG_H;
const TIN_H_SVG = (0.48 / FW_H) * FW_SVG_H;
const SL_Y = fwY(1.78);
const OL_Y = fwY(4.57);
const BL_Y = fwY(0.48); // board line = top of tin
const BOTTOM_Y = fwY(0);

export function FrontWallDiagram({
  highlight,
  caption,
}: {
  highlight?: 'tin' | 'service-line' | 'out-line' | 'good-area';
  caption?: string;
}) {
  // Compute fills based on highlight
  const tinFill = highlight === 'tin' ? C.amber : C.navy;
  const tinOpacity = highlight === 'tin' ? 0.9 : 1;
  const goodAreaOpacity = highlight === 'good-area' ? 0.18 : 0.07;
  const goodAreaFill = highlight === 'good-area' ? C.amber : C.navyLight;
  const slStroke = highlight === 'service-line' ? C.amber : C.navy;
  const slWidth = highlight === 'service-line' ? 2 : 1;
  const olStroke = highlight === 'out-line' ? C.amber : C.navy;
  const olWidth = highlight === 'out-line' ? 2.5 : 1.5;

  const vbW = FW_OX + FW_SVG_W + 68;
  const vbH = FW_OY + FW_SVG_H + 24;

  return (
    <DiagramCard
      caption={caption}
      defaultCaption="Front wall view. The ball must hit above the Tin and below the Out Line."
    >
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-auto"
        aria-label="Front wall diagram"
      >
        <defs>
          <ArrowMarker id="fw-arrow-navy" color={C.slate400} />
        </defs>

        {/* Хорошая зона (service line → out line) */}
        <rect
          x={FW_OX}
          y={OL_Y}
          width={FW_SVG_W}
          height={SL_Y - OL_Y}
          fill={goodAreaFill}
          fillOpacity={goodAreaOpacity}
        />

        {/* Зона между board и service line (нейтральная) */}
        <rect
          x={FW_OX}
          y={SL_Y}
          width={FW_SVG_W}
          height={BL_Y - SL_Y}
          fill={C.navy}
          fillOpacity={0.03}
        />

        {/* TIN — нижняя полоса */}
        <rect
          x={FW_OX}
          y={BL_Y}
          width={FW_SVG_W}
          height={TIN_H_SVG}
          fill={tinFill}
          fillOpacity={tinOpacity}
        />
        {/* Подпись TIN по центру полосы белым */}
        <text
          x={FW_OX + FW_SVG_W / 2}
          y={BL_Y + TIN_H_SVG / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.white}
          fontSize={9}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="1"
        >
          TIN
        </text>

        {/* Контур стенки (рамка) */}
        <rect
          x={FW_OX}
          y={FW_OY}
          width={FW_SVG_W}
          height={FW_SVG_H}
          fill="none"
          stroke={C.navy}
          strokeWidth={1.5}
        />

        {/* OUT LINE — верхняя граница */}
        <line
          x1={FW_OX}
          y1={OL_Y}
          x2={FW_OX + FW_SVG_W}
          y2={OL_Y}
          stroke={olStroke}
          strokeWidth={olWidth}
        />
        <text
          x={FW_OX + FW_SVG_W / 2}
          y={OL_Y - 5}
          textAnchor="middle"
          dominantBaseline="auto"
          fill={olStroke}
          fontSize={8}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="0.5"
        >
          OUT LINE
        </text>

        {/* SERVICE LINE */}
        <line
          x1={FW_OX}
          y1={SL_Y}
          x2={FW_OX + FW_SVG_W}
          y2={SL_Y}
          stroke={slStroke}
          strokeWidth={slWidth}
          strokeDasharray={highlight === 'service-line' ? 'none' : '4,3'}
        />
        <text
          x={FW_OX + FW_SVG_W + 4}
          y={SL_Y}
          textAnchor="start"
          dominantBaseline="central"
          fill={slStroke}
          fontSize={7}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="0.3"
        >
          SERVICE LINE
        </text>

        {/* BOARD LINE (верхняя граница tin) */}
        <line
          x1={FW_OX}
          y1={BL_Y}
          x2={FW_OX + FW_SVG_W}
          y2={BL_Y}
          stroke={C.navy}
          strokeWidth={2}
        />
        <text
          x={FW_OX + FW_SVG_W + 4}
          y={BL_Y}
          textAnchor="start"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={7}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          BOARD LINE
        </text>

        {/* ── Размерные выноски слева ── */}
        {/* Общая высота 4.57 m */}
        <DimLabel
          x1={FW_OX - 8} y1={OL_Y}
          x2={FW_OX - 8} y2={BOTTOM_Y}
          label="4.57 m" side="left"
        />
        {/* Высота до service line 1.78 m */}
        <DimLabel
          x1={FW_OX - 18} y1={SL_Y}
          x2={FW_OX - 18} y2={BOTTOM_Y}
          label="1.78 m" side="left"
        />
        {/* Высота tin 0.48 m */}
        <DimLabel
          x1={FW_OX - 28} y1={BL_Y}
          x2={FW_OX - 28} y2={BOTTOM_Y}
          label="0.48 m" side="left"
        />

        {/* Ширина 6.4 m */}
        <DimLabel
          x1={FW_OX} y1={BOTTOM_Y + 12}
          x2={FW_OX + FW_SVG_W} y2={BOTTOM_Y + 12}
          label="6.4 m" side="top"
        />
      </svg>
    </DiagramCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// КОМПОНЕНТ 2 — CourtPlanDiagram
// Вид корта сверху (план), пропорции WSF
// ═══════════════════════════════════════════════════════════════════════════

// Реальные размеры WSF (м):
// Длина: 9.75 м, Ширина: 6.4 м
// Short line: 4.26 м от передней стенки (фактически 9.75/2 ≈ 4.875, WSF: 4.26 м от front)
// Half-court line: от short line до back wall
// Service box: 1.6×1.6 м, примыкает к боковой стенке, перед short line

// Geometry for CourtPlanDiagram (Front Wall at TOP, Back Wall at BOTTOM, Side Walls on LEFT/RIGHT)
const CP_W = 6.4;  // Court width (X axis: 0 to 6.4m)
const CP_L = 9.75; // Court length (Y axis: 0 [Front Wall] to 9.75m [Back Wall])
const CP_SVG_W = 165; // Court width in SVG
const CP_SVG_L = CP_SVG_W * (CP_L / CP_W); // ~251px height in SVG
const CP_OX = 54; // Left margin
const CP_OY = 22; // Top margin

const cpX = (m: number) => CP_OX + (m / CP_W) * CP_SVG_W;
const cpY = (m: number) => CP_OY + (m / CP_L) * CP_SVG_L;

const CP_SL_Y = cpY(4.26);     // Short line (4.26m from Front Wall)
const HCL_X = cpX(CP_W / 2); // Half-court line (center vertical)
const SB_W_SVG = (1.6 / CP_W) * CP_SVG_W; // Service box width (1.6m)
const SB_H_SVG = (1.6 / CP_L) * CP_SVG_L; // Service box height (1.6m)

export function CourtPlanDiagram({
  highlight: _highlight,
  caption,
}: {
  highlight?: 'service-box-right' | 'service-box-left' | 'target-quarter' | 'short-line';
  caption?: string;
}) {
  const [serveMode, setServeMode] = React.useState<'serve-right' | 'serve-left' | 'serve-fault'>('serve-right');

  const vbW = CP_OX + CP_SVG_W + 64;
  const vbH = CP_OY + CP_SVG_L + 28;

  // Serve trajectory coordinates based on serveMode
  // Right Box -> Left Back-Quarter
  const pRightBox = { x: cpX(5.6), y: cpY(5.06) };
  const pLeftTarget = { x: cpX(1.6), y: cpY(7.0) };

  // Left Box -> Right Back-Quarter
  const pLeftBox = { x: cpX(0.8), y: cpY(5.06) };
  const pRightTarget = { x: cpX(4.8), y: cpY(7.0) };

  // Fault serve (lands short of Short Line)
  const pFaultTarget = { x: cpX(2.0), y: cpY(3.0) };

  // Front Wall Impact (center top)
  const pFrontWallHit = { x: cpX(3.2), y: CP_OY };

  let servePathD = '';
  let serveLen = 300;
  const isLegalServe = serveMode !== 'serve-fault';
  const serveColor = isLegalServe ? '#10B981' : '#EF4444';
  const serveMarkerId = isLegalServe ? 'cp-arrow-green' : 'cp-arrow-red';

  if (serveMode === 'serve-right') {
    servePathD = `M ${pRightBox.x} ${pRightBox.y} L ${pFrontWallHit.x} ${pFrontWallHit.y} L ${pLeftTarget.x} ${pLeftTarget.y}`;
    serveLen = dist(pRightBox, pFrontWallHit) + dist(pFrontWallHit, pLeftTarget);
  } else if (serveMode === 'serve-left') {
    servePathD = `M ${pLeftBox.x} ${pLeftBox.y} L ${pFrontWallHit.x} ${pFrontWallHit.y} L ${pRightTarget.x} ${pRightTarget.y}`;
    serveLen = dist(pLeftBox, pFrontWallHit) + dist(pFrontWallHit, pRightTarget);
  } else {
    servePathD = `M ${pRightBox.x} ${pRightBox.y} L ${pFrontWallHit.x} ${pFrontWallHit.y} L ${pFaultTarget.x} ${pFaultTarget.y}`;
    serveLen = dist(pRightBox, pFrontWallHit) + dist(pFrontWallHit, pFaultTarget);
  }

  return (
    <DiagramCard
      caption={caption}
      defaultCaption={
        serveMode === 'serve-right'
          ? '✓ Right Box Serve: Front wall → Left Back-Quarter'
          : serveMode === 'serve-left'
          ? '✓ Left Box Serve: Front wall → Right Back-Quarter'
          : '✕ Short Line Fault: Fails to reach Back-Quarter (Fault)'
      }
    >
      {/* Interactive Mode Buttons */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
        <button
          type="button"
          onClick={() => setServeMode('serve-right')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
            serveMode === 'serve-right'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>✓ Right Box Serve</span>
        </button>
        <button
          type="button"
          onClick={() => setServeMode('serve-left')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
            serveMode === 'serve-left'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>✓ Left Box Serve</span>
        </button>
        <button
          type="button"
          onClick={() => setServeMode('serve-fault')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
            serveMode === 'serve-fault'
              ? 'bg-rose-500 text-white border-rose-500 shadow-xs font-black'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>✕ Short Line Fault</span>
        </button>
      </div>

      {/* Animation CSS */}
      <style>{`
        @keyframes serve-draw {
          0%   { stroke-dashoffset: ${serveLen}; opacity: 1; }
          65%  { stroke-dashoffset: 0; opacity: 1; }
          80%  { stroke-dashoffset: 0; opacity: 1; }
          95%  { stroke-dashoffset: 0; opacity: 0.15; }
          100% { stroke-dashoffset: ${serveLen}; opacity: 0; }
        }
        .serve-path-anim {
          stroke-dasharray: ${serveLen};
          stroke-dashoffset: ${serveLen};
          animation: serve-draw 2.8s linear infinite;
        }
      `}</style>

      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-auto"
        aria-label="Court plan diagram"
      >
        <defs>
          <ArrowMarker id="cp-arrow-green" color="#10B981" />
          <ArrowMarker id="cp-arrow-red" color="#EF4444" />
        </defs>

        {/* Court outline */}
        <rect
          x={CP_OX}
          y={CP_OY}
          width={CP_SVG_W}
          height={CP_SVG_L}
          fill={C.white}
          stroke={C.navy}
          strokeWidth={2}
        />

        {/* Target Quarter Highlight - Left Back-Quarter */}
        {serveMode === 'serve-right' && (
          <rect
            x={CP_OX}
            y={CP_SL_Y}
            width={HCL_X - CP_OX}
            height={cpY(CP_L) - CP_SL_Y}
            fill="#D1FAE5"
            fillOpacity={0.45}
            stroke="#10B981"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}

        {/* Target Quarter Highlight - Right Back-Quarter */}
        {serveMode === 'serve-left' && (
          <rect
            x={HCL_X}
            y={CP_SL_Y}
            width={CP_OX + CP_SVG_W - HCL_X}
            height={cpY(CP_L) - CP_SL_Y}
            fill="#D1FAE5"
            fillOpacity={0.45}
            stroke="#10B981"
            strokeWidth={1}
            strokeDasharray="3,3"
          />
        )}

        {/* Fault Highlight Area */}
        {serveMode === 'serve-fault' && (
          <rect
            x={CP_OX}
            y={CP_OY}
            width={CP_SVG_W}
            height={CP_SL_Y - CP_OY}
            fill="#FEE2E2"
            fillOpacity={0.25}
          />
        )}

        {/* Left Service Box (adjacent to left wall, BEHIND short line inside Left Quarter) */}
        <rect
          x={CP_OX}
          y={CP_SL_Y}
          width={SB_W_SVG}
          height={SB_H_SVG}
          fill={serveMode === 'serve-left' ? '#10B981' : C.navy}
          fillOpacity={serveMode === 'serve-left' ? 0.35 : 0.08}
          stroke={C.navy}
          strokeWidth={1.2}
        />
        <text
          x={CP_OX + SB_W_SVG / 2}
          y={CP_SL_Y + SB_H_SVG / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={5.5}
          fontWeight={800}
          fontFamily="sans-serif"
        >
          BOX (L)
        </text>

        {/* Right Service Box (adjacent to right wall, BEHIND short line inside Right Quarter) */}
        <rect
          x={CP_OX + CP_SVG_W - SB_W_SVG}
          y={CP_SL_Y}
          width={SB_W_SVG}
          height={SB_H_SVG}
          fill={serveMode === 'serve-right' ? '#10B981' : C.navy}
          fillOpacity={serveMode === 'serve-right' ? 0.35 : 0.08}
          stroke={C.navy}
          strokeWidth={1.2}
        />
        <text
          x={CP_OX + CP_SVG_W - SB_W_SVG / 2}
          y={CP_SL_Y + SB_H_SVG / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={5.5}
          fontWeight={800}
          fontFamily="sans-serif"
        >
          BOX (R)
        </text>

        {/* SHORT LINE (horizontal across court) */}
        <line
          x1={CP_OX}
          y1={CP_SL_Y}
          x2={CP_OX + CP_SVG_W}
          y2={CP_SL_Y}
          stroke={C.navy}
          strokeWidth={2}
        />
        <text
          x={CP_OX + CP_SVG_W + 6}
          y={CP_SL_Y}
          textAnchor="start"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={6.5}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          SHORT LINE
        </text>

        {/* HALF-COURT LINE (vertical down middle from Short Line to Back Wall) */}
        <line
          x1={HCL_X}
          y1={CP_SL_Y}
          x2={HCL_X}
          y2={cpY(CP_L)}
          stroke={C.navy}
          strokeWidth={1.5}
          strokeDasharray="4,3"
        />

        {/* Wall Labels */}
        <text
          x={CP_OX + CP_SVG_W / 2}
          y={CP_OY - 7}
          textAnchor="middle"
          fill={C.navy}
          fontSize={8}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="0.5"
        >
          FRONT WALL (TOP)
        </text>
        <text
          x={CP_OX + CP_SVG_W / 2}
          y={CP_OY + CP_SVG_L + 12}
          textAnchor="middle"
          fill={C.navy}
          fontSize={8}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="0.5"
        >
          BACK WALL (BOTTOM)
        </text>
        <text
          x={CP_OX - 6}
          y={CP_OY + CP_SVG_L / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={7}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="0.4"
          transform={`rotate(-90, ${CP_OX - 6}, ${CP_OY + CP_SVG_L / 2})`}
        >
          SIDE WALL
        </text>
        <text
          x={CP_OX + CP_SVG_W + 6}
          y={CP_OY + CP_SVG_L / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={7}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="0.4"
          transform={`rotate(90, ${CP_OX + CP_SVG_W + 6}, ${CP_OY + CP_SVG_L / 2})`}
        >
          SIDE WALL
        </text>

        {/* Quarter Court Labels */}
        <text
          x={CP_OX + (HCL_X - CP_OX) / 2}
          y={CP_SL_Y + (cpY(CP_L) - CP_SL_Y) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#047857"
          fontSize={6}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          LEFT QUARTER
        </text>
        <text
          x={HCL_X + (CP_OX + CP_SVG_W - HCL_X) / 2}
          y={CP_SL_Y + (cpY(CP_L) - CP_SL_Y) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill="#047857"
          fontSize={6}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          RIGHT QUARTER
        </text>

        {/* Animated Serve Trajectory Path */}
        <path
          className="serve-path-anim"
          d={servePathD}
          fill="none"
          stroke={serveColor}
          strokeWidth={2.2}
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeDasharray={isLegalServe ? 'none' : '6,4'}
          markerEnd={`url(#${serveMarkerId})`}
        />

        {/* Front Wall Impact Dot */}
        <circle cx={pFrontWallHit.x} cy={pFrontWallHit.y} r={4.5} fill={serveColor} stroke={C.white} strokeWidth={1} />

        {/* Serve Target Landing Badge */}
        {serveMode === 'serve-right' && (
          <g>
            <circle cx={pLeftTarget.x} cy={pLeftTarget.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <text x={pLeftTarget.x} y={pLeftTarget.y + 12} textAnchor="middle" fill="#047857" fontSize={6.5} fontWeight={800}>
              ✓ Serve Target (Left Quarter)
            </text>
          </g>
        )}

        {serveMode === 'serve-left' && (
          <g>
            <circle cx={pRightTarget.x} cy={pRightTarget.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <text x={pRightTarget.x} y={pRightTarget.y + 12} textAnchor="middle" fill="#047857" fontSize={6.5} fontWeight={800}>
              ✓ Serve Target (Right Quarter)
            </text>
          </g>
        )}

        {serveMode === 'serve-fault' && (
          <g>
            <circle cx={pFaultTarget.x} cy={pFaultTarget.y} r={8} fill="#EF4444" stroke={C.white} strokeWidth={1.5} />
            <text x={pFaultTarget.x} y={pFaultTarget.y} textAnchor="middle" dominantBaseline="central" fill={C.white} fontSize={10} fontWeight={900}>
              ✕
            </text>
            <text x={pFaultTarget.x} y={pFaultTarget.y + 14} textAnchor="middle" fill="#DC2626" fontSize={6.5} fontWeight={800}>
              ✕ FAULT! Landed before Short Line
            </text>
          </g>
        )}

        {/* Dimension Labels */}
        <DimLabel
          x1={CP_OX - 10} y1={CP_OY}
          x2={CP_OX - 10} y2={cpY(CP_L)}
          label="9.75 m" side="left"
        />
        <DimLabel
          x1={CP_OX} y1={cpY(CP_L) + 16}
          x2={CP_OX + CP_SVG_W} y2={cpY(CP_L) + 16}
          label="6.4 m" side="bottom"
        />
      </svg>
    </DiagramCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// КОМПОНЕНТ 3 — BoastDiagram
// Траектория удара Boast с анимацией
// ═══════════════════════════════════════════════════════════════════════════

// Geometry for BoastDiagram (Front Wall at TOP, Back Wall at BOTTOM, Side Walls on LEFT/RIGHT)
const BD_W = 6.4;  // Court width (X axis: 0 to 6.4m)
const BD_L = 9.75; // Court length (Y axis: 0 [Front Wall] to 9.75m [Back Wall])
const BD_SVG_W = 165; // Court width in SVG
const BD_SVG_L = BD_SVG_W * (BD_L / BD_W); // ~251px height in SVG
const BD_OX = 54; // Left margin
const BD_OY = 22; // Top margin

const bdX = (m: number) => BD_OX + (m / BD_W) * BD_SVG_W;
const bdY = (m: number) => BD_OY + (m / BD_L) * BD_SVG_L;

// Helper to calculate segment length
function dist(a: {x:number;y:number}, b: {x:number;y:number}) {
  return Math.sqrt((b.x-a.x)**2 + (b.y-a.y)**2);
}

export function BoastDiagram({
  animated = true,
  caption,
}: {
  animated?: boolean;
  caption?: string;
}) {
  const [shotMode, setShotMode] = React.useState<
    'side-boast' | 'back-wall-direct' | 'back-wall-side' | 'fault-shot'
  >('side-boast');

  const vbW = BD_OX + BD_SVG_W + 64;
  const vbH = BD_OY + BD_SVG_L + 28;

  // Mode 1: Side Wall Boast (Legal - Emerald Green)
  // Player (back right) -> Right Side Wall (1) -> Front Wall at Top (2) -> Front-Left Court (3)
  const pSidePlayer = { x: bdX(5.2), y: bdY(8.4) };
  const pSideHit1 = { x: bdX(BD_W), y: bdY(5.2) }; // Right side wall
  const pSideHit2 = { x: bdX(1.0), y: bdY(0) };    // Front wall at TOP
  const pSideEnd = { x: bdX(0.6), y: bdY(2.2) };   // Front-left court landing

  // Mode 2A: Direct Back Wall Shot (Legal - Emerald Green)
  // Player -> Back Wall at Bottom (1) -> Flies diagonally across court to Front Wall at Top (2) -> Court (3)
  const pDirectPlayer = { x: bdX(4.6), y: bdY(7.0) };
  const pDirectHit1 = { x: bdX(4.2), y: bdY(BD_L) }; // Back wall (BOTTOM right)
  const pDirectHit2 = { x: bdX(2.0), y: bdY(0) };    // Front wall (TOP left)
  const pDirectEnd = { x: bdX(1.4), y: bdY(2.4) };   // Court landing

  // Mode 2B: Back + Side Wall Shot (Legal - Emerald Green)
  // Player -> Back Wall at Bottom (1) -> Right Side Wall (2) -> Front Wall at Top (3) -> Court (4)
  const pBackPlayer = { x: bdX(4.8), y: bdY(7.2) };
  const pBackHit1 = { x: bdX(5.4), y: bdY(BD_L) }; // Back wall (BOTTOM)
  const pBackHit2 = { x: bdX(BD_W), y: bdY(3.6) }; // Right side wall (well separated!)
  const pBackHit3 = { x: bdX(2.2), y: bdY(0) };    // Front wall at TOP
  const pBackEnd = { x: bdX(1.8), y: bdY(2.4) };   // Court landing

  // Mode 3: Fault Shot (Bounces on floor before Front Wall - Illegal - Rose Red)
  // Player -> Right Side Wall (1) -> Floor Bounce before Front Wall (✖ FAULT)
  const pFaultPlayer = { x: bdX(5.2), y: bdY(8.4) };
  const pFaultHit1 = { x: bdX(BD_W), y: bdY(6.8) }; // Right side wall (well separated!)
  const pFaultFloor = { x: bdX(3.8), y: bdY(5.0) }; // Bounces on floor in mid court!

  // Consistency Rule: ALL legal shots = Emerald Green (#10B981), ALL illegal/fault = Rose Red (#EF4444)
  const isLegal = shotMode !== 'fault-shot';
  const strokeColor = isLegal ? '#10B981' : '#EF4444';
  const markerId = isLegal ? 'bd-arrow-green' : 'bd-arrow-red';

  let pathD = '';
  let totalLen = 300;

  if (shotMode === 'side-boast') {
    pathD = `M ${pSidePlayer.x} ${pSidePlayer.y} L ${pSideHit1.x} ${pSideHit1.y} L ${pSideHit2.x} ${pSideHit2.y} L ${pSideEnd.x} ${pSideEnd.y}`;
    totalLen = dist(pSidePlayer, pSideHit1) + dist(pSideHit1, pSideHit2) + dist(pSideHit2, pSideEnd);
  } else if (shotMode === 'back-wall-direct') {
    pathD = `M ${pDirectPlayer.x} ${pDirectPlayer.y} L ${pDirectHit1.x} ${pDirectHit1.y} L ${pDirectHit2.x} ${pDirectHit2.y} L ${pDirectEnd.x} ${pDirectEnd.y}`;
    totalLen = dist(pDirectPlayer, pDirectHit1) + dist(pDirectHit1, pDirectHit2) + dist(pDirectHit2, pDirectEnd);
  } else if (shotMode === 'back-wall-side') {
    pathD = `M ${pBackPlayer.x} ${pBackPlayer.y} L ${pBackHit1.x} ${pBackHit1.y} L ${pBackHit2.x} ${pBackHit2.y} L ${pBackHit3.x} ${pBackHit3.y} L ${pBackEnd.x} ${pBackEnd.y}`;
    totalLen = dist(pBackPlayer, pBackHit1) + dist(pBackHit1, pBackHit2) + dist(pBackHit2, pBackHit3) + dist(pBackHit3, pBackEnd);
  } else {
    pathD = `M ${pFaultPlayer.x} ${pFaultPlayer.y} L ${pFaultHit1.x} ${pFaultHit1.y} L ${pFaultFloor.x} ${pFaultFloor.y}`;
    totalLen = dist(pFaultPlayer, pFaultHit1) + dist(pFaultHit1, pFaultFloor);
  }

  const activePlayer =
    shotMode === 'back-wall-direct'
      ? pDirectPlayer
      : shotMode === 'back-wall-side'
      ? pBackPlayer
      : pSidePlayer;

  return (
    <DiagramCard
      caption={caption}
      defaultCaption={
        shotMode === 'side-boast'
          ? '✓ Side Wall Boast: Side wall → Front wall → Court'
          : shotMode === 'back-wall-direct'
          ? '✓ Direct Back Wall: Back wall → Front wall → Court'
          : shotMode === 'back-wall-side'
          ? '✓ Back + Side Wall: Back wall → Side wall → Front wall → Court'
          : '✕ Floor First: Bounces on floor before Front wall (Fault)'
      }
    >
      {/* Mode Selector Buttons with explicit ✓ and ✕ indicators */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
        <button
          type="button"
          onClick={() => setShotMode('side-boast')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
            shotMode === 'side-boast'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>✓ Side Wall Boast</span>
        </button>
        <button
          type="button"
          onClick={() => setShotMode('back-wall-direct')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
            shotMode === 'back-wall-direct'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>✓ Direct Back Wall</span>
        </button>
        <button
          type="button"
          onClick={() => setShotMode('back-wall-side')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
            shotMode === 'back-wall-side'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>✓ Back + Side Wall</span>
        </button>
        <button
          type="button"
          onClick={() => setShotMode('fault-shot')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer flex items-center space-x-1 ${
            shotMode === 'fault-shot'
              ? 'bg-rose-500 text-white border-rose-500 shadow-xs font-black'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          <span>✕ Floor First (Fault)</span>
        </button>
      </div>

      {/* CSS-animation for stroke-dashoffset progressive ball drawing */}
      {animated && (
        <style>{`
          @keyframes boast-draw-dyn {
            0%   { stroke-dashoffset: ${totalLen}; opacity: 1; }
            70%  { stroke-dashoffset: 0; opacity: 1; }
            85%  { stroke-dashoffset: 0; opacity: 1; }
            95%  { stroke-dashoffset: 0; opacity: 0.15; }
            100% { stroke-dashoffset: ${totalLen}; opacity: 0; }
          }
          .boast-path-dyn {
            stroke-dasharray: ${totalLen};
            stroke-dashoffset: ${totalLen};
            animation: boast-draw-dyn 2.8s linear infinite;
          }
        `}</style>
      )}

      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-auto"
        aria-label="Boast shot diagram"
      >
        <defs>
          <ArrowMarker id="bd-arrow-green" color="#10B981" />
          <ArrowMarker id="bd-arrow-red" color="#EF4444" />
          <ArrowMarker id="bd-arrow-static" color={C.navy} />
        </defs>

        {/* Court outline */}
        <rect
          x={BD_OX}
          y={BD_OY}
          width={BD_SVG_W}
          height={BD_SVG_L}
          fill={C.white}
          stroke={C.navy}
          strokeWidth={2}
        />

        {/* Light front area highlight (near Front Wall at top) */}
        <rect
          x={BD_OX}
          y={BD_OY}
          width={BD_SVG_W}
          height={BD_SVG_L * 0.35}
          fill={shotMode === 'fault-shot' ? '#FEE2E2' : '#D1FAE5'}
          fillOpacity={shotMode === 'fault-shot' ? 0.15 : 0.12}
        />

        {/* Wall labels */}
        <text
          x={BD_OX + BD_SVG_W / 2}
          y={BD_OY - 7}
          textAnchor="middle"
          fill={C.navy}
          fontSize={8}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="0.5"
        >
          FRONT WALL
        </text>
        <text
          x={BD_OX + BD_SVG_W / 2}
          y={BD_OY + BD_SVG_L + 12}
          textAnchor="middle"
          fill={C.navy}
          fontSize={8}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="0.5"
        >
          BACK WALL
        </text>
        <text
          x={BD_OX - 6}
          y={BD_OY + BD_SVG_L / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={7}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="0.4"
          transform={`rotate(-90, ${BD_OX - 6}, ${BD_OY + BD_SVG_L / 2})`}
        >
          SIDE WALL
        </text>
        <text
          x={BD_OX + BD_SVG_W + 6}
          y={BD_OY + BD_SVG_L / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={7}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="0.4"
          transform={`rotate(90, ${BD_OX + BD_SVG_W + 6}, ${BD_OY + BD_SVG_L / 2})`}
        >
          SIDE WALL
        </text>

        {/* Base faint trajectory line (shows path style: Solid for Legal, Dashed for Fault) */}
        <path
          d={pathD}
          fill="none"
          stroke={strokeColor}
          strokeWidth={1.6}
          strokeOpacity={0.25}
          strokeDasharray={isLegal ? 'none' : '5,4'}
        />

        {/* Progressive ball drawing animation path */}
        {animated && (
          <path
            className="boast-path-dyn"
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2.4}
            strokeLinecap="round"
            strokeLinejoin="round"
            markerEnd={`url(#${markerId})`}
          />
        )}

        {/* Mode 1: Side Wall Boast Badges & Markers (Green + Checkmark) */}
        {shotMode === 'side-boast' && (
          <g>
            {/* Impact 1: Side Wall */}
            <circle cx={pSideHit1.x} cy={pSideHit1.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pSideHit1.x - 13} y={pSideHit1.y} n={1} />
            <text x={pSideHit1.x - 13} y={pSideHit1.y + 11} textAnchor="end" fill="#047857" fontSize={6} fontWeight={700}>
              1. Side Wall Impact
            </text>

            {/* Impact 2: Front Wall at Top */}
            <circle cx={pSideHit2.x} cy={pSideHit2.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pSideHit2.x} y={pSideHit2.y + 13} n={2} />
            <text x={pSideHit2.x + 9} y={pSideHit2.y + 23} textAnchor="start" fill="#047857" fontSize={6} fontWeight={700}>
              2. Front Wall Target
            </text>

            {/* Landing 3: Floor */}
            <circle cx={pSideEnd.x} cy={pSideEnd.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pSideEnd.x} y={pSideEnd.y + 13} n={3} />
            <text x={pSideEnd.x} y={pSideEnd.y + 25} textAnchor="middle" fill="#047857" fontSize={6.5} fontWeight={800}>
              3. ✓ Good Return (In Play)
            </text>
          </g>
        )}

        {/* Mode 2A: Direct Back Wall Badges & Markers (Green + Checkmark) */}
        {shotMode === 'back-wall-direct' && (
          <g>
            {/* Impact 1: Back Wall at Bottom */}
            <circle cx={pDirectHit1.x} cy={pDirectHit1.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pDirectHit1.x} y={pDirectHit1.y - 13} n={1} />
            <text x={pDirectHit1.x} y={pDirectHit1.y - 23} textAnchor="middle" fill="#047857" fontSize={6} fontWeight={700}>
              1. Back Wall Hit
            </text>

            {/* Impact 2: Front Wall at Top */}
            <circle cx={pDirectHit2.x} cy={pDirectHit2.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pDirectHit2.x} y={pDirectHit2.y + 13} n={2} />
            <text x={pDirectHit2.x + 9} y={pDirectHit2.y + 23} textAnchor="start" fill="#047857" fontSize={6} fontWeight={700}>
              2. Direct Front Wall
            </text>

            {/* Landing 3: Floor */}
            <circle cx={pDirectEnd.x} cy={pDirectEnd.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pDirectEnd.x} y={pDirectEnd.y + 13} n={3} />
            <text x={pDirectEnd.x} y={pDirectEnd.y + 25} textAnchor="middle" fill="#047857" fontSize={6.5} fontWeight={800}>
              3. ✓ Good Return
            </text>
          </g>
        )}

        {/* Mode 2B: Back + Side Wall Badges & Markers (Green + Checkmark) */}
        {shotMode === 'back-wall-side' && (
          <g>
            {/* Impact 1: Back Wall at Bottom */}
            <circle cx={pBackHit1.x} cy={pBackHit1.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pBackHit1.x - 12} y={pBackHit1.y - 13} n={1} />
            <text x={pBackHit1.x - 12} y={pBackHit1.y - 23} textAnchor="end" fill="#047857" fontSize={6} fontWeight={700}>
              1. Back Wall Shot
            </text>

            {/* Impact 2: Side Wall Rebound */}
            <circle cx={pBackHit2.x} cy={pBackHit2.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pBackHit2.x - 13} y={pBackHit2.y} n={2} />
            <text x={pBackHit2.x - 13} y={pBackHit2.y + 11} textAnchor="end" fill="#047857" fontSize={6} fontWeight={700}>
              2. Side Wall Rebound
            </text>

            {/* Impact 3: Front Wall at Top */}
            <circle cx={pBackHit3.x} cy={pBackHit3.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pBackHit3.x} y={pBackHit3.y + 13} n={3} />
            <text x={pBackHit3.x + 9} y={pBackHit3.y + 23} textAnchor="start" fill="#047857" fontSize={6} fontWeight={700}>
              3. Hits Front Wall
            </text>

            {/* Landing 4: Floor */}
            <circle cx={pBackEnd.x} cy={pBackEnd.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pBackEnd.x} y={pBackEnd.y + 13} n={4} />
            <text x={pBackEnd.x} y={pBackEnd.y + 25} textAnchor="middle" fill="#047857" fontSize={6.5} fontWeight={800}>
              4. ✓ Legal Landing
            </text>
          </g>
        )}
        {shotMode === 'fault-shot' && (
          <g>
            {/* Impact 1: Side Wall */}
            <circle cx={pFaultHit1.x} cy={pFaultHit1.y} r={4.5} fill="#EF4444" stroke={C.white} strokeWidth={1} />
            <Badge x={pFaultHit1.x - 13} y={pFaultHit1.y} n={1} />
            <text x={pFaultHit1.x - 13} y={pFaultHit1.y + 11} textAnchor="end" fill="#B91C1C" fontSize={6} fontWeight={700}>
              1. Side Wall Impact
            </text>

            {/* Fault Floor Landing: Red Cross */}
            <circle cx={pFaultFloor.x} cy={pFaultFloor.y} r={8} fill="#EF4444" stroke={C.white} strokeWidth={1.5} />
            <text x={pFaultFloor.x} y={pFaultFloor.y} textAnchor="middle" dominantBaseline="central" fill={C.white} fontSize={10} fontWeight={900}>
              ✕
            </text>
            <text x={pFaultFloor.x} y={pFaultFloor.y + 16} textAnchor="middle" fill="#DC2626" fontSize={6.5} fontWeight={800}>
              ✕ FAULT! Bounced on floor before Front Wall
            </text>
          </g>
        )}

        {/* Player icon */}
        <circle cx={activePlayer.x} cy={activePlayer.y} r={7} fill={C.navy} fillOpacity={0.12} stroke={C.navy} strokeWidth={1.5} />
        <circle cx={activePlayer.x} cy={activePlayer.y - 3.5} r={2.5} fill={C.navy} />
        <line x1={activePlayer.x} y1={activePlayer.y - 1} x2={activePlayer.x} y2={activePlayer.y + 4} stroke={C.navy} strokeWidth={1.5} />
        <line x1={activePlayer.x - 4} y1={activePlayer.y + 1} x2={activePlayer.x + 4} y2={activePlayer.y + 1} stroke={C.navy} strokeWidth={1.5} />
        <text
          x={activePlayer.x}
          y={activePlayer.y + 12}
          textAnchor="middle"
          fill={C.navy}
          fontSize={6.5}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          PLAYER
        </text>
      </svg>
    </DiagramCard>
  );
}

// ═══════════════════════════════════════════════════════════════════════════
// DiagramLegend — горизонтальный ряд легенды
// ═══════════════════════════════════════════════════════════════════════════

interface LegendItem {
  color: string;
  label: string;
  shape?: 'circle' | 'line' | 'rect';
}

const DEFAULT_LEGEND: LegendItem[] = [
  { color: C.navy,  label: 'Court lines',     shape: 'line' },
  { color: C.amber, label: 'Active zone',      shape: 'rect' },
  { color: C.amber, label: 'Ball contact',     shape: 'circle' },
  { color: C.slate400, label: 'Dimensions',   shape: 'line' },
];

export function DiagramLegend({ items = DEFAULT_LEGEND }: { items?: LegendItem[] }) {
  return (
    <div className="flex flex-wrap gap-x-4 gap-y-1 justify-center">
      {items.map((item, i) => (
        <div key={i} className="flex items-center gap-1.5">
          <svg width={16} height={12} viewBox="0 0 16 12" className="flex-shrink-0">
            {item.shape === 'circle' && (
              <circle cx={8} cy={6} r={4} fill={item.color} />
            )}
            {item.shape === 'line' && (
              <line x1={0} y1={6} x2={16} y2={6} stroke={item.color} strokeWidth={2} strokeDasharray={item.color === C.slate400 ? '3,2' : 'none'} />
            )}
            {item.shape === 'rect' && (
              <rect x={2} y={2} width={12} height={8} rx={2} fill={item.color} fillOpacity={0.4} stroke={item.color} strokeWidth={1} />
            )}
            {!item.shape && (
              <circle cx={8} cy={6} r={4} fill={item.color} />
            )}
          </svg>
          <span className="text-xs text-slate-500 whitespace-nowrap">{item.label}</span>
        </div>
      ))}
    </div>
  );
}
