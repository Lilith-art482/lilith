const TARGET_TEMPERATURE_THRESHOLD = 30

export function calculateMyProbability(
  forecastTemperatures: number[],
  historicalStdDev: number,
  targetThreshold: number = TARGET_TEMPERATURE_THRESHOLD
): number {
  if (forecastTemperatures.length === 0) return 0.5

  const avgTemp = forecastTemperatures.reduce((a, b) => a + b, 0) / forecastTemperatures.length
  const effectiveStdDev = Math.max(historicalStdDev, 1)

  const zScore = (targetThreshold - avgTemp) / effectiveStdDev
  const probability = 1 - normalCDF(zScore)

  return Math.round(Math.max(0, Math.min(1, probability)) * 10000) / 10000
}

function normalCDF(x: number): number {
  const a1 = 0.254829592
  const a2 = -0.284496736
  const a3 = 1.421413741
  const a4 = -1.453152027
  const a5 = 1.061405429
  const p = 0.3275911

  const sign = x < 0 ? -1 : 1
  x = Math.abs(x) / Math.sqrt(2)

  const t = 1 / (1 + p * x)
  const y = 1 - (((((a5 * t + a4) * t) + a3) * t + a2) * t + a1) * t * Math.exp(-x * x)

  return 0.5 * (1 + sign * y)
}

export function calculateEdge(myProbability: number, marketPrice: number): number {
  return Math.round((myProbability - marketPrice) * 10000) / 10000
}
