const PRICE_LABELS = {
  salePrice:      '매매가',
  kbPrice:        'KB시세',
  appraisalPrice: '감정가',
}

// 담보가액 결정: 입력된 값 중 가장 낮은 값 (실제 은행 방식)
export function calculateCollateralValue({ appraisalPrice, kbPrice, salePrice }) {
  const candidates = [
    { key: 'salePrice',      value: salePrice      },
    { key: 'kbPrice',        value: kbPrice        },
    { key: 'appraisalPrice', value: appraisalPrice },
  ].filter(({ value }) => value != null && value > 0)

  if (candidates.length === 0) return null

  const min = candidates.reduce((a, b) => a.value <= b.value ? a : b)
  return { value: min.value, source: PRICE_LABELS[min.key] }
}

// 하위 호환용 alias
export const resolveCollateralValue = calculateCollateralValue

// 향후 실거래가 API 연동 시 이 함수만 교체
export async function getMarketPrice(address) {
  // const res = await fetch(`/api/kb-price?address=${encodeURIComponent(address)}`)
  // return await res.json()
  return null
}
