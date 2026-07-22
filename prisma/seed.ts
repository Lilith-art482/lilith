import { PrismaClient } from "@prisma/client"
import { CITIES } from "../src/lib/cities"

const prisma = new PrismaClient()

async function main() {
  console.log("Seeding database...")

  for (const cityData of CITIES) {
    const city = await prisma.city.upsert({
      where: {
        id: CITIES.indexOf(cityData) + 1,
      },
      update: {},
      create: {
        name: cityData.name,
        country: cityData.country,
        latitude: cityData.latitude,
        longitude: cityData.longitude,
        timezone: cityData.timezone,
      },
    })

    const templates = [
      { condition: "temperature_above_30c", description: `${cityData.name} temperature above 30°C`, slug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-temperature-be-above-30c` },
      { condition: "temperature_below_0c", description: `${cityData.name} temperature below 0°C`, slug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-temperature-be-below-0c` },
      { condition: "rain_probability_above_50", description: `${cityData.name} rain probability above 50%`, slug: `will-${cityData.name.toLowerCase().replace(/\s+/g, "-")}-rain-probability-be-above-50` },
    ]

    for (const template of templates) {
      await prisma.market.upsert({
        where: {
          id: templates.indexOf(template) + (CITIES.indexOf(cityData) * templates.length) + 1,
        },
        update: {},
        create: {
          cityId: city.id,
          condition: template.condition,
          description: template.description,
          polymarketSlug: template.slug,
        },
      })
    }

    console.log(`  ✓ ${cityData.name} (${cityData.country})`)
  }

  console.log("Seeding complete!")
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })
