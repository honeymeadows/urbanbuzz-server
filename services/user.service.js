import { error } from "firebase-functions/logger";
import { admin, adminInstance, collectionNames } from "../config/firebase.js";

export async function populateRefs(data, options) {
  const {
    singleSuffixes = ["Id"],
    arraySuffixes = ["Ids"],
    projections = {},
    collection = null,
  } = options;

  const result = { ...data };

  // helper to fetch one doc with optional projection
  async function fetchDoc(id) {
    if (!collection) return null;
    const ref = admin.firestore().collection(collection).doc(id);
    const snap = await ref.get();
    if (!snap.exists) return null;
    const data = snap.data();
    const fields = projections[collection];
    if (fields && fields.length) {
      // Manually pick only the desired fields
      const filtered = {};
      for (const field of fields) {
        if (data.hasOwnProperty(field)) {
          filtered[field] = data[field];
        }
      }
      return { id: snap.id, ...filtered };
    }
    return { id: snap.id, ...data };
  }

  // process each key
  for (const key of Object.keys(data)) {
    const val = data[key];

    // single‑doc suffixes
    for (const suf of singleSuffixes) {
      if (key.endsWith(suf) && typeof val === "string") {
        const base = key.slice(0, -suf.length); // e.g. "client"
        const coll = base + "s"; // e.g. "clients"
        const doc = await fetchDoc(coll, val);

        result[coll] = doc;
        delete result[key];
      }
    }

    // array‑doc suffixes
    for (const suf of arraySuffixes) {
      if (key.endsWith(suf) && Array.isArray(val)) {
        const base = key.slice(0, -suf.length); // e.g. "client"
        const coll = base + "s"; // e.g. "clients"
        const users = await Promise.all(val.map((id) => fetchDoc(id)));

        result[coll] = users.filter((u) => u !== null);
        delete result[key];
      }
    }
  }

  return result;
}
export const toggleUserEmailNotification = async ({ userId }) => {
  if (!userId) {
    return { error: "invalid-request" };
  }
  const userRef = admin.firestore().collection(collectionNames.users).doc(userId);

  try {
    const newNotificationStatus = await admin.firestore().runTransaction(async (transaction) => {
      const userDoc = await transaction.get(userRef);
      if (!userDoc.exists) {
        throw new Error("Document does not exist!");
      }

      const userEmail = userDoc.data()?.email;
      const isEmailNotification = userDoc.data()?.isEmailNotification;

      transaction.update(userRef, { isEmailNotification: !isEmailNotification });

      if (isEmailNotification) {
        const projectsQuery = admin
          .firestore()
          .collection("projects")
          .where("clientEmails", "array-contains", userEmail);
        const projectsSnapshot = await projectsQuery.get();
        projectsSnapshot.forEach((projectDoc) => {
          const projectRef = projectDoc.ref;
          transaction.update(projectRef, {
            clientEmails: adminInstance.firestore.FieldValue.arrayRemove(userEmail),
          });
        });
      } else {
        const projectsQuery = admin
          .firestore()
          .collection("projects")
          .where("clientIds", "array-contains", userDoc.data()?.id);
        const projectsSnapshot = await projectsQuery.get();
        projectsSnapshot.forEach((projectDoc) => {
          const projectRef = projectDoc.ref;
          transaction.update(projectRef, {
            clientEmails: adminInstance.firestore.FieldValue.arrayUnion(userEmail),
          });
        });
      }
      return isEmailNotification ? false : true;
    });

    return newNotificationStatus;
  } catch (error) {
    console.log("toggleUserEmailNotification ===========>", error);
    return { error };
  }
};
