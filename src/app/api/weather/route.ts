import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { serializeDoc } from "@/lib/serialize"
import { ensureSeeded } from "@/lib/seed"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get("cityId")

  if (!cityId) {
    return NextResponse.json({ error: "cityId is required" }, { status: 400 })
  }

  try {
    await ensureSeeded()

    const snapshot = await adminDb
      .collection("weatherRecords")
      .where("cityId", "==", cityId)
      .orderBy("timestamp", "desc")
      .limit(168)
      .get()

    const records = snapshot.docs.map(serializeDoc).filter(Boolean)
    return NextResponse.json(records)
  } catch (error) {
    console.error("Error fetching weather:", error)
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
