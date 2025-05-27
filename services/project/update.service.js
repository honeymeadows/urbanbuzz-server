// utils
import { collectionNames, admin } from "../../config/firebase.js";
export const getUpdateData = async ({ projectId }) => {
  try {
    const projectData = (
      await admin.firestore().collection(collectionNames.projects).doc(projectId).get()
    ).data();

    const clients = projectData?.clientIds
      ? (
          await admin
            .firestore()
            .collection(collectionNames.users)
            .where("id", "in", projectData.clientIds)
            .get()
        ).docs.map((doc) => ({
          id: doc.data().id,
          name: doc.data().name,
          profileImage: doc.data().profileImage,
        }))
      : [];

    return {
      data: {
        clients,
        project: {
          id: projectData.id,
          adminId: projectData.adminId,
          clientIds: projectData.clientIds,
          clientEmails: projectData.clientEmails,
          country: projectData.country,
          nickName: projectData.nickName.admin,
          name: projectData.name,
          notes: projectData.notes,
          cover: projectData.cover,
          location: projectData.location,
          statuses: projectData.statuses,
          timeline: projectData.timeline,
          updated: projectData.updated.toDate().getTime(),
          created: projectData.created.toDate().getTime(),
        },
      },
    };
  } catch (error) {
    console.log("searchProjects ====>", error);
    return { error };
  }
};
export const getClientUpdateData = async ({ projectId }) => {
  try {
    const projectData = (
      await admin.firestore().collection(collectionNames.projects).doc(projectId).get()
    ).data();

    return {
      data: {
        project: {
          id: projectData.id,
          adminId: projectData.adminId,
          clientIds: projectData.clientIds,
          country: projectData.country,
          nickName: projectData.nickName.client,
          name: projectData.name,
          notes: projectData.notes,
          cover: projectData.cover,
          location: projectData.location,
          statuses: projectData.statuses,
          timeline: projectData.timeline,
          updated: projectData.updated.toDate().getTime(),
          created: projectData.created.toDate().getTime(),
        },
      },
    };
  } catch (error) {
    console.log("searchProjects ====>", error);
    return { error };
  }
};
export const getNewCommentsCount = async ({ adminId }) => {
  let counts = 0;
  try {
    const updates = await admin
      .firestore()
      .collection(collectionNames.updates)
      .where("adminId", "==", adminId)
      .where("isAdminReplied", "==", false)
      .get();

    counts = updates.size;
    return { data: counts };
  } catch (error) {
    console.log("getNewCommentsCount ====>", error);
    return { error };
  }
};
export const searchUpdates = async ({ searchedText }) => {
  const updates = [];
  try {
    const docRef = await admin
      .firestore()
      .collection(collectionNames.updates)
      .where("statuses.isDeactivated", "==", false)
      .where("statuses.isDeleted", "==", false)
      .where("searchKeywords", "array-contains", searchedText.toLowerCase())
      .get();

    docRef.forEach((doc) => {
      updates.push({
        id: doc.data().id,
        adminId: doc.data().adminId,
        location: doc.data().location,
        projectId: doc.data().projectId,
        text: doc.data().text,
        images: doc.data().images,
        comments: doc.data().comments,
        statuses: doc.data().statuses,
        updated: doc.data().updated.toDate().getTime(),
        created: doc.data().created.toDate().getTime(),
      });
    });

    return { data: updates };
  } catch (error) {
    console.log("searchupdates ====>", error);
    return { error };
  }
};
export const getClientProjectUpdates = async ({ clientId, startAfter, limit }) => {
  if (!clientId) {
    return { error: "invalid-request" };
  }
  let query = admin.firestore().collection(collectionNames.updates);
  if (startAfter && startAfter !== "undefined") {
    const lastDoc = await admin
      .firestore()
      .collection(collectionNames.updates)
      .doc(startAfter)
      .get();
    query = query.startAfter(lastDoc);
  }
  if (limit && limit !== "undefined") {
    query = query.limit(limit);
  }
  try {
    const projectIds = (
      await admin
        .firestore()
        .collection(collectionNames.projects)
        .where("clientIds", "array-contains", clientId)
        .get()
    ).docs.map((doc) => doc.id);

    if (!projectIds?.length) {
      return [];
    }

    let response = (
      await query
        .where("projectId", "in", projectIds)
        .where("statuses.isDeactivated", "==", false)
        .where("statuses.isDeleted", "==", false)
        .orderBy("created", "desc")
        .get()
    ).docs;

    response = response.map((doc) => {
      const data = doc.data();
      return {
        id: data.id,
        adminId: data.adminId,
        projectId: data.projectId,
        location: data.location,
        text: data.text,
        images: data.images,
        comments: data.comments,
        statuses: data.statuses,
        updated: data.updated.toDate().getTime(),
        created: data.created.toDate().getTime(),
      };
    });

    response = { data: response, startAfter: response[response.length - 1]?.id };

    return response;
  } catch (error) {
    console.log("getClientProjectUpdates ====>", error);
    return { error };
  }
};
export async function getUpdatesCount({ clientId }) {
  if (!clientId) {
    return { error: "invalid-request" };
  }
  try {
    const projectIds = (
      await admin
        .firestore()
        .collection(collectionNames.projects)
        .where("clientIds", "array-contains", clientId)
        .get()
    ).docs.map((doc) => doc.id);
    const total = (
      await admin
        .firestore()
        .collection(collectionNames.updates)
        .where("projectId", "in", projectIds)
        .where("statuses.isDeactivated", "==", false)
        .where("statuses.isDeleted", "==", false)
        .count()
        .get()
    ).data().count;
    return total;
  } catch (error) {
    console.log("getUpdatesCount ======>", error);
    return { error };
  }
}
