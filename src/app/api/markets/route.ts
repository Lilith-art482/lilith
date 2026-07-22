import { NextRequest, NextResponse } from "next/server"
import { adminDb } from "@/lib/firebaseAdmin"
import { serializeDoc } from "@/lib/serialize"
import { ensureSeeded } from "@/lib/seed"

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url)
  const cityId = searchParams.get("cityId")

  try {
    await ensureSeeded()

    let marketsQuery: FirebaseFirestore.Query = adminDb.collection("markets")
    if (cityId) {
      marketsQuery = marketsQuery.where("cityId", "==", cityId)
    }

    const marketsSnapshot = await marketsQuery.get()
    const markets = await Promise.all(
      marketsSnapshot.docs.map(async (marketDoc) => {
        const pricesSnapshot = await adminDb
          .collection("marketPrices")
          .where("marketId", "==", marketDoc.id)
          .orderBy("timestamp", "desc")
          .limit(168)
          .get()

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
