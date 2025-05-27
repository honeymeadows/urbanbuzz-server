import "dotenv/config";
import firebaseAdminInstance from "firebase-admin";

import { getFirestore } from "firebase-admin/firestore";

export const admin = firebaseAdminInstance.initializeApp({
  credential: firebaseAdminInstance.credential.cert(JSON.parse(process.env.FIREBASE_SERVICE_KEY)),
  databaseURL: "",
});

export const bucket = admin.storage().bucket("urbanbuzz-bcfbd.appspot.com");

export const db = getFirestore();

export const collectionNames = {
  admins: "admins",
  comments: "comments",
  users: "users",
  invites: "invites",
  tokens: "tokens",
  projects: "projects",
  notes: "notes",
  updates: "updates",
  notifications: "notifications",
};

export const adminInstance = firebaseAdminInstance;
