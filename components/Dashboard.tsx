"use client"

import { useState, useEffect, useCallback } from "react"
import CityModal from "@/components/CityModal"

interface Signal {
  id: number
  cityId: number
  edge: number
  myProbability: number
  marketPrice: number
  timestamp: string
  city: { name: string; country: string }
  market: { condition: string; description: string }
}

const CONDITION_COLORS: Record<string, string> = {
  temperature_above_30c: "bg-orange-500/20 text-orange-300",
  temperature_below_0c: "bg-blue-500/20 text-blue-300",
  rain_probability_above_50: "bg-cyan-500/20 text-cyan-300",
}

export default function Dashboard() {
  const [signals, setSignals] = useState<Signal[]>([])
  const [loading, setLoading] = useState(true)
  const [selectedCity, setSelectedCity] = useState<{ id: number; name: string } | null>(null)
  const [sortField, setSortField] = useState<string>("edge")
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc")

  const fetchSignals = useCallback(async () => {
    try {
      const res = await fetch("/api/signals")
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data = await res.json()
      if (Array.isArray(data)) setSignals(data)
    } catch (err) {
      console.error("Failed to fetch signals:", err)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    fetchSignals()
    const interval = setInterval(fetchSignals, 60000)
    return () => clearInterval(interval)
  }, [fetchSignals])

  const sorted = [...signals].sort((a, b) => {
    const aVal = a[sortField as keyof Signal]
    const bVal = b[sortField as keyof Signal]
    if (typeof aVal === "number" && typeof bVal === "number") {
      return sortDir === "desc" ? bVal - aVal : aVal - bVal
    }
    return 0
  })

  const toggleSort = (field: string) => {
    if (sortField === field) {
      setSortDir((d) => (d === "desc" ? "asc" : "desc"))
    } else {
      setSortField(field)
      setSortDir("desc")
    }
  }

  const sortArrow = (field: string) => {
    if (sortField !== field) return ""
    return sortDir === "desc" ? " ↓" : " ↑"
  }

  return (
    <div className="min-h-screen p-4 md:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-white mb-2">Weather Polymarket Dashboard</h1>
        <p className="text-gray-400">
          Monitoring weather markets across {signals.length > 0 ? new Set(signals.map((s) => s.city.name)).size : 0} cities
        </p>
      </header>

      {loading ? (
        <div className="flex justify-center py-24">
          <div className="animate-spin h-12 w-12 border-4 border-blue-500 border-t-transparent rounded-full" />
        </div>
      ) : (
        <div className="bg-gray-900 rounded-xl overflow-hidden border border-gray-800">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-800 bg-gray-900/50">
                  <th
                    className="text-left px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200"
                    onClick={() => toggleSort("cityId")}
                  >
                    City{sortArrow("cityId")}
                  </th>
                  <th className="text-left px-4 py-3 text-gray-400 font-medium">
                    Condition
                  </th>
                  <th
                    className="text-right px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200"
                    onClick={() => toggleSort("myProbability")}
                  >
                    My Probability{sortArrow("myProbability")}
                  </th>
                  <th
                    className="text-right px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200"
                    onClick={() => toggleSort("marketPrice")}
                  >
                    Market Price{sortArrow("marketPrice")}
                  </th>
                  <th
                    className="text-right px-4 py-3 text-gray-400 font-medium cursor-pointer hover:text-gray-200"
                    onClick={() => toggleSort("edge")}
                  >
                    Edge{sortArrow("edge")}
                  </th>
                  <th className="text-right px-4 py-3 text-gray-400 font-medium">
                    Updated
                  </th>
                </tr>
              </thead>
              <tbody>
                {sorted.map((signal) => (
                  <tr
                    key={signal.id}
                    className="border-b border-gray-800 hover:bg-gray-800/50 cursor-pointer transition-colors"
                    onClick={() =>
                      setSelectedCity({ id: signal.cityId, name: signal.city.name })
                    }
                  >
                    <td className="px-4 py-3">
                      <span className="text-white font-medium">{signal.city.name}</span>
                      <span className="text-gray-500 ml-2 text-xs">{signal.city.country}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                          CONDITION_COLORS[signal.market.condition] || "bg-gray-700 text-gray-300"
                        }`}
                      >
                        {signal.market.description}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono">
                      {(signal.myProbability * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right text-white font-mono">
                      {(signal.marketPrice * 100).toFixed(1)}%
                    </td>
                    <td className="px-4 py-3 text-right">
                      <span
                        className={`font-mono font-bold ${
                          signal.edge > 0.01
                            ? "text-green-400"
                            : signal.edge < -0.01
                              ? "text-red-400"
                              : "text-gray-400"
                        }`}
                      >
                        {signal.edge > 0 ? "+" : ""}
                        {(signal.edge * 100).toFixed(2)}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-right text-gray-500 text-xs">
                      {new Date(signal.timestamp).toLocaleTimeString()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {selectedCity && (
        <CityModal
          cityId={selectedCity.id}
          cityName={selectedCity.name}
          onClose={() => setSelectedCity(null)}
        />
      )}
    </div>
  )
}
