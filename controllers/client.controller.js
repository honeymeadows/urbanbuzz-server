// controllers
// resources
import { clientRequestTypes } from "../resources/types/requests/client.js";
// utils
import { collectionNames, admin } from "../config/firebase.js";
import { getCollectionData } from "./collection.controller.js";
import { errorTypes } from "../resources/types/index.js";

export async function getClients(req, res) {
  const { clientRequestType } = req.params;
  const { searchedText, initial, sortField, sortDirection } = req.query;

  if (!clientRequestType) {
    return res.status(400).json({ message: "client Request Type is required" });
  }

  let fetcherHandler = null; // Function handler which will fetch data from db
  let args = null; // Object of Arguments for the handler. Order is important
  let responseName = null; // String name to use in store
  let limit = Number(req.query.limit);
  let startAfter = req.query.startAfter === "null" ? null : req.query.startAfter;

  if (
    clientRequestType === clientRequestTypes.activeClients ||
    clientRequestType === clientRequestTypes.bannedClients
  ) {
    const isBanned = clientRequestType === clientRequestTypes.bannedClients;
    args = {
      collectionName: collectionNames.users,
      sort: {
        field: sortField ?? "name",
        direction: sortDirection ?? "asc",
      },
      pagination: { limit, startAfter: startAfter ?? null },
      primaryFilter: { field: "roles.isClient", operator: "==", value: true },
      secondaryFilter: { field: "roles.isAdmin", operator: "==", value: false },
      tertiaryFilter: { field: "statuses.isBanned", operator: "==", value: isBanned },
      quaternaryFilter: { field: "statuses.isDeleted", operator: "==", value: false },
      isInitial: initial,
    };

    fetcherHandler = getCollectionData;
    responseName = "clients";
  } else if (clientRequestType === clientRequestTypes.searchClients) {
    if (!searchedText) {
      return res.status(400).json({ message: "Searched text is required" });
    }
    fetcherHandler = searchClients;
    args = { searchedText };
    responseName = "clients";
  } else if (clientRequestType === clientRequestTypes.clientCount) {
    fetcherHandler = getClientCounts;
    args = {};
    responseName = "counts";
  }
  if (!fetcherHandler || !responseName || !args) {
    return res.status(400).json({ message: "Invalid Request type." });
  }

  const result = await fetcherHandler(args);
  if (result?.error) {
    return res.status(400).json(result?.error);
  } else {
    let response = {
      [responseName]: result.data,
      startAfter: result?.startAfter,
    };

    if (result?.total !== null) {
      response = { ...response, total: result?.total };
    }
    return res.json(response);
  }
}

export async function updateClients(req, res) {
  const { clientRequestType } = req.params;
  const { newData, adminId, clientId } = req.body;

  if (!clientRequestType) {
    return res.status(400).json({ message: "Admin request type is required" });
  }

  //
  // @ desc delete an admins
  //
  if (clientRequestType === clientRequestTypes.deleteAdmin) {
    try {
      const doc = await admin.firestore().collection(collectionNames.users).doc(adminId).get();
      if (!doc.exists) {
        return res.status(400).json({ message: "User does not exist" });
      } else {
        await admin.firestore().collection(collectionNames.users).doc(adminId).update({
          "statuses.isDeleted": true,
        });
        return res.send({ user: { adminId }, msg: "Admin deleted" });
      }
    } catch (error) {
      console.log("deleteAdmins ====>", error);
      return { error };
    }
  } else if (clientRequestType === clientRequestTypes.updateClient) {
    if (
      (typeof newData?.isBanned !== "boolean" && typeof newData?.isDeleted !== "boolean") ||
      !clientId
    ) {
      return res.status(400).json({ message: "invalid update data" });
    }
    const userRef = admin.firestore().collection(collectionNames.users).doc(clientId);
    try {
      let userData = await userRef.get();
      if (!userData.exists) {
        return res.status(400).json({ message: errorTypes.noUser });
      }
      await userRef.update({
        statuses: {
          isBanned: newData?.isBanned ?? userData.data().statuses.isBanned,
          isDeleted: newData?.isDeleted ?? userData.data().statuses.isDeleted,
        },
        roles: {
          ...userData.data().roles,
          isClient: typeof newData?.isDeleted === "boolean" ? !newData?.isDeleted : true,
        },
      });
      const userAuthData = await admin.auth().getUserByEmail(userData.data().email);
      await admin.auth().setCustomUserClaims(clientId, {
        ...userAuthData.customClaims,
        statuses: {
          isBanned: newData?.isBanned ?? userData.data().statuses.isBanned,
          isDeleted: newData?.isDeleted ?? userData.data().statuses.isDeleted,
        },
        roles: {
          ...userAuthData.customClaims.roles,
          isClient: typeof newData?.isDeleted === "boolean" ? !newData?.isDeleted : true,
        },
      });

      userData = (await userRef.get()).data();
      return res.send({ user: userData });
    } catch (error) {
      console.log("update client ====>", error);
      return { error };
    }
  }
}

export async function deleteClients(req, res) {
  const { clientRequestType, adminId } = req.params;

  if (!clientRequestType) {
    return res.status(400).json({ message: "Admin request type is required" });
  }

  //
  // @ desc delete an admins
  //
  if (clientRequestType === clientRequestTypes.deleteAdmin) {
    try {
      const doc = await admin.firestore().collection(collectionNames.users).doc(adminId).get();
      if (!doc.exists) {
        return res.status(400).json({ message: "User does not exist" });
      } else {
        await admin.firestore().collection(collectionNames.users).doc(adminId).update({
          "statuses.isDeleted": true,
        });
        return res.send({ user: { adminId }, msg: "Admin deleted" });
      }
    } catch (error) {
      console.log("deleteAdmins ====>", error);
      return { error };
    }
  }
}

const searchClients = async ({ searchedText }) => {
  const clients = [];
  try {
    const docRef = await admin
      .firestore()
      .collection(collectionNames.users)
      .where("roles.isClient", "==", true)
      .where("statuses.isBanned", "==", false)
      .where("statuses.isDeleted", "==", false)
      .where("searchKeywords", "array-contains", searchedText.toLowerCase())
      .get();

    docRef.forEach((doc) => {
      clients.push({ id: doc.id, ...doc.data() });
    });

    return { data: clients };
  } catch (error) {
    console.log("searchClients ====>", error);
    return { error };
  }
};

const getClientCounts = async ({ adminId }) => {
  let data = {
    all: 0,
    banned: 0,
  };
  try {
    const allUsers = await admin
      .firestore()
      .collection(collectionNames.users)
      .where("roles.isClient", "==", true)
      .where("roles.isAdmin", "==", false)
      .where("statuses.isBanned", "==", false)
      .where("statuses.isDeleted", "==", false)
      .get();
    data.all = allUsers.size;

    const bannedUsers = await admin
      .firestore()
      .collection(collectionNames.users)
      .where("roles.isClient", "==", true)
      .where("statuses.isBanned", "==", true)
      .where("statuses.isDeleted", "==", false)
      .get();
    data.banned = bannedUsers.size;
    return { data };
  } catch (error) {
    console.log("getClientCounts ====>", error);
    return { error };
  }
};
