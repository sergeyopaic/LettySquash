import React from 'react';

// ─────────────────────────────────────────────────────────────────────────────
// ТИПЫ
// ─────────────────────────────────────────────────────────────────────────────

export interface RallyEvent {
  index: number;
  scorerId: string;
  p1Score: number;
  p2Score: number;
  isHandout: boolean;
  decision?: 'YES_LET' | 'STROKE' | 'NO_LET';
}

export interface RallyChartPlayer {
  id: string;
  name: string;
  countryFlag?: string;
}

export interface RallyProgressionChartProps {
  player1: RallyChartPlayer;
  player2: RallyChartPlayer;
  rallies: RallyEvent[];
  gameNumber?: number;
  mode?: 'ladder' | 'momentum';
  targetScore?: number;
  className?: string;
}

// ─────────────────────────────────────────────────────────────────────────────
// КОНСТАНТЫ ЦВЕТОВ (строго из палитры)
// ─────────────────────────────────────────────────────────────────────────────

const C = {
  navy: '#1e3a8a',
  dark: '#0f172a',
  amber: '#fbbf24',
  amberText: '#d97706',
  slate400: '#94a3b8',
  slate200: '#e2e8f0',
  white: '#ffffff',
} as const;

// ─────────────────────────────────────────────────────────────────────────────
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: сокращение имени «Имя + инициал фамилии»
// ─────────────────────────────────────────────────────────────────────────────

function abbreviateName(name: string, maxChars = 12): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length === 1) return name.slice(0, maxChars);
  const first = parts[0];
  const lastInitial = parts[parts.length - 1][0].toUpperCase();
  const candidate = `${first} ${lastInitial}.`;
  return candidate.length <= maxChars ? candidate : first.slice(0, maxChars);
}

// ─────────────────────────────────────────────────────────────────────────────
// ВСПОМОГАТЕЛЬНАЯ ФУНКЦИЯ: кубическая кривая Безье через 2 точки
// (касательные вертикальны, чтобы линия плавно «переползала» между колонками)
// ─────────────────────────────────────────────────────────────────────────────

function cubicPath(x1: number, y1: number, x2: number, y2: number): string {
  const dy = Math.abs(y2 - y1);
  const tension = Math.min(dy * 0.5, 20);
  return `M ${x1} ${y1} C ${x1} ${y1 + tension}, ${x2} ${y2 - tension}, ${x2} ${y2}`;
}

// ─────────────────────────────────────────────────────────────────────────────
// SVG-ИКОНКА: стрелки смены подачи (⇄ без эмодзи)
// ─────────────────────────────────────────────────────────────────────────────

function HandoutIcon({ cx, cy }: { cx: number; cy: number }) {
  return (
    <g transform={`translate(${cx - 6}, ${cy - 5})`}>
      {/* Стрелка влево */}
      <path
        d="M 8 3 L 2 3 M 2 3 L 4 1 M 2 3 L 4 5"
        stroke={C.slate400}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* Стрелка вправо */}
      <path
        d="M 4 7 L 10 7 M 10 7 L 8 5 M 10 7 L 8 9"
        stroke={C.slate400}
        strokeWidth="1"
        fill="none"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </g>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ТУЛТИП (абсолютный div поверх SVG)
// ─────────────────────────────────────────────────────────────────────────────

interface TooltipData {
  x: number;
  y: number;
  rally: RallyEvent;
  playerName: string;
}

function Tooltip({ data }: { data: TooltipData }) {
  const decisionLabel: Record<string, string> = {
    YES_LET: 'Let',
    STROKE: 'Stroke',
    NO_LET: 'No Let',
  };

  return (
    <div
      style={{
        position: 'absolute',
        left: data.x,
        top: data.y,
        transform: 'translate(-50%, -110%)',
        background: C.dark,
        color: C.white,
        borderRadius: 8,
        padding: '5px 9px',
        fontSize: 10,
        whiteSpace: 'nowrap',
        pointerEvents: 'none',
        zIndex: 50,
        lineHeight: 1.5,
        boxShadow: '0 4px 12px rgba(0,0,0,0.25)',
      }}
    >
      <div style={{ fontWeight: 700, fontSize: 12, fontFamily: 'monospace' }}>
        {data.rally.p1Score} — {data.rally.p2Score}
      </div>
      <div style={{ color: C.slate400, fontSize: 10 }}>
        Розыгрыш #{data.rally.index} · {data.playerName}
      </div>
      {data.rally.decision && (
        <div style={{ color: C.amber, fontSize: 10 }}>
          {decisionLabel[data.rally.decision]}
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ: РЕЖИМ LADDER (основной)
// ─────────────────────────────────────────────────────────────────────────────

function LadderChart({
  player1,
  player2,
  rallies,
  targetScore,
}: {
  player1: RallyChartPlayer;
  player2: RallyChartPlayer;
  rallies: RallyEvent[];
  targetScore: number;
}) {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);
  const [tooltipData, setTooltipData] = React.useState<TooltipData | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  // Размеры SVG
  const SVG_W = 320;
  const HEADER_H = 28;   // место под заголовки колонок
  const FOOTER_H = 28;   // место под итоговый счёт
  const STEP = 16;        // вертикальный шаг на розыгрыш
  const BODY_H = Math.max(rallies.length * STEP + 20, 60);
  const SVG_H = HEADER_H + BODY_H + FOOTER_H;

  const PAD_L = 36;       // отступ слева (для счёта p1)
  const PAD_R = 36;       // отступ справа
  const CHART_W = SVG_W - PAD_L - PAD_R;
  const CENTER_X = PAD_L + CHART_W / 2;
  const P1_X = PAD_L + CHART_W * 0.18;   // x-позиция колонки p1
  const P2_X = PAD_L + CHART_W * 0.82;   // x-позиция колонки p2

  // Прореживание подписей счёта
  const showEveryScore = true;
  const scoreStep = rallies.length > 24 ? 2 : 1;

  // Вычисляем game ball / tie-break пороги
  const gameBallScore = targetScore - 1;

  // Находим, с какого розыгрыша начинается tie-break зона
  let tiebreakerStartIdx = -1;
  for (let i = 0; i < rallies.length; i++) {
    if (rallies[i].p1Score >= gameBallScore && rallies[i].p2Score >= gameBallScore) {
      tiebreakerStartIdx = i;
      break;
    }
  }

  // Функция y-координаты для розыгрыша с индексом i (0-based)
  const rallyY = (i: number) => HEADER_H + 10 + i * STEP;

  // Функция x-координаты точки
  const pointX = (rally: RallyEvent) =>
    rally.scorerId === player1.id ? P1_X : P2_X;

  // Находим y уровня game ball
  const gameBallY = (() => {
    for (let i = 0; i < rallies.length; i++) {
      const r = rallies[i];
      if (r.p1Score === gameBallScore || r.p2Score === gameBallScore) {
        return rallyY(i);
      }
    }
    return null;
  })();

  // Обработчик наведения на точку
  const handlePointEnter = (
    _e: React.MouseEvent<SVGElement>,
    rally: RallyEvent
  ) => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const relX = (pointX(rally) / SVG_W) * rect.width;
    const relY = (rallyY(rally.index - 1) / SVG_H) * rect.height;
    setActiveIdx(rally.index);
    setTooltipData({
      x: relX,
      y: relY,
      rally,
      playerName:
        rally.scorerId === player1.id ? player1.name : player2.name,
    });
  };

  const handlePointLeave = () => {
    setActiveIdx(null);
    setTooltipData(null);
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-auto"
        style={{ display: 'block' }}
      >
        {/* ── Фон тай-брейк зоны ── */}
        {tiebreakerStartIdx >= 0 && (
          <rect
            x={PAD_L}
            y={rallyY(tiebreakerStartIdx) - STEP / 2}
            width={CHART_W}
            height={BODY_H - (rallyY(tiebreakerStartIdx) - HEADER_H - 10) + STEP / 2}
            fill={C.amber}
            fillOpacity={0.06}
          />
        )}

        {/* ── Линия game ball ── */}
        {gameBallY !== null && (
          <>
            <line
              x1={PAD_L}
              y1={gameBallY}
              x2={SVG_W - PAD_R}
              y2={gameBallY}
              stroke={C.amberText}
              strokeWidth={0.75}
              strokeDasharray="3 2"
              opacity={0.6}
            />
            <text
              x={CENTER_X}
              y={gameBallY - 3}
              textAnchor="middle"
              fontSize={7}
              fill={C.amberText}
              fontWeight={600}
              fontFamily="monospace"
            >
              GAME BALL
            </text>
          </>
        )}

        {/* ── Подпись TIE-BREAK ── */}
        {tiebreakerStartIdx >= 0 && (
          <text
            x={CENTER_X}
            y={rallyY(tiebreakerStartIdx) - 3}
            textAnchor="middle"
            fontSize={6.5}
            fill={C.amberText}
            fontWeight={700}
            fontFamily="monospace"
          >
            TIE-BREAK · WIN BY 2
          </text>
        )}

        {/* ── Подписи колонок ── */}
        <text
          x={P1_X}
          y={HEADER_H - 8}
          textAnchor="middle"
          fontSize={9}
          fontWeight={700}
          fill={C.navy}
          fontFamily="system-ui, sans-serif"
        >
          {abbreviateName(player1.name)}
        </text>
        <text
          x={CENTER_X}
          y={HEADER_H - 8}
          textAnchor="middle"
          fontSize={7}
          fill={C.slate400}
          fontFamily="system-ui, sans-serif"
          letterSpacing={0.8}
        >
          RALLY BY RALLY
        </text>
        <text
          x={P2_X}
          y={HEADER_H - 8}
          textAnchor="middle"
          fontSize={9}
          fontWeight={700}
          fill={C.amberText}
          fontFamily="system-ui, sans-serif"
        >
          {abbreviateName(player2.name)}
        </text>

        {/* ── Центральная ось ── */}
        <line
          x1={CENTER_X}
          y1={HEADER_H}
          x2={CENTER_X}
          y2={HEADER_H + BODY_H - 10}
          stroke={C.slate200}
          strokeWidth={1}
        />

        {/* ── Линии смены подачи ── */}
        {rallies.map((r) => {
          if (!r.isHandout) return null;
          const y = rallyY(r.index - 1);
          return (
            <g key={`handout-${r.index}`}>
              <line
                x1={PAD_L}
                y1={y}
                x2={SVG_W - PAD_R}
                y2={y}
                stroke={C.slate200}
                strokeWidth={0.8}
                strokeDasharray="2 3"
              />
              <HandoutIcon cx={CENTER_X} cy={y} />
            </g>
          );
        })}

        {/* ── Сегменты кривой ── */}
        {rallies.map((r, i) => {
          // Начальная точка: для первого розыгрыша — центр, для остальных — предыдущая точка
          const x1 = i === 0 ? CENTER_X : pointX(rallies[i - 1]);
          const y1 = i === 0 ? HEADER_H + 10 - STEP : rallyY(i - 1);
          const x2 = pointX(r);
          const y2 = rallyY(i);
          const color = r.scorerId === player1.id ? C.navy : C.amberText;
          return (
            <path
              key={`seg-${r.index}`}
              d={cubicPath(x1, y1, x2, y2)}
              stroke={color}
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
            />
          );
        })}

        {/* ── Точки / Ромбы розыгрышей ── */}
        {rallies.map((r, i) => {
          const x = pointX(r);
          const y = rallyY(i);
          const color = r.scorerId === player1.id ? C.navy : C.amberText;
          const isActive = activeIdx === r.index;
          const showScore =
            showEveryScore && (i % scoreStep === 0 || i === rallies.length - 1);
          const isP1 = r.scorerId === player1.id;

          // Подпись решения судьи
          const decisionShort: Record<string, string> = {
            YES_LET: 'LET',
            STROKE: 'STR',
            NO_LET: 'NO',
          };

          return (
            <g
              key={`point-${r.index}`}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => handlePointEnter(e, r)}
              onMouseLeave={handlePointLeave}
            >
              {/* Ромб для решений судьи, круг для обычных */}
              {r.decision ? (
                <rect
                  x={x - 4.5}
                  y={y - 4.5}
                  width={9}
                  height={9}
                  transform={`rotate(45, ${x}, ${y})`}
                  fill={color}
                  stroke={C.white}
                  strokeWidth={1.5}
                />
              ) : (
                <circle
                  cx={x}
                  cy={y}
                  r={isActive ? 5.5 : 4}
                  fill={color}
                  stroke={C.white}
                  strokeWidth={1.5}
                />
              )}

              {/* Подпись счёта сбоку */}
              {showScore && (
                <text
                  x={isP1 ? PAD_L - 4 : SVG_W - PAD_R + 4}
                  y={y + 3.5}
                  textAnchor={isP1 ? 'end' : 'start'}
                  fontSize={8}
                  fill={color}
                  fontFamily="monospace"
                  style={{ fontVariantNumeric: 'tabular-nums' } as React.CSSProperties}
                >
                  {isP1 ? r.p1Score : r.p2Score}
                </text>
              )}

              {/* Метка решения судьи */}
              {r.decision && (
                <text
                  x={isP1 ? P1_X - 14 : P2_X + 14}
                  y={y + 3}
                  textAnchor={isP1 ? 'end' : 'start'}
                  fontSize={7}
                  fill={C.slate400}
                  fontFamily="monospace"
                >
                  {decisionShort[r.decision]}
                </text>
              )}
            </g>
          );
        })}

        {/* ── Итоговый счёт внизу ── */}
        {rallies.length > 0 && (() => {
          const last = rallies[rallies.length - 1];
          const p1Final = last.p1Score;
          const p2Final = last.p2Score;
          const p1Wins = p1Final > p2Final;
          const p2Wins = p2Final > p1Final;
          const footerY = HEADER_H + BODY_H + 12;
          return (
            <g>
              <text
                x={P1_X}
                y={footerY}
                textAnchor="middle"
                fontSize={p1Wins ? 16 : 12}
                fontWeight={p1Wins ? 800 : 400}
                fill={p1Wins ? C.navy : C.slate400}
                fontFamily="monospace"
                style={{ fontVariantNumeric: 'tabular-nums' } as React.CSSProperties}
              >
                {p1Final}
              </text>
              <text
                x={CENTER_X}
                y={footerY}
                textAnchor="middle"
                fontSize={9}
                fill={C.slate400}
                fontFamily="system-ui, sans-serif"
              >
                —
              </text>
              <text
                x={P2_X}
                y={footerY}
                textAnchor="middle"
                fontSize={p2Wins ? 16 : 12}
                fontWeight={p2Wins ? 800 : 400}
                fill={p2Wins ? C.amberText : C.slate400}
                fontFamily="monospace"
                style={{ fontVariantNumeric: 'tabular-nums' } as React.CSSProperties}
              >
                {p2Final}
              </text>
            </g>
          );
        })()}
      </svg>

      {/* Тултип поверх SVG */}
      {tooltipData && <Tooltip data={tooltipData} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ: РЕЖИМ MOMENTUM
// ─────────────────────────────────────────────────────────────────────────────

function MomentumChart({
  player1,
  player2,
  rallies,
}: {
  player1: RallyChartPlayer;
  player2: RallyChartPlayer;
  rallies: RallyEvent[];
}) {
  const [activeIdx, setActiveIdx] = React.useState<number | null>(null);
  const [tooltipData, setTooltipData] = React.useState<TooltipData | null>(null);
  const svgRef = React.useRef<SVGSVGElement>(null);

  const SVG_W = 320;
  const HEADER_H = 28;
  const FOOTER_H = 24;
  const STEP = 16;
  const BODY_H = Math.max(rallies.length * STEP + 20, 60);
  const SVG_H = HEADER_H + BODY_H + FOOTER_H;

  const PAD_L = 40;
  const PAD_R = 40;
  const CHART_W = SVG_W - PAD_L - PAD_R;
  const CENTER_X = PAD_L + CHART_W / 2;

  // Максимальная разница — для масштаба
  const diffs = rallies.map((r) => r.p1Score - r.p2Score);
  const maxDiff = Math.max(6, ...diffs.map(Math.abs));

  // Масштабирование разницы в пиксели
  const diffToX = (diff: number) =>
    CENTER_X + (diff / maxDiff) * (CHART_W / 2 - 4);

  const rallyY = (i: number) => HEADER_H + 10 + i * STEP;

  // Сетка: -6, -4, -2, 0, +2, +4, +6
  const gridLines = [-6, -4, -2, 0, 2, 4, 6].filter(
    (v) => Math.abs(v) <= maxDiff
  );

  // Поиск пиков разницы
  let maxP1Diff = 0;
  let maxP1DiffIdx = -1;
  let maxP2Diff = 0;
  let maxP2DiffIdx = -1;
  diffs.forEach((d, i) => {
    if (d > maxP1Diff) { maxP1Diff = d; maxP1DiffIdx = i; }
    if (-d > maxP2Diff) { maxP2Diff = -d; maxP2DiffIdx = i; }
  });

  // Строим area-пути
  const buildAreaPath = (side: 'p1' | 'p2') => {
    if (rallies.length === 0) return '';
    const points: string[] = [];
    points.push(`M ${CENTER_X} ${HEADER_H + 10 - STEP}`);
    rallies.forEach((r, i) => {
      const diff = r.p1Score - r.p2Score;
      const clippedDiff =
        side === 'p1' ? Math.max(0, diff) : Math.max(0, -diff);
      const x = side === 'p1'
        ? CENTER_X + (clippedDiff / maxDiff) * (CHART_W / 2 - 4)
        : CENTER_X - (clippedDiff / maxDiff) * (CHART_W / 2 - 4);
      points.push(`L ${x} ${rallyY(i)}`);
    });
    points.push(`L ${CENTER_X} ${rallyY(rallies.length - 1)}`);
    points.push('Z');
    return points.join(' ');
  };

  const handlePointEnter = (
    _e: React.MouseEvent<SVGElement>,
    rally: RallyEvent
  ) => {
    const svgEl = svgRef.current;
    if (!svgEl) return;
    const rect = svgEl.getBoundingClientRect();
    const diff = rally.p1Score - rally.p2Score;
    const px = diffToX(diff) / SVG_W * rect.width;
    const py = rallyY(rally.index - 1) / SVG_H * rect.height;
    setActiveIdx(rally.index);
    setTooltipData({
      x: px,
      y: py,
      rally,
      playerName: rally.scorerId === player1.id ? player1.name : player2.name,
    });
  };

  return (
    <div style={{ position: 'relative' }}>
      <svg
        ref={svgRef}
        viewBox={`0 0 ${SVG_W} ${SVG_H}`}
        className="w-full h-auto"
        style={{ display: 'block' }}
      >
        {/* ── Area-заливки зон ── */}
        <path d={buildAreaPath('p1')} fill={C.navy} fillOpacity={0.08} />
        <path d={buildAreaPath('p2')} fill={C.amber} fillOpacity={0.08} />

        {/* ── Вертикальные линии сетки ── */}
        {gridLines.map((v) => {
          const x = CENTER_X + (v / maxDiff) * (CHART_W / 2 - 4);
          return (
            <g key={`grid-${v}`}>
              <line
                x1={x}
                y1={HEADER_H}
                x2={x}
                y2={HEADER_H + BODY_H - 10}
                stroke={C.slate200}
                strokeWidth={v === 0 ? 1 : 0.5}
              />
              <text
                x={x}
                y={HEADER_H - 4}
                textAnchor="middle"
                fontSize={7}
                fill={C.slate400}
                fontFamily="monospace"
              >
                {v > 0 ? `+${v}` : v}
              </text>
            </g>
          );
        })}

        {/* ── Подписи игроков сверху ── */}
        <text x={PAD_L + 4} y={HEADER_H - 8} fontSize={8} fontWeight={700} fill={C.navy} fontFamily="system-ui, sans-serif">
          {abbreviateName(player1.name, 10)} &lt;
        </text>
        <text x={SVG_W - PAD_R - 4} y={HEADER_H - 8} fontSize={8} fontWeight={700} fill={C.amberText} textAnchor="end" fontFamily="system-ui, sans-serif">
          &gt; {abbreviateName(player2.name, 10)}
        </text>

        {/* ── Кривая momentum ── */}
        {rallies.map((r, i) => {
          const diff = r.p1Score - r.p2Score;
          const x1 = i === 0 ? CENTER_X : diffToX(rallies[i - 1].p1Score - rallies[i - 1].p2Score);
          const y1 = i === 0 ? HEADER_H + 10 - STEP : rallyY(i - 1);
          const x2 = diffToX(diff);
          const y2 = rallyY(i);
          const color = r.scorerId === player1.id ? C.navy : C.amberText;
          return (
            <path
              key={`mseg-${r.index}`}
              d={cubicPath(x1, y1, x2, y2)}
              stroke={color}
              strokeWidth={1.8}
              fill="none"
              strokeLinecap="round"
            />
          );
        })}

        {/* ── Точки ── */}
        {rallies.map((r, i) => {
          const diff = r.p1Score - r.p2Score;
          const x = diffToX(diff);
          const y = rallyY(i);
          const color = r.scorerId === player1.id ? C.navy : C.amberText;
          const isActive = activeIdx === r.index;
          return (
            <circle
              key={`mpt-${r.index}`}
              cx={x}
              cy={y}
              r={isActive ? 5 : 3.5}
              fill={color}
              stroke={C.white}
              strokeWidth={1.5}
              style={{ cursor: 'pointer' }}
              onMouseEnter={(e) => handlePointEnter(e, r)}
              onMouseLeave={() => { setActiveIdx(null); setTooltipData(null); }}
            />
          );
        })}

        {/* ── Бейдж пика p1 ── */}
        {maxP1DiffIdx >= 0 && maxP1Diff > 0 && (
          <g>
            <rect
              x={diffToX(maxP1Diff) + 6}
              y={rallyY(maxP1DiffIdx) - 9}
              width={22}
              height={13}
              rx={4}
              fill={C.navy}
              fillOpacity={0.15}
            />
            <text
              x={diffToX(maxP1Diff) + 17}
              y={rallyY(maxP1DiffIdx) + 1}
              textAnchor="middle"
              fontSize={8}
              fontWeight={700}
              fill={C.navy}
              fontFamily="monospace"
            >
              +{maxP1Diff}
            </text>
          </g>
        )}

        {/* ── Бейдж пика p2 ── */}
        {maxP2DiffIdx >= 0 && maxP2Diff > 0 && (
          <g>
            <rect
              x={diffToX(-maxP2Diff) - 28}
              y={rallyY(maxP2DiffIdx) - 9}
              width={22}
              height={13}
              rx={4}
              fill={C.amber}
              fillOpacity={0.2}
            />
            <text
              x={diffToX(-maxP2Diff) - 17}
              y={rallyY(maxP2DiffIdx) + 1}
              textAnchor="middle"
              fontSize={8}
              fontWeight={700}
              fill={C.amberText}
              fontFamily="monospace"
            >
              +{maxP2Diff}
            </text>
          </g>
        )}
      </svg>

      {tooltipData && <Tooltip data={tooltipData} />}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// ГЛАВНЫЙ КОМПОНЕНТ: RallyProgressionChart
// ─────────────────────────────────────────────────────────────────────────────

export function RallyProgressionChart({
  player1,
  player2,
  rallies,
  gameNumber,
  mode = 'ladder',
  targetScore = 11,
  className = '',
}: RallyProgressionChartProps) {
  // Пустое состояние
  if (!rallies || rallies.length === 0) {
    return (
      <div
        className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}
        style={{ minHeight: 80 }}
      >
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: 80,
            color: C.slate400,
            fontSize: 13,
            fontFamily: 'system-ui, sans-serif',
          }}
        >
          Нет данных о розыгрышах
        </div>
      </div>
    );
  }

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white p-4 ${className}`}
    >
      {gameNumber !== undefined && (
        <div
          style={{
            fontSize: 9,
            fontWeight: 700,
            color: C.slate400,
            letterSpacing: 1.5,
            fontFamily: 'system-ui, sans-serif',
            marginBottom: 6,
          }}
        >
          GAME {gameNumber}
        </div>
      )}

      {mode === 'ladder' ? (
        <LadderChart
          player1={player1}
          player2={player2}
          rallies={rallies}
          targetScore={targetScore}
        />
      ) : (
        <MomentumChart
          player1={player1}
          player2={player2}
          rallies={rallies}
        />
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ 2: RallyChartLegend
// ─────────────────────────────────────────────────────────────────────────────

export function RallyChartLegend({
  player1Name,
  player2Name,
}: {
  player1Name: string;
  player2Name: string;
}) {
  const itemStyle: React.CSSProperties = {
    display: 'flex',
    alignItems: 'center',
    gap: 5,
    fontSize: 10,
    color: '#64748b', // slate-500
    fontFamily: 'system-ui, sans-serif',
    whiteSpace: 'nowrap',
  };

  return (
    <div
      style={{
        display: 'flex',
        flexWrap: 'wrap',
        gap: '6px 14px',
        marginTop: 8,
        paddingLeft: 2,
      }}
    >
      {/* P1 */}
      <div style={itemStyle}>
        <svg width={10} height={10} style={{ flexShrink: 0 }}>
          <circle cx={5} cy={5} r={4} fill={C.navy} stroke={C.white} strokeWidth={1} />
        </svg>
        <span>{abbreviateName(player1Name, 14)}</span>
      </div>

      {/* P2 */}
      <div style={itemStyle}>
        <svg width={10} height={10} style={{ flexShrink: 0 }}>
          <circle cx={5} cy={5} r={4} fill={C.amberText} stroke={C.white} strokeWidth={1} />
        </svg>
        <span>{abbreviateName(player2Name, 14)}</span>
      </div>

      {/* Смена подачи */}
      <div style={itemStyle}>
        <svg width={18} height={10} style={{ flexShrink: 0 }}>
          <line
            x1={1} y1={5} x2={17} y2={5}
            stroke={C.slate400}
            strokeWidth={1}
            strokeDasharray="2 2"
          />
        </svg>
        <span>смена подачи</span>
      </div>

      {/* Решение судьи */}
      <div style={itemStyle}>
        <svg width={10} height={10} style={{ flexShrink: 0 }}>
          <rect
            x={1} y={1} width={8} height={8}
            transform="rotate(45, 5, 5)"
            fill={C.slate400}
            stroke={C.white}
            strokeWidth={1}
          />
        </svg>
        <span>решение судьи</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// КОМПОНЕНТ 3: GameSelectorTabs
// ─────────────────────────────────────────────────────────────────────────────

const scrollbarHideStyle = `
  .scrollbar-hide::-webkit-scrollbar { display: none; }
  .scrollbar-hide { -ms-overflow-style: none; scrollbar-width: none; }
`;

export function GameSelectorTabs({
  games,
  activeGame,
  onSelect,
}: {
  games: number[];
  activeGame: number;
  onSelect: (n: number) => void;
}) {
  const ALL_GAME = 0; // 0 = весь матч

  const chipStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    minWidth: 64,
    height: 30,
    borderRadius: 8,
    border: isActive ? 'none' : `1px solid ${C.slate200}`,
    background: isActive ? C.navy : C.white,
    color: isActive ? C.white : '#475569', // slate-600
    fontSize: 11,
    fontWeight: isActive ? 700 : 500,
    fontFamily: 'system-ui, sans-serif',
    cursor: 'pointer',
    padding: '0 12px',
    whiteSpace: 'nowrap',
    flexShrink: 0,
    transition: 'background 0.15s, color 0.15s',
    userSelect: 'none',
  });

  return (
    <>
      <style>{scrollbarHideStyle}</style>
      <div
        className="scrollbar-hide"
        style={{
          display: 'flex',
          gap: 6,
          overflowX: 'auto',
          paddingBottom: 2,
        }}
      >
        <button
          style={chipStyle(activeGame === ALL_GAME)}
          onClick={() => onSelect(ALL_GAME)}
        >
          Весь матч
        </button>
        {games.map((g) => (
          <button
            key={g}
            style={chipStyle(activeGame === g)}
            onClick={() => onSelect(g)}
          >
            Гейм {g}
          </button>
        ))}
      </div>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// МОК ДАННЫХ — реалистичный гейм до 11 с тай-брейком (итог 13–11)
// ─────────────────────────────────────────────────────────────────────────────

const MOCK_P1: RallyChartPlayer = { id: 'p1', name: 'Alinta Watson', countryFlag: 'AU' };
const MOCK_P2: RallyChartPlayer = { id: 'p2', name: 'Nirupama Sanjeev', countryFlag: 'IN' };

// Генерация последовательности розыгрышей вручную:
// p1 - Watson, p2 - Sanjeev
// Финальный счёт: Watson 13 : Sanjeev 11 (тай-брейк)
const MOCK_RALLIES: RallyEvent[] = [
  // Начало: p2 уходит вперёд
  { index: 1,  scorerId: 'p2', p1Score: 0, p2Score: 1,  isHandout: false },
  { index: 2,  scorerId: 'p2', p1Score: 0, p2Score: 2,  isHandout: false },
  { index: 3,  scorerId: 'p1', p1Score: 1, p2Score: 2,  isHandout: true  },
  { index: 4,  scorerId: 'p1', p1Score: 2, p2Score: 2,  isHandout: false },
  { index: 5,  scorerId: 'p1', p1Score: 3, p2Score: 2,  isHandout: false },
  // p2 отыгрывается
  { index: 6,  scorerId: 'p2', p1Score: 3, p2Score: 3,  isHandout: true  },
  { index: 7,  scorerId: 'p2', p1Score: 3, p2Score: 4,  isHandout: false },
  { index: 8,  scorerId: 'p2', p1Score: 3, p2Score: 5,  isHandout: false, decision: 'YES_LET' },
  // p1 серия
  { index: 9,  scorerId: 'p1', p1Score: 4, p2Score: 5,  isHandout: true  },
  { index: 10, scorerId: 'p1', p1Score: 5, p2Score: 5,  isHandout: false },
  { index: 11, scorerId: 'p1', p1Score: 6, p2Score: 5,  isHandout: false },
  { index: 12, scorerId: 'p1', p1Score: 7, p2Score: 5,  isHandout: false },
  // p2 возвращается
  { index: 13, scorerId: 'p2', p1Score: 7, p2Score: 6,  isHandout: true  },
  { index: 14, scorerId: 'p2', p1Score: 7, p2Score: 7,  isHandout: false },
  { index: 15, scorerId: 'p1', p1Score: 8, p2Score: 7,  isHandout: true  },
  { index: 16, scorerId: 'p2', p1Score: 8, p2Score: 8,  isHandout: true  },
  // Оба идут к game ball
  { index: 17, scorerId: 'p1', p1Score: 9,  p2Score: 8,  isHandout: true  },
  { index: 18, scorerId: 'p2', p1Score: 9,  p2Score: 9,  isHandout: true  },
  { index: 19, scorerId: 'p1', p1Score: 10, p2Score: 9,  isHandout: false },
  // Game ball Watson — но Sanjeev отыгрывает
  { index: 20, scorerId: 'p2', p1Score: 10, p2Score: 10, isHandout: true, decision: 'STROKE' },
  // Тай-брейк: оба 10
  { index: 21, scorerId: 'p1', p1Score: 11, p2Score: 10, isHandout: true  },
  { index: 22, scorerId: 'p2', p1Score: 11, p2Score: 11, isHandout: true  },
  { index: 23, scorerId: 'p1', p1Score: 12, p2Score: 11, isHandout: true  },
  { index: 24, scorerId: 'p1', p1Score: 13, p2Score: 11, isHandout: false },
];

const MOCK_GAMES = [1, 2, 3];

// ─────────────────────────────────────────────────────────────────────────────
// DEFAULT EXPORT — ДЕМО СТРАНИЦА
// ─────────────────────────────────────────────────────────────────────────────

export default function App() {
  const [activeGame, setActiveGame] = React.useState<number>(1);
  const [chartMode, setChartMode] = React.useState<'ladder' | 'momentum'>('ladder');

  const modeBtnStyle = (isActive: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    height: 28,
    borderRadius: 7,
    border: isActive ? 'none' : `1px solid ${C.slate200}`,
    background: isActive ? C.amberText : C.white,
    color: isActive ? C.white : '#475569',
    fontSize: 10,
    fontWeight: isActive ? 700 : 500,
    fontFamily: 'system-ui, sans-serif',
    cursor: 'pointer',
    padding: '0 14px',
    letterSpacing: 0.5,
    transition: 'all 0.15s',
    userSelect: 'none',
  });

  return (
    <div
      style={{
        minHeight: '100vh',
        background: '#f8fafc', // slate-50
        display: 'flex',
        justifyContent: 'center',
        padding: '24px 16px 48px',
      }}
    >
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Заголовок демо */}
        <div style={{ marginBottom: 20 }}>
          <div
            style={{
              fontSize: 10,
              fontWeight: 700,
              color: C.slate400,
              letterSpacing: 2,
              fontFamily: 'system-ui, sans-serif',
              marginBottom: 4,
            }}
          >
            LETTY SQUASH
          </div>
          <div
            style={{
              fontSize: 18,
              fontWeight: 800,
              color: C.dark,
              fontFamily: 'system-ui, sans-serif',
            }}
          >
            Rally Progression
          </div>
          <div
            style={{
              fontSize: 12,
              color: C.slate400,
              fontFamily: 'system-ui, sans-serif',
              marginTop: 2,
            }}
          >
            {MOCK_P1.name} vs {MOCK_P2.name}
          </div>
        </div>

        {/* Переключатель геймов */}
        <div style={{ marginBottom: 12 }}>
          <GameSelectorTabs
            games={MOCK_GAMES}
            activeGame={activeGame}
            onSelect={setActiveGame}
          />
        </div>

        {/* Переключатель режима */}
        <div
          style={{
            display: 'flex',
            gap: 6,
            marginBottom: 12,
            alignItems: 'center',
          }}
        >
          <span
            style={{
              fontSize: 10,
              color: C.slate400,
              fontFamily: 'system-ui, sans-serif',
              marginRight: 4,
              letterSpacing: 0.5,
            }}
          >
            Режим:
          </span>
          <button
            style={modeBtnStyle(chartMode === 'ladder')}
            onClick={() => setChartMode('ladder')}
          >
            Ladder
          </button>
          <button
            style={modeBtnStyle(chartMode === 'momentum')}
            onClick={() => setChartMode('momentum')}
          >
            Momentum
          </button>
        </div>

        {/* Основной график */}
        <RallyProgressionChart
          player1={MOCK_P1}
          player2={MOCK_P2}
          rallies={activeGame === 0 ? MOCK_RALLIES : MOCK_RALLIES}
          gameNumber={activeGame === 0 ? undefined : activeGame}
          mode={chartMode}
          targetScore={11}
        />

        {/* Легенда */}
        <RallyChartLegend
          player1Name={MOCK_P1.name}
          player2Name={MOCK_P2.name}
        />

        {/* Подвал-подсказка */}
        <div
          style={{
            marginTop: 20,
            padding: '10px 14px',
            borderRadius: 12,
            border: `1px solid ${C.slate200}`,
            background: C.white,
            fontSize: 10,
            color: C.slate400,
            fontFamily: 'system-ui, sans-serif',
            lineHeight: 1.6,
          }}
        >
          <strong style={{ color: C.dark }}>Подсказка:</strong> наведите курсор на точку розыгрыша,
          чтобы увидеть подробный счёт. Ромбы = решения судьи. Пунктирные линии = смена подачи.
          Amber-зона = тай-брейк.
        </div>
      </div>
    </div>
  );
}
