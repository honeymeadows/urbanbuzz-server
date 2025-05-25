import { collectionNames, admin } from "../../config/firebase.js";
import { projectRequestTypes } from "../../resources/types/requests/project.js";
import { populateRefs } from "../user.service.js";

export async function getAllProjects({
  projectRequestType,
  isDeactivated,
  limit,
  startAfter,
  sortField,
  sortDirection,
}) {
  let response = [];
  let query = admin.firestore().collection(collectionNames.projects);

  if (sortField && sortField !== "undefined" && sortDirection && sortDirection !== "undefined") {
    query = query.orderBy(sortField, sortDirection);
  } else {
    query = query.orderBy("created", "desc");
  }

  if (startAfter && startAfter !== "undefined") {
    const lastDoc = await admin
      .firestore()
      .collection(collectionNames.projects)
      .doc(startAfter)
      .get();
    query = query.startAfter(lastDoc);
  }
  if (limit && limit !== "undefined") {
    query = query.limit(limit);
  }
  try {
    response = (
      await query
        .where("statuses.isDeactivated", "==", isDeactivated ? isDeactivated : false)
        .where("statuses.isDeleted", "==", false)
        .get()
    ).docs;

    response = response.map((doc) => {
      const data = doc.data();

      return {
        id: data.id,
        adminId: data.adminId,
        clientIds: data.clientIds,
        location: data.location,
        nickName:
          projectRequestType === projectRequestTypes.clientProjects
            ? data.nickName.client
            : data.nickName.admin,
        name: data.name,
        notes: data.notes,
        cover: data.cover,
        statuses: data.statuses,
        timeline: data.timeline,
        updated: data.updated.toDate().getTime(),
        created: data.created.toDate().getTime(),
      };
    });

    response = { data: response, startAfter: response[response.length - 1]?.id };

    return response;
  } catch (error) {
    console.log("getAllProjects ======>", error);
    return { error };
  }
}
export async function getAllProjectsList({ limit, startAfter }) {
  let response = [];
  let query = admin.firestore().collection(collectionNames.projects).orderBy("created", "desc");

  if (startAfter && startAfter !== "undefined") {
    const lastDoc = await admin
      .firestore()
      .collection(collectionNames.projects)
      .doc(startAfter)
      .get();
    query = query.startAfter(lastDoc);
  }
  if (limit && limit !== "undefined") {
    query = query.limit(limit);
  }
  try {
    response = (
      await query
        .where("statuses.isDeactivated", "==", false)
        .where("statuses.isDeleted", "==", false)
        .get()
    ).docs;

    response = await Promise.all(
      response.map(async (doc) => {
        const data = await populateRefs(doc.data(), {
          collection: collectionNames.users,
          projections: {
            users: ["name", "email", "profileImage"],
          },
        });

        return {
          id: data.id,
          clients: data.clients,
          location: data.location,
          nickName: data.nickName.admin,
          name: data.name,
        };
      })
    );

    response = { data: response, startAfter: response[response.length - 1]?.id };

    return response;
  } catch (error) {
    console.log("getAllProjectLists ======>", error);
    return { error };
  }
}
export async function getAllClientProjects({ clientId, projectRequestType, limit, startAfter }) {
  if (clientId) {
    return { error: "client-id-require" };
  }
  let response = [];
  let query = admin
    .firestore()
    .collection(collectionNames.projects)
    .orderBy("created", "asc")
    .where("clientIds", "array-contains", clientId)
    .where("statuses.isDeactivated", "==", false)
    .where("statuses.isDeleted", "==", false);

  if (startAfter && startAfter !== "undefined") {
    const lastDoc = await admin
      .firestore()
      .collection(collectionNames.projects)
      .doc(startAfter)
      .get();
    query = query.startAfter(lastDoc);
  }
  if (limit && limit !== "undefined") {
    query = query.limit(limit);
  }
  try {
    response = (await query.get()).docs;

    response = response.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        adminId: data.adminId,
        clientId: data.clientId,
        location: data.location,
        nickName:
          projectRequestType === projectRequestTypes.clientProjects
            ? data.nickName.client
            : data.nickName.admin,
        name: data.name,
        notes: data.notes,
        cover: data.cover,
        statuses: data.statuses,
        timeline: data.timeline,
        updated: data.updated.toDate().getTime(),
        created: data.created.toDate().getTime(),
      };
    });

    response = { data: response, startAfter: response[response.length - 1]?.id };

    return response;
  } catch (error) {
    console.log("getCollectionData ======>", error);
    return { error };
  }
}

export async function getProjectsCount({ isDeactivated }) {
  try {
    const total = (
      await admin
        .firestore()
        .collection(collectionNames.projects)
        .where("statuses.isDeactivated", "==", isDeactivated ? isDeactivated : false)
        .where("statuses.isDeleted", "==", false)
        .count()
        .get()
    ).data().count;
    return total;
  } catch (error) {
    console.log("getProjectsCount ======>", error);
    return { error };
  }
}

export const getAllTypeProjectCounts = async () => {
  try {
    const activeProjects = (
      await admin
        .firestore()
        .collection(collectionNames.projects)
        .where("statuses.isDeactivated", "==", false)
        .where("statuses.isDeleted", "==", false)
        .count()
        .get()
    ).data().count;
    const deactivateedProjects = (
      await admin
        .firestore()
        .collection(collectionNames.projects)
        .where("statuses.isDeactivated", "==", true)
        .where("statuses.isDeleted", "==", false)
        .count()
        .get()
    ).data().count;

    return {
      data: {
        active: activeProjects,
        deactivated: deactivateedProjects,
      },
    };
  } catch (error) {
    console.log("getProjectCounts ====>", error);
    return { error };
  }
};

export const getClientProjectData = async ({ projectId }) => {
  const projectData = (
    await admin.firestore().collection(collectionNames.projects).doc(projectId).get()
  ).data();
  try {
    const updatesCount = (
      await admin
        .firestore()
        .collection(collectionNames.updates)
        .where("projectId", "==", projectId)
        .count()
        .get()
    ).data().count;

    return {
      data: {
        project: {
          name: projectData.name,
          id: projectData.id,
          location: projectData.location,
          clientId: projectData.clientId,
          nickName: projectData.nickName.client,
        },
        updates: updatesCount,
      },
    };
  } catch (error) {
    console.log("getClientProjectData ====>", error);
    return { error };
  }
};
