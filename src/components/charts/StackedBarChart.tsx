import { useRef, useState, useEffect } from 'react';
import { fmtEur } from '../../utils';

interface Series {
  label: string;
  color: string;
  data: number[];
}

interface Props {
  series: Series[];
  labels: string[];
  tooltipLabels: string[];
  height?: number;
}

const axisFmt = (v: number) => v >= 1000 ? `€${(v / 1000).toFixed(1)}k` : `€${Math.round(v)}`;

export default function StackedBarChart({ series, labels, tooltipLabels, height = 220 }: Props) {
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
  const n = labels.length;

  const totals = labels.map((_, i) => series.reduce((s, ser) => s + ser.data[i], 0));
  const maxV = Math.max(...totals, 1);
  const slot = W / Math.max(n, 1);
  const barW = Math.min(slot * 0.65, 48);
  const sy = (v: number) => H - (v / maxV) * H;
  const ticks = Array.from({ length: 5 }, (_, i) => (maxV * i) / 4);

  const tooltipOnLeft = hovIdx !== null && hovIdx > n / 2;
  const hovRows = hovIdx === null ? [] : series
    .map(s => ({ label: s.label, color: s.color, v: s.data[hovIdx] }))
    .filter(r => r.v > 0)
    .sort((a, b) => b.v - a.v);

  return (
    <div ref={ref} style={{ width: '100%', position: 'relative' }}>
      <svg width={width} height={height} onMouseLeave={() => setHovIdx(null)} style={{ display: 'block' }}>
        <g transform={`translate(${pad.l},${pad.t})`}>
          {ticks.map((v, i) => (
            <g key={i}>
              <line x1={0} y1={sy(v)} x2={W} y2={sy(v)} stroke="var(--border)" strokeWidth={0.8} strokeDasharray="3,4" />
              <text x={-8} y={sy(v) + 4} fontSize={10} fill="var(--text2)" textAnchor="end" fontFamily="Nunito,sans-serif">{axisFmt(v)}</text>
            </g>
          ))}
          {labels.map((l, i) => {
            const x = slot * i + (slot - barW) / 2;
            let acc = 0;
            return (
              <g key={i} onMouseEnter={() => setHovIdx(i)}>
                <rect x={slot * i} y={0} width={slot} height={H} fill={hovIdx === i ? 'var(--hover)' : 'transparent'} />
                {series.map(s => {
                  const v = s.data[i];
                  if (v <= 0) return null;
                  const y = sy(acc + v);
                  const h = sy(acc) - y;
                  acc += v;
                  return <rect key={s.label} x={x} y={y} width={barW} height={Math.max(h, 0)} fill={s.color} opacity={hovIdx === null || hovIdx === i ? 1 : 0.5} />;
                })}
                <text x={slot * i + slot / 2} y={H + 20} fontSize={10} textAnchor="middle"
                  fill={hovIdx === i ? 'var(--text)' : 'var(--text2)'} fontWeight={hovIdx === i ? 700 : 400}
                  fontFamily="Nunito,sans-serif">{l}</text>
              </g>
            );
          })}
        </g>
      </svg>

      {hovIdx !== null && (
        <div style={{
          position: 'absolute', top: pad.t,
          left: tooltipOnLeft ? pad.l + slot * hovIdx - 8 - 220 : pad.l + slot * (hovIdx + 1) + 8,
          background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: 9,
          padding: '9px 12px', pointerEvents: 'none', boxShadow: '0 8px 24px rgba(0,0,0,0.3)',
          width: 220, boxSizing: 'border-box', zIndex: 10,
        }}>
          <div style={{ fontSize: 11, fontWeight: 700, color: 'var(--text2)', marginBottom: 7, letterSpacing: '0.05em', textTransform: 'uppercase' }}>
            {tooltipLabels[hovIdx]}
          </div>
          {hovRows.map(r => (
            <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 7, marginBottom: 4 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: r.color, flexShrink: 0 }} />
              <span style={{ fontSize: 12, color: 'var(--text2)', flex: 1, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.label}</span>
              <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text)' }}>{fmtEur(r.v)}</span>
            </div>
          ))}
          <div style={{ display: 'flex', justifyContent: 'space-between', borderTop: '1px solid var(--border)', paddingTop: 6, marginTop: 4 }}>
            <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--text2)' }}>Total</span>
            <span style={{ fontSize: 13, fontWeight: 800, color: 'var(--text)' }}>{fmtEur(totals[hovIdx])}</span>
          </div>
        </div>
      )}
    </div>
  );
}
