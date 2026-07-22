import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { CITIES } from "@/lib/cities"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const secret = process.env.CRON_SECRET

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const existing = await adminDb.collection("cities").limit(1).get()
    if (!existing.empty) {
      return NextResponse.json({ error: "Database already seeded" }, { status: 400 })
    }

    let cityCount = 0
    let marketCount = 0

    for (const cityData of CITIES) {
      const cityRef = adminDb.collection("cities").doc()
      await cityRef.set({
        name: cityData.name,
        country: cityData.country,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
        timezone: cityData.timezone,
        createdAt: adminDb.Timestamp.now(),
      })
      cityCount++

      const templates = [
        { condition: "temperature_above_30c", description: `${cityData.name} temperature above 30°C`, polymarketSlug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-temperature-be-above-30c` },
        { condition: "temperature_below_0c", description: `${cityData.name} temperature below 0°C`, polymarketSlug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-temperature-be-below-0c` },
        { condition: "rain_probability_above_50", description: `${cityData.name} rain probability above 50%`, polymarketSlug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-rain-probability-be-above-50` },
      ]

      for (const template of templates) {
        await adminDb.collection("markets").add({
          cityId: cityRef.id,
          ...template,
          createdAt: adminDb.Timestamp.now(),
        })
        marketCount++
      }
    }

    return NextResponse.json({ success: true, cities: cityCount, markets: marketCount })
  } catch (error) {
    console.error("Seed failed:", error)
    return NextResponse.json({ error: "Seed failed" }, { status: 500 })
  }
}
