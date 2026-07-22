import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/firebase"
import { serializeDoc } from "@/lib/serialize"
import { ensureSeeded } from "@/lib/seed"
import { collection, getDocs, query, where, orderBy, limit as firestoreLimit } from "firebase/firestore"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get("cityId")

  try {
    await ensureSeeded()

    let marketsQ = collection(db, "markets")
    if (cityId) {
      marketsQ = query(marketsQ, where("cityId", "==", cityId)) as typeof marketsQ
    }

    const marketsSnapshot = await getDocs(marketsQ)
    const markets = await Promise.all(
      marketsSnapshot.docs.map(async (marketDoc) => {
        const pricesQ = query(
          collection(db, "marketPrices"),
          where("marketId", "==", marketDoc.id),
          orderBy("timestamp", "desc"),
          firestoreLimit(168)
        )
        const pricesSnapshot = await getDocs(pricesQ)
        const prices = pricesSnapshot.docs.map(serializeDoc).filter(Boolean)

        return {
          ...serializeDoc(marketDoc),
          prices,
        }
      })
    )

    return NextResponse.json(markets)
  } catch (error) {
    console.error("Error fetching markets:", error)
    return NextResponse.json({ error: "Failed to fetch markets" }, { status: 500 })
  }
}
