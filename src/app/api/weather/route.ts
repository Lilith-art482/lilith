import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get("cityId")

  if (!cityId) {
    return NextResponse.json({ error: "cityId is required" }, { status: 400 })
  }

  try {
    const records = await prisma.weatherRecord.findMany({
      where: { cityId: parseInt(cityId, 10) },
      orderBy: { timestamp: "desc" },
      take: 168,
    })

    return NextResponse.json(records)
  } catch (error) {
    console.error("Error fetching weather:", error)
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
