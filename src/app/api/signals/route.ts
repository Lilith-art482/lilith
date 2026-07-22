import { NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { ensureSeeded } from "@/lib/seed"
import { collection, getDocs, query, orderBy, limit, doc, getDoc } from "firebase/firestore"

export const revalidate = 0

export async function GET() {
  try {
    await ensureSeeded()

    const q = query(collection(db, "signals"), orderBy("edge", "desc"), limit(100))
    const snapshot = await getDocs(q)

    if (snapshot.empty) {
      return NextResponse.json([])
    }

    function toDate(v: unknown): string {
      if (v && typeof v === "object" && "toDate" in v) {
        return (v as { toDate: () => Date }).toDate().toISOString()
      }
      return String(v)
    }

    const signals = await Promise.all(
      snapshot.docs.map(async (signalDoc) => {
        const data = signalDoc.data()

        const citySnap = await getDoc(doc(db, "cities", data.cityId))
        const city = citySnap.exists()
          ? { name: citySnap.data()?.name, country: citySnap.data()?.country }
          : { name: "Unknown", country: "" }

        const marketSnap = await getDoc(doc(db, "markets", data.marketId))
        const market = marketSnap.exists()
          ? { condition: marketSnap.data()?.condition, description: marketSnap.data()?.description }
          : { condition: "unknown", description: "Unknown" }

        return {
          id: signalDoc.id,
          cityId: data.cityId,
          myProbability: data.myProbability,
          marketPrice: data.marketPrice,
          edge: data.edge,
          timestamp: toDate(data.timestamp),
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
