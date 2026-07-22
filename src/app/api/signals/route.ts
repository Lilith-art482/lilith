import { NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { ensureSeeded } from "@/lib/seed"

export const revalidate = 0

export async function GET() {
  try {
    await ensureSeeded()

    const snapshot = await adminDb
      .collection("signals")
      .orderBy("edge", "desc")
      .limit(100)
      .get()

    if (snapshot.empty) {
      return NextResponse.json([])
    }

    const signals = await Promise.all(
      snapshot.docs.map(async (signalDoc) => {
        const data = signalDoc.data()

        const cityDoc = await adminDb.collection("cities").doc(data.cityId).get()
        const city = cityDoc.exists
          ? { name: cityDoc.data()?.name, country: cityDoc.data()?.country }
          : { name: "Unknown", country: "" }

        const marketDoc = await adminDb.collection("markets").doc(data.marketId).get()
        const market = marketDoc.exists
          ? { condition: marketDoc.data()?.condition, description: marketDoc.data()?.description }
          : { condition: "unknown", description: "Unknown" }

        return {
          id: signalDoc.id,
          cityId: data.cityId,
          myProbability: data.myProbability,
          marketPrice: data.marketPrice,
          edge: data.edge,
          timestamp: data.timestamp?.toDate?.()?.toISOString() || data.timestamp,
          city,
          market,
        }
      })
    )

    return NextResponse.json(signals)
  } catch (error) {
    console.error("Error fetching signals:", error)
    return NextResponse.json({ error: "Failed to fetch signals" }, { status: 500 })
  }
}
