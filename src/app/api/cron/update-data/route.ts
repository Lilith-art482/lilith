import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { getForecast } from "@/lib/weatherService"
import { getHistoricalForecasts, getOpenMeteoForecast, calculateHistoricalStdDev } from "@/lib/openMeteoService"
import { getMarketPrices, MARKET_TEMPLATES } from "@/lib/polymarketService"
import { calculateMyProbability, calculateEdge } from "@/lib/signalCalculator"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const secret = process.env.CRON_SECRET

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const cities = await prisma.city.findMany()
    const results: string[] = []

    for (const city of cities) {
      try {
        const forecast = await getForecast(city.latitude, city.longitude)
        const limitedForecast = forecast.slice(0, 168)

        for (const data of limitedForecast) {
          await prisma.weatherRecord.create({
            data: {
              cityId: city.id,
              timestamp: data.timestamp,
              temperature: data.temperature,
              humidity: data.humidity,
              windSpeed: data.windSpeed,
              precipitationProbability: data.precipitationProbability,
              isForecast: true,
            },
          })
        }

        const historicalData = await getHistoricalForecasts(city.latitude, city.longitude, 5)
        const currentForecast = await getOpenMeteoForecast(city.latitude, city.longitude, 7)
        const stdDev = calculateHistoricalStdDev(historicalData, currentForecast)

        const markets = await prisma.market.findMany({ where: { cityId: city.id } })

        for (const market of markets) {
          const polymarketPrice = await getMarketPrices(market.polymarketSlug)

          if (polymarketPrice) {
            await prisma.marketPrice.create({
              data: {
                marketId: market.id,
                timestamp: polymarketPrice.timestamp,
                price: polymarketPrice.price,
              },
            })
          }

          const forecastTemps = forecast.slice(0, 24).map((f) => f.temperature)
          const myProb = calculateMyProbability(forecastTemps, stdDev)
          const marketPrice = polymarketPrice?.price ?? 0.5
          const edge = calculateEdge(myProb, marketPrice)

          await prisma.signal.create({
            data: {
              cityId: city.id,
              marketId: market.id,
              timestamp: new Date(),
              myProbability: myProb,
              marketPrice,
              edge,
            },
          })
        }

        results.push(`${city.name}: OK (${forecast.length} records)`)
      } catch (err) {
        console.error(`Error processing ${city.name}:`, err)
        results.push(`${city.name}: ERROR`)
      }
    }

    return NextResponse.json({ success: true, results })
  } catch (error) {
    console.error("Cron update failed:", error)
    return NextResponse.json({ error: "Update failed" }, { status: 500 })
  }
}
