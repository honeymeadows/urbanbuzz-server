import { admin } from "../config/firebase.js";

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
