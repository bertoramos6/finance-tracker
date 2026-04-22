import { fmtEur } from '../../utils';
import { useWindowSize } from '../../hooks/useWindowSize';

interface Props {
  label: string;
  value: number;
  color: string;
  sign: 1 | -1;
}

export default function StatCard({ label, value, color, sign }: Props) {
  const { isMobile } = useWindowSize();
  return (
    <div style={{ background: 'var(--card)', border: '1px solid var(--border)', borderRadius: 12, padding: isMobile ? '12px 14px' : 18, display: 'flex', flexDirection: 'column', gap: 5 }}>
      <span style={{ fontSize: 10, fontWeight: 700, color: 'var(--text2)', letterSpacing: '0.07em', textTransform: 'uppercase' }}>{label}</span>
      <span style={{ fontSize: isMobile ? 20 : 28, fontWeight: 800, color, letterSpacing: '-0.025em', lineHeight: 1 }}>
        {sign < 0 ? '-' : ''}{fmtEur(value)}
      </span>
    </div>
  );
}
