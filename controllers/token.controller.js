import { admin, collectionNames } from "../config/firebase.js";
import { errorTypes } from "../resources/types/index.js";
export async function getJwtToken(req, res) {
  const { tokenId } = req.query;
  if (!tokenId) {
    return res.status(400).json({ message: "Token id is required" });
  }
  try {
    const response = await admin.firestore().collection(collectionNames.tokens).doc(tokenId).get();
    if (!response.exists) {
      return res.status(400).json({ error: errorTypes.expiredInvitation });
    }
    return res.json(response.data().token);
  } catch (error) {
    console.log("getJwtToken", error);
    return res.status(500).json({ message: "Server Error" });
  }
}
