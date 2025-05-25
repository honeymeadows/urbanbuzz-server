import firebaseAdminInstance from "firebase-admin";

// import adminServiceAccount from "./service-accounts/urbanbuzz-bcfbd-firebase-adminsdk-v491r-55bca99f6e.json" assert { type: "json" };

import { getFirestore } from "firebase-admin/firestore";

export const admin = firebaseAdminInstance.initializeApp({
  credential: firebaseAdminInstance.credential.cert(
    JSON.parse(JSON.stringify(process.env.URBANBUZZ_SERVICE_KEY))
  ),
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
