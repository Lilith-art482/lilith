import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { serializeDoc } from "@/lib/serialize"
import { ensureSeeded } from "@/lib/seed"
import { collection, getDocs, orderBy, query } from "firebase/firestore"

export async function GET() {
  try {
    await ensureSeeded()
    const q = query(collection(db, "cities"), orderBy("name", "asc"))
    const snapshot = await getDocs(q)
    const cities = snapshot.docs.map(serializeDoc).filter(Boolean)
    return NextResponse.json(cities)
  } catch (error) {
    console.error("Error fetching cities:", error)
    return NextResponse.json({ error: "Failed to fetch cities" }, { status: 500 })
  }
}
