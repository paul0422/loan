import { useState } from 'react'
import CompareTab from './components/CompareTab'
import PurchaseCostTab from './components/PurchaseCostTab'
import GuideTab from './components/GuideTab'
import { useIsMobile } from './lib/useIsMobile'

export default function App() {
  const [activeTab, setActiveTab] = useState('compare')
  const [sharedSalePrice, setSharedSalePrice] = useState(0)
  const isMobile = useIsMobile()

  const tabs = [
    { key: 'compare', label: isMobile ? '⚖️ 비교' : '⚖️ 대출 상품 비교' },
    { key: 'cost',    label: isMobile ? '🧾 비용' : '🧾 구매 비용 계산' },
    { key: 'guide',   label: isMobile ? '📖 가이드' : '📖 사용 가이드' },
  ]

  return (
    <div style={{ minHeight: '100vh', background: 'linear-gradient(135deg, #f0f4f8 0%, #e8edf5 100%)' }}>
      <div style={{ maxWidth: 1200, margin: '0 auto', padding: isMobile ? '20px 12px 24px' : '32px 16px' }}>

        <header style={{ textAlign: 'center', marginBottom: isMobile ? 20 : 36 }}>
          <div style={{ fontSize: isMobile ? 36 : 48, marginBottom: isMobile ? 6 : 12 }}>🏠</div>
          <h1 style={{ fontSize: isMobile ? 20 : 26, fontWeight: 700, color: '#1a202c', marginBottom: isMobile ? 4 : 8 }}>
            🧮 주담대 계산기
          </h1>
          <p style={{ fontSize: 14, color: '#64748b' }}>대출 한도 · 구매 비용을 한 번에 계산합니다</p>
        </header>

        <div style={{
          display: 'flex', gap: isMobile ? 4 : 6,
          margin: isMobile ? '0 0 16px' : '0 auto 28px',
          background: '#fff', borderRadius: isMobile ? 12 : 14, padding: isMobile ? 4 : 5,
          boxShadow: '0 2px 8px rgba(0,0,0,0.06)',
          width: isMobile ? '100%' : 'fit-content',
        }}>
          {tabs.map(t => (
            <button key={t.key}
              style={{
                padding: isMobile ? '10px 8px' : '10px 22px',
                fontSize: isMobile ? 13 : 14,
                fontWeight: activeTab === t.key ? 700 : 600,
                border: 'none', borderRadius: 10, cursor: 'pointer',
                color: activeTab === t.key ? '#1e40af' : '#64748b',
                background: activeTab === t.key ? '#eff6ff' : 'transparent',
                fontFamily: 'inherit',
                ...(isMobile ? { flex: 1 } : {}),
              }}
              onClick={() => setActiveTab(t.key)}>
              {t.label}
            </button>
          ))}
        </div>

        {activeTab === 'compare' && <CompareTab isMobile={isMobile} onSalePriceChange={setSharedSalePrice} />}
        {activeTab === 'cost'    && <PurchaseCostTab defaultPrice={sharedSalePrice} isMobile={isMobile} />}
        {activeTab === 'guide'   && <GuideTab isMobile={isMobile} />}

        <footer style={{ textAlign: 'center', marginTop: 32, fontSize: 12, color: '#94a3b8' }}>
          본 계산기는 참고용이며, 실제 대출 조건은 금융기관 심사 결과에 따라 달라질 수 있습니다.
        </footer>
      </div>
    </div>
  )
}
