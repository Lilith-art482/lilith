export function getConditionLabel(condition: string): string {
  const labels: Record<string, string> = {
    temperature_above_30c: ">30°C",
    temperature_below_0c: "<0°C",
    rain_probability_above_50: "Rain >50%",
  }
  return labels[condition] || condition
}

export function formatTemperature(temp: number): string {
  return `${Math.round(temp)}°C`
}

export function formatProbability(prob: number): string {
  return `${(prob * 100).toFixed(1)}%`
}

export function formatEdge(edge: number): string {
  const sign = edge > 0 ? "+" : ""
  return `${sign}${(edge * 100).toFixed(2)}%`
}

export interface SignalRow {
  id: number
  cityId: number
  cityName: string
  country: string
  condition: string
  conditionLabel: string
  myProbability: number
  marketPrice: number
  edge: number
  timestamp: string
}

export function signalToRow(signal: {
  id: number
  cityId: number
  myProbability: number
  marketPrice: number
  edge: number
  timestamp: Date | string
  city: { name: string; country: string }
  market: { condition: string }
}): SignalRow {
  return {
    id: signal.id,
    cityId: signal.cityId,
    cityName: signal.city.name,
    country: signal.city.country,
    condition: signal.market.condition,
    conditionLabel: getConditionLabel(signal.market.condition),
    myProbability: signal.myProbability,
    marketPrice: signal.marketPrice,
    edge: signal.edge,
    timestamp: new Date(signal.timestamp).toISOString(),
  }
}
