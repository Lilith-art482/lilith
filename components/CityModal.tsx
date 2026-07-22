"use client"

import { useState, useEffect } from "react"
import WeatherChart from "@/components/WeatherChart"
import PriceChart from "@/components/PriceChart"

interface ModalProps {
  cityId: number
  cityName: string
  onClose: () => void
}

interface WeatherRecord {
  timestamp: string
  temperature: number
  humidity: number | null
  precipitationProbability: number | null
}

interface MarketWithPrices {
  id: number
  description: string
  condition: string
  prices: { timestamp: string; price: number }[]
}

export default function CityModal({ cityId, cityName, onClose }: ModalProps) {
  const [weatherData, setWeatherData] = useState<WeatherRecord[]>([])
  const [markets, setMarkets] = useState<MarketWithPrices[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function load() {
      try {
        const [weatherRes, marketsRes] = await Promise.all([
          fetch(`/api/weather?cityId=${cityId}`),
          fetch(`/api/markets?cityId=${cityId}`),
        ])

        if (!weatherRes.ok || !marketsRes.ok) {
          throw new Error("Failed to load data")
        }

        const weather = await weatherRes.json()
        const markets = await marketsRes.json()

        setWeatherData(weather)
        setMarkets(markets)
      } catch (err) {
        setError(err instanceof Error ? err.message : "Unknown error")
      } finally {
        setLoading(false)
      }
    }

    load()
  }, [cityId])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70" onClick={onClose}>
      <div
        className="bg-gray-900 rounded-xl w-full max-w-4xl max-h-[90vh] overflow-y-auto mx-4 p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold text-white">{cityName}</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white text-xl p-2">
            ✕
          </button>
        </div>

        {loading && (
          <div className="flex justify-center py-12">
            <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full" />
          </div>
        )}

        {error && (
          <div className="bg-red-900/50 text-red-300 p-4 rounded-lg">{error}</div>
        )}

        {!loading && !error && (
          <div className="space-y-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-300 mb-3">Temperature & Precipitation Forecast</h3>
              <div className="bg-gray-800 rounded-lg p-4">
                <WeatherChart data={weatherData} />
              </div>
            </div>

            {markets.map((market) => (
              <div key={market.id}>
                <h3 className="text-lg font-semibold text-gray-300 mb-3">{market.description}</h3>
                <div className="bg-gray-800 rounded-lg p-4">
                  <PriceChart data={market.prices} label={`${market.description} Price`} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
