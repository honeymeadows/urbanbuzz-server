import { collectionNames, admin } from "../config/firebase.js";
import { updateRequestTypes } from "../resources/types/requests/update.js";
import { projectRequestTypes } from "../resources/types/requests/project.js";

export async function getCollectionData({
  collectionName,
  sort = {},
  secondarySort = {},
  pagination = {},
  primaryFilter = {},
  secondaryFilter = {},
  tertiaryFilter = {},
  quaternaryFilter = {},
  requestType,
  isInitial,
}) {
  if (!collectionName) {
    return { error: "Collection name required." };
  }
  let response = [];
  let total = 0;
  let query = admin.firestore().collection(collectionName);
  let countQuery = null;

  if (
    sort?.field &&
    sort?.field !== "undefined" &&
    sort?.direction &&
    sort?.direction !== "undefined"
  ) {
    query = query.orderBy(sort.field, sort.direction);
  } else {
    query = query.orderBy("created", "desc");
  }
  if (
    secondarySort?.field &&
    secondarySort?.field !== "undefined" &&
    secondarySort?.direction &&
    secondarySort?.direction !== "undefined"
  ) {
    query = query.orderBy(secondarySort.field, secondarySort.direction);
  }
  if (primaryFilter?.field && primaryFilter.operator && primaryFilter?.value !== undefined) {
    query = query.where(primaryFilter.field, primaryFilter.operator, primaryFilter.value);
  }
  if (secondaryFilter?.field && secondaryFilter?.operator && secondaryFilter?.value !== undefined) {
    query = query.where(secondaryFilter.field, secondaryFilter.operator, secondaryFilter.value);
  }
  if (tertiaryFilter?.field && tertiaryFilter?.operator && tertiaryFilter?.value !== undefined) {
    query = query.where(tertiaryFilter.field, tertiaryFilter.operator, tertiaryFilter.value);
  }
  if (
    quaternaryFilter?.field &&
    quaternaryFilter?.operator &&
    quaternaryFilter?.value !== undefined
  ) {
    query = query.where(quaternaryFilter.field, quaternaryFilter.operator, quaternaryFilter.value);
  }

  if (isInitial) {
    countQuery = query;
  }

  if (pagination?.startAfter && pagination?.startAfter !== "undefined") {
    const lastDoc = await admin
      .firestore()
      .collection(collectionName)
      .doc(pagination.startAfter)
      .get();
    query = query.startAfter(lastDoc);
  }
  if (pagination?.limit && pagination?.limit !== "undefined") {
    query = query.limit(pagination.limit);
  }
  try {
    response = (await query.get()).docs;
    if (collectionName === collectionNames.users) {
      response = await Promise.all(
        response.map(async (doc) => {
          const data = doc.data();
          const lastSession = (await admin.auth().getUserByEmail(data.email)).metadata
            .lastRefreshTime;
          return {
            id: doc.id,
            profileImage: data.profileImage,
            name: data.name,
            email: data.email,
            isEmailNotification: data?.isEmailNotification ? true : false,
            joined: data.joined,
            invite: data.invite,
            roles: data.roles,
            statuses: data.statuses,
            lastSession: lastSession,
          };
        })
      );
    } else {
      response = response.map((doc) => {
        const data = doc.data();
        if (collectionName === collectionNames.projects) {
          if (requestType === projectRequestTypes.clientProjects) {
            return {
              id: data.id,
              adminId: data.adminId,
              clientId: data.clientId,
              location: data.location,
              nickName: data.nickName.client,
              name: data.name,
              notes: data.notes,
              cover: data.cover,
              statuses: data.statuses,
              timeline: data.timeline,
              updated: data.updated.toDate().getTime(),
              created: data.created.toDate().getTime(),
            };
          } else {
            return {
              id: data.id,
              adminId: data.adminId,
              clientId: data.clientId,
              location: data.location,
              nickName: data.nickName.admin,
              name: data.name,
              notes: data.notes,
              cover: data.cover,
              statuses: data.statuses,
              timeline: data.timeline,
              updated: data.updated.toDate().getTime(),
              created: data.created.toDate().getTime(),
            };
          }
        } else if (collectionName === collectionNames.updates) {
          if (
            requestType === updateRequestTypes.clientUpdates ||
            requestType === updateRequestTypes.clientProjectUpdates
          ) {
            return {
              id: data.id,
              adminId: data.adminId,
              clientId: data.clientId,
              projectId: data.projectId,
              location: data.location,
              text: data.text,
              images: data.images,
              comments: data.comments,
              statuses: data.statuses,
              updated: data.updated.toDate().getTime(),
              created: data.created.toDate().getTime(),
            };
          } else {
            return {
              id: data.id,
              adminId: data.adminId,
              clientId: data.clientId,
              location: data.location,
              projectId: data.projectId,
              text: data.text,
              images: data.images,
              comments: data.comments,
              statuses: data.statuses,
              updated: data.updated.toDate().getTime(),
              created: data.created.toDate().getTime(),
            };
          }
        }
      });
    }

    response = { data: response, startAfter: response[response.length - 1]?.id };
    if (countQuery) {
      total = (await countQuery.count().get()).data().count;
      response = { ...response, total };
    }
    return response;
  } catch (error) {
    console.log("getCollectionData ======>", error);
    return { error };
  }
}
