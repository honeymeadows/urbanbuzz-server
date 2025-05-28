// controllers
// resources
import { adminRequestTypes } from "../resources/types/requests/admins.js";
// utils
import { collectionNames, admin } from "../config/firebase.js";
import { getCollectionData } from "./collection.controller.js";

export async function getAdmins(req, res) {
  const { adminRequestType } = req.params;
  const { initial, sortField, sortDirection } = req.query;

  if (!adminRequestType) {
    return res.status(400).json({ message: "Admin Request Type is required" });
  }

  let fetcherHandler = null; // Function handler which will fetch data from db
  let args = null; // Object of Arguments for the handler. Order is important
  let responseName = null; // String name to use in store
  let limit = Number(req.query.limit);
  let startAfter = req.query.startAfter === "null" ? null : req.query.startAfter;

  //
  // @ desc get all the admins
  //
  if (adminRequestType === adminRequestTypes.admins) {
    args = {
      collectionName: collectionNames.users,
      sort: {
        field: sortField ?? "name",
        direction: sortDirection ?? "asc",
      },
      pagination: { limit, startAfter: startAfter ?? null },
      primaryFilter: { field: "roles.isAdmin", operator: "==", value: true },
      tertiaryFilter: { field: "statuses.isDeleted", operator: "==", value: false },
      isInitial: initial,
    };

    fetcherHandler = getCollectionData;
    responseName = "admins";
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

export async function deleteAdmins(req, res) {
  const { adminRequestType, adminId } = req.params;

  if (!adminRequestType) {
    return res.status(400).json({ message: "Admin request type is required" });
  }

  //
  // @ desc delete an admins
  //
  if (adminRequestType === adminRequestTypes.deleteAdmin) {
    try {
      const doc = await admin.firestore().collection(collectionNames.users).doc(adminId).get();
      let user = await admin
        .auth()
        .getUserByEmail(doc.data()?.email)
        .then((user) => user)
        .catch((err) => false);

      if (!doc.exists || !user) {
        return res.status(400).json({ message: "User does not exist" });
      } else {
        await admin.auth().setCustomUserClaims(user.uid, {
          ...user.customClaims,
          roles: {
            ...user.customClaims.roles,
            isAdmin: false,
          },
          statuses: {
            ...user.customClaims.statuses,
            isDeleted: true,
          },
        });
        await admin
          .firestore()
          .collection(collectionNames.users)
          .doc(adminId)
          .update({
            roles: {
              ...user.customClaims.roles,
              isAdmin: false,
            },
            statuses: {
              ...user.customClaims.statuses,
              isDeleted: true,
              deletedOn: new Date().getTime(),
            },
          });
        return res.send({ user: { adminId }, msg: "Admin deleted" });
      }
    } catch (error) {
      console.log("deleteAdmins ====>", error);
      return { error };
    }
  }
}
