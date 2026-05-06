import { useState, useMemo } from 'react'
import { resolveCollateralValue } from '../services/priceService'

// ── 상수 ─────────────────────────────────────────────────────────
// 출처: 한국주택금융공사 공식 금리표 (2026년 5월)
const RATES = {
  일반: {
    10: [2.85, 3.20, 3.55, 3.90],
    15: [2.95, 3.30, 3.65, 4.00],
    20: [3.05, 3.40, 3.75, 4.10],
    30: [3.10, 3.45, 3.80, 4.15],
  },
  우대: {
    10: [2.55, 2.90, 3.25, 3.60],
    15: [2.65, 3.00, 3.35, 3.70],
    20: [2.75, 3.10, 3.45, 3.80],
    30: [2.80, 3.15, 3.50, 3.85],
  },
}
const INCOME_THRESHOLDS = [2000, 4000, 7000, 8500] // 만원

function getIncomeBracket(incomeMan) {
  if (incomeMan <= 2000) return 0
  if (incomeMan <= 4000) return 1
  if (incomeMan <= 7000) return 2
  return 3
}

function getIncomeLimit({ isNewlywed, isFirstHome, children }) {
  if (isNewlywed) return 8500
  if (isFirstHome || children >= 2) return 7000
  return 6000
}

function getLoanCap({ isNewlywed, isFirstHome, children }) {
  if (isNewlywed || children >= 2) return 400_000_000
  if (isFirstHome) return 300_000_000
  return 250_000_000
}

function calcDidimdol({ incomeMan, collateralValue, years, isFirstHome, isNewlywed, children, isSingleParent, isRegional }) {
  const incomeLimit = getIncomeLimit({ isNewlywed, isFirstHome, children })
  if (incomeMan > incomeLimit) return { ineligible: true, reason: `소득 초과 (한도: ${incomeLimit.toLocaleString()}만원)` }
  if (collateralValue > 500_000_000) return { ineligible: true, reason: '주택가격 5억원 초과' }

  const rateType = (isFirstHome || isNewlywed) ? '우대' : '일반'
  const bracket  = getIncomeBracket(incomeMan)
  const baseRate = RATES[rateType][years][bracket]

  let discount = 0
  const discounts = []
  if (children >= 3) { discount += 0.7; discounts.push('3자녀 이상 -0.7%p') }
  else if (children === 2) { discount += 0.5; discounts.push('2자녀 -0.5%p') }
  else if (children === 1) { discount += 0.3; discounts.push('1자녀 -0.3%p') }
  if (isSingleParent && incomeMan <= 6000) { discount += 0.5; discounts.push('한부모 가구 -0.5%p') }
  if (isRegional) { discount += 0.2; discounts.push('지방 소재 주택 -0.2%p') }

  const minRate   = (isFirstHome || isNewlywed) ? 1.2 : 1.5
  const finalRate = Math.max(minRate, baseRate - discount)

  const productCap = getLoanCap({ isNewlywed, isFirstHome, children })
  const ltvLimit   = Math.floor(collateralValue * 0.7)
  const loanAmount = Math.min(productCap, ltvLimit)

  const monthlyRate = finalRate / 100 / 12
  const months      = years * 12
  const monthlyPayment = monthlyRate === 0
    ? loanAmount / months
    : loanAmount * monthlyRate * Math.pow(1 + monthlyRate, months) /
      (Math.pow(1 + monthlyRate, months) - 1)

  return {
    ineligible: false,
    baseRate, finalRate, discount, discounts, rateType,
    productCap, ltvLimit, loanAmount,
    monthlyPayment, months,
    limitedBy: ltvLimit <= productCap ? 'LTV' : '상품한도',
  }
}

// ── 유틸 ─────────────────────────────────────────────────────────
function formatKRW(v) {
  if (!v || isNaN(v)) return '-'
  return '₩' + Math.round(v).toLocaleString('ko-KR')
}

function useMillionInput(initNum = 0) {
  const initRaw = initNum > 0 ? String(Math.round(initNum / 1_000_000)) : ''
  const [raw, setRaw] = useState(initRaw)
  const num = raw === '' ? 0 : Math.round((parseFloat(raw) || 0) * 1_000_000)
  const onChange = e => setRaw(e.target.value.replace(/[^0-9.]/g, ''))
  return [raw, onChange, num, setRaw]
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────────
function Label({ text, required }) {
  return (
    <label style={S.label}>
      {text}{required && <span style={S.req}>*</span>}
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
    <div style={{ position: 'relative', flex: 1 }}>
      <div style={{
        position: 'relative',
        background: '#f8fafc',
        border: `1.5px solid ${focused ? '#3b82f6' : '#e2e8f0'}`,
        borderRadius: 9,
        boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}>
        <input
          style={{
            display: 'block', width: '100%',
            padding: '9px 52px 9px 12px', fontSize: 14,
            border: 'none', outline: 'none', background: 'transparent',
            color: 'transparent', caretColor: '#1a202c',
            fontFamily: 'inherit', boxSizing: 'border-box',
            position: 'relative', zIndex: 1,
          }}
          type="text" inputMode="decimal"
          value={raw} onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
        />
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          padding: '9px 52px 9px 12px',
          display: 'flex', alignItems: 'center',
          fontSize: 14, pointerEvents: 'none',
        }}>
          {raw
            ? <span style={{ color: '#1a202c' }}>{formatted.slice(0, splitAt)}<span style={{ color: '#c8d3df' }}>{formatted.slice(splitAt)}</span></span>
            : <span style={{ color: '#94a3b8' }}>{placeholder}</span>}
        </div>
      </div>
      <span style={S.unit}>백만원</span>
    </div>
  )
}

function CheckItem({ label, checked, onChange, sub }) {
  return (
    <label style={S.checkItem}>
      <input type="checkbox" checked={checked}
        onChange={e => onChange(e.target.checked)} style={S.checkbox} />
      <span style={S.checkLabel}>{label}</span>
      {sub && <span style={S.checkSub}>{sub}</span>}
    </label>
  )
}

function DetailRow({ label, value, valueColor, border }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '4px 0', ...(border ? { borderTop: '1px dashed #e2e8f0', paddingTop: 10, marginTop: 6 } : {}) }}>
      <span style={{ fontSize: 12, color: '#64748b' }}>{label}</span>
      <span style={{ fontSize: 12, fontWeight: 700, color: valueColor || '#1a202c' }}>{value}</span>
    </div>
  )
}

// ── 메인 컴포넌트 ─────────────────────────────────────────────────
export default function DimdolTab({ isMobile, defaultIncome = 0, defaultSalePrice = 0, defaultKbPrice = 0, defaultAppraisalPrice = 0 }) {
  const [income, incomeChange, incomeNum] = useMillionInput(defaultIncome)
  const [salePrice, salePriceChange, salePriceNum]           = useMillionInput(defaultSalePrice)
  const [kbPrice, kbPriceChange, kbPriceNum]                 = useMillionInput(defaultKbPrice)
  const [appraisalPrice, appraisalPriceChange, appraisalNum] = useMillionInput(defaultAppraisalPrice)
  const [years, setYears]             = useState(30)
  const [isFirstHome, setIsFirstHome] = useState(false)
  const [isNewlywed, setIsNewlywed]   = useState(false)
  const [children, setChildren]       = useState(0)
  const [isSingleParent, setSingleParent] = useState(false)
  const [isRegional, setRegional]     = useState(false)

  const incomeMan = Math.round(incomeNum / 10_000)

  const collateral = useMemo(() =>
    resolveCollateralValue({ appraisalPrice: appraisalNum, kbPrice: kbPriceNum, salePrice: salePriceNum })
  , [salePriceNum, kbPriceNum, appraisalNum])

  const result = useMemo(() => {
    if (!incomeNum || !salePriceNum || !collateral) return null
    return calcDidimdol({ incomeMan, collateralValue: collateral.value, years, isFirstHome, isNewlywed, children, isSingleParent, isRegional })
  }, [incomeNum, salePriceNum, collateral, years, isFirstHome, isNewlywed, children, isSingleParent, isRegional, incomeMan])

  return (
    <div style={{ ...S.grid, ...(isMobile ? { gridTemplateColumns: '1fr', gap: 16 } : {}) }}>

      {/* ── 입력 패널 ── */}
      <section style={isMobile ? S.cardMobile : S.card}>
        <h2 style={S.cardTitle}>디딤돌 대출 조건 입력</h2>

        <div style={{ ...S.infoBox, marginBottom: 18 }}>
          <span style={{ fontSize: 13, color: '#1d4ed8' }}>
            📋 무주택 세대주 대상 · 주택가격 5억원 이하 · 전용 85㎡ 이하
          </span>
        </div>

        <SectionHeader title="소득 정보" />
        <div style={S.fg}>
          <Label text="부부합산 연소득" required />
          <MoneyInput raw={income} onChange={incomeChange} placeholder="예: 50" />
        </div>

        <SectionHeader title="주택 정보" />
        <div style={S.fg}>
          <Label text="매매가" required />
          <MoneyInput raw={salePrice} onChange={salePriceChange} placeholder="예: 350" />
        </div>
        <div style={S.fg}>
          <Label text="KB시세" />
          <MoneyInput raw={kbPrice} onChange={kbPriceChange} placeholder="예: 340" />
        </div>
        <div style={S.fg}>
          <Label text="감정가" />
          <MoneyInput raw={appraisalPrice} onChange={appraisalPriceChange} placeholder="미입력 시 KB시세 적용" />
        </div>

        <SectionHeader title="대출 기간" />
        <div style={{ display: 'flex', gap: 8 }}>
          {[10, 15, 20, 30].map(y => (
            <button key={y}
              style={{ ...S.yearBtn, ...(years === y ? S.yearBtnActive : {}) }}
              onClick={() => setYears(y)}>{y}년</button>
          ))}
        </div>

        <SectionHeader title="우대 조건" />
        <div style={S.checkboxGroup}>
          <CheckItem label="생애최초 주택구입" checked={isFirstHome} onChange={setIsFirstHome} sub="한도 3억 · 우대금리" />
          <CheckItem label="신혼부부" checked={isNewlywed} onChange={setIsNewlywed} sub="한도 4억 · 우대금리" />
          <CheckItem label="한부모 가구" checked={isSingleParent} onChange={setSingleParent} sub="소득 6천 이하 시 -0.5%p" />
          <CheckItem label="지방 소재 주택" checked={isRegional} onChange={setRegional} sub="-0.2%p" />
        </div>

        <SectionHeader title="자녀 수" />
        <div style={{ display: 'flex', gap: 8 }}>
          {[{ v: 0, label: '없음' }, { v: 1, label: '1명' }, { v: 2, label: '2명' }, { v: 3, label: '3명 이상' }].map(({ v, label }) => (
            <button key={v}
              style={{ ...S.yearBtn, flex: 1, ...(children === v ? S.yearBtnActive : {}) }}
              onClick={() => setChildren(v)}>{label}</button>
          ))}
        </div>
      </section>

      {/* ── 결과 패널 ── */}
      <section style={isMobile ? S.cardMobile : S.card}>
        <h2 style={S.cardTitle}>계산 결과</h2>

        {!result ? (
          <div style={S.placeholder}>
            <div style={{ fontSize: 52, marginBottom: 16, opacity: 0.5 }}>🏛️</div>
            <p style={{ fontSize: 14, textAlign: 'center', lineHeight: 1.8, color: '#94a3b8' }}>
              소득과 매매가를 입력하면<br />결과가 표시됩니다
            </p>
          </div>
        ) : result.ineligible ? (
          <div style={S.ineligibleBox}>
            <div style={{ fontSize: 36, marginBottom: 12 }}>🚫</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#991b1b', marginBottom: 8 }}>자격 요건 미충족</div>
            <div style={{ fontSize: 13, color: '#7f1d1d' }}>{result.reason}</div>
          </div>
        ) : (
          <>
            {/* 최대 대출 금액 */}
            <div style={S.mainBox}>
              <div style={S.mainLabel}>최대 대출 가능 금액</div>
              <div style={S.mainValue}>{formatKRW(result.loanAmount)}</div>
              <div style={S.mainSub}>월 상환액 {formatKRW(result.monthlyPayment)} · 원리금균등</div>
            </div>

            {/* 핵심 지표 */}
            <div style={S.summaryGrid}>
              <div style={S.summaryItem}>
                <div style={S.summaryLabel}>적용 금리</div>
                <div style={{ ...S.summaryValue, color: '#0369a1' }}>{result.finalRate.toFixed(2)}%</div>
                {result.discount > 0 && <div style={S.summarySub}>우대 -{result.discount.toFixed(1)}%p</div>}
              </div>
              <div style={S.summaryItem}>
                <div style={S.summaryLabel}>금리 유형</div>
                <div style={S.summaryValue}>{result.rateType}</div>
                <div style={S.summarySub}>{result.rateType === '우대' ? '생애최초·신혼' : '일반'}</div>
              </div>
              <div style={S.summaryItem}>
                <div style={S.summaryLabel}>LTV 한도</div>
                <div style={S.summaryValue}>{formatKRW(result.ltvLimit)}</div>
                <div style={S.summarySub}>담보가액 × 70%</div>
              </div>
              <div style={S.summaryItem}>
                <div style={S.summaryLabel}>상품 한도</div>
                <div style={S.summaryValue}>{formatKRW(result.productCap)}</div>
                <div style={S.summarySub}>{result.limitedBy === 'LTV' ? 'LTV 기준 적용' : '상품한도 적용'}</div>
              </div>
            </div>

            {/* 금리 상세 */}
            <div style={S.detailCard}>
              <div style={S.detailHeader}>
                <span style={S.badgeBlue}>금리</span>
                <span style={S.detailHeaderLabel}>기본금리 + 우대할인</span>
              </div>
              <DetailRow label={`기본금리 (${result.rateType}, ${years}년)`} value={`${result.baseRate.toFixed(2)}%`} />
              {result.discounts.map((d, i) => (
                <DetailRow key={i} label={d.split('-')[0]} value={`-${d.split('-')[1]}`} valueColor="#059669" />
              ))}
              <DetailRow label="최종 적용 금리" value={`${result.finalRate.toFixed(2)}%`} valueColor="#1d4ed8" border />
            </div>

            {/* 한도 상세 */}
            <div style={S.detailCard}>
              <div style={S.detailHeader}>
                <span style={S.badgeGreen}>한도</span>
                <span style={S.detailHeaderLabel}>LTV 70% vs 상품 한도</span>
              </div>
              <DetailRow label="담보가액" value={formatKRW(collateral?.value)} />
              <DetailRow label="LTV 70% 적용" value={formatKRW(result.ltvLimit)} />
              <DetailRow label="상품 한도" value={formatKRW(result.productCap)} />
              <DetailRow label={`최종 한도 (${result.limitedBy} 기준)`} value={formatKRW(result.loanAmount)} valueColor="#059669" border />
            </div>

            {salePriceNum > 0 && (
              <div style={S.equityBox}>
                <div style={S.equityTitle}>필요 자기자본</div>
                <DetailRow label="매매가" value={formatKRW(salePriceNum)} />
                <DetailRow label="최대 대출금액" value={`- ${formatKRW(result.loanAmount)}`} valueColor="#ef4444" />
                <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: '#1a202c' }}>필요 자기자본</span>
                  <span style={{ fontSize: 22, fontWeight: 800, color: '#1e40af', letterSpacing: '-0.02em' }}>
                    {formatKRW(Math.max(0, salePriceNum - result.loanAmount))}
                  </span>
                </div>
              </div>
            )}

            <div style={{ marginTop: 12, fontSize: 11, color: '#94a3b8', lineHeight: 1.6 }}>
              * DTI 60% 이내 별도 심사 적용 / 실제 한도는 금융기관 심사 결과에 따라 다를 수 있습니다
            </div>
          </>
        )}
      </section>
    </div>
  )
}

// ── 스타일 ────────────────────────────────────────────────────────
const S = {
  grid: { display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))', gap: 24, alignItems: 'start' },
  card:       { background: '#fff', borderRadius: 20, padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)' },
  cardMobile: { background: '#fff', borderRadius: 14, padding: '18px 16px', boxShadow: '0 2px 12px rgba(0,0,0,0.05)' },
  cardTitle: { fontSize: 17, fontWeight: 700, color: '#1a202c', marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #f1f5f9' },
  sectionHeader: { fontSize: 11, fontWeight: 700, letterSpacing: '0.08em', color: '#94a3b8', textTransform: 'uppercase', marginTop: 20, marginBottom: 12, paddingBottom: 6, borderBottom: '1px solid #f1f5f9' },
  fg: { marginBottom: 14, position: 'relative' },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 },
  req: { color: '#ef4444', marginLeft: 3 },
  unit: { position: 'absolute', right: 12, top: '50%', transform: 'translateY(-50%)', fontSize: 12, color: '#94a3b8', fontWeight: 500, pointerEvents: 'none' },
  infoBox: { background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: 10, padding: '10px 14px' },
  checkboxGroup: { display: 'flex', flexDirection: 'column', gap: 12, padding: '14px', background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 9 },
  checkItem: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  checkbox: { accentColor: '#3b82f6', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 },
  checkLabel: { fontSize: 13, color: '#374151', fontWeight: 500 },
  checkSub: { fontSize: 11, color: '#3b82f6', fontWeight: 600, background: '#eff6ff', borderRadius: 5, padding: '1px 7px', marginLeft: 2 },
  yearBtn: { flex: 1, padding: '8px 0', fontSize: 13, fontWeight: 600, border: '1.5px solid #e2e8f0', borderRadius: 8, cursor: 'pointer', background: '#f8fafc', color: '#64748b', fontFamily: 'inherit' },
  yearBtnActive: { background: '#eff6ff', borderColor: '#3b82f6', color: '#1d4ed8' },
  placeholder: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 380 },
  ineligibleBox: { display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', minHeight: 280, background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 16, padding: 32 },
  mainBox: { background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)', borderRadius: 16, padding: '22px', marginBottom: 16, textAlign: 'center' },
  mainLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 8, fontWeight: 500 },
  mainValue: { fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 },
  mainSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 },
  summaryGrid: { display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: 10, marginBottom: 16 },
  summaryItem: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '12px 14px' },
  summaryLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 5 },
  summaryValue: { fontSize: 17, fontWeight: 700, letterSpacing: '-0.01em' },
  summarySub: { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  detailCard: { background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: '14px 16px', marginBottom: 12 },
  detailHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  detailHeaderLabel: { fontSize: 12, color: '#64748b', fontWeight: 500 },
  badgeGreen: { fontSize: 10, fontWeight: 700, color: '#059669', background: '#dcfce7', borderRadius: 6, padding: '2px 7px' },
  badgeBlue: { fontSize: 10, fontWeight: 700, color: '#1d4ed8', background: '#dbeafe', borderRadius: 6, padding: '2px 7px' },
  equityBox: { marginTop: 4, background: '#f8fafc', border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px' },
  equityTitle: { fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em' },
}
