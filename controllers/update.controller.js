// controllers
// resources
import { updateRequestTypes } from "../resources/types/requests/update.js";
// utils
import { collectionNames, admin, bucket } from "../config/firebase.js";
import { getCollectionData } from "./collection.controller.js";
import { uploadToStorage } from "../services/storage/firebase.service.js";
import { createNotification, createNotifications } from "./notification.controller.js";
import { getMissingElements } from "../utils/array.js";
import { notificationTypes } from "../resources/types/notification.js";
import {
  getNewCommentsCount,
  getUpdateData,
  searchUpdates,
} from "../services/project/update.service.js";
import sendEmail from "../services/email.servce.js";
import { emailTypes } from "../resources/types/index.js";

export async function getUpdates(req, res) {
  const { updateRequestType } = req.params;
  const { searchedText, initial, sortField, sortDirection, projectId, clientId, isDeactivated } =
    req.query;

  if (!updateRequestType) {
    return res.status(400).json({ message: "Request type is required" });
  }

  let fetcherHandler = null; // Function handler which will fetch data from db
  let args = null; // Object of Arguments for the handler. Order is important
  let responseName = null; // String name to use in store
  let limit = Number(req.query.limit);
  let startAfter = req.query.startAfter === "null" ? null : req.query.startAfter;

  if (updateRequestType === updateRequestTypes.recentUpdates) {
    args = {
      collectionName: collectionNames.updates,
      sort: {
        field: sortField,
        direction: sortDirection,
      },
      pagination: { limit, startAfter: startAfter ?? null },
      primaryFilter: {
        field: "statuses.isDeactivated",
        operator: "==",
        value: false,
      },
      secondaryFilter: {
        field: "statuses.isDeleted",
        operator: "==",
        value: false,
      },
      isInitial: initial,
    };

    fetcherHandler = getCollectionData;
    responseName = "updates";
  } else if (updateRequestType === updateRequestTypes.commentedUpdates) {
    args = {
      collectionName: collectionNames.updates,
      sort: {
        field: "isAdminReplied",
        direction: "asc",
      },
      secondarySort: {
        field: "lastCommentByClientOn",
        direction: sortDirection,
      },
      pagination: { limit, startAfter: startAfter ?? null },
      primaryFilter: {
        field: "statuses.isDeactivated",
        operator: "==",
        value: false,
      },
      secondaryFilter: {
        field: "statuses.isDeleted",
        operator: "==",
        value: false,
      },
      isInitial: initial,
    };

    fetcherHandler = getCollectionData;
    responseName = "updates";
  } else if (updateRequestType === updateRequestTypes.searchUpdates) {
    args = {
      collectionName: collectionNames.updates,
      sort: {
        field: "isAdminReplied",
        direction: "asc",
      },
      secondarySort: {
        field: "lastCommentByClientOn",
        direction: sortDirection,
      },
      pagination: { limit, startAfter: startAfter ?? null },
      primaryFilter: {
        field: "statuses.isDeactivated",
        operator: "==",
        value: false,
      },
      secondaryFilter: {
        field: "statuses.isDeleted",
        operator: "==",
        value: false,
      },
      isInitial: initial,
    };
    if (!searchedText) {
      return res.status(400).json({ message: "Searched text is required" });
    }
    fetcherHandler = searchUpdates;
    args = { searchedText };
    responseName = "updates";
  } else if (updateRequestType === updateRequestTypes.projectUpdates) {
    if (projectId === "undefined") {
      return res.status(400).json({ message: "Project id is required" });
    }
    args = {
      collectionName: collectionNames.updates,
      sort: { field: "created", direction: "asc" },
      pagination: { limit, startAfter: startAfter ?? null },
      primaryFilter: { field: "projectId", operator: "==", value: projectId },
      secondaryFilter: {
        field: "statuses.isDeactivated",
        operator: "==",
        value: false,
      },
      tertiaryFilter: {
        field: "statuses.isDeleted",
        operator: "==",
        value: false,
      },
      isInitial: initial,
    };

    fetcherHandler = getCollectionData;
    responseName = "updates";
  } else if (updateRequestType === updateRequestTypes.updateData) {
    if (projectId === "undefined") {
      return res.status(400).json({ message: "Project id is required" });
    }
    fetcherHandler = getUpdateData;
    args = { projectId };
    responseName = "updateData";
  } else if (updateRequestType === updateRequestTypes.newCommentsCount) {
    const adminId = req.user.user_id;
    fetcherHandler = getNewCommentsCount;
    args = { adminId };
    responseName = "commentsCount";
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

export async function createUpdate(req, res) {
  const { updateRequestType } = req.params;
  const { content, clientId, projectId, updateId, images, emailNotification } = req.body;

  if (!updateRequestType) {
    return res.status(400).json({ message: "Request type is required" });
  }

  const adminId = req.user.uid;
  const adminData = (
    await admin.firestore().collection(collectionNames.users).doc(adminId).get()
  ).data();

  if (updateRequestType === updateRequestTypes.createProjectUpdate) {
    if (!content || !projectId) {
      return res.status(400).json({ message: "Invalid update data body" });
    }

    const updateRef = admin.firestore().collection(collectionNames.updates).doc();
    const projectRef = admin.firestore().collection(collectionNames.projects).doc(projectId);
    try {
      let uploadedImages = [];
      if (images?.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const fileName = images[i].name;
          const fileType = images[i].type;
          const file = Buffer.from(images[i].buffer);
          const newFileName = `projects/updates/${updateRef.id}/${new Date().getTime()}`;

          const fileData = await uploadToStorage(newFileName, file, fileType);
          uploadedImages.push({
            name: fileData.name,
            originalFileName: fileName,
            path: fileData.name,
            url: fileData.url,
          });
        }
      }

      const projectData = (await projectRef.get()).data();

      await admin.firestore().runTransaction(async (transaction) => {
        if (!projectData) {
          throw new Error("Document does not exist!");
        }

        transaction.create(updateRef, {
          id: updateRef.id,
          adminId,
          projectId,
          comments: [],
          text: content,
          images: uploadedImages,
          isAdminReplied: true,
          lastCommentByClientOn: new Date().getTime(),
          lastCommentByAdminOn: new Date().getTime(),
          loaction: projectData?.location,
          searchKeywords: projectData?.searchKeywords,
          statuses: {
            isDeactivated: false,
            isDeleted: false,
          },
          updated: new Date(),
          created: new Date(),
        });

        await createNotifications({
          sender: {
            id: adminData?.id,
            name: adminData?.name,
            profileimage: adminData?.profileImage?.url,
          },
          receivers: projectData?.clientIds,
          project: {
            id: projectData?.id,
            name: projectData?.name,
            location: projectData?.location,
          },
          type: notificationTypes.updateCreated,
        });
      });

      const update = (await updateRef.get()).data();

      if (emailNotification && projectData?.clientEmails?.length) {
        const emailRes = await sendEmail({
          email: projectData.clientEmails,
          emailType: emailTypes.projectUpdate,
          emailData: {
            project: projectData,
          },
        });
      }

      return res.json({
        update: {
          ...update,
          project: {
            id: projectData.id,
            adminId: projectData.adminId,
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
          isNew: true,
          created: update?.created?.toDate().getTime(),
          updated: update?.created?.toDate().getTime(),
        },
      });
    } catch (error) {
      console.log("createUpdate ====>", error);
      return res.status(500).json({ message: "server-error" });
    }
  } else if (updateRequestType === updateRequestTypes.createUpdateComment) {
    if (!content || !updateId || !adminData) {
      return res.status(400).json({ message: "Invalid update data body" });
    }
    const updateRef = admin.firestore().collection(collectionNames.updates).doc(updateId);

    try {
      let uploadedImages = [];

      if (images?.length > 0) {
        for (let i = 0; i < images.length; i++) {
          const fileName = images[i].name;
          const fileType = images[i].type;
          const file = Buffer.from(images[i].buffer);
          const newFileName = `projects/updates/${updateRef.id}/comments/${new Date().getTime()}`;

          const fileData = await uploadToStorage(newFileName, file, fileType);
          uploadedImages.push({
            name: fileData.name,
            originalFileName: fileName,
            path: fileData.name,
            url: fileData.url,
          });
        }
      }

      const commentData = {
        id: admin.firestore().collection(collectionNames.comments).doc().id,
        text: content,
        images: uploadedImages,
        isAdmin: true,
        user: {
          id: adminData?.id,
          name: adminData?.name,
          profileImage: adminData?.profileImage?.url,
          isAdmin: req.user.roles.isAdmin || req.user.roles.isSuperAdmin,
          isClient: req.user.roles.isClient,
        },
        created: new Date().getTime(),
      };

      await admin.firestore().runTransaction(async (transaction) => {
        const updateData = await transaction.get(updateRef);
        if (!updateData.exists) {
          throw new Error("Document does not exist!");
        }

        transaction.update(updateRef, {
          isAdminReplied: true,
          lastCommentByAdminOn: new Date().getTime(),
          comments:
            updateData.data()?.comments?.length > 0
              ? updateData.data()?.comments?.concat([commentData])
              : [commentData],
        });
      });

      const update = (await updateRef.get()).data();
      const project = (
        await admin.firestore().collection(collectionNames.projects).doc(update.projectId).get()
      ).data();

      await createNotification({
        sender: {
          id: adminData?.id,
          name: adminData?.name,
          profileimage: adminData?.profileImage?.url,
        },
        receiver: { id: project?.clientId },
        project: {
          id: project.id,
          name: project.name,
          location: project.location,
        },
        type: notificationTypes.replyProject,
      });
      return res.json({
        update: {
          ...update,
          created: update?.created?.toDate().getTime(),
          updated: update?.created?.toDate().getTime(),
        },
      });
    } catch (error) {
      console.log("createComment ====>", error);
      return res.status(500).json({ message: "server-error" });
    }
  }
}

export async function updateProjectUpdate(req, res) {
  const { updateRequestType } = req.params;
  const { updateId, newData } = req.body;

  if (!updateRequestType) {
    return res.status(400).json({ message: "Update request type is required" });
  }
  if (!updateId) {
    return res.status(400).json({ message: "Update id is required" });
  }
  if (!newData) {
    return res.status(400).json({ message: "New updated data is required" });
  }

  const updateRef = admin.firestore().collection(collectionNames.updates).doc(updateId);

  let update;

  if (updateRequestType === updateRequestTypes.updateProjectUpdate) {
    const { content, projectId, images } = newData;
    if (!content || !projectId) {
      return res.status(400).json({ message: "Invalid update data body" });
    }

    update = await updateRef.get();
    if (!update.exists) {
      return res.status(400).json({ message: "invalid update id" });
    }
    update = update.data();

    const deletedImage = getMissingElements(update.images, images);

    try {
      let uploadedImages = images.filter((img) => img?.url);
      if (images?.length > 0) {
        for (let i = 0; i < images.length; i++) {
          if (images[i]?.url) {
            continue;
          }
          const fileName = images[i].name;
          const fileType = images[i].type;
          const file = Buffer.from(images[i].buffer);
          const newFileName = `projects/updates/${updateId}/${new Date().getTime()}`;

          const fileData = await uploadToStorage(newFileName, file, fileType);
          uploadedImages.push({
            name: fileData.name,
            originalFileName: fileName,
            path: fileData.name,
            url: fileData.url,
          });
        }
      }
      if (deletedImage?.length > 0) {
        for (let i = 0; i < deletedImage.length; i++) {
          await bucket.file(deletedImage[i].name).delete();
        }
      }

      await updateRef.update({
        images: uploadedImages,
        text: content,
        projectId,
        updated: new Date(),
      });
      update = (await updateRef.get()).data();
    } catch (error) {
      console.log("updateProjectUpdate ====>", error);
      return res.status(500).json({ message: "server-error" });
    }
  }

  return res.json({
    update: {
      ...update,
      updated: update.updated.toDate().getTime(),
      created: update.created.toDate().getTime(),
    },
    updateRequestType,
  });
}
export async function deleteProjectUpdate(req, res) {
  const { updateId } = req.query;
  if (!updateId) {
    return res.status(400).json({ message: "Update id is required" });
  }

  const updateRef = admin.firestore().collection(collectionNames.updates).doc(updateId);

  let update;

  update = await updateRef.get();
  if (!update.exists) {
    return res.status(400).json({ message: "invalid update id" });
  }
  try {
    const [files] = await bucket.getFiles({
      prefix: `projects/updates/${updateId}/`,
    });

    for (let i = 0; i < files.length; i++) {
      await bucket.file(files[i].name).delete();
    }

    await updateRef.delete();
    return res.json({
      updateId,
    });
  } catch (error) {
    console.log("deleteProjectUpdate ====>", error);
    return res.status(500).json({ message: "server-error" });
  }
}
