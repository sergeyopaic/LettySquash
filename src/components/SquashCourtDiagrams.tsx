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
  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm w-full">
      {children}
      <p className="text-xs text-slate-500 mt-3 text-center leading-relaxed">
        {caption ?? defaultCaption}
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

// Примечание: по WSF short line = 4.26 м от front wall
const CP_L = 9.75;  // court length
const CP_W = 6.4;   // court width
const CP_SVG_W = 200; // width in SVG
const CP_SVG_L = CP_SVG_W * (CP_L / CP_W); // ~305
const CP_OX = 48;   // left offset for dimension label
const CP_OY = 28;   // top offset

// Convert real meters to SVG pixels (X = length/depth, Y = width)
const cpX = (m: number) => CP_OX + (m / CP_L) * CP_SVG_L;
const cpY = (m: number) => CP_OY + (m / CP_W) * CP_SVG_W;

const SL_X = cpX(4.26);   // short line
const HCL_Y = cpY(CP_W / 2); // half-court line
const SB_SIZE = (1.6 / CP_W) * CP_SVG_W;

export function CourtPlanDiagram({
  highlight,
  caption,
}: {
  highlight?: 'service-box-right' | 'service-box-left' | 'target-quarter' | 'short-line';
  caption?: string;
}) {
  const vbW = CP_OX + CP_SVG_L + 24;
  const vbH = CP_OY + CP_SVG_W + 24;

  // Fill color for left service box (near bottom side wall)
  const sbLeftFill = highlight === 'service-box-left' ? C.amber : C.navy;
  const sbLeftOp = highlight === 'service-box-left' ? 0.22 : 0.08;

  // Fill color for right service box (near top side wall)
  const sbRightFill = highlight === 'service-box-right' ? C.amber : C.navy;
  const sbRightOp = highlight === 'service-box-right' ? 0.22 : 0.08;

  // Target quarter - left rear (opposite right service box)
  const targetFill = highlight === 'target-quarter' ? C.amber : C.amberLight;
  const targetOp = highlight === 'target-quarter' ? 0.35 : 0.18;

  // Short line
  const slStroke = highlight === 'short-line' ? C.amber : C.navy;
  const slWidth = highlight === 'short-line' ? 2.5 : 1.5;

  return (
    <DiagramCard
      caption={caption}
      defaultCaption="Top view. When serving from the right service box, the ball must land in the opposite back-quarter court."
    >
      <svg
        viewBox={`0 0 ${vbW} ${vbH}`}
        className="w-full h-auto"
        aria-label="Court plan diagram"
      >
        <defs>
          <ArrowMarker id="cp-arrow-amber" color={C.amber} />
          <ArrowMarker id="cp-arrow-navy" color={C.navy} />
        </defs>

        {/* Контур корта */}
        <rect
          x={CP_OX}
          y={CP_OY}
          width={CP_SVG_L}
          height={CP_SVG_W}
          fill={C.white}
          stroke={C.navy}
          strokeWidth={2}
        />

        {/* Целевая четверть (левая задняя = верхняя левая от short line) */}
        <rect
          x={SL_X}
          y={CP_OY}
          width={cpX(CP_L) - SL_X}
          height={HCL_Y - CP_OY}
          fill={targetFill}
          fillOpacity={targetOp}
        />

        {/* Service box — правый (у верхней боковой стенки) */}
        <rect
          x={SL_X - SB_SIZE}
          y={CP_OY}
          width={SB_SIZE}
          height={SB_SIZE}
          fill={sbRightFill}
          fillOpacity={sbRightOp}
          stroke={C.navy}
          strokeWidth={1}
        />

        {/* Service box — левый (у нижней боковой стенки) */}
        <rect
          x={SL_X - SB_SIZE}
          y={cpY(CP_W) - SB_SIZE}
          width={SB_SIZE}
          height={SB_SIZE}
          fill={sbLeftFill}
          fillOpacity={sbLeftOp}
          stroke={C.navy}
          strokeWidth={1}
        />

        {/* SHORT LINE */}
        <line
          x1={SL_X}
          y1={CP_OY}
          x2={SL_X}
          y2={cpY(CP_W)}
          stroke={slStroke}
          strokeWidth={slWidth}
        />

        {/* HALF-COURT LINE (от short line до задней стенки) */}
        <line
          x1={SL_X}
          y1={HCL_Y}
          x2={cpX(CP_L)}
          y2={HCL_Y}
          stroke={C.navy}
          strokeWidth={1}
          strokeDasharray="4,3"
        />

        {/* Подписи стен */}
        <text
          x={CP_OX + CP_SVG_L / 2}
          y={CP_OY - 6}
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
          x={CP_OX + CP_SVG_L / 2}
          y={cpY(CP_W) + 10}
          textAnchor="middle"
          fill={C.navy}
          fontSize={8}
          fontWeight={700}
          fontFamily="sans-serif"
          letterSpacing="0.5"
        >
          BACK WALL
        </text>

        {/* Подписи зон */}
        <text
          x={SL_X + (cpX(CP_L) - SL_X) / 2}
          y={HCL_Y - (HCL_Y - CP_OY) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={6.5}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          QUARTER COURT
        </text>
        <text
          x={SL_X + (cpX(CP_L) - SL_X) / 2}
          y={HCL_Y + (cpY(CP_W) - HCL_Y) / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={6.5}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          QUARTER COURT
        </text>

        {/* Подпись SHORT LINE */}
        <text
          x={SL_X + 2}
          y={cpY(CP_W) + 10}
          textAnchor="middle"
          fill={slStroke}
          fontSize={6.5}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          SHORT LINE
        </text>

        {/* Подпись SERVICE BOX (правый) */}
        <text
          x={SL_X - SB_SIZE / 2}
          y={CP_OY + SB_SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={5.5}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          SERVICE
        </text>
        <text
          x={SL_X - SB_SIZE / 2}
          y={CP_OY + SB_SIZE / 2 + 7}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={5.5}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          BOX
        </text>

        {/* Подпись SERVICE BOX (левый) */}
        <text
          x={SL_X - SB_SIZE / 2}
          y={cpY(CP_W) - SB_SIZE / 2}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={5.5}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          SERVICE
        </text>
        <text
          x={SL_X - SB_SIZE / 2}
          y={cpY(CP_W) - SB_SIZE / 2 + 7}
          textAnchor="middle"
          dominantBaseline="central"
          fill={C.navy}
          fontSize={5.5}
          fontWeight={700}
          fontFamily="sans-serif"
        >
          BOX
        </text>

        {/* Дуговая пунктирная стрелка подачи: из правого service box → левая задняя четверть */}
        {/* Центр правого service box */}
        {(() => {
          const sx = SL_X - SB_SIZE / 2;
          const sy = CP_OY + SB_SIZE / 2;
          // Целевая точка — центр левой задней четверти
          const tx = SL_X + (cpX(CP_L) - SL_X) * 0.55;
          const ty = CP_OY + (HCL_Y - CP_OY) * 0.5;
          // Контрольная точка для дуги
          const cx1 = sx + (tx - sx) * 0.5;
          const cy1 = CP_OY - 18;
          return (
            <g>
              <path
                d={`M ${sx} ${sy} Q ${cx1} ${cy1} ${tx} ${ty}`}
                fill="none"
                stroke={C.amber}
                strokeWidth={1.5}
                strokeDasharray="4,3"
                markerEnd="url(#cp-arrow-amber)"
              />
              {/* Метка SERVE MUST LAND HERE */}
              <rect
                x={tx - 28}
                y={ty - 18}
                width={56}
                height={14}
                fill={C.amber}
                fillOpacity={0.15}
                rx={3}
              />
              <text
                x={tx}
                y={ty - 11}
                textAnchor="middle"
                dominantBaseline="central"
                fill={C.dark}
                fontSize={5.5}
                fontWeight={700}
                fontFamily="sans-serif"
              >
                SERVE MUST LAND HERE
              </text>
            </g>
          );
        })()}

        {/* ── Размерные выноски ── */}
        {/* Длина 9.75 m (вертикально слеви) */}
        <DimLabel
          x1={CP_OX - 10} y1={CP_OY}
          x2={CP_OX - 10} y2={cpY(CP_W)}
          label="9.75 m" side="left"
        />
        {/* Ширина 6.4 m (горизонтально сверху) */}
        <DimLabel
          x1={CP_OX} y1={CP_OY - 16}
          x2={cpX(CP_L)} y2={CP_OY - 16}
          label="6.4 m" side="top"
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
const BD_OX = 44; // Left margin
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

  const vbW = BD_OX + BD_SVG_W + 44;
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
          ? 'Side Wall Boast (LEGAL): 1. Side wall impact → 2. Rebounds to Front Wall at TOP → 3. In Play.'
          : shotMode === 'back-wall-direct'
          ? 'Direct Back Wall Shot (LEGAL): 1. Hits Back Wall → 2. Flies straight to Front Wall at TOP without side wall → 3. In Play.'
          : shotMode === 'back-wall-side'
          ? 'Back + Side Wall Shot (LEGAL): 1. Hits Back Wall → 2. Rebounds off Side Wall → 3. Front Wall at TOP → 4. In Play.'
          : 'Floor First Fault (ILLEGAL ✖): Ball hits side wall and bounces on floor BEFORE reaching Front Wall!'
      }
    >
      {/* Mode Selector Buttons */}
      <div className="flex flex-wrap gap-1.5 justify-center mb-3">
        <button
          type="button"
          onClick={() => setShotMode('side-boast')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
            shotMode === 'side-boast'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Side Wall Boast (Legal)
        </button>
        <button
          type="button"
          onClick={() => setShotMode('back-wall-direct')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
            shotMode === 'back-wall-direct'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Direct Back Wall (Legal)
        </button>
        <button
          type="button"
          onClick={() => setShotMode('back-wall-side')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
            shotMode === 'back-wall-side'
              ? 'bg-emerald-600 text-white border-emerald-600 shadow-xs font-black'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Back + Side Wall (Legal)
        </button>
        <button
          type="button"
          onClick={() => setShotMode('fault-shot')}
          className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all cursor-pointer ${
            shotMode === 'fault-shot'
              ? 'bg-rose-500 text-white border-rose-500 shadow-xs font-black'
              : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-50'
          }`}
        >
          Floor First (Fault ✖)
        </button>
      </div>

      {/* CSS-animation for stroke-dashoffset */}
      {animated && (
        <style>{`
          @keyframes boast-draw-dyn {
            0%   { stroke-dashoffset: ${totalLen}; opacity: 1; }
            65%  { stroke-dashoffset: 0; opacity: 1; }
            80%  { stroke-dashoffset: 0; opacity: 1; }
            95%  { stroke-dashoffset: 0; opacity: 0.15; }
            100% { stroke-dashoffset: ${totalLen}; opacity: 0; }
          }
          .boast-path-dyn {
            stroke-dasharray: ${totalLen};
            stroke-dashoffset: ${totalLen};
            animation: boast-draw-dyn 2.8s cubic-bezier(0.4,0,0.2,1) infinite;
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

        {/* Static Trajectory when animated=false */}
        {!animated && (
          <path
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2}
            strokeDasharray={shotMode === 'fault-shot' ? '4,4' : '5,3'}
            markerEnd={`url(#${markerId})`}
          />
        )}

        {/* Animated Trajectory */}
        {animated && (
          <path
            className="boast-path-dyn"
            d={pathD}
            fill="none"
            stroke={strokeColor}
            strokeWidth={2.2}
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeDasharray={shotMode === 'fault-shot' ? '5,4' : 'none'}
            markerEnd={`url(#${markerId})`}
          />
        )}

        {/* Mode 1: Side Wall Boast Badges & Markers (Green) */}
        {shotMode === 'side-boast' && (
          <g>
            {/* Impact 1: Side Wall */}
            <circle cx={pSideHit1.x} cy={pSideHit1.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pSideHit1.x - 14} y={pSideHit1.y} n={1} />
            <text x={pSideHit1.x - 14} y={pSideHit1.y + 10} textAnchor="end" fill="#047857" fontSize={6} fontWeight={700}>
              1. Side Wall Impact
            </text>

            {/* Impact 2: Front Wall at Top */}
            <circle cx={pSideHit2.x} cy={pSideHit2.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pSideHit2.x} y={pSideHit2.y + 12} n={2} />
            <text x={pSideHit2.x + 8} y={pSideHit2.y + 22} textAnchor="start" fill="#047857" fontSize={6} fontWeight={700}>
              2. Front Wall Target
            </text>

            {/* Landing 3: Floor */}
            <circle cx={pSideEnd.x} cy={pSideEnd.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pSideEnd.x} y={pSideEnd.y + 10} n={3} />
            <text x={pSideEnd.x} y={pSideEnd.y + 22} textAnchor="middle" fill="#047857" fontSize={6} fontWeight={800}>
              3. Good Return (In Play)
            </text>
          </g>
        )}

        {/* Mode 2A: Direct Back Wall Badges & Markers (Green) */}
        {shotMode === 'back-wall-direct' && (
          <g>
            {/* Impact 1: Back Wall at Bottom */}
            <circle cx={pDirectHit1.x} cy={pDirectHit1.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pDirectHit1.x} y={pDirectHit1.y - 12} n={1} />
            <text x={pDirectHit1.x} y={pDirectHit1.y - 20} textAnchor="middle" fill="#047857" fontSize={6} fontWeight={700}>
              1. Back Wall Hit
            </text>

            {/* Impact 2: Front Wall at Top */}
            <circle cx={pDirectHit2.x} cy={pDirectHit2.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pDirectHit2.x} y={pDirectHit2.y + 12} n={2} />
            <text x={pDirectHit2.x + 8} y={pDirectHit2.y + 22} textAnchor="start" fill="#047857" fontSize={6} fontWeight={700}>
              2. Direct Front Wall
            </text>

            {/* Landing 3: Floor */}
            <circle cx={pDirectEnd.x} cy={pDirectEnd.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pDirectEnd.x} y={pDirectEnd.y + 10} n={3} />
            <text x={pDirectEnd.x} y={pDirectEnd.y + 22} textAnchor="middle" fill="#047857" fontSize={6} fontWeight={800}>
              3. Good Return
            </text>
          </g>
        )}

        {/* Mode 2B: Back + Side Wall Badges & Markers (Green) */}
        {shotMode === 'back-wall-side' && (
          <g>
            {/* Impact 1: Back Wall at Bottom */}
            <circle cx={pBackHit1.x} cy={pBackHit1.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pBackHit1.x} y={pBackHit1.y - 12} n={1} />
            <text x={pBackHit1.x} y={pBackHit1.y - 20} textAnchor="middle" fill="#047857" fontSize={6} fontWeight={700}>
              1. Back Wall Shot
            </text>

            {/* Impact 2: Side Wall Rebound */}
            <circle cx={pBackHit2.x} cy={pBackHit2.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pBackHit2.x - 14} y={pBackHit2.y} n={2} />
            <text x={pBackHit2.x - 14} y={pBackHit2.y + 10} textAnchor="end" fill="#047857" fontSize={6} fontWeight={700}>
              2. Side Wall Rebound
            </text>

            {/* Impact 3: Front Wall at Top */}
            <circle cx={pBackHit3.x} cy={pBackHit3.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pBackHit3.x} y={pBackHit3.y + 12} n={3} />
            <text x={pBackHit3.x + 8} y={pBackHit3.y + 22} textAnchor="start" fill="#047857" fontSize={6} fontWeight={700}>
              3. Hits Front Wall
            </text>

            {/* Landing 4: Floor */}
            <circle cx={pBackEnd.x} cy={pBackEnd.y} r={4.5} fill="#10B981" stroke={C.white} strokeWidth={1} />
            <Badge x={pBackEnd.x} y={pBackEnd.y + 10} n={4} />
            <text x={pBackEnd.x} y={pBackEnd.y + 22} textAnchor="middle" fill="#047857" fontSize={6} fontWeight={800}>
              4. Legal Landing
            </text>
          </g>
        )}

        {/* Mode 3: Fault Shot (Floor First) */}
        {shotMode === 'fault-shot' && (
          <g>
            {/* Impact 1: Side Wall */}
            <circle cx={pFaultHit1.x} cy={pFaultHit1.y} r={4} fill="#EF4444" stroke={C.white} strokeWidth={1} />
            <Badge x={pFaultHit1.x} y={pFaultHit1.y - 12} n={1} />
            <text x={pFaultHit1.x} y={pFaultHit1.y - 22} textAnchor="middle" fill={C.navy} fontSize={6} fontWeight={700}>
              1. Side Wall Impact
            </text>

            {/* Fault Floor Landing: Red Cross */}
            <circle cx={pFaultFloor.x} cy={pFaultFloor.y} r={8} fill="#EF4444" stroke={C.white} strokeWidth={1.5} />
            <text x={pFaultFloor.x} y={pFaultFloor.y} textAnchor="middle" dominantBaseline="central" fill={C.white} fontSize={10} fontWeight={900}>
              ✕
            </text>
            <text x={pFaultFloor.x} y={pFaultFloor.y + 14} textAnchor="middle" fill="#DC2626" fontSize={6.5} fontWeight={800}>
              FAULT! Bounced on floor before Front Wall
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

// ═══════════════════════════════════════════════════════════════════════════
// ДЕМО-СТРАНИЦА — default export
// ═══════════════════════════════════════════════════════════════════════════

type HighlightFW = 'tin' | 'service-line' | 'out-line' | 'good-area' | undefined;

const FW_CHIPS: { label: string; value: HighlightFW }[] = [
  { label: 'None',         value: undefined },
  { label: 'Tin',          value: 'tin' },
  { label: 'Service Line', value: 'service-line' },
  { label: 'Out Line',     value: 'out-line' },
  { label: 'Good Area',    value: 'good-area' },
];

export default function App() {
  const [fwHighlight, setFwHighlight] = React.useState<HighlightFW>(undefined);
  const [animated, setAnimated] = React.useState(true);

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(135deg, #f0f4ff 0%, #fafafa 60%, #fffbeb 100%)',
        fontFamily: 'system-ui, -apple-system, sans-serif',
      }}
      className="p-4 md:p-8"
    >
      {/* Заголовок */}
      <div className="max-w-lg mx-auto mb-8 text-center">
        <div className="inline-flex items-center gap-2 bg-white rounded-full px-4 py-1.5 shadow-sm border border-slate-100 mb-4">
          <svg width={16} height={16} viewBox="0 0 16 16">
            <circle cx={8} cy={8} r={7} fill="none" stroke="#1e3a8a" strokeWidth={1.5} />
            <path d="M4 8 Q8 4 12 8 Q8 12 4 8" fill="none" stroke="#1e3a8a" strokeWidth={1} />
            <line x1={8} y1={1} x2={8} y2={15} stroke="#1e3a8a" strokeWidth={0.8} />
          </svg>
          <span className="text-xs font-semibold text-slate-600 tracking-wide uppercase">Letty Squash</span>
        </div>
        <h1
          className="text-2xl font-extrabold tracking-tight"
          style={{ color: '#0f172a' }}
        >
          Court Diagrams
        </h1>
        <p className="text-sm text-slate-500 mt-1">Interactive squash court illustrations</p>
      </div>

      <div className="max-w-lg mx-auto space-y-8">

        {/* ── Диаграмма 1: Передняя стенка ── */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">
            1 — Front Wall
          </h2>

          {/* Кнопки-чипы для highlight */}
          <div className="flex flex-wrap gap-2 mb-3">
            {FW_CHIPS.map(chip => (
              <button
                key={chip.label}
                onClick={() => setFwHighlight(chip.value)}
                className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
                style={{
                  background: fwHighlight === chip.value ? '#1e3a8a' : '#fff',
                  color:      fwHighlight === chip.value ? '#fff'    : '#1e3a8a',
                  borderColor: '#1e3a8a',
                  boxShadow:  fwHighlight === chip.value ? '0 2px 8px rgba(30,58,138,0.18)' : 'none',
                }}
              >
                {chip.label}
              </button>
            ))}
          </div>

          <FrontWallDiagram highlight={fwHighlight} />
        </section>

        {/* ── Диаграмма 2: Вид сверху ── */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">
            2 — Court Plan (Top View)
          </h2>
          <CourtPlanDiagram highlight="target-quarter" />
        </section>

        {/* ── Диаграмма 3: Boast ── */}
        <section>
          <h2 className="text-sm font-bold text-slate-700 uppercase tracking-widest mb-3">
            3 — Boast Shot Trajectory
          </h2>
          <div className="flex gap-2 mb-3">
            <button
              onClick={() => setAnimated(true)}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              style={{
                background:  animated ? '#fbbf24' : '#fff',
                color:       animated ? '#0f172a' : '#64748b',
                borderColor: '#fbbf24',
              }}
            >
              Animated
            </button>
            <button
              onClick={() => setAnimated(false)}
              className="px-3 py-1 rounded-full text-xs font-semibold border transition-all"
              style={{
                background: !animated ? '#1e3a8a' : '#fff',
                color:      !animated ? '#fff'    : '#64748b',
                borderColor: '#1e3a8a',
              }}
            >
              Static
            </button>
          </div>
          <BoastDiagram animated={animated} />
        </section>

        {/* ── Легенда ── */}
        <div className="rounded-2xl border border-slate-100 bg-white/70 p-4">
          <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-3 text-center">Legend</p>
          <DiagramLegend />
        </div>

        {/* Footer */}
        <p className="text-center text-xs text-slate-300 pb-4">
          Letty Squash — WSF court proportions
        </p>
      </div>
    </div>
  );
}
