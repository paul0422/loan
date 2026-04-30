import { useEffect, useRef } from 'react'

// ⚠️ 카카오 애드핏 승인 후 발급받은 광고 unit ID로 교체하세요
// PC용 (728x90) 과 모바일용 (320x100) 두 개를 만들어야 함
const AD_UNITS = {
  pc:     'YOUR_PC_UNIT_ID',     // 예: 'DAN-xxxxxxxxxxxxxxxx'
  mobile: 'YOUR_MOBILE_UNIT_ID', // 예: 'DAN-yyyyyyyyyyyyyyyy'
}

const AD_SIZES = {
  pc:     { w: 728, h: 90  },
  mobile: { w: 320, h: 100 },
}

export default function AdSlot() {
  const isMobile = typeof window !== 'undefined' && window.innerWidth < 768
  const variant  = isMobile ? 'mobile' : 'pc'
  const unitId   = AD_UNITS[variant]
  const { w, h } = AD_SIZES[variant]
  const insRef   = useRef(null)

  useEffect(() => {
    // 광고 unit ID가 아직 placeholder면 광고 호출 X (개발용 표시만)
    if (!unitId || unitId.startsWith('YOUR_')) return
    // 카카오 애드핏 스크립트가 자동으로 .kakao_ad_area를 찾아 렌더링
  }, [unitId])

  // 미승인 상태에서는 안내 박스만 표시
  if (!unitId || unitId.startsWith('YOUR_')) {
    return (
      <div style={{
        ...placeholderStyle,
        width: w, height: h,
      }}>
        📢 광고 영역 ({w}×{h})<br />
        <span style={{ fontSize: 10, color: '#94a3b8' }}>
          애드핏 승인 후 unit ID 입력 필요
        </span>
      </div>
    )
  }

  return (
    <div style={{ display: 'flex', justifyContent: 'center', margin: '20px 0' }}>
      <ins
        ref={insRef}
        className="kakao_ad_area"
        style={{ display: 'none' }}
        data-ad-unit={unitId}
        data-ad-width={String(w)}
        data-ad-height={String(h)}
      />
    </div>
  )
}

const placeholderStyle = {
  margin: '20px auto',
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  background: '#f8fafc',
  border: '1px dashed #cbd5e1',
  borderRadius: 8,
  color: '#64748b',
  fontSize: 12,
  textAlign: 'center',
  lineHeight: 1.6,
}
