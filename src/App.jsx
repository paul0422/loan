import { useState, useMemo, useEffect, useRef } from 'react'
import { policyConfig } from './config/policy'
import { resolveCollateralValue } from './services/priceService'
import { calcLoan } from './lib/calcLoan'
import PurchaseCostTab from './components/PurchaseCostTab'
import FavoritesPanel from './components/FavoritesPanel'
import GuideTab from './components/GuideTab'
import { getFavorites, saveFavorites } from './services/favoritesService'
import { useIsMobile } from './lib/useIsMobile'

// ── 유틸 ──────────────────────────────────────────────────────
function formatKRW(v) {
  if (!v || isNaN(v)) return '-'
  return '₩' + Math.round(v).toLocaleString('ko-KR')
}

function useMillionInput(initialValue = '') {
  const [raw, setRaw] = useState(initialValue)
  const num    = raw === '' ? 0 : Math.round((parseFloat(raw) || 0) * 1_000_000)
  const onChange = e => setRaw(e.target.value.replace(/[^0-9.]/g, ''))
  return [raw, onChange, num, setRaw]
}

// ── 메인 컴포넌트 ──────────────────────────────────────────────
export default function App() {
  // 개인 정보
  const [income,       incomeChange,       incomeNum,       setIncome      ] = useMillionInput()
  const [existingLoan, existingLoanChange, existingLoanNum, setExistingLoan] = useMillionInput()

  // 주택 정보
  const [salePrice,      salePriceChange,      salePriceNum,      setSalePrice     ] = useMillionInput()
  const [kbPrice,        kbPriceChange,        kbPriceNum,        setKbPrice       ] = useMillionInput()
  const [appraisalPrice, appraisalPriceChange, appraisalPriceNum, setAppraisalPrice] = useMillionInput()
  const [region,    setRegion   ] = useState('규제지역')
  const [ownership, setOwnership] = useState('무주택')

  // 정책
  const [isFirstHome, setIsFirstHome] = useState(false)
  const [isNewlywed,  setIsNewlywed ] = useState(false)
  const [isYouth,     setIsYouth    ] = useState(false)

  // 대출 조건
  const [baseRate, setBaseRate] = useState('')
  const [years,    setYears   ] = useState('')

  // 탭
  const [activeTab, setActiveTab] = useState('loan')

  // 즐겨찾기 — 초기값을 localStorage에서 즉시 로드 (race condition 방지)
  const [favorites, setFavorites] = useState(() => getFavorites())
  const isFirstRender = useRef(true)

  // 반응형
  const isMobile = useIsMobile()

  // localStorage 동기화 — 첫 렌더에서는 저장 스킵
  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false
      return
    }
    saveFavorites(favorites)
  }, [favorites])

  const collateral = useMemo(() =>
    resolveCollateralValue({
      appraisalPrice: appraisalPriceNum,
      kbPrice: kbPriceNum,
      salePrice: salePriceNum,
    })
  , [salePriceNum, kbPriceNum, appraisalPriceNum])

  const noPriceInput  = salePriceNum === 0 && kbPriceNum === 0 && appraisalPriceNum === 0
  const showKbWarning = !noPriceInput && kbPriceNum === 0 && appraisalPriceNum === 0

  const result = useMemo(() => {
    if (!incomeNum || !salePriceNum || !baseRate || !years || !collateral) return null
    const yearsNum = parseInt(years)
    if (!yearsNum || yearsNum <= 0) return null

    return calcLoan({
      income: incomeNum,
      existingLoan: existingLoanNum,
      collateralValue: collateral.value,
      region, ownership,
      isFirstHome, isNewlywed, isYouth,
      baseRate: parseFloat(baseRate) || 0,
      years: yearsNum,
    })
  }, [incomeNum, existingLoanNum, salePriceNum, collateral, region, ownership, isFirstHome, isNewlywed, isYouth, baseRate, years])

  // 즐겨찾기 핸들러들
  const handleSaveFavorite = (name) => {
    const newFav = {
      id: Date.now().toString(),
      name,
      createdAt: Date.now(),
      inputs: {
        salePrice: salePriceNum,
        kbPrice: kbPriceNum,
        appraisalPrice: appraisalPriceNum,
        income: incomeNum,
        existingLoan: existingLoanNum,
        baseRate: parseFloat(baseRate) || 0,
        years: parseInt(years) || 0,
        region,
        ownership,
        isFirstHome,
        isNewlywed,
        isYouth,
      },
      results: result ? {
        finalAmount: result.finalAmount,
        monthlyPayment: result.monthlyPayment,
        ltvRatio: result.ltvRatio,
        collateralValue: collateral?.value || 0,
        collateralSource: collateral?.source || '',
        ltvAmount: result.ltvAmount,
        dsrAmount: result.dsrAmount,
        finalRate: result.finalRate,
      } : null,
    }
    setFavorites([newFav, ...favorites])
  }

  const handleLoadFavorite = (favorite) => {
    const { inputs } = favorite
    // 모든 입력값 복원
    setIncome(inputs.income > 0 ? Math.round(inputs.income / 1_000_000).toString() : '')
    setExistingLoan(inputs.existingLoan > 0 ? Math.round(inputs.existingLoan / 1_000_000).toString() : '')
    setSalePrice(inputs.salePrice > 0 ? Math.round(inputs.salePrice / 1_000_000).toString() : '')
    setKbPrice(inputs.kbPrice > 0 ? Math.round(inputs.kbPrice / 1_000_000).toString() : '')
    setAppraisalPrice(inputs.appraisalPrice > 0 ? Math.round(inputs.appraisalPrice / 1_000_000).toString() : '')

    setRegion(inputs.region)
    setOwnership(inputs.ownership)
    setIsFirstHome(inputs.isFirstHome)
    setIsNewlywed(inputs.isNewlywed)
    setIsYouth(inputs.isYouth)

    setBaseRate(inputs.baseRate.toString())
    setYears(inputs.years.toString())
  }

  const handleRemoveFavorite = (id) => {
    setFavorites(favorites.filter(f => f.id !== id))
  }

  return (
    <div style={{
      ...S.page,
      display: 'flex',
      flexDirection: isMobile ? 'column' : 'row',
    }}>
      <div style={{
        ...S.container,
        flex: 1,
        overflowY: isMobile ? 'visible' : 'auto',
        padding: isMobile ? '20px 12px 24px' : '32px 16px',
      }}>

        <header style={isMobile ? S.headerMobile : S.header}>
          <div style={isMobile ? S.headerIconMobile : S.headerIcon}>🏠</div>
          <h1 style={isMobile ? S.titleMobile : S.title}>🧮 주담대 계산기</h1>
          <p style={S.subtitle}>대출 한도 · 구매 비용을 한 번에 계산합니다</p>
        </header>

        <div style={isMobile ? S.tabsMobile : S.tabs}>
          {[
            { key: 'loan',  label: isMobile ? '🏦 대출' : '🏦 대출 계산' },
            { key: 'cost',  label: isMobile ? '🧾 비용' : '🧾 구매 비용 계산' },
            { key: 'guide', label: isMobile ? '📖 가이드' : '📖 사용 가이드' },
          ].map(t => (
            <button key={t.key}
              style={{
                ...(activeTab === t.key ? S.tabActive : S.tab),
                ...(isMobile ? { flex: 1, padding: '10px 8px', fontSize: 13 } : {}),
              }}
              onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'cost'  && <PurchaseCostTab defaultPrice={salePriceNum} isMobile={isMobile} />}
        {activeTab === 'guide' && <GuideTab isMobile={isMobile} />}

        {activeTab === 'loan' && <div style={{
          ...S.grid,
          ...(isMobile ? { gridTemplateColumns: '1fr', gap: 16 } : {}),
        }}>

          {/* ── 입력 패널 ── */}
          <section style={isMobile ? S.cardMobile : S.card}>
            <h2 style={S.cardTitle}>입력 정보</h2>

            <SectionHeader title="개인 정보" />
            <div style={S.fg}>
              <Label text="연소득" required />
              <NumInput display={income} onChange={incomeChange} unit="" placeholder="예: 60" />
            </div>
            <div style={S.fg}>
              <Label text="기존 대출 월 상환액" />
              <NumInput display={existingLoan} onChange={existingLoanChange} unit="" placeholder="예: 1.5" />
            </div>

            <SectionHeader title="주택 정보" />
            <div style={S.fg}>
              <Label text="매매가" required />
              <NumInput display={salePrice} onChange={salePriceChange} unit="" placeholder="예: 500" />
            </div>
            <div style={S.fg}>
              <Label text="KB시세" />
              <NumInput display={kbPrice} onChange={kbPriceChange} unit="" placeholder="예: 480" />
            </div>
            <div style={S.fg}>
              <Label text="감정가" />
              <NumInput display={appraisalPrice} onChange={appraisalPriceChange} unit="" placeholder="미입력 시 KB시세 적용" />
            </div>

            {noPriceInput && (
              <div style={S.inputError}>
                <span>🚫</span>
                <span>담보가액 계산을 위해 최소 1개의 가격 정보가 필요합니다</span>
              </div>
            )}
            {showKbWarning && (
              <div style={S.kbWarning}>
                <span>⚠️</span>
                <span>정확한 계산을 위해 KB시세 입력을 권장합니다</span>
              </div>
            )}

            <div style={S.row}>
              <div style={{ ...S.fg, flex: 1 }}>
                <Label text="지역" required />
                <Select value={region} onChange={setRegion} options={['규제지역', '비규제지역']} />
              </div>
              <div style={{ ...S.fg, flex: 1 }}>
                <Label text="주택 보유 수" required />
                <Select value={ownership} onChange={setOwnership} options={['무주택', '1주택', '다주택']} />
              </div>
            </div>

            <SectionHeader title="정책 혜택" />
            <div style={S.checkboxGroup}>
              <CheckItem label="생애최초 주택구입" checked={isFirstHome} onChange={setIsFirstHome}
                sub="LTV 80%" />
              <CheckItem label="신혼부부" checked={isNewlywed} onChange={setIsNewlywed}
                sub="금리 -0.3%" />
              <CheckItem label="청년 (만 19~34세)" checked={isYouth} onChange={setIsYouth}
                sub="금리 -0.2%" />
            </div>

            <SectionHeader title="대출 조건" />
            <div style={S.row}>
              <div style={{ ...S.fg, flex: 1 }}>
                <Label text="기본 금리" required />
                <div style={S.iw}>
                  <input style={S.inp} type="number" step="0.1" min="0" max="30"
                    placeholder="예: 4.5" value={baseRate} onChange={e => setBaseRate(e.target.value)} />
                  <span style={S.unit}>%</span>
                </div>
              </div>
              <div style={{ ...S.fg, flex: 1 }}>
                <Label text="대출 기간" required />
                <div style={S.iw}>
                  <input style={S.inp} type="number" min="1" max="50"
                    placeholder="예: 30" value={years} onChange={e => setYears(e.target.value)} />
                  <span style={S.unit}>년</span>
                </div>
              </div>
            </div>
          </section>

          {/* ── 결과 패널 ── */}
          <section style={isMobile ? S.cardMobile : S.card}>
            <h2 style={S.cardTitle}>계산 결과</h2>

            {!result ? (
              <div style={S.placeholder}>
                <div style={S.phIcon}>📊</div>
                <p style={S.phText}>필수 항목(*)을 입력하면<br />결과가 표시됩니다</p>
              </div>
            ) : (
              <>
                {/* 정책 설명 배지 */}
                {result.explanations.map((e, i) => <Alert key={i} type={e.type} text={e.text} />)}

                {/* 최대 대출 금액 */}
                <div style={S.mainBox}>
                  <div style={S.mainLabel}>최대 대출 가능 금액</div>
                  <div style={result.blocked ? S.mainValueBlocked : S.mainValue}>
                    {result.blocked ? '대출 불가' : formatKRW(result.finalAmount)}
                  </div>
                  {!result.blocked && (
                    <div style={S.mainSub}>월 상환액 {formatKRW(result.monthlyPayment)} · 원리금균등</div>
                  )}
                </div>

                {/* 4개 핵심 지표 */}
                <div style={S.summaryGrid}>
                  <SummaryItem
                    label="담보가액"
                    value={formatKRW(collateral?.value)}
                    sub={`${collateral?.source} 기준`} />
                  <SummaryItem
                    label="적용 LTV"
                    value={`${Math.round(result.ltvRatio * 100)}%`}
                    sub={isFirstHome ? '생애최초 특례' : `${region} · ${ownership}`} />
                  <SummaryItem
                    label="최종 금리"
                    value={`${result.finalRate.toFixed(2)}%`}
                    sub={result.rateDiscount < 0 ? `우대 ${result.rateDiscount}%p` : '우대 없음'}
                    highlight={result.rateDiscount < 0} />
                  <SummaryItem
                    label="DSR 한도"
                    value={`${Math.round(policyConfig.DSR * 100)}%`}
                    sub={`연 ${formatKRW(result.annualAllowable)}`} />
                </div>

                <div style={S.divider} />

                {/* 상세 분석 */}
                <div style={S.detailTitle}>상세 분석</div>

                <div style={S.detailCard}>
                  <div style={S.detailHeader}>
                    <span style={S.badgeGreen}>LTV</span>
                    <span style={S.detailHeaderLabel}>담보인정비율 기준</span>
                  </div>
                  <DetailRow label="담보가액" value={formatKRW(collateral?.value)} />
                  <DetailRow label={`LTV ${Math.round(result.ltvRatio * 100)}% 적용`}
                    value={formatKRW(result.ltvAmount)} valueColor="#059669" border />
                  {result.ltvCapped && (
                    <DetailRow label="생애최초 한도 상한 적용" value="6억원 (규제지역)" valueColor="#d97706" />
                  )}
                </div>

                <div style={S.detailCard}>
                  <div style={S.detailHeader}>
                    <span style={S.badgeBlue}>DSR</span>
                    <span style={S.detailHeaderLabel}>총부채원리금상환비율 기준</span>
                  </div>
                  <DetailRow label={`연간 상환 가능액 (소득 × ${Math.round(policyConfig.DSR * 100)}%)`}
                    value={formatKRW(result.annualAllowable)} />
                  <DetailRow label="기존 대출 연간 상환액"
                    value={result.existingAnnual > 0 ? `- ${formatKRW(result.existingAnnual)}` : '없음'}
                    valueColor={result.existingAnnual > 0 ? '#ef4444' : '#94a3b8'} />
                  <DetailRow label="신규 대출 월 상환 가능액"
                    value={result.remainingMonthly <= 0 ? '불가' : formatKRW(result.remainingMonthly)}
                    valueColor={result.remainingMonthly <= 0 ? '#ef4444' : '#0369a1'} />
                  <DetailRow label="DSR 기준 한도"
                    value={result.blocked ? '불가' : formatKRW(result.dsrAmount)}
                    valueColor="#1d4ed8" border />
                </div>

                {!result.blocked && (
                  <div style={S.limitBox}>
                    <span>{result.limitedBy === 'LTV' ? '🔒' : '📉'}</span>
                    <span style={S.limitText}>
                      <strong>{result.limitedBy}</strong> 기준이 최종 한도를 결정했습니다
                    </span>
                  </div>
                )}

                {salePriceNum > 0 && (
                  <div style={S.equityBox}>
                    <div style={S.equityTitle}>최종적으로 필요한 금액</div>
                    <DetailRow label="매매가" value={formatKRW(salePriceNum)} />
                    {!result.blocked && (
                      <DetailRow label="최대 대출금액"
                        value={`- ${formatKRW(result.finalAmount)}`}
                        valueColor="#ef4444" />
                    )}
                    <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
                    <div style={S.equityRow}>
                      <span style={S.equityLabel}>필요 자기자본</span>
                      <span style={S.equityValue}>
                        {result.blocked
                          ? formatKRW(salePriceNum)
                          : formatKRW(Math.max(0, salePriceNum - result.finalAmount))}
                      </span>
                    </div>
                    {!result.blocked && (
                      <>
                        <div style={{ height: 1, background: '#e2e8f0', margin: '8px 0' }} />
                        <DetailRow label="월 상환액" value={formatKRW(result.monthlyPayment)} />
                      </>
                    )}
                  </div>
                )}
              </>
            )}
          </section>
        </div>}

        <footer style={S.footer}>
          본 계산기는 참고용이며, 실제 대출 조건은 금융기관 심사 결과에 따라 달라질 수 있습니다.
        </footer>
      </div>

      <FavoritesPanel
        favorites={favorites}
        onLoadFavorite={handleLoadFavorite}
        onRemoveFavorite={handleRemoveFavorite}
        onSaveFavorite={handleSaveFavorite}
        salePriceNum={salePriceNum}
        isMobile={isMobile}
      />
    </div>
  )
}

// ── 서브 컴포넌트 ─────────────────────────────────────────────

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

function NumInput({ display: raw, onChange, unit, placeholder }) {
  const [focused, setFocused] = useState(false)
  const num       = raw === '' ? 0 : Math.round((parseFloat(raw) || 0) * 1_000_000)
  const formatted = num > 0 ? num.toLocaleString('ko-KR') : ''
  const splitAt   = formatted.length > 8 ? formatted.length - 8 : 0
  const typedPart = formatted.slice(0, splitAt)
  const ghostPart = formatted.slice(splitAt)

  return (
    <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
      <div style={{
        position: 'relative', flex: 1,
        background: '#f8fafc',
        border: `1.5px solid ${focused ? '#3b82f6' : '#e2e8f0'}`,
        borderRadius: 9,
        boxShadow: focused ? '0 0 0 3px rgba(59,130,246,0.15)' : 'none',
        transition: 'border-color 0.15s, box-shadow 0.15s',
      }}>
        {/* 실제 입력 - 텍스트 투명, 커서만 보임 */}
        <input
          style={{
            display: 'block', width: '100%',
            padding: '9px 52px 9px 12px', fontSize: 14,
            border: 'none', outline: 'none', background: 'transparent',
            color: 'transparent', caretColor: '#1a202c',
            fontFamily: 'inherit', boxSizing: 'border-box',
            position: 'relative', zIndex: 1,
          }}
          type="text" inputMode="decimal" placeholder=""
          value={raw} onChange={onChange}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          onKeyDown={e => { if (e.key === 'Enter') e.target.blur() }}
        />
        {/* 오버레이 - 포맷된 숫자 표시 */}
        <div style={{
          position: 'absolute', top: 0, left: 0, right: 0, bottom: 0,
          padding: '9px 52px 9px 12px',
          display: 'flex', alignItems: 'center',
          fontSize: 14, fontFamily: 'inherit', pointerEvents: 'none',
        }}>
          {raw ? (
            focused ? (
              <>
                <span style={{ color: '#1a202c' }}>{typedPart}</span>
                <span style={{ color: '#c8d3df' }}>{ghostPart}</span>
              </>
            ) : (
              <span style={{ color: '#1a202c' }}>{formatted}</span>
            )
          ) : (
            <span style={{ color: '#94a3b8' }}>{placeholder}</span>
          )}
        </div>
      </div>
      <span style={{
        position: 'absolute', right: 12,
        fontSize: 12, color: '#94a3b8', fontWeight: 500, pointerEvents: 'none',
      }}>{unit}</span>
    </div>
  )
}

function Select({ value, onChange, options }) {
  return (
    <select style={S.sel} value={value} onChange={e => onChange(e.target.value)}>
      {options.map(o => <option key={o} value={o}>{o}</option>)}
    </select>
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

function Alert({ type, text }) {
  const map = {
    success: { bg: '#f0fdf4', border: '#bbf7d0', color: '#166534' },
    warning: { bg: '#fffbeb', border: '#fde68a', color: '#92400e' },
    danger:  { bg: '#fef2f2', border: '#fecaca', color: '#991b1b' },
    info:    { bg: '#eff6ff', border: '#bfdbfe', color: '#1e40af' },
  }
  const icons = { success: '✅', warning: '⚠️', danger: '🚫', info: 'ℹ️' }
  const c = map[type]
  return (
    <div style={{ display: 'flex', gap: 10, padding: '11px 14px', borderRadius: 10,
      marginBottom: 10, fontSize: 13, lineHeight: 1.6,
      background: c.bg, border: `1px solid ${c.border}`, color: c.color }}>
      <span style={{ flexShrink: 0 }}>{icons[type]}</span>
      <span>{text}</span>
    </div>
  )
}

function SummaryItem({ label, value, sub, highlight }) {
  return (
    <div style={S.summaryItem}>
      <div style={S.summaryLabel}>{label}</div>
      <div style={{ ...S.summaryValue, color: highlight ? '#dc2626' : '#1a202c' }}>{value}</div>
      {sub && <div style={S.summarySub}>{sub}</div>}
    </div>
  )
}

function DetailRow({ label, value, valueColor, border }) {
  return (
    <div style={{
      ...S.detailRow,
      ...(border ? { borderTop: '1px dashed #e2e8f0', paddingTop: 10, marginTop: 6 } : {})
    }}>
      <span style={S.detailKey}>{label}</span>
      <span style={{ ...S.detailVal, ...(valueColor ? { color: valueColor } : {}) }}>{value}</span>
    </div>
  )
}

// ── 스타일 ────────────────────────────────────────────────────
const S = {
  page: {
    minHeight: '100vh',
    background: 'linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%)',
    padding: 0,
  },
  container: { maxWidth: 1140, margin: '0 auto', padding: '32px 16px' },
  header: { textAlign: 'center', marginBottom: 36 },
  headerMobile: { textAlign: 'center', marginBottom: 20 },
  headerIcon: { fontSize: 48, marginBottom: 12 },
  headerIconMobile: { fontSize: 36, marginBottom: 6 },
  title: { fontSize: 26, fontWeight: 700, color: '#1a202c', marginBottom: 8 },
  titleMobile: { fontSize: 20, fontWeight: 700, color: '#1a202c', marginBottom: 4 },
  subtitle: { fontSize: 14, color: '#64748b' },
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
    gap: 24,
    alignItems: 'start',
  },
  card: {
    background: '#fff',
    borderRadius: 20,
    padding: '28px',
    boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
  },
  cardMobile: {
    background: '#fff',
    borderRadius: 14,
    padding: '18px 16px',
    boxShadow: '0 2px 12px rgba(0,0,0,0.05)',
  },
  cardTitle: {
    fontSize: 17, fontWeight: 700, color: '#1a202c',
    marginBottom: 20, paddingBottom: 12, borderBottom: '2px solid #f1f5f9',
  },
  sectionHeader: {
    fontSize: 11, fontWeight: 700, letterSpacing: '0.08em',
    color: '#94a3b8', textTransform: 'uppercase',
    marginTop: 20, marginBottom: 12,
    paddingBottom: 6, borderBottom: '1px solid #f1f5f9',
  },
  fg: { marginBottom: 14 },
  row: { display: 'flex', gap: 12 },
  label: { display: 'block', fontSize: 12, fontWeight: 600, color: '#374151', marginBottom: 6 },
  req: { color: '#ef4444', marginLeft: 3 },
  iw: { position: 'relative', display: 'flex', alignItems: 'center' },
  inp: {
    width: '100%', padding: '9px 52px 9px 12px', fontSize: 14,
    border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none',
    color: '#1a202c', background: '#f8fafc', fontFamily: 'inherit', boxSizing: 'border-box',
  },
  unit: {
    position: 'absolute', right: 12, fontSize: 12,
    color: '#94a3b8', fontWeight: 500, pointerEvents: 'none',
  },
  sel: {
    width: '100%', padding: '9px 34px 9px 12px', fontSize: 14,
    border: '1.5px solid #e2e8f0', borderRadius: 9, outline: 'none',
    color: '#1a202c', cursor: 'pointer', fontFamily: 'inherit',
    appearance: 'none', boxSizing: 'border-box',
    background: `#f8fafc url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%2394a3b8' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E") no-repeat right 12px center`,
  },
  inputError: {
    display: 'flex', gap: 8, padding: '10px 14px',
    background: '#fef2f2', border: '1px solid #fecaca',
    borderRadius: 9, fontSize: 12, color: '#991b1b',
    marginBottom: 14, alignItems: 'flex-start', lineHeight: 1.5,
  },
  kbWarning: {
    display: 'flex', gap: 8, padding: '10px 14px',
    background: '#fffbeb', border: '1px solid #fde68a',
    borderRadius: 9, fontSize: 12, color: '#92400e',
    marginBottom: 14, alignItems: 'flex-start', lineHeight: 1.5,
  },
  checkboxGroup: {
    display: 'flex', flexDirection: 'column', gap: 12,
    padding: '14px', background: '#f8fafc',
    border: '1.5px solid #e2e8f0', borderRadius: 9,
  },
  checkItem: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  checkbox: { accentColor: '#3b82f6', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 },
  checkLabel: { fontSize: 13, color: '#374151', fontWeight: 500 },
  checkSub: {
    fontSize: 11, color: '#3b82f6', fontWeight: 600,
    background: '#eff6ff', borderRadius: 5, padding: '1px 7px', marginLeft: 2,
  },
  placeholder: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: 380, color: '#94a3b8',
  },
  phIcon: { fontSize: 52, marginBottom: 16, opacity: 0.5 },
  phText: { fontSize: 14, textAlign: 'center', lineHeight: 1.8 },
  mainBox: {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    borderRadius: 16, padding: '22px', marginBottom: 16, textAlign: 'center',
  },
  mainLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 8, fontWeight: 500 },
  mainValue: { fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 },
  mainValueBlocked: { fontSize: 26, fontWeight: 700, color: 'rgba(255,255,255,0.6)' },
  mainSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 },
  summaryGrid: {
    display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)',
    gap: 10, marginBottom: 20,
  },
  summaryItem: {
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 12, padding: '12px 14px',
  },
  summaryLabel: { fontSize: 11, color: '#94a3b8', fontWeight: 600, marginBottom: 5 },
  summaryValue: { fontSize: 19, fontWeight: 700, letterSpacing: '-0.01em' },
  summarySub: { fontSize: 11, color: '#94a3b8', marginTop: 3 },
  divider: { height: 1, background: '#f1f5f9', margin: '4px 0 18px' },
  detailTitle: { fontSize: 13, fontWeight: 700, color: '#374151', marginBottom: 12 },
  detailCard: {
    background: '#f8fafc', border: '1px solid #e2e8f0',
    borderRadius: 12, padding: '14px 16px', marginBottom: 12,
  },
  detailHeader: { display: 'flex', alignItems: 'center', gap: 8, marginBottom: 10 },
  detailHeaderLabel: { fontSize: 12, color: '#64748b', fontWeight: 500 },
  badgeGreen: {
    fontSize: 10, fontWeight: 700, color: '#059669',
    background: '#dcfce7', borderRadius: 6, padding: '2px 7px',
  },
  badgeBlue: {
    fontSize: 10, fontWeight: 700, color: '#1d4ed8',
    background: '#dbeafe', borderRadius: 6, padding: '2px 7px',
  },
  detailRow: {
    display: 'flex', justifyContent: 'space-between',
    alignItems: 'center', padding: '4px 0',
  },
  detailKey: { fontSize: 12, color: '#64748b' },
  detailVal: { fontSize: 12, fontWeight: 700, color: '#1a202c' },
  limitBox: {
    display: 'flex', alignItems: 'center', gap: 8,
    padding: '10px 14px', background: '#f1f5f9', borderRadius: 10,
  },
  limitText: { fontSize: 13, color: '#475569', fontWeight: 500 },
  equityBox: {
    marginTop: 16, background: '#f8fafc',
    border: '1.5px solid #e2e8f0', borderRadius: 14, padding: '16px',
  },
  equityTitle: {
    fontSize: 12, fontWeight: 700, color: '#64748b',
    marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.06em',
  },
  equityRow: { display: 'flex', justifyContent: 'space-between', alignItems: 'center' },
  equityLabel: { fontSize: 14, fontWeight: 700, color: '#1a202c' },
  equityValue: { fontSize: 22, fontWeight: 800, color: '#1e40af', letterSpacing: '-0.02em' },
  tabs: {
    display: 'flex', gap: 6, margin: '0 auto 28px',
    background: '#fff', borderRadius: 14, padding: 5,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: 'fit-content',
  },
  tabsMobile: {
    display: 'flex', gap: 4, margin: '0 0 16px',
    background: '#fff', borderRadius: 12, padding: 4,
    boxShadow: '0 2px 8px rgba(0,0,0,0.06)', width: '100%',
  },
  tab: {
    padding: '10px 22px', fontSize: 14, fontWeight: 600,
    border: 'none', borderRadius: 10, cursor: 'pointer',
    color: '#64748b', background: 'transparent', fontFamily: 'inherit',
  },
  tabActive: {
    padding: '10px 22px', fontSize: 14, fontWeight: 700,
    border: 'none', borderRadius: 10, cursor: 'pointer',
    color: '#1e40af', background: '#eff6ff', fontFamily: 'inherit',
  },
  footer: { textAlign: 'center', marginTop: 32, fontSize: 12, color: '#94a3b8' },
}
