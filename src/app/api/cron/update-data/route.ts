import { NextRequest, NextResponse } from "next/server"
import { db, Timestamp } from "@/lib/firebase"
import { getForecast, getNwsForecast } from "@/lib/weatherService"
import { getHistoricalForecasts, calculateHistoricalStdDev } from "@/lib/openMeteoService"
import { getMarketPrices } from "@/lib/polymarketService"
import { calculateMyProbability, calculateEdge } from "@/lib/signalCalculator"
import { ensureSeeded } from "@/lib/seed"
import {
  collection, getDocs, doc, setDoc, addDoc,
  query, where, writeBatch,
} from "firebase/firestore"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const secret = process.env.CRON_SECRET

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    await ensureSeeded()
    const citiesSnapshot = await getDocs(collection(db, "cities"))
    const results: string[] = []

    for (const cityDoc of citiesSnapshot.docs) {
      const city = { id: cityDoc.id, ...cityDoc.data() } as {
        id: string
        name: string
        country: string
        latitude: number
        longitude: number
      }

      try {
        let forecast = await getForecast(city.latitude, city.longitude)
        if (city.country === "US") {
          const nws = await getNwsForecast(city.latitude, city.longitude)
          if (nws) forecast = nws
        }
        const limitedForecast = forecast.slice(0, 168)

        const batch = writeBatch(db)
        for (const data of limitedForecast) {
          const ref = doc(collection(db, "weatherRecords"))
          batch.set(ref, {
            cityId: city.id,
            timestamp: Timestamp.fromDate(data.timestamp),
            temperature: data.temperature,
            humidity: data.humidity,
            windSpeed: data.windSpeed,
            precipitationProbability: data.precipitationProbability,
            isForecast: true,
          })
        }
        await batch.commit()

        const historicalData = await getHistoricalForecasts(city.latitude, city.longitude, 5)
        const currentForecast = forecast.map((f) => ({
          time: f.timestamp.toISOString(),
          temperature: f.temperature,
          humidity: f.humidity,
          precipitationProbability: f.precipitationProbability,
          windSpeed: f.windSpeed,
        }))
        const stdDev = calculateHistoricalStdDev(historicalData, currentForecast)

        const marketsQ = query(collection(db, "markets"), where("cityId", "==", city.id))
        const marketsSnapshot = await getDocs(marketsQ)

        const signalBatch = writeBatch(db)
        for (const marketDoc of marketsSnapshot.docs) {
          const marketData = marketDoc.data()
          const polymarketPrice = await getMarketPrices(marketData.polymarketSlug || "")

          if (polymarketPrice) {
            const priceRef = doc(collection(db, "marketPrices"))
            signalBatch.set(priceRef, {
              marketId: marketDoc.id,
              timestamp: Timestamp.fromDate(polymarketPrice.timestamp),
              price: polymarketPrice.price,
            })
          }

          const forecastTemps = forecast.slice(0, 24).map((f) => f.temperature)
          const myProb = calculateMyProbability(forecastTemps, stdDev)
          const marketPrice = polymarketPrice?.price ?? 0.5
          const edge = calculateEdge(myProb, marketPrice)

          const signalRef = doc(collection(db, "signals"))
          signalBatch.set(signalRef, {
            cityId: city.id,
            marketId: marketDoc.id,
            timestamp: Timestamp.now(),
            myProbability: myProb,
            marketPrice,
            edge,
          })
        }
        await signalBatch.commit()

        results.push(`${city.name}: OK (${limitedForecast.length} records)`)
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
