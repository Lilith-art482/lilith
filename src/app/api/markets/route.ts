import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get("cityId")

  try {
    const where = cityId ? { cityId: parseInt(cityId, 10) } : {}

    const markets = await prisma.market.findMany({
      where,
      include: {
        prices: {
          orderBy: { timestamp: "desc" },
          take: 168,
        },
      },
    })

    return NextResponse.json(markets)
  } catch (error) {
    console.error("Error fetching markets:", error)
    return NextResponse.json({ error: "Failed to fetch markets" }, { status: 500 })
  }
}
