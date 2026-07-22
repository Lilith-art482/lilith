const POLYMARKET_CLOB_API = "https://clob.polymarket.com"

interface PolymarketMarket {
  condition_id: string
  question: string
  outcomes: string[]
  outcome_prices: string[]
  volume: string
}

interface PolymarketPrice {
  marketId: string
  price: number
  timestamp: Date
}

export async function getMarketPrices(slug: string): Promise<PolymarketPrice | null> {
  try {
    const url = `${POLYMARKET_CLOB_API}/markets?slug=${encodeURIComponent(slug)}`
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    })

    if (!response.ok) return null

    const markets: PolymarketMarket[] = await response.json()
    if (markets.length === 0) return null

    const market = markets[0]
    const prices = market.outcome_prices.map(Number)
    const yesPrice = prices[0] ?? 0

    return {
      marketId: market.condition_id,
      price: yesPrice,
      timestamp: new Date(),
    }
  } catch {
    return null
  }
}

export async function searchMarkets(query: string): Promise<PolymarketMarket[]> {
  try {
    const url = `${POLYMARKET_CLOB_API}/markets?limit=10&search=${encodeURIComponent(query)}`
    const response = await fetch(url, {
      headers: { Accept: "application/json" },
    })

    if (!response.ok) return []

    return await response.json()
  } catch {
    return []
  }
}

export const MARKET_TEMPLATES = [
  { condition: "temperature_above_30c", description: "Temperature above 30°C" },
  { condition: "temperature_below_0c", description: "Temperature below 0°C" },
  { condition: "rain_probability_above_50", description: "Rain probability above 50%" },
]
