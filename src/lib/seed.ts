import { Timestamp } from "firebase-admin/firestore"
import { adminDb } from "@/lib/firebaseAdmin"
import { CITIES } from "@/lib/cities"

export async function ensureSeeded() {
  const snapshot = await adminDb.collection("cities").limit(1).get()
  if (!snapshot.empty) return false

  for (const cityData of CITIES) {
    const cityRef = adminDb.collection("cities").doc()
    await cityRef.set({
      name: cityData.name,
      country: cityData.country,
      latitude: cityData.latitude,
      longitude: cityData.longitude,
      timezone: cityData.timezone,
      createdAt: Timestamp.now(),
    })

    const templates = [
      { condition: "temperature_above_30c", description: `${cityData.name} temperature above 30°C`, polymarketSlug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-temperature-be-above-30c` },
      { condition: "temperature_below_0c", description: `${cityData.name} temperature below 0°C`, polymarketSlug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-temperature-be-below-0c` },
      { condition: "rain_probability_above_50", description: `${cityData.name} rain probability above 50%`, polymarketSlug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-rain-probability-be-above-50` },
    ]

    for (const template of templates) {
      await adminDb.collection("markets").add({
        cityId: cityRef.id,
        ...template,
        createdAt: Timestamp.now(),
      })
    }
  }

  return true
}
