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
          clientId: projectData.clientId,
          clientIds: projectData.clientIds,
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
export const getClientUpdateData = async ({ projectId, clientId }) => {
  try {
    const clientData = (
      await admin.firestore().collection(collectionNames.users).doc(clientId).get()
    ).data();
    const projectData = (
      await admin.firestore().collection(collectionNames.projects).doc(projectId).get()
    ).data();

    return {
      data: {
        client: {
          id: clientData.id,
          name: clientData.name,
          profileImage: clientData.profileImage,
        },
        project: {
          id: projectData.id,
          adminId: projectData.adminId,
          clientId: projectData.clientId,
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
        clientId: doc.data().clientId,
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
