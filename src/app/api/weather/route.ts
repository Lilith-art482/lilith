import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { serializeDoc } from "@/lib/serialize"
import { ensureSeeded } from "@/lib/seed"
import { collection, getDocs, query, where, orderBy, limit } from "firebase/firestore"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get("cityId")

  if (!cityId) {
    return NextResponse.json({ error: "cityId is required" }, { status: 400 })
  }

  try {
    await ensureSeeded()

    const q = query(
      collection(db, "weatherRecords"),
      where("cityId", "==", cityId),
      orderBy("timestamp", "desc"),
      limit(168)
    )
    const snapshot = await getDocs(q)
    const records = snapshot.docs.map(serializeDoc).filter(Boolean)
    return NextResponse.json(records)
  } catch (error) {
    console.error("Error fetching weather:", error)
    return NextResponse.json({ error: "Failed to fetch weather data" }, { status: 500 })
  }
}
