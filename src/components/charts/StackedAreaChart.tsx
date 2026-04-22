import { useRef, useState, useEffect } from 'react';

interface Series {
  label: string;
  color: string;
  data: number[];
}

interface Props {
  series: Series[];
  labels: string[];
  tooltipLabels?: string[];
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

function fmtEurShort(v: number) {
  if (v >= 1000) return `€${(v / 1000).toFixed(1)}k`;
  return `€${Math.round(v)}`;
}

export default function StackedAreaChart({ series, labels, tooltipLabels, height = 220 }: Props) {
  const ref = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(500);
  const [hov, setHov] = useState<number | null>(null);
  const [hovIdx, setHovIdx] = useState<number | null>(null);

  useEffect(() => {
    if (!ref.current) return;
    const ro = new ResizeObserver(entries => setWidth(entries[0].contentRect.width));
    ro.observe(ref.current);
    return () => ro.disconnect();
  }, []);

  const pad = { t: 10, r: 8, b: 28, l: 56 };
  const W = Math.max(width - pad.l - pad.r, 10);
  const H = height - pad.t - pad.b;
  const n = labels.length;
  const sx = (i: number) => (i / Math.max(n - 1, 1)) * W;

  const running = new Array(n).fill(0);
  const layers = series.map(s => {
    const bottom = [...running];
    s.data.forEach((v, i) => { running[i] = (running[i] || 0) + (v || 0); });
    return { ...s, bottom, top: [...running] };
  });

  const maxV = Math.max(...running, 1);
  const sy = (v: number) => H - (v / maxV) * H;

  const bandPath = (bottom: number[], top: number[]) => {
    const tPts: [number, number][] = top.map((v, i) => [sx(i), sy(v)] as [number, number]);
    const bPts: [number, number][] = bottom.map((v, i) => [sx(i), sy(v)] as [number, number]).reverse();
    let d = smoothD(tPts);
    d += ` L${bPts[0][0]} ${bPts[0][1]}`;
    for (let i = 1; i < bPts.length; i++) {
      const cpx = (bPts[i - 1][0] + bPts[i][0]) / 2;
      d += ` C${cpx} ${bPts[i - 1][1]} ${cpx} ${bPts[i][1]} ${bPts[i][0]} ${bPts[i][1]}`;
    }
    return d + ' Z';
  };

  const ticks = Array.from({ length: 5 }, (_, i) => (maxV * i) / 4);

  const handleMouseMove = (e: React.MouseEvent<SVGSVGElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const mx = e.clientX - rect.left - pad.l;
    if (mx < 0 || mx > W || n < 2) { setHovIdx(null); return; }
    const idx = Math.round((mx / W) * (n - 1));
    setHovIdx(Math.max(0, Math.min(n - 1, idx)));
  };

  const tooltipWidth = 160;
  const tooltipX = hovIdx !== null
    ? sx(hovIdx) + pad.l + (sx(hovIdx) > W * 0.6 ? -(tooltipWidth + 12) : 12)
    : 0;

  return (
    <div ref={ref} style={{ width: '100%', position: 'relative' }}>
      <svg width={width} height={height}
        onMouseMove={handleMouseMove}
        onMouseLeave={() => { setHov(null); setHovIdx(null); }}>
        <g transform={`translate(${pad.l},${pad.t})`}>
          {ticks.map((v, i) => (
            <g key={i}>
              <line x1={0} y1={sy(v)} x2={W} y2={sy(v)} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="3,4" />
              <text x={-8} y={sy(v) + 4} fontSize={10} fill="var(--text2)" textAnchor="end" fontFamily="Nunito,sans-serif">
                {v >= 1000 ? `€${(v / 1000).toFixed(0)}k` : `€${Math.round(v)}`}
              </text>
            </g>
          ))}
          {layers.map((layer, i) => (
            <path
              key={i}
              d={bandPath(layer.bottom, layer.top)}
              fill={layer.color}
              opacity={hov !== null && hov !== i ? 0.45 : 0.88}
              style={{ cursor: 'pointer', transition: 'opacity 0.15s' }}
              onMouseEnter={() => setHov(i)}
            />
          ))}
          {layers.map((layer, i) => (
            <path
              key={`t${i}`}
              d={smoothD(layer.top.map((v, j) => [sx(j), sy(v)]))}
              fill="none" stroke="var(--bg)" strokeWidth={0.8} opacity={0.4}
            />
          ))}
          {labels.map((l, i) => (
            <text key={i} x={sx(i)} y={H + 20} fontSize={10} textAnchor="middle" fill="var(--text2)" fontFamily="Nunito,sans-serif">
              {l}
            </text>
          ))}
          {hovIdx !== null && (
            <line
              x1={sx(hovIdx)} y1={0} x2={sx(hovIdx)} y2={H}
              stroke="var(--text2)" strokeWidth={1} strokeDasharray="3,3" opacity={0.5}
              style={{ pointerEvents: 'none' }}
            />
          )}
          {hovIdx !== null && layers.map((layer, i) => {
            const midY = sy((layer.top[hovIdx] + layer.bottom[hovIdx]) / 2);
            return (
              <circle key={`dot${i}`}
                cx={sx(hovIdx)} cy={midY} r={4}
                fill={layer.color} stroke="var(--bg)" strokeWidth={1.5}
                style={{ pointerEvents: 'none' }}
              />
            );
          })}
        </g>
      </svg>

      {hovIdx !== null && (
        <div style={{
          position: 'absolute',
          top: pad.t + 4,
          left: tooltipX,
          background: 'var(--card)',
          border: '1px solid var(--border)',
          borderRadius: 8,
          padding: '8px 12px',
          pointerEvents: 'none',
          width: tooltipWidth,
          boxShadow: '0 4px 16px rgba(0,0,0,0.18)',
          zIndex: 10,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 6 }}>
            {tooltipLabels ? tooltipLabels[hovIdx] : labels[hovIdx]}
          </div>
          {[...layers].reverse().map((layer, ri) => {
            const origIdx = layers.length - 1 - ri;
            const val = series[origIdx].data[hovIdx] || 0;
            return (
              <div key={layer.label} style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 3 }}>
                <span style={{ display: 'inline-block', width: 7, height: 7, borderRadius: '50%', background: layer.color, flexShrink: 0 }} />
                <span style={{ fontSize: 11, color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{layer.label}</span>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)', whiteSpace: 'nowrap' }}>{fmtEurShort(val)}</span>
              </div>
            );
          })}
          <div style={{ borderTop: '1px solid var(--border)', marginTop: 5, paddingTop: 5, display: 'flex', justifyContent: 'space-between' }}>
            <span style={{ fontSize: 11, color: 'var(--text2)' }}>Total</span>
            <span style={{ fontSize: 12, fontWeight: 800, color: 'var(--text)' }}>{fmtEurShort(layers[layers.length - 1]?.top[hovIdx] || 0)}</span>
          </div>
        </div>
      )}
    </div>
  );
}
