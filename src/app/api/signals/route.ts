import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export const revalidate = 0

export async function GET() {
  try {
    const signals = await prisma.signal.findMany({
      include: {
        city: { select: { name: true, country: true } },
        market: { select: { condition: true, description: true } },
      },
      orderBy: { edge: "desc" },
      take: 100,
    })

    return NextResponse.json(signals)
  } catch (error) {
    console.error("Error fetching signals:", error)
    return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 })
  }
}
