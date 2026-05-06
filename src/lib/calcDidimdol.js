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

function getIncomeBracket(incomeMan) {
  if (incomeMan <= 2000) return 0
  if (incomeMan <= 4000) return 1
  if (incomeMan <= 7000) return 2
  return 3
}

export function getIncomeLimit({ isNewlywed, isFirstHome, children }) {
  if (isNewlywed) return 8500
  if (isFirstHome || children >= 2) return 7000
  return 6000
}

export function getLoanCap({ isNewlywed, isFirstHome, children }) {
  if (isNewlywed || children >= 2) return 400_000_000
  if (isFirstHome) return 300_000_000
  return 250_000_000
}

export function calcDidimdol({ incomeMan, collateralValue, years, isFirstHome, isNewlywed, children, isSingleParent, isRegional }) {
  const incomeLimit = getIncomeLimit({ isNewlywed, isFirstHome, children })
  if (incomeMan > incomeLimit) return { ineligible: true, reason: `소득 초과 (한도: ${incomeLimit.toLocaleString()}만원)` }
  if (collateralValue > 500_000_000) return { ineligible: true, reason: '주택가격 5억원 초과' }

  const rateType = (isFirstHome || isNewlywed) ? '우대' : '일반'
  const bracket  = getIncomeBracket(incomeMan)
  const baseRate = RATES[rateType][years][bracket]

  let discount = 0
  const discounts = []
  if (children >= 3)      { discount += 0.7; discounts.push('3자녀 이상 -0.7%p') }
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
