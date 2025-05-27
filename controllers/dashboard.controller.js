// resources
import { projectRequestTypes } from "../resources/types/requests/project.js";
// utils
import { collectionNames, admin } from "../config/firebase.js";
import { getAllClientProjects, getClientProjectData } from "../services/project/project.service.js";
import { uploadToStorage } from "../services/storage/firebase.service.js";
import { updateRequestTypes } from "../resources/types/requests/update.js";
import { getCollectionData } from "./collection.controller.js";
import {
  getClientProjectUpdates,
  getClientUpdateData,
  getUpdatesCount,
} from "../services/project/update.service.js";

export async function getClientProjects(req, res) {
  const { projectRequestType } = req.params;
  const { projectId } = req.query;

  const clientId = req.user.uid;
  if (!projectRequestType) {
    return res.status(400).json({ message: "Request type is required" });
  }

  if (!clientId) {
    return res.status(400).json({ message: "Client id is required" });
  }

  let fetcherHandler = null; // Function handler which will fetch data from db
  let args = null; // Object of Arguments for the handler. Order is important
  let responseName = null; // String name to use in store
  let limit = Number(req.query.limit);
  let initial = req.query?.initial === "true" ? true : false;
  let startAfter = req.query.startAfter === "null" ? null : req.query.startAfter;
  let total = 0;

  if (projectRequestType === projectRequestTypes.clientProjects) {
    args = {
      clientId,
      projectRequestType,
      limit,
      startAfter: startAfter ?? null,
    };

    fetcherHandler = getAllClientProjects;
    responseName = "projects";
  } else if (projectRequestType === projectRequestTypes.clientProjectData) {
    if (!projectId) {
      return res.status(400).json({ message: "Project id is required" });
    }
    fetcherHandler = getClientProjectData;
    args = { projectId };
    responseName = "projectData";
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

export async function updateClientProject(req, res) {
  const { projectRequestType } = req.params;
  const { projectId, newData } = req.body;

  if (!projectRequestType) {
    return res.status(400).json({ message: "Admin request type is required" });
  }
  if (!projectId) {
    return res.status(400).json({ message: "Project id is required" });
  }
  if (!newData) {
    return res.status(400).json({ message: "New updated data is required" });
  }

  const projectRef = admin.firestore().collection(collectionNames.projects).doc(projectId);

  let project = await projectRef.get();

  if (!project.exists || project.data()?.statuses?.isDeleted) {
    return res.status(400).json({ message: "invalid project id" });
  }

  if (projectRequestType === projectRequestTypes.updateClientProjectNickName) {
    if (!newData?.newNickName) {
      return res.status(400).json({ message: "new name is required" });
    }

    await projectRef.update({
      nickName: {
        ...project.data().nickName,
        client: newData.newNickName,
      },
    });
  } else {
    return res.status(400).json({ message: "Invalid project request type" });
  }

  project = (await projectRef.get()).data();
  return res.json({
    project: {
      ...project,
      updated: project.updated.toDate().getTime(),
      created: project.created.toDate().getTime(),
    },
    projectRequestType,
  });
}

export async function getClientUpdates(req, res) {
  const { updateRequestType } = req.params;
  const { initial, projectId } = req.query;

  if (!updateRequestType) {
    return res.status(400).json({ message: "Request type is required" });
  }

  let fetcherHandler = null; // Function handler which will fetch data from db
  let args = null; // Object of Arguments for the handler. Order is important
  let responseName = null; // String name to use in store
  let limit = Number(req.query.limit);
  let startAfter = req.query.startAfter === "null" ? null : req.query.startAfter;
  let total = 0;

  if (updateRequestType === updateRequestTypes.clientUpdates) {
    args = {
      clientId: req.user.uid,
      startAfter: startAfter ?? null,
      limit,
    };
    fetcherHandler = getClientProjectUpdates;
    responseName = "updates";
  } else if (updateRequestType === updateRequestTypes.clientUpdateData) {
    if (projectId === "undefined") {
      return res.status(400).json({ message: "Project id is required" });
    }

    fetcherHandler = getClientUpdateData;
    args = { projectId };
    responseName = "updateData";
  } else if (updateRequestType === updateRequestTypes.clientProjectUpdates) {
    if (projectId === "undefined") {
      return res.status(400).json({ message: "Project id is required" });
    }
    args = {
      collectionName: collectionNames.updates,
      sort: { field: "created", direction: "asc" },
      pagination: { limit, startAfter: startAfter ?? null },
      primaryFilter: { field: "projectId", operator: "==", value: projectId },
      secondaryFilter: { field: "statuses.isDeactivated", operator: "==", value: false },
      tertiaryFilter: { field: "statuses.isDeleted", operator: "==", value: false },
      isInitial: initial,
    };

    fetcherHandler = getCollectionData;
    responseName = "updates";
  }
  if (!fetcherHandler || !responseName || !args) {
    return res.status(400).json({ message: "Invalid Request type." });
  }

  const result = await fetcherHandler(args);
  if (initial) {
    total = await getUpdatesCount(args);
  }
  if (result?.error) {
    return res.status(400).json(result?.error);
  } else {
    let response = {
      [responseName]: result.data,
      startAfter: result?.startAfter,
    };

    if (total) {
      response = { ...response, total };
    }
    return res.json(response);
  }
}
export async function createClientUpdateComment(req, res) {
  const { updateRequestType } = req.params;
  const { content, updateId, user, images } = req.body;

  if (!updateRequestType) {
    return res.status(400).json({ message: "Request type is required" });
  }

  const clientId = req.user.uid;

  if (updateRequestType === updateRequestTypes.createClientUpdateComment) {
    if (!content || !updateId || !user) {
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
          id: user?.id,
          name: user?.name,
          profileImage: user?.profileImage,
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
          lastCommentByClientOn: new Date().getTime(),
          comments:
            updateData.data()?.comments?.length > 0
              ? updateData.data()?.comments?.concat([commentData])
              : [commentData],
        });
      });

      const update = (await updateRef.get()).data();
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
