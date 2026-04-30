import { useEffect, useRef } from 'react'

// 카카오 애드핏 광고 unit ID (없으면 광고 미노출)
const AD_UNITS = {
  pc:     '',                       // PC용 미등록
  mobile: 'DAN-TPSBOFwnI3qKHtTt',   // 모바일 320x100
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
    if (!unitId) return
    // 카카오 애드핏 스크립트가 자동으로 .kakao_ad_area를 찾아 렌더링
  }, [unitId])

  // unit ID 없으면 아무것도 그리지 않음 (PC에서 PC unit 미등록 시 등)
  if (!unitId) return null

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
