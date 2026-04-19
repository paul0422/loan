import { taxConfig } from '../config/tax'

function getAcquisitionTaxRate(price, ownership, isAdjusted, config) {
  if (ownership === '다주택') {
    return isAdjusted ? config.취득세.조정지역_다주택 : config.취득세.다주택
  }
  const bracket = config.취득세.기본.find(b => price <= b.max) ?? config.취득세.기본.at(-1)
  return bracket.rate
}

function getAgentFeeRate(price, config) {
  const bracket = config.중개수수료.find(b => price <= b.max) ?? config.중개수수료.at(-1)
  return bracket.rate
}

export function calcPurchaseCost({ price, ownership, isAdjusted }, config = taxConfig) {
  if (!price || price <= 0) return null

  const acquisitionRate = getAcquisitionTaxRate(price, ownership, isAdjusted, config)
  const acquisitionTax  = price * acquisitionRate
  const ruralTax        = price * config.농어촌특별세율
  const educationTax    = acquisitionTax * config.지방교육세율
  const agentFeeRate    = getAgentFeeRate(price, config)
  const agentFee        = price * agentFeeRate
  const otherCosts      = config.법무사비 + config.기타비용
  const total           = acquisitionTax + ruralTax + educationTax + agentFee + otherCosts

  return {
    acquisitionTax, acquisitionRate,
    ruralTax, educationTax,
    agentFee, agentFeeRate,
    lawyerFee: config.법무사비,
    miscFee:   config.기타비용,
    total,
  }
}
