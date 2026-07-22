import type { DocumentSnapshot } from "firebase/firestore"

export function serializeDoc(doc: DocumentSnapshot): Record<string, unknown> | null {
  const data = doc.data()
  if (!data) return null
  const serialized: Record<string, unknown> = { id: doc.id }
  for (const [key, value] of Object.entries(data)) {
    if (value && typeof value === "object" && "toDate" in value) {
      serialized[key] = (value as { toDate: () => Date }).toDate().toISOString()
    } else {
      serialized[key] = value
    }
  }
  return serialized
}
