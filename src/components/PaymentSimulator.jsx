import { useState, useMemo } from 'react'

function formatKRW(v) {
  if (!v || isNaN(v)) return '-'
  return '₩' + Math.round(v).toLocaleString('ko-KR')
}

function toEok(amountInMillion) {
  const v = amountInMillion / 100
  return v % 1 === 0 ? `${v}억` : `${v.toFixed(1)}억`
}

function calcMonthly(principal, annualRate, years) {
  if (!principal || !annualRate || !years) return 0
  const r = annualRate / 100 / 12
  const n = years * 12
  return principal * r * Math.pow(1 + r, n) / (Math.pow(1 + r, n) - 1)
}

export default function PaymentSimulator() {
  const [amount, setAmount] = useState(300)
  const [rate, setRate]     = useState(4.5)
  const [years, setYears]   = useState(30)

  const principal = amount * 1_000_000
  const monthly   = useMemo(() => Math.round(calcMonthly(principal, rate, years)), [principal, rate, years])
  const total     = monthly * years * 12
  const interest  = total - principal

  return (
    <div style={S.card}>
      <div style={S.header}>
        <div style={S.title}>📊 상환액 시뮬레이터</div>
        <div style={S.sub}>슬라이더로 빠르게 계산</div>
      </div>

      <div style={S.field}>
        <div style={S.row}>
          <span style={S.label}>대출금액</span>
          <span style={S.val}>{toEok(amount)}</span>
        </div>
        <input type="range" min={50} max={1000} step={10} value={amount}
          onChange={e => setAmount(+e.target.value)} style={S.slider} />
        <div style={S.rangeRow}><span>5천만</span><span>10억</span></div>
      </div>

      <div style={S.field}>
        <div style={S.row}>
          <span style={S.label}>금리</span>
          <span style={S.val}>{rate.toFixed(1)}%</span>
        </div>
        <input type="range" min={1} max={10} step={0.1} value={rate}
          onChange={e => setRate(+e.target.value)} style={S.slider} />
        <div style={S.rangeRow}><span>1%</span><span>10%</span></div>
      </div>

      <div style={{ marginBottom: 16 }}>
        <span style={S.label}>기간</span>
        <div style={S.yearRow}>
          {[10, 15, 20, 30].map(y => (
            <button key={y} onClick={() => setYears(y)}
              style={{ ...S.yBtn, ...(years === y ? S.yBtnOn : {}) }}>{y}년</button>
          ))}
        </div>
      </div>

      <div style={S.result}>
        <div style={S.rLabel}>월 상환액 (원리금균등)</div>
        <div style={S.rValue}>{formatKRW(monthly)}</div>
        <div style={S.rDivider} />
        <div style={S.rSub}><span>총 상환액</span><span>{formatKRW(total)}</span></div>
        <div style={S.rSub}><span>총 이자</span><span style={{ color: '#fca5a5' }}>{formatKRW(interest)}</span></div>
      </div>
    </div>
  )
}

const S = {
  card: {
    width: '100%', boxSizing: 'border-box',
    background: '#fff', borderRadius: 20,
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
    padding: '20px 16px',
  },
  header: { paddingBottom: 12, borderBottom: '2px solid #f1f5f9', marginBottom: 14 },
  title:  { fontSize: 14, fontWeight: 700, color: '#1a202c', marginBottom: 2 },
  sub:    { fontSize: 11, color: '#94a3b8' },
  field:  { marginBottom: 14 },
  row:    { display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 4 },
  label:  { fontSize: 11, fontWeight: 600, color: '#64748b' },
  val:    { fontSize: 12, fontWeight: 700, color: '#1e40af' },
  slider: { width: '100%', accentColor: '#3b82f6', cursor: 'pointer', margin: '4px 0' },
  rangeRow: { display: 'flex', justifyContent: 'space-between', fontSize: 10, color: '#94a3b8' },
  yearRow: { display: 'flex', gap: 6, marginTop: 6 },
  yBtn:   { flex: 1, padding: '6px 0', fontSize: 12, fontWeight: 600, border: '1.5px solid #e2e8f0', borderRadius: 7, cursor: 'pointer', fontFamily: 'inherit', background: '#f8fafc', color: '#64748b' },
  yBtnOn: { borderColor: '#3b82f6', background: '#eff6ff', color: '#1d4ed8' },
  result: {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    borderRadius: 12, padding: '14px 16px',
  },
  rLabel:   { fontSize: 10, color: 'rgba(255,255,255,0.75)', marginBottom: 4 },
  rValue:   { fontSize: 22, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 10 },
  rDivider: { height: 1, background: 'rgba(255,255,255,0.2)', marginBottom: 8 },
  rSub:     { display: 'flex', justifyContent: 'space-between', fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 4 },
}
