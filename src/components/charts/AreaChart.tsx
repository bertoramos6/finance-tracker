import { useRef, useState, useEffect } from 'react';

interface Series {
  label: string;
  color: string;
  data: number[];
}

interface Props {
  series: Series[];
  labels: string[];
  height?: number;
}

function smoothD(pts: [number, number][]): string {
  if (!pts.length) return '';
  let d = `M${pts[0][0]} ${pts[0][1]}`;
  for (let i = 1; i < pts.length; i++) {
    const cpx = (pts[i - 1][0] + pts[i][0]) / 2;
    d += ` C${cpx} ${pts[i - 1][1]} ${cpx} ${pts[i][1]} ${pts[i][0]} ${pts[i][1]}`;
  }
  return d;
}

function fmt(v: number): string {
  return v >= 1000 || v <= -1000
    ? `€${(v / 1000).toFixed(1)}k`
    : `€${Math.round(Math.abs(v))}${v < 0 ? '' : ''}`;
}

export default function AreaChart({ series, labels, height = 160 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(400);
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const pad = { t: 10, r: 8, b: 28, l: 52 };
  const W = Math.max(width - pad.l - pad.r, 10);
  const H = height - pad.t - pad.b;

  const allVals = series.flatMap(s => s.data).filter(v => v != null && !isNaN(v));
  const minV = Math.min(0, ...allVals);
  const maxV = Math.max(...allVals, 1);
  const range = maxV - minV || 1;
  const n = labels.length;

  const sx = (i: number) => (i / Math.max(n - 1, 1)) * W;
  const sy = (v: number) => H - ((v - minV) / range) * H;
  const pts = (data: number[]): [number, number][] => data.map((v, i) => [sx(i), sy(v)]);
  const areaD = (data: number[]) => {
    const p = pts(data);
    return `${smoothD(p)} L${p[p.length - 1][0]} ${sy(minV)} L${p[0][0]} ${sy(minV)} Z`;
  };

  const ticks = Array.from({ length: 5 }, (_, i) => minV + (range * i) / 4);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const svgRect = e.currentTarget.getBoundingClientRect();
    const x = e.clientX - svgRect.left - pad.l;
    if (x < 0 || x > W || n < 2) { setHovIdx(null); return; }
    const idx = Math.round((x / W) * (n - 1));
    setHovIdx(Math.max(0, Math.min(n - 1, idx)));
  };

  const hx = hovIdx !== null ? sx(hovIdx) : null;

  // Tooltip: figure out if it should flip to the left side
  const tooltipOnLeft = hovIdx !== null && hovIdx > n / 2;

  return (
    <div ref={ref} style={{ width: '100%', position: 'relative' }}>
      <svg
        width={width} height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => setHovIdx(null)}
        style={{ display: 'block' }}
      >
        <g transform={`translate(${pad.l},${pad.t})`}>
          {ticks.map((v, i) => (
            <g key={i}>
              <line x1={0} y1={sy(v)} x2={W} y2={sy(v)} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="3,4" />
              <text x={-8} y={sy(v) + 4} fontSize={10} fill="var(--text2)" textAnchor="end" fontFamily="Nunito,sans-serif">
                {v >= 1000 ? `€${(v / 1000).toFixed(1)}k` : `€${Math.round(v)}`}
              </text>
            </g>
          ))}
          {minV < 0 && <line x1={0} y1={sy(0)} x2={W} y2={sy(0)} stroke="var(--border)" strokeWidth={1} />}
          {series.map((s, i) => <path key={`a${i}`} d={areaD(s.data)} fill={s.color} fillOpacity={0.09} />)}
          {series.map((s, i) => <path key={`l${i}`} d={smoothD(pts(s.data))} fill="none" stroke={s.color} strokeWidth={2.2} strokeLinecap="round" strokeLinejoin="round" />)}

          {/* Hover crosshair */}
          {hx !== null && (
            <line x1={hx} y1={0} x2={hx} y2={H} stroke="var(--text2)" strokeWidth={1} strokeDasharray="3,3" opacity={0.4} />
          )}

          {/* Hover dots */}
          {hovIdx !== null && series.map((s, i) => {
            const v = s.data[hovIdx];
            if (v == null || isNaN(v)) return null;
            return (
              <circle
                key={i}
                cx={sx(hovIdx)} cy={sy(v)} r={4}
                fill={s.color} stroke="var(--card)" strokeWidth={2}
              />
            );
          })}

          {labels.map((l, i) => (
            <text key={i} x={sx(i)} y={H + 20} fontSize={10} textAnchor="middle"
              fill={hovIdx === i ? 'var(--text)' : 'var(--text2)'}
              fontWeight={hovIdx === i ? 700 : 400}
              fontFamily="Nunito,sans-serif">
              {l}
            </text>
          ))}
        </g>
      </svg>

      {/* Tooltip */}
      {hovIdx !== null && hx !== null && (
        <div style={{
          position: 'absolute',
          top: pad.t,
          left: tooltipOnLeft
            ? pad.l + hx - 8 - 148
            : pad.l + hx + 10,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: 9,
          padding: '9px 12px',
          pointerEvents: 'none',
          boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          minWidth: 140,
          zIndex: 10,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {labels[hovIdx] || `#${hovIdx + 1}`}
          </div>
          {series.map((s, i) => {
            const v = s.data[hovIdx];
            if (v == null || isNaN(v)) return null;
            return (
              <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
                <div style={{ width: 8, height: 8, borderRadius: '50%', background: s.color, flexShrink: 0 }} />
                <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1 }}>{s.label}</span>
                <span style={{ fontSize: 13, fontWeight: 800, color: v < 0 ? 'var(--red)' : 'var(--text)' }}>
                  {v < 0 ? '-' : ''}{fmt(Math.abs(v))}
                </span>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
