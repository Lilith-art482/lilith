import { getApps, initializeApp, cert } from "firebase-admin/app"
import { getFirestore } from "firebase-admin/firestore"

const serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0]

  if (serviceAccount) {
    return initializeApp({
      credential: cert(JSON.parse(serviceAccount)),
    })
  }

  return initializeApp({
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID || "weather-lilith",
  })
}

const adminApp = getAdminApp()
export const adminDb = getFirestore(adminApp)
