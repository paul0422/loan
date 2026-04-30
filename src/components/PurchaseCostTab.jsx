import { useState, useMemo } from 'react'
import { calcPurchaseCost } from '../lib/calcPurchaseCost'

function formatKRW(v) {
  if (!v || isNaN(v)) return '-'
  return '₩' + Math.round(v).toLocaleString('ko-KR')
}

function useMillionInput(initialValue = '') {
  const [raw, setRaw] = useState(initialValue)
  const num    = raw === '' ? 0 : Math.round((parseFloat(raw) || 0) * 1_000_000)
  const onChange = e => setRaw(e.target.value.replace(/[^0-9.]/g, ''))
  return [raw, onChange, num]
}

function MoneyInput({ raw, onChange, unit, placeholder }) {
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

const AREA_PRESETS = [
  { label: '59㎡ (약 18평)',  value: '59'  },
  { label: '74㎡ (약 22평)',  value: '74'  },
  { label: '84㎡ (약 25평)',  value: '84'  },
  { label: '102㎡ (약 31평)', value: '102' },
  { label: '112㎡ (약 34평)', value: '112' },
  { label: '135㎡ (약 41평)', value: '135' },
  { label: '직접 입력',        value: 'custom' },
]

const CHART_COLORS = {
  취득세:      '#3b82f6',
  농어촌특별세: '#8b5cf6',
  지방교육세:  '#06b6d4',
  중개수수료:  '#f59e0b',
  법무사비:    '#10b981',
  기타비용:    '#94a3b8',
}

export default function PurchaseCostTab({ defaultPrice = 0 }) {
  const defaultRaw = defaultPrice > 0 ? Math.round(defaultPrice / 1_000_000).toString() : ''
  const [price, priceChange, priceNum] = useMillionInput(defaultRaw)
  const [houseType, setHouseType]      = useState('아파트')
  const [areaOption, setAreaOption]    = useState('84')
  const [customArea, setCustomArea]    = useState('')
  const area = areaOption === 'custom' ? customArea : areaOption
  const [ownership, setOwnership]      = useState('무주택')
  const [isFirstHome, setIsFirstHome]  = useState(false)
  const [isAdjusted, setIsAdjusted]    = useState(false)

  const result = useMemo(
    () => calcPurchaseCost({ price: priceNum, ownership, isAdjusted, houseType, area, isFirstHome }),
    [priceNum, ownership, isAdjusted, houseType, area, isFirstHome]
  )

  const acquisitionDesc = result
    ? result.isOfficetel
      ? '오피스텔 4% 적용'
      : result.firstHomeDiscount > 0
        ? `${(result.acquisitionRate * 100).toFixed(2)}% 적용 · 생애최초 ${formatKRW(result.firstHomeDiscount)} 감면`
        : `${(result.acquisitionRate * 100).toFixed(2)}% 적용 · 주택가격 및 보유 주택 수 기준`
    : ''

  const ruralDesc = result
    ? result.isRuralTaxExempt
      ? '전용 85㎡ 이하 주택 비과세'
      : result.isOfficetel
        ? '오피스텔 0.2% 부과 (면적 무관)'
        : '주택가격의 0.2% (전용 85㎡ 초과)'
    : ''

  const items = result
    ? [
        {
          label: '취득세',
          value: result.acquisitionTax,
          desc: acquisitionDesc,
        },
        {
          label: '농어촌특별세',
          value: result.ruralTax,
          desc: ruralDesc,
        },
        {
          label: '지방교육세',
          value: result.educationTax,
          desc: '취득세의 10%',
        },
        {
          label: '중개수수료',
          value: result.agentFee,
          desc: `${(result.agentFeeRate * 1000).toFixed(1)}‰ 적용 · 법정 상한 요율`,
        },
        {
          label: '법무사비',
          value: result.lawyerFee,
          desc: '등기 이전 등 법무 비용 (예상)',
        },
        {
          label: '기타비용',
          value: result.miscFee,
          desc: '이사비 등 예상 부대비용',
        },
      ]
    : []

  return (
    <div style={S.grid}>
      {/* ── 입력 패널 ── */}
      <section style={S.card}>
        <h2 style={S.cardTitle}>입력 정보</h2>

        <div style={S.sectionHeader}>주택 정보</div>
        <div style={S.fg}>
          <Label text="주택 가격" required />
          <MoneyInput raw={price} onChange={priceChange} unit="" placeholder="예: 500" />
        </div>
        <div style={S.row}>
          <div style={{ ...S.fg, flex: 1 }}>
            <Label text="주택 종류" />
            <select style={S.sel} value={houseType} onChange={e => setHouseType(e.target.value)}>
              {['아파트', '빌라', '오피스텔'].map(v => <option key={v}>{v}</option>)}
            </select>
          </div>
          <div style={{ ...S.fg, flex: 1 }}>
            <Label text="전용면적" />
            <select style={S.sel} value={areaOption}
              onChange={e => { setAreaOption(e.target.value); setCustomArea('') }}>
              {AREA_PRESETS.map(o => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            {areaOption === 'custom' && (
              <div style={{ ...S.iw, marginTop: 8 }}>
                <input style={S.inp} type="number" min="0" placeholder="면적 직접 입력"
                  value={customArea} onChange={e => setCustomArea(e.target.value)} />
                <span style={S.unit}>㎡</span>
              </div>
            )}
          </div>
        </div>

        <div style={S.sectionHeader}>구매자 정보</div>
        <div style={S.fg}>
          <Label text="주택 보유 수" required />
          <select style={S.sel} value={ownership} onChange={e => setOwnership(e.target.value)}>
            {['무주택', '1주택', '다주택'].map(v => <option key={v}>{v}</option>)}
          </select>
        </div>
        <div style={S.checkboxGroup}>
          <CheckItem label="생애최초 주택구입" sub="취득세 감면 혜택"
            checked={isFirstHome} onChange={setIsFirstHome} />
          <CheckItem label="조정대상지역" sub="다주택 취득세 12%"
            checked={isAdjusted} onChange={setIsAdjusted} />
        </div>

        {isFirstHome && (
          <div style={S.infoBox}>
            <span style={{ flexShrink: 0 }}>ℹ️</span>
            <span>
              생애최초 주택구입 취득세 감면(12억 이하, 200만원 한도)이 자동 반영됩니다.
              오피스텔·다주택은 적용되지 않으며, 3년 실거주 의무가 있습니다.
            </span>
          </div>
        )}
        {houseType === '오피스텔' && (
          <div style={S.infoBox}>
            <span style={{ flexShrink: 0 }}>ℹ️</span>
            <span>오피스텔은 취득세 4% 단일 세율이 적용되며, 생애최초 감면 대상이 아닙니다.</span>
          </div>
        )}
      </section>

      {/* ── 결과 패널 ── */}
      <section style={S.card}>
        <h2 style={S.cardTitle}>구매 비용 내역</h2>

        {!result ? (
          <div style={S.placeholder}>
            <div style={S.phIcon}>🧾</div>
            <p style={S.phText}>주택 가격을 입력하면<br />비용 내역이 표시됩니다</p>
          </div>
        ) : (
          <>
            {/* 총 비용 */}
            <div style={S.mainBox}>
              <div style={S.mainLabel}>총 구매 부대비용</div>
              <div style={S.mainValue}>{formatKRW(result.total)}</div>
              <div style={S.mainSub}>
                주택가격 포함 실 지출 {formatKRW(priceNum + result.total)}
              </div>
            </div>

            {/* 항목별 내역 */}
            <div style={S.breakdownList}>
              {items.map(item => (
                <div key={item.label} style={S.breakdownItem}>
                  <div style={S.breakdownLeft}>
                    <div style={{ ...S.breakdownDot, background: CHART_COLORS[item.label] }} />
                    <div>
                      <div style={S.breakdownLabel}>{item.label}</div>
                      <div style={S.breakdownDesc}>{item.desc}</div>
                    </div>
                  </div>
                  <div style={S.breakdownRight}>{formatKRW(item.value)}</div>
                </div>
              ))}
            </div>

            <div style={S.divider} />

            {/* 비율 차트 */}
            <div style={S.chartTitle}>비용 구성 비율</div>
            <div style={S.chartBar}>
              {items.map(item => {
                const pct = (item.value / result.total) * 100
                return (
                  <div key={item.label}
                    title={`${item.label} ${pct.toFixed(1)}%`}
                    style={{ flex: pct, background: CHART_COLORS[item.label], minWidth: 2 }} />
                )
              })}
            </div>
            <div style={S.chartLegend}>
              {items.map(item => (
                <div key={item.label} style={S.legendItem}>
                  <div style={{ ...S.legendDot, background: CHART_COLORS[item.label] }} />
                  <span style={S.legendLabel}>{item.label}</span>
                  <span style={S.legendPct}>
                    {((item.value / result.total) * 100).toFixed(1)}%
                  </span>
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </div>
  )
}

function Label({ text, required }) {
  return (
    <label style={S.label}>
      {text}{required && <span style={S.req}>*</span>}
    </label>
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

const S = {
  grid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(460px, 1fr))',
    gap: 24,
    alignItems: 'start',
  },
  card: {
    background: '#fff', borderRadius: 20,
    padding: '28px', boxShadow: '0 4px 24px rgba(0,0,0,0.07)',
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
  checkboxGroup: {
    display: 'flex', flexDirection: 'column', gap: 12,
    padding: '14px', background: '#f8fafc',
    border: '1.5px solid #e2e8f0', borderRadius: 9, marginBottom: 14,
  },
  checkItem: { display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer' },
  checkbox: { accentColor: '#3b82f6', width: 15, height: 15, cursor: 'pointer', flexShrink: 0 },
  checkLabel: { fontSize: 13, color: '#374151', fontWeight: 500 },
  checkSub: {
    fontSize: 11, color: '#3b82f6', fontWeight: 600,
    background: '#eff6ff', borderRadius: 5, padding: '1px 7px', marginLeft: 2,
  },
  infoBox: {
    display: 'flex', gap: 8, padding: '10px 14px',
    background: '#eff6ff', border: '1px solid #bfdbfe',
    borderRadius: 9, fontSize: 12, color: '#1e40af',
    alignItems: 'flex-start', lineHeight: 1.5,
    marginBottom: 8,
  },
  placeholder: {
    display: 'flex', flexDirection: 'column',
    alignItems: 'center', justifyContent: 'center',
    minHeight: 360, color: '#94a3b8',
  },
  phIcon: { fontSize: 52, marginBottom: 16, opacity: 0.5 },
  phText: { fontSize: 14, textAlign: 'center', lineHeight: 1.8 },
  mainBox: {
    background: 'linear-gradient(135deg, #1e40af 0%, #3b82f6 100%)',
    borderRadius: 16, padding: '22px', marginBottom: 20, textAlign: 'center',
  },
  mainLabel: { fontSize: 12, color: 'rgba(255,255,255,0.8)', marginBottom: 8, fontWeight: 500 },
  mainValue: { fontSize: 30, fontWeight: 700, color: '#fff', letterSpacing: '-0.02em', marginBottom: 8 },
  mainSub: { fontSize: 12, color: 'rgba(255,255,255,0.75)', fontWeight: 500 },
  breakdownList: { display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 20 },
  breakdownItem: {
    display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    padding: '11px 14px', background: '#f8fafc',
    border: '1px solid #e2e8f0', borderRadius: 10,
  },
  breakdownLeft: { display: 'flex', alignItems: 'center', gap: 10 },
  breakdownDot: { width: 10, height: 10, borderRadius: '50%', flexShrink: 0 },
  breakdownLabel: { fontSize: 13, fontWeight: 600, color: '#1a202c' },
  breakdownDesc: { fontSize: 11, color: '#94a3b8', marginTop: 2 },
  breakdownRight: { fontSize: 14, fontWeight: 700, color: '#1a202c', flexShrink: 0 },
  divider: { height: 1, background: '#f1f5f9', margin: '4px 0 16px' },
  chartTitle: { fontSize: 12, fontWeight: 700, color: '#64748b', marginBottom: 8 },
  chartBar: {
    display: 'flex', height: 18, borderRadius: 9,
    overflow: 'hidden', gap: 1, marginBottom: 12,
  },
  chartLegend: { display: 'flex', flexWrap: 'wrap', gap: '6px 14px' },
  legendItem: { display: 'flex', alignItems: 'center', gap: 5 },
  legendDot: { width: 8, height: 8, borderRadius: '50%', flexShrink: 0 },
  legendLabel: { fontSize: 11, color: '#64748b', fontWeight: 500 },
  legendPct: { fontSize: 11, color: '#94a3b8' },
}
