import { NextRequest, NextResponse } from "next/server"
import { db, Timestamp } from "@/lib/firebase"
import { CITIES } from "@/lib/cities"
import { collection, getDocs, query, limit, doc, setDoc, addDoc } from "firebase/firestore"

export async function POST(request: NextRequest) {
  const authHeader = request.headers.get("authorization")
  const secret = process.env.CRON_SECRET

  if (secret && authHeader !== `Bearer ${secret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
  }

  try {
    const q = query(collection(db, "cities"), limit(1))
    const existing = await getDocs(q)
    if (!existing.empty) {
      return NextResponse.json({ error: "Database already seeded" }, { status: 400 })
    }

    let cityCount = 0
    let marketCount = 0

    for (const cityData of CITIES) {
      const cityRef = doc(collection(db, "cities"))
      await setDoc(cityRef, {
        name: cityData.name,
        country: cityData.country,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
        timezone: cityData.timezone,
        createdAt: Timestamp.now(),
      })
      cityCount++

      const templates = [
        { condition: "temperature_above_30c", description: `${cityData.name} temperature above 30°C`, polymarketSlug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-temperature-be-above-30c` },
        { condition: "temperature_below_0c", description: `${cityData.name} temperature below 0°C`, polymarketSlug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-temperature-be-below-0c` },
        { condition: "rain_probability_above_50", description: `${cityData.name} rain probability above 50%`, polymarketSlug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-rain-probability-be-above-50` },
      ]

      for (const template of templates) {
        await addDoc(collection(db, "markets"), {
          cityId: cityRef.id,
          ...template,
          createdAt: Timestamp.now(),
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
