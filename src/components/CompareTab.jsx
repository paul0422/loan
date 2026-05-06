import { useState, useMemo } from 'react'
import { resolveCollateralValue } from '../services/priceService'
import { calcLoan } from '../lib/calcLoan'
import { calcDidimdol } from '../lib/calcDidimdol'
import { policyConfig } from '../config/policy'

function formatKRW(v) {
  if (!v || isNaN(v)) return '-'
  return '₩' + Math.round(v).toLocaleString('ko-KR')
}

function useMillionInput(initNum = 0) {
  const initRaw = initNum > 0 ? String(Math.round(initNum / 1_000_000)) : ''
  const [raw, setRaw] = useState(initRaw)
  const num = raw === '' ? 0 : Math.round((parseFloat(raw) || 0) * 1_000_000)
  const onChange = e => setRaw(e.target.value.replace(/[^0-9.]/g, ''))
  return [raw, onChange, num]
}

function Label({ text, required }) {
  return (
    <label style={S.label}>
      {text}{required && <span style={{ color: '#ef4444', marginLeft: 3 }}>*</span>}
    </label>
  )
}

function SectionHeader({ title }) {
  return <div style={S.sectionHeader}>{title}</div>
}

function MoneyInput({ raw, onChange, placeholder }) {
  const [focused, setFocused] = useState(false)
  const num       = raw === '' ? 0 : Math.round((parseFloat(raw) || 0) * 1_000_000)
  const formatted = num > 0 ? num.toLocaleString('ko-KR') : ''
  const splitAt   = formatted.length > 8 ? formatted.length - 8 : 0

  return (
    <div style={{ position: 'relative' }}>
      <div style={{
        position: 'relative', background: '#f8fafc',
        border: `1.5px solid ${focused ? '#3b82f6' : '#e2e8f0'}`,
        borderRadius: 9,
        boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}>
        <input
          style={{ display: 'block', width: '100%', padding: '9px 64px 9px 12px', fontSize: 14, border: 'none', outline: 'none', background: 'transparent', color: 'transparent', caretColor: '#1a202c', fontFamily: 'inherit', boxSizing: 'border-box', position: 'relative', zIndex: 1 }}
          type="text" inputMode="decimal"
          value={raw} onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <div style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0, padding: '9px 64px 9px 12px', display: 'flex', alignItems: 'center', fontSize: 14, pointerEvents: 'none' }}>
          {raw
            ? <span style={{ color: '#1a202c' }}>{formatted.slice(0, splitAt)}<span style={{ color: '#c8d3df' }}>{formatted.slice(splitAt)}</span></span>
            : <span style={{ color: '#94a3b8' }}>{placeholder}</span>}
        </div>
      </div>
      <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8', fontWeight: 500, pointerEvents: 'none' }}>백만원</span>
    </div>
  )
}

function YearButtons({ value, onChange }) {
  return (
    <div style={{ display: 'flex', gap: 8 }}>
      {[10, 15, 20, 30].map(y => (
        <button key={y}
          style={{ flex: 1, padding: '9px 0', fontSize: 13, fontWeight: 600, border: `1.5px solid ${value === y ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', background: value === y ? '#eff6ff' : '#f8fafc', color: value === y ? '#1d4ed8' : '#64748b' }}
          onClick={() => onChange(y)}>{y}년</button>
      ))}
    </div>
  )
}

function CheckItem({ label, checked, onChange, sub }) {
  return (
    <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' }}>
      <input type="checkbox" checked={checked} onChange={e => onChange(e.target.checked)} style={{ accentColor: '#3b82f6', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 }} />
      <span style={{ fontSize: 13, color: '#374151', fontWeight: 500 }}>{label}</span>
      {sub && <span style={{ fontSize: 11, color: '#3b82f6', fontWeight: 600, background: '#eff6ff', borderRadius: 5, padding: '1px 7px', marginLeft: 2 }}>{sub}</span>}
    </label>
  )
}

// ── 공통 서브 컴포넌트 ────────────────────────────────────────────
function DetailRow({ label, value, valueColor, border }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', ...(border ? { borderTop: '1px dashed #e2e8f0', paddingTop: 8, marginTop: 4 } : {}) }}>
      <span style={{ fontSize: 11, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 11, fontWeight: 700, color: valueColor || '#1a202c' }}>{value}</span>
    </div>
  )
}

function DetailCard({ badge, badgeColor, badgeBg, title, children }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '12px 14px', marginBottom: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
        <span style={{ fontSize: 10, fontWeight: 700, color: badgeColor, background: badgeBg, borderRadius: 5, padding: '2px 6px' }}>{badge}</span>
        <span style={{ fontSize: 11, color: '#64748b', fontWeight: 500 }}>{title}</span>
      </div>
      {children}
    </div>
  )
}

function Alert({ type, text }) {
  const map = { success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' }, warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' }, danger: { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' }, info: { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af' } }
  const icons = { success: '✅', warning: '⚠️', danger: '🚫', info: 'ℹ️' }
  const c = map[type]
  return (
    <div style={{ display: 'flex', gap: 8, padding: '9px 12px', borderRadius: 8, marginBottom: 8, fontSize: 11, lineHeight: 1.5, background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      <span style={{ flexShrink: 0 }}>{icons[type]}</span><span>{text}</span>
    </div>
  )
}

// ── 일반 주담대 결과 카드 ─────────────────────────────────────────
function LoanCard({ result, salePriceNum, collateral, isBetter }) {
  const DSR = 0.4
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 16, border: `2px solid ${isBetter ? '#22c55e' : '#e2e8f0'}`, padding: '20px', position: 'relative', minWidth: 0 }}>
      {isBetter && <BetterBadge label="한도 유리" />}
      <CardTitle icon="🏦" title="일반 주담대" color="#1e40af" />

      {result?.blocked ? (
        <IneligibleBox reason="DSR 한도 초과: 기존 대출 상환액이 연소득의 40%를 초과합니다" />
      ) : !result ? (
        <EmptyBox />
      ) : (
        <>
          {result.explanations.map((e, i) => <Alert key={i} type={e.type} text={e.text} />)}

          <MainAmountBox color="#1e40af" amount={result.finalAmount} monthly={result.monthlyPayment} />

          <div style={S2.summaryGrid}>
            <SummaryItem label="담보가액" value={formatKRW(collateral?.value)} sub={`${collateral?.source} 기준`} />
            <SummaryItem label="적용 LTV" value={`${Math.round(result.ltvRatio * 100)}%`} sub={result.ltvCapped ? '6억 상한 적용' : ''} />
            <SummaryItem label="최종 금리" value={`${result.finalRate.toFixed(2)}%`} sub={result.rateDiscount < 0 ? `우대 ${result.rateDiscount}%p` : '우대 없음'} highlight={result.rateDiscount < 0} />
            <SummaryItem label="DSR 한도" value={`${Math.round(DSR * 100)}%`} sub={`연 ${formatKRW(result.annualAllowable)}`} />
          </div>

          <DetailCard badge="LTV" badgeColor="#059669" badgeBg="#dcfce7" title="담보인정비율 기준">
            <DetailRow label="담보가액" value={formatKRW(collateral?.value)} />
            <DetailRow label={`LTV ${Math.round(result.ltvRatio * 100)}% 적용`} value={formatKRW(result.ltvAmount)} valueColor="#059669" border />
            {result.ltvCapped && <DetailRow label="생애최초 한도 상한" value="6억원 (규제지역)" valueColor="#d97706" />}
          </DetailCard>

          <DetailCard badge="DSR" badgeColor="#1d4ed8" badgeBg="#dbeafe" title="총부채원리금상환비율 기준">
            <DetailRow label={`연간 상환 가능액 (소득 × ${Math.round(DSR * 100)}%)`} value={formatKRW(result.annualAllowable)} />
            <DetailRow label="기존 대출 연간 상환액" value={result.existingAnnual > 0 ? `- ${formatKRW(result.existingAnnual)}` : '없음'} valueColor={result.existingAnnual > 0 ? '#ef4444' : '#94a3b8'} />
            <DetailRow label="신규 대출 월 상환 가능액" value={result.remainingMonthly <= 0 ? '불가' : formatKRW(result.remainingMonthly)} valueColor={result.remainingMonthly <= 0 ? '#ef4444' : '#0369a1'} />
            <DetailRow label="DSR 기준 한도" value={formatKRW(result.dsrAmount)} valueColor="#1d4ed8" border />
          </DetailCard>

          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '8px 12px', background: '#f1f5f9', borderRadius: 8, marginBottom: 12 }}>
            <span>{result.limitedBy === 'LTV' ? '🔒' : '📉'}</span>
            <span style={{ fontSize: 12, color: '#475569', fontWeight: 500 }}><strong>{result.limitedBy}</strong> 기준이 최종 한도를 결정했습니다</span>
          </div>

          {salePriceNum > 0 && <EquityBox salePriceNum={salePriceNum} loanAmount={result.finalAmount} monthly={result.monthlyPayment} />}
        </>
      )}
    </div>
  )
}

// ── 디딤돌 결과 카드 ──────────────────────────────────────────────
function DidimdolCard({ result, salePriceNum, collateral, isBetter }) {
  return (
    <div style={{ flex: 1, background: '#fff', borderRadius: 16, border: `2px solid ${isBetter ? '#22c55e' : '#e2e8f0'}`, padding: '20px', position: 'relative', minWidth: 0 }}>
      {isBetter && <BetterBadge label="금리 유리" />}
      <CardTitle icon="🏛️" title="디딤돌 대출" color="#0369a1" />

      {result?.ineligible ? (
        <IneligibleBox reason={result.reason} />
      ) : !result ? (
        <EmptyBox />
      ) : (
        <>
          <MainAmountBox color="#0369a1" amount={result.loanAmount} monthly={result.monthlyPayment} />

          <div style={S2.summaryGrid}>
            <SummaryItem label="적용 금리" value={`${result.finalRate.toFixed(2)}%`} sub={result.discount > 0 ? `우대 -${result.discount.toFixed(1)}%p` : '우대 없음'} highlight={result.discount > 0} />
            <SummaryItem label="금리 유형" value={result.rateType} sub={result.rateType === '우대' ? '생애최초·신혼' : '일반'} />
            <SummaryItem label="LTV 한도" value={formatKRW(result.ltvLimit)} sub="담보가액 × 70%" />
            <SummaryItem label="상품 한도" value={formatKRW(result.productCap)} sub={result.limitedBy === 'LTV' ? 'LTV 기준 적용' : '상품한도 적용'} />
          </div>

          <DetailCard badge="금리" badgeColor="#1d4ed8" badgeBg="#dbeafe" title="기본금리 + 우대할인">
            <DetailRow label={`기본금리 (${result.rateType})`} value={`${result.baseRate.toFixed(2)}%`} />
            {result.discounts.map((d, i) => (
              <DetailRow key={i} label={d.replace(/-[\d.]+%p$/, '').trim()} value={`-${d.match(/[\d.]+%p/)?.[0] ?? ''}`} valueColor="#059669" />
            ))}
            <DetailRow label="최종 적용 금리" value={`${result.finalRate.toFixed(2)}%`} valueColor="#1d4ed8" border />
          </DetailCard>

          <DetailCard badge="한도" badgeColor="#059669" badgeBg="#dcfce7" title="LTV 70% vs 상품 한도">
            <DetailRow label="담보가액" value={formatKRW(collateral?.value)} />
            <DetailRow label="LTV 70% 적용" value={formatKRW(result.ltvLimit)} />
            <DetailRow label="상품 한도" value={formatKRW(result.productCap)} />
            <DetailRow label={`최종 한도 (${result.limitedBy} 기준)`} value={formatKRW(result.loanAmount)} valueColor="#059669" border />
          </DetailCard>

          {salePriceNum > 0 && <EquityBox salePriceNum={salePriceNum} loanAmount={result.loanAmount} monthly={result.monthlyPayment} />}

          <div style={{ fontSize: 10, color: '#94a3b8', lineHeight: 1.5 }}>* DTI 60% 이내 별도 심사 적용</div>
        </>
      )}
    </div>
  )
}

// ── 공용 블록 ─────────────────────────────────────────────────────
function BetterBadge({ label }) {
  return <div style={{ position: 'absolute', top: -13, left: '50%', transform: 'translateX(-50%)', background: '#22c55e', color: '#fff', fontSize: 11, fontWeight: 700, borderRadius: 20, padding: '3px 12px', whiteSpace: 'nowrap' }}>{label}</div>
}
function CardTitle({ icon, title, color }) {
  return <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 14, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' }}><span style={{ fontSize: 20 }}>{icon}</span><span style={{ fontSize: 15, fontWeight: 700, color }}>{title}</span></div>
}
function IneligibleBox({ reason }) {
  return <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '20px', textAlign: 'center' }}><div style={{ fontSize: 28, marginBottom: 8 }}>🚫</div><div style={{ fontSize: 13, fontWeight: 700, color: '#991b1b', marginBottom: 4 }}>자격 미충족</div><div style={{ fontSize: 12, color: '#7f1d1d' }}>{reason}</div></div>
}
function EmptyBox() {
  return <div style={{ textAlign: 'center', color: '#94a3b8', padding: '20px 0', fontSize: 13 }}>계산 불가</div>
}
function MainAmountBox({ color, amount, monthly }) {
  return (
    <div style={{ background: `linear-gradient(135deg, ${color} 0%, ${color}bb 100%)`, borderRadius: 12, padding: '16px', textAlign: 'center', marginBottom: 12 }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.8)', marginBottom: 4 }}>최대 대출 금액</div>
      <div style={{ fontSize: 24, fontWeight: 800, color: '#fff', letterSpacing: '-0.02em', marginBottom: 4 }}>{formatKRW(amount)}</div>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,0.75)' }}>월 상환액 {formatKRW(monthly)} · 원리금균등</div>
    </div>
  )
}
function SummaryItem({ label, value, sub, highlight }) {
  return (
    <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 10, padding: '10px 12px' }}>
      <div style={{ fontSize: 10, color: '#94a3b8', fontWeight: 600, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 15, fontWeight: 700, color: highlight ? '#dc2626' : '#1a202c' }}>{value}</div>
      {sub && <div style={{ fontSize: 10, color: '#94a3b8', marginTop: 2 }}>{sub}</div>}
    </div>
  )
}
function EquityBox({ salePriceNum, loanAmount, monthly }) {
  return (
    <div style={{ background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 12, padding: '14px', marginBottom: 12 }}>
      <div style={{ fontSize: 10, fontWeight: 700, color: '#64748b', marginBottom: 10, textTransform: 'uppercase', letterSpacing: '0.06em' }}>필요한 금액</div>
      <DetailRow label="매매가" value={formatKRW(salePriceNum)} />
      <DetailRow label="최대 대출금액" value={`- ${formatKRW(loanAmount)}`} valueColor="#ef4444" />
      <div style={{ height: 1, background: '#e2e8f0', margin: '6px 0' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <span style={{ fontSize: 13, fontWeight: 700, color: '#1a202c' }}>필요 자기자본</span>
        <span style={{ fontSize: 20, fontWeight: 800, color: '#1e40af', letterSpacing: '-0.02em' }}>{formatKRW(Math.max(0, salePriceNum - loanAmount))}</span>
      </div>
      <div style={{ height: 1, background: '#e2e8f0', margin: '6px 0' }} />
      <DetailRow label="월 상환액" value={formatKRW(monthly)} />
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────
export default function CompareTab({ isMobile, defaultIncome = 0, defaultSalePrice = 0, defaultKbPrice = 0, defaultAppraisalPrice = 0, defaultYears = 30, defaultRegion = '규제지역', defaultOwnership = '무주택', defaultIsFirstHome = false, defaultIsNewlywed = false }) {
  // 공통 입력
  const [income,         incomeChange,         incomeNum        ] = useMillionInput(defaultIncome)
  const [salePrice,      salePriceChange,      salePriceNum     ] = useMillionInput(defaultSalePrice)
  const [kbPrice,        kbPriceChange,        kbPriceNum       ] = useMillionInput(defaultKbPrice)
  const [appraisalPrice, appraisalPriceChange, appraisalNum     ] = useMillionInput(defaultAppraisalPrice)
  const [years,          setYears             ] = useState(defaultYears)

  // 공통 조건
  const [isFirstHome, setIsFirstHome] = useState(defaultIsFirstHome)
  const [isNewlywed,  setIsNewlywed ] = useState(defaultIsNewlywed)
  const [children,    setChildren   ] = useState(0)

  // 일반 주담대 전용
  const [baseRate,   setBaseRate  ] = useState('')
  const [region,     setRegion    ] = useState(defaultRegion)
  const [ownership,  setOwnership ] = useState(defaultOwnership)
  const [isYouth,    setIsYouth   ] = useState(false)
  const [existingLoan, existingLoanChange, existingLoanNum] = useMillionInput()

  // 디딤돌 전용
  const [isSingleParent, setSingleParent] = useState(false)
  const [isRegional,     setRegional     ] = useState(false)

  const [showResult, setShowResult] = useState(false)

  const collateral = useMemo(() =>
    resolveCollateralValue({ appraisalPrice: appraisalNum, kbPrice: kbPriceNum, salePrice: salePriceNum })
  , [salePriceNum, kbPriceNum, appraisalNum])

  const incomeMan = Math.round(incomeNum / 10_000)

  const loanResult = useMemo(() => {
    if (!incomeNum || !salePriceNum || !baseRate || !collateral) return null
    return calcLoan({
      income: incomeNum, existingLoan: existingLoanNum,
      collateralValue: collateral.value,
      region, ownership,
      isFirstHome, isNewlywed, isYouth,
      baseRate: parseFloat(baseRate) || 0, years,
    })
  }, [incomeNum, existingLoanNum, salePriceNum, collateral, region, ownership, isFirstHome, isNewlywed, isYouth, baseRate, years])

  const didimdolResult = useMemo(() => {
    if (!incomeNum || !salePriceNum || !collateral) return null
    return calcDidimdol({ incomeMan, collateralValue: collateral.value, years, isFirstHome, isNewlywed, children, isSingleParent, isRegional })
  }, [incomeNum, salePriceNum, collateral, incomeMan, years, isFirstHome, isNewlywed, children, isSingleParent, isRegional])

  const canCompare = incomeNum > 0 && salePriceNum > 0 && baseRate && collateral

  // 어느 상품이 더 유리한지
  const loanAmount  = loanResult && !loanResult.blocked ? loanResult.finalAmount : 0
  const didimdolAmt = didimdolResult && !didimdolResult.ineligible ? didimdolResult.loanAmount : 0
  const loanBetter    = loanAmount > 0 && (didimdolAmt === 0 || loanAmount > didimdolAmt)
  const didimdolBetter = didimdolAmt > 0 && loanResult?.finalRate > didimdolResult?.finalRate

  const loanMonthly    = loanResult?.monthlyPayment ?? 0
  const didimdolMonthly = didimdolResult?.monthlyPayment ?? 0
  const monthlyDiff = Math.abs(loanMonthly - didimdolMonthly)

  if (showResult) {
    return (
      <div>
        <button onClick={() => setShowResult(false)} style={S.backBtn}>← 다시 입력</button>

        {loanResult && didimdolResult && !didimdolResult.ineligible && !loanResult.blocked && (
          <div style={S.summaryBanner}>
            {didimdolResult.finalRate < (loanResult.finalRate ?? 99)
              ? `💡 디딤돌 대출이 월 ${formatKRW(monthlyDiff)} 더 저렴합니다`
              : `💡 일반 주담대 한도가 ${formatKRW(loanAmount - didimdolAmt)} 더 많습니다`}
          </div>
        )}

        <div style={{ display: 'flex', gap: 16, flexDirection: isMobile ? 'column' : 'row', marginTop: 16, alignItems: 'flex-start' }}>
          <LoanCard result={loanResult} salePriceNum={salePriceNum} collateral={collateral} isBetter={loanBetter} />
          <DidimdolCard result={didimdolResult} salePriceNum={salePriceNum} collateral={collateral} isBetter={didimdolBetter} />
        </div>

        <div style={{ marginTop: 12, fontSize: 11, color: '#94a3b8', textAlign: 'center', lineHeight: 1.6 }}>
          * 실제 대출 조건은 금융기관 심사 결과에 따라 달라질 수 있습니다
        </div>
      </div>
    )
  }

  return (
    <div style={isMobile ? S.cardMobile : S.card}>
      <h2 style={S.cardTitle}>대출 조건 입력</h2>

      <SectionHeader title="공통 — 소득 · 주택 정보" />
      <div style={S.fg}>
        <Label text="연소득 (신혼부부는 부부합산)" required />
        <MoneyInput raw={income} onChange={incomeChange} placeholder="예: 60" />
      </div>
      <div style={S.fg}>
        <Label text="매매가" required />
        <MoneyInput raw={salePrice} onChange={salePriceChange} placeholder="예: 500" />
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <Label text="KB시세" />
          <MoneyInput raw={kbPrice} onChange={kbPriceChange} placeholder="예: 480" />
        </div>
        <div style={{ flex: 1 }}>
          <Label text="감정가" />
          <MoneyInput raw={appraisalPrice} onChange={appraisalPriceChange} placeholder="미입력 시 KB시세" />
        </div>
      </div>
      <div style={S.fg}>
        <Label text="대출 기간" required />
        <YearButtons value={years} onChange={setYears} />
      </div>

      <SectionHeader title="공통 — 우대 조건" />
      <div style={S.checkGroup}>
        <CheckItem label="생애최초 주택구입" checked={isFirstHome} onChange={setIsFirstHome} sub="LTV 80% · 한도↑" />
        <CheckItem label="신혼부부" checked={isNewlywed} onChange={setIsNewlywed} sub="금리 우대" />
      </div>
      <div style={{ marginTop: 12 }}>
        <Label text="자녀 수" />
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 0, label: '없음' }, { v: 1, label: '1명' }, { v: 2, label: '2명' }, { v: 3, label: '3명+' }].map(({ v, label }) => (
            <button key={v}
              style={{ flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600, border: `1.5px solid ${children === v ? '#3b82f6' : '#e2e8f0'}`, borderRadius: 8, cursor: 'pointer', fontFamily: 'inherit', background: children === v ? '#eff6ff' : '#f8fafc', color: children === v ? '#1d4ed8' : '#64748b' }}
              onClick={() => setChildren(v)}>{label}</button>
          ))}
        </div>
      </div>

      <SectionHeader title="일반 주담대 전용" />
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <Label text="지역" />
          <select style={S.sel} value={region} onChange={e => setRegion(e.target.value)}>
            <option>규제지역</option><option>비규제지역</option>
          </select>
        </div>
        <div style={{ flex: 1 }}>
          <Label text="주택 보유 수" />
          <select style={S.sel} value={ownership} onChange={e => setOwnership(e.target.value)}>
            <option>무주택</option><option>1주택</option><option>다주택</option>
          </select>
        </div>
      </div>
      <div style={{ display: 'flex', gap: 12, marginBottom: 14 }}>
        <div style={{ flex: 1 }}>
          <Label text="기본 금리" required />
          <div style={{ position: 'relative' }}>
            <input style={{ ...S.inp, paddingRight: 36 }} type="number" step="0.1" min="0" max="30"
              placeholder="예: 4.5" value={baseRate} onChange={e => setBaseRate(e.target.value)} />
            <span style={{ position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8' }}>%</span>
          </div>
        </div>
        <div style={{ flex: 1 }}>
          <Label text="기존 대출 월 상환액" />
          <MoneyInput raw={existingLoan} onChange={existingLoanChange} placeholder="없으면 0" />
        </div>
      </div>
      <div style={S.checkGroup}>
        <CheckItem label="청년 (만 19~34세)" checked={isYouth} onChange={setIsYouth} sub="-0.2%p" />
      </div>

      <SectionHeader title="디딤돌 전용" />
      <div style={S.checkGroup}>
        <CheckItem label="한부모 가구" checked={isSingleParent} onChange={setSingleParent} sub="소득 6천 이하 시 -0.5%p" />
        <CheckItem label="지방 소재 주택" checked={isRegional} onChange={setRegional} sub="-0.2%p" />
      </div>

      <button
        disabled={!canCompare}
        onClick={() => setShowResult(true)}
        style={{ ...S.compareBtn, opacity: canCompare ? 1 : 0.45, cursor: canCompare ? 'pointer' : 'not-allowed' }}
      >
        비교하기 →
      </button>
      {!canCompare && (
        <p style={{ textAlign: 'center', fontSize: 12, color: '#94a3b8', marginTop: 8 }}>
          소득, 매매가, 기본 금리(*) 입력 후 비교 가능합니다
        </p>
      )}
    </div>
  )
}

// ── 스타일 ────────────────────────────────────────────────────────
const S2 = {
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 8, marginBottom: 12 },
}

const S = {
  card:       { background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)', maxWidth: 600, margin: '0 auto' },
  cardMobile: { background: '#fff', borderRadius: 14, padding: '18px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  cardTitle:  { fontSize: 17, fontWeight: 700, color: '#1a202c', marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' },
  sectionHeader: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase', marginTop: 20, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f1f5f9' },
  fg:  { marginBottom: 14 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 },
  checkGroup: { display: 'flex', flexDirection: 'column', gap: 12, padding: '14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9 },
  inp: { width: '100%', padding: '9px 12px', fontSize: 14, border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none', color: '#1a202c', background: '#f8fafc', fontFamily: 'inherit', boxSizing: 'border-box' },
  sel: { width: '100%', padding: '9px 34px 9px 12px', fontSize: 14, border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none', color: '#1a202c', cursor: 'pointer', fontFamily: 'inherit', appearance: 'none', boxSizing: 'border-box', background: `#f8fafc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center` },
  compareBtn: { width: '100%', marginTop: 24, padding: '14px', fontSize: 15, fontWeight: 700, background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', color: '#fff', border: 'none', borderRadius: 12, fontFamily: 'inherit' },
  backBtn: { display: 'inline-flex', alignItems: 'center', gap: 6, padding: '8px 16px', fontSize: 13, fontWeight: 600, background: '#f1f5f9', border: 'none', borderRadius: 8, cursor: 'pointer', color: '#475569', fontFamily: 'inherit', marginBottom: 16 },
  summaryBanner: { background: 'linear-gradient(135deg, #f0fdf4, #dcfce7)', border: '1px solid #bbf7d0', borderRadius: 12, padding: '12px 16px', fontSize: 14, fontWeight: 600, color: '#166534', textAlign: 'center' },
}
