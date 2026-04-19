import { policyConfig } from '../config/policy'

export function calcLoan(inputs, policy = policyConfig) {
  const {
    income, existingLoan, collateralValue,
    region, ownership,
    isFirstHome, isNewlywed, isYouth,
    baseRate, years,
  } = inputs

  const explanations = []

  // 1. LTV 계산
  let ltvRatio
  if (isFirstHome) {
    ltvRatio = policy.LTV.생애최초
    explanations.push({ type: 'success', text: '생애최초 혜택으로 LTV 80% 적용' })
  } else {
    ltvRatio = policy.LTV[region][ownership]
  }
  const ltvAmount = collateralValue * ltvRatio

  // 2. 금리 우대 계산
  let rateDiscount = 0
  if (isNewlywed) {
    rateDiscount += policy.금리우대.신혼부부
    explanations.push({ type: 'success', text: `신혼부부 금리 우대 적용 (${policy.금리우대.신혼부부}%)` })
  }
  if (isYouth) {
    rateDiscount += policy.금리우대.청년
    explanations.push({ type: 'success', text: `청년 금리 우대 적용 (${policy.금리우대.청년}%)` })
  }
  const finalRate = Math.max(0.1, baseRate + rateDiscount)

  // 3. DSR 계산
  const annualAllowable = income * policy.DSR
  const existingAnnual  = existingLoan * 12
  const remainingMonthly = (annualAllowable - existingAnnual) / 12
  const monthlyRate = finalRate / 100 / 12
  const months = years * 12

  // 4. DSR 기준 최대 대출 (원리금균등)
  let dsrAmount = 0
  if (remainingMonthly > 0 && months > 0) {
    dsrAmount = monthlyRate === 0
      ? remainingMonthly * months
      : remainingMonthly * (Math.pow(1 + monthlyRate, months) - 1) /
        (monthlyRate * Math.pow(1 + monthlyRate, months))
  }

  // 5. 최종 한도 = min(LTV, DSR)
  const blocked     = remainingMonthly <= 0
  const finalAmount = blocked ? 0 : Math.min(ltvAmount, Math.max(0, dsrAmount))
  const limitedBy   = ltvAmount <= dsrAmount ? 'LTV' : 'DSR'

  // 6. 월 상환액 (원리금균등)
  let monthlyPayment = null
  if (finalAmount > 0 && months > 0) {
    monthlyPayment = monthlyRate === 0
      ? finalAmount / months
      : finalAmount * monthlyRate * Math.pow(1 + monthlyRate, months) /
        (Math.pow(1 + monthlyRate, months) - 1)
  }

  // 7. 설명 추가
  if (blocked) {
    explanations.push({ type: 'danger',  text: 'DSR 초과: 기존 대출 상환액이 연소득의 40%를 이미 초과했습니다.' })
  } else if (limitedBy === 'DSR') {
    explanations.push({ type: 'warning', text: 'DSR 규제로 대출 한도가 제한되었습니다.' })
  } else {
    explanations.push({ type: 'info',    text: 'LTV 기준으로 대출 한도가 결정되었습니다.' })
  }

  return {
    ltvRatio, ltvAmount,
    dsrAmount: Math.max(0, dsrAmount),
    finalRate, rateDiscount, finalAmount,
    monthlyPayment, annualAllowable,
    existingAnnual, remainingMonthly,
    blocked, limitedBy, explanations,
  }
}
