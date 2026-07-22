import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { serializeDoc } from "@/lib/serialize"

export async function GET() {
  try {
    const snapshot = await adminDb.collection("cities").orderBy("name", "asc").get()
    const cities = snapshot.docs.map(serializeDoc).filter(Boolean)
    return NextResponse.json(cities)
  } catch (error) {
    console.error("Error fetching cities:", error)
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 })
  }
}
