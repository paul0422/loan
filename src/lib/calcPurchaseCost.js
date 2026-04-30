import { taxConfig } from '../config/tax'

function getAcquisitionTaxRate({ price, ownership, isAdjusted, isOfficetel }, config) {
  if (isOfficetel) return config.취득세.오피스텔

  if (ownership === '다주택') {
    return isAdjusted ? config.취득세.조정지역_다주택 : config.취득세.다주택
  }

  const { 이하_6억, 초과_9억, 누진_6억, 누진_9억 } = config.취득세.주택
  if (price <= 누진_6억) return 이하_6억
  if (price >= 누진_9억) return 초과_9억

  // 6~9억 누진 공식: 세율(%) = (취득가억원 × 2/3) - 3
  const billions = price / 100_000_000
  const ratePercent = billions * (2 / 3) - 3
  return ratePercent / 100
}

function getAgentFeeRate(price, config) {
  const bracket = config.중개수수료.find(b => price <= b.max) ?? config.중개수수료.at(-1)
  return bracket.rate
}

export function calcPurchaseCost(
  { price, ownership, isAdjusted, houseType = '아파트', area, isFirstHome = false },
  config = taxConfig,
) {
  if (!price || price <= 0) return null

  const isOfficetel = houseType === '오피스텔'
  const acquisitionRate = getAcquisitionTaxRate({ price, ownership, isAdjusted, isOfficetel }, config)
  let acquisitionTax = price * acquisitionRate

  // 농어촌특별세: 오피스텔은 면적 무관 부과 / 주택은 85㎡ 초과 시 부과
  const areaNum = area ? parseFloat(area) : 0
  const isRuralTaxExempt = !isOfficetel && areaNum > 0 && areaNum <= config.농특세_면제면적
  let ruralTax = isRuralTaxExempt ? 0 : price * config.농어촌특별세율

  let educationTax = acquisitionTax * config.지방교육세율

  // 생애최초 주택구입 취득세 감면: 12억 이하 주택, 다주택/오피스텔 제외
  let firstHomeDiscount = 0
  const eligibleForFirstHome =
    isFirstHome &&
    !isOfficetel &&
    ownership !== '다주택' &&
    price <= config.생애최초감면.가격상한
  if (eligibleForFirstHome) {
    firstHomeDiscount = Math.min(acquisitionTax, config.생애최초감면.감면한도)
    acquisitionTax -= firstHomeDiscount
    educationTax = acquisitionTax * config.지방교육세율
  }

  const agentFeeRate = getAgentFeeRate(price, config)
  const agentFee = price * agentFeeRate
  const otherCosts = config.법무사비 + config.기타비용
  const total = acquisitionTax + ruralTax + educationTax + agentFee + otherCosts

  return {
    acquisitionTax, acquisitionRate,
    ruralTax, educationTax,
    agentFee, agentFeeRate,
    lawyerFee: config.법무사비,
    miscFee:   config.기타비용,
    firstHomeDiscount,
    isOfficetel,
    isRuralTaxExempt,
    total,
  }
}
