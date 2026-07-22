import { initializeApp, cert } from "firebase-admin/app"
import { getFirestore, Timestamp } from "firebase-admin/firestore"
import { CITIES } from "../src/lib/cities"
import * as fs from "fs"
import * as path from "path"

const serviceAccountPath = process.env.GOOGLE_APPLICATION_CREDENTIALS

const app = initializeApp(
  serviceAccountPath
    ? { credential: cert(JSON.parse(fs.readFileSync(serviceAccountPath, "utf-8"))) }
    : { projectId: process.env.FIREBASE_PROJECT_ID || "weather-lilith" }
)

const db = getFirestore(app)

async function seed() {
  console.log("Seeding Firebase...")

  for (const cityData of CITIES) {
    const cityRef = db.collection("cities").doc()
    await cityRef.set({
      name: cityData.name,
      country: cityData.country,
      latitude: cityData.latitude,
      longitude: cityData.longitude,
      timezone: cityData.timezone,
      createdAt: Timestamp.now(),
    })

    const templates = [
      {
        condition: "temperature_above_30c",
        description: `${cityData.name} temperature above 30°C`,
        slug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-temperature-be-above-30c`,
      },
      {
        condition: "temperature_below_0c",
        description: `${cityData.name} temperature below 0°C`,
        slug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-temperature-be-below-0c`,
      },
      {
        condition: "rain_probability_above_50",
        description: `${cityData.name} rain probability above 50%`,
        slug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-rain-probability-be-above-50`,
      },
    ]

    for (const template of templates) {
      await db.collection("markets").add({
        cityId: cityRef.id,
        condition: template.condition,
        description: template.description,
        polymarketSlug: template.slug,
        createdAt: Timestamp.now(),
      })
    }

    console.log(`  ✓ ${cityData.name} (${cityData.country})`)
  }

  console.log("Seeding complete!")
}

seed().catch(console.error)
