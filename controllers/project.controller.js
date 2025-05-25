// controllers
// resources
import { projectRequestTypes } from "../resources/types/requests/project.js";
// utils
import { collectionNames, admin, adminInstance } from "../config/firebase.js";
import { createNotification } from "./notification.controller.js";
import { getArrayFromString } from "../utils/index.js";
import { notificationTypes } from "../resources/types/notification.js";
import {
  getAllClientProjects,
  getAllProjects,
  getAllProjectsList,
  getAllTypeProjectCounts,
  getProjectsCount,
} from "../services/project/project.service.js";
import { populateRefs } from "../services/user.service.js";

export async function getProjects(req, res) {
  const { projectRequestType } = req.params;
  const { searchedText, sortField, sortDirection, projectId, clientId, isDeactivated } = req.query;

  if (!projectRequestType) {
    return res.status(400).json({ message: "Request type is required" });
  }

  let fetcherHandler = null; // Function handler which will fetch data from db
  let args = null; // Object of Arguments for the handler. Order is important
  let responseName = null; // String name to use in store
  let limit = Number(req.query.limit);
  let initial = req.query?.initial === "true" ? true : false;
  let startAfter = req.query.startAfter === "null" ? null : req.query.startAfter;
  let total = 0;

  if (
    projectRequestType === projectRequestTypes.activeProjects ||
    projectRequestType === projectRequestTypes.deactivatedProjects
  ) {
    args = {
      projectRequestType,
      isDeactivated: projectRequestType === projectRequestTypes.deactivatedProjects ? true : false,
      limit,
      startAfter: startAfter ?? null,
      sortField,
      sortDirection,
    };

    fetcherHandler = getAllProjects;
    responseName = "projects";
  } else if (projectRequestType === projectRequestTypes.projectsList) {
    args = {
      limit,
      startAfter: startAfter ?? null,
    };

    fetcherHandler = getAllProjectsList;
    responseName = "projects";
  } else if (projectRequestType === projectRequestTypes.activeClientProjects) {
    if (!clientId) {
      return res.status(400).json({ message: "Client Id is required" });
    }
    args = {
      clientId,
      projectRequestType,
      limit,
      startAfter,
    };

    fetcherHandler = getAllClientProjects;
    responseName = "projects";
  } else if (projectRequestType === projectRequestTypes.searchProjects) {
    if (!searchedText) {
      return res.status(400).json({ message: "Searched text is required" });
    }
    fetcherHandler = searchProjects;
    args = { searchedText, isDeactivated };
    responseName = "projects";
  } else if (projectRequestType === projectRequestTypes.projectData) {
    if (!projectId) {
      return res.status(400).json({ message: "Project id is required" });
    }
    fetcherHandler = getProjectData;
    args = { projectId };
    responseName = "projectData";
  } else if (projectRequestType === projectRequestTypes.projectCount) {
    fetcherHandler = getAllTypeProjectCounts;
    args = {};
    responseName = "counts";
  }
  if (!fetcherHandler || !responseName || !args) {
    return res.status(400).json({ message: "Invalid Request type." });
  }

  const result = await fetcherHandler(args);
  if (initial) {
    total = await getProjectsCount(args);
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

export async function createProject(req, res) {
  const { projectRequestType } = req.params;
  const {
    projectId,
    note,
    clientId,
    clientName,
    country,
    countryCode,
    placeId,
    address,
    city,
    province,
    postalCode,
    latitude,
    longitude,
  } = req.body;

  if (!projectRequestType) {
    return res.status(400).json({ message: "Request type is required" });
  }

  const adminId = req.user.uid;
  const adminData = (
    await admin.firestore().collection(collectionNames.users).doc(adminId).get()
  ).data();

  if (projectRequestType === projectRequestTypes.createProject) {
    if (!clientId || !clientName || !country || !countryCode || !address || !city || !postalCode) {
      return res.status(400).json({ message: "Invalid project body" });
    }

    const clientData = (
      await admin.firestore().collection(collectionNames.users).doc(clientId).get()
    ).data();

    const nickName = createNickName(address);

    try {
      const projectRef = admin.firestore().collection(collectionNames.projects).doc();
      await projectRef.create({
        id: projectRef.id,
        adminId,
        clientId,
        clientName,
        country,
        nickName: {
          admin: nickName,
          client: nickName,
        },
        name: address,
        location: {
          placeId: placeId ?? null,
          address,
          countryCode,
          city,
          province,
          postalCode,
          latitude: latitude ?? null,
          longitude: longitude ?? null,
          country,
        },
        notes: [],
        searchKeywords: [
          ...new Set([
            ...getArrayFromString(nickName)
              .concat(getArrayFromString(clientName))
              .concat(getArrayFromString(address))
              .concat(getArrayFromString(city))
              .concat(getArrayFromString(country)),
          ]),
        ],
        statuses: {
          isDeactivated: false,
          isDeleted: false,
        },
        timeline: [
          {
            type: "created",
            time: new Date().getTime(),
          },
        ],
        updated: new Date(),
        created: new Date(),
      });
      const project = (await projectRef.get()).data();

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
        type: notificationTypes.projectCreated,
      });

      return res.json({
        project: {
          ...project,
          nickName: project?.nickName?.admin,
          client: {
            id: clientData.id,
            name: clientData.name,
            profileImage: clientData.profileImage,
          },
          isNew: true,
          created: project?.created?.toDate().getTime(),
          updated: project?.created?.toDate().getTime(),
        },
      });
    } catch (error) {
      console.log("createProject ====>", error);
      return res.status(500).json({ message: "server-error" });
    }
  } else if (projectRequestType === projectRequestTypes.createProjectNote) {
    if (!projectId) {
      return res.status(400).json({ message: "Project id is required" });
    }
    if (!note) {
      return res.status(400).json({ message: "Project note is required" });
    }

    const projectRef = admin.firestore().collection(collectionNames.projects).doc(projectId);
    const noteRef = admin.firestore().collection(collectionNames.notes).doc();
    let project = await projectRef.get();
    if (!project.exists) {
      return res.status(400).json({ message: "invalid project id" });
    }

    try {
      await projectRef.update({
        notes: project
          .data()
          .notes.concat([{ id: noteRef.id, text: note, createdOn: new Date().getTime() }]),
      });
      project = (await projectRef.get()).data();
      return res.json({
        project: {
          ...project,
          created: project?.created?.toDate().getTime(),
          updated: project?.created?.toDate().getTime(),
        },
      });
    } catch (error) {
      console.log("createProject ====>", error);
      return res.status(500).json({ message: "server-error" });
    }
  }
}

export async function updateProject(req, res) {
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
  const updatesRef = admin
    .firestore()
    .collection(collectionNames.updates)
    .where("projectId", "==", projectId);

  let project = await projectRef.get();

  if (!project.exists) {
    return res.status(400).json({ message: "invalid project id" });
  }

  if (projectRequestType === projectRequestTypes.updateProject) {
    await admin.firestore().runTransaction(async (transaction) => {
      const data = {
        clientId: newData?.clientId ?? project.data().clientId,
        clientName: newData?.clientName ?? project.data().clientName,
        name: newData?.address ?? project.data().name,
        location: {
          placeId: newData?.placeId ?? null,
          address: newData?.address ?? project.data().address,
          country: newData?.country ?? project.data().country,
          countryCode: newData?.countryCode ?? project.data().countryCode,
          city: newData?.city ?? project.data().city,
          province: newData?.province ?? project.data().province,
          postalCode: newData?.postalCode ?? project.data().postalCode,
          latitude: newData?.latitude ?? null,
          longitude: newData?.longitude ?? null,
        },
        searchKeywords: [
          ...new Set([
            ...getArrayFromString(project.data().nickName.admin)
              .concat(getArrayFromString(newData?.clientName ?? project.data().clientName))
              .concat(getArrayFromString(newData?.address ?? project.data().location.address))
              .concat(getArrayFromString(newData?.city ?? project.data().location.city))
              .concat(getArrayFromString(newData?.country ?? project.data().location.country)),
          ]),
        ],
        updated: new Date(),
      };

      transaction.update(projectRef, data);

      const updatesSnapshot = await updatesRef.get();
      updatesSnapshot.forEach((updateDoc) => {
        const updateDocRef = admin
          .firestore()
          .collection(collectionNames.updates)
          .doc(updateDoc.id);
        transaction.update(updateDocRef, {
          location: data.location,
          searchKeywords: data.searchKeywords,
        });
      });
    });
  } else if (projectRequestType === projectRequestTypes.updateDeactivatedStatus) {
    if (typeof newData?.isDeactivated !== "boolean") {
      return res.status(400).json({ message: "invalid update data" });
    }

    try {
      await admin.firestore().runTransaction(async (transaction) => {
        transaction.update(projectRef, {
          timeline: project.data().timeline.concat([
            {
              type: newData?.isDeactivated ? "deactivated" : "activated",
              time: new Date().getTime(),
            },
          ]),
          statuses: {
            ...project.data().statuses,
            isDeactivated: newData.isDeactivated,
          },
        });

        const updatesSnapshot = await updatesRef.get();

        updatesSnapshot.forEach((updateDoc) => {
          const updateDocRef = admin
            .firestore()
            .collection(collectionNames.updates)
            .doc(updateDoc.id);
          transaction.update(updateDocRef, {
            "statuses.isDeactivated": newData.isDeactivated,
          });
        });
      });
    } catch (error) {
      console.log(error);
      return res.status(500).json({ message: "server-error" });
    }
  } else if (projectRequestType === projectRequestTypes.updateDeletedStatus) {
    if (typeof newData?.isDeleted !== "boolean") {
      return res.status(400).json({ message: "invalid update data" });
    }
    await projectRef.update({
      timeline: project.data().timeline.concat([
        {
          type: newData?.isDeleted ? "deleted" : "recovered",
          time: new Date().getTime(),
        },
      ]),
      statuses: {
        ...project.data().statuses,
        isDeleted: newData.isDeleted,
      },
    });

    try {
      await admin.firestore().runTransaction(async (transaction) => {
        transaction.update(projectRef, {
          statuses: {
            ...project.data().statuses,
            isDeleted: newData.isDeleted,
            timeline: project.data().timeline.concat([
              {
                type: newData?.isDeleted ? "Deleted" : "Restored",
                time: new Date().getTime(),
              },
            ]),
          },
        });

        const updatesSnapshot = await updatesRef.get();

        updatesSnapshot.forEach((updateDoc) => {
          const updateDocRef = admin
            .firestore()
            .collection(collectionNames.updates)
            .doc(updateDoc.id)
            .doc(updateDoc.id);
          transaction.update(updateDocRef, {
            "statuses.isDeleted": newData.isDeleted,
          });
        });
      });
    } catch (error) {
      console.log({ error });
      return res.status(500).json({ message: "server-error" });
    }
  } else if (projectRequestType === projectRequestTypes.updateNickName) {
    if (!newData?.newNickName) {
      return res.status(400).json({ message: "new name is required" });
    }

    await projectRef.update({
      nickName: {
        ...project.data().nickName,
        admin: newData.newNickName,
      },
      searchKeywords: [
        ...new Set([
          ...getArrayFromString(newData.newNickName)
            .concat(getArrayFromString(project.data().clientName))
            .concat(getArrayFromString(project.data().location.address))
            .concat(getArrayFromString(project.data().location.city))
            .concat(getArrayFromString(project.data().location.country)),
        ]),
      ],
    });
  } else if (projectRequestType === projectRequestTypes.deleteNote) {
    if (!newData?.noteId) {
      return res.status(400).json({ message: "Note id is required" });
    }
    await projectRef.update({
      notes: project.data().notes.filter((note) => note.id !== newData.noteId),
    });
  } else {
    return res.status(400).json({ message: "invalid project request type" });
  }

  project = (await projectRef.get()).data();
  return res.json({
    project: {
      ...project,
      nickName: project.nickName.admin,
      updated: project.updated.toDate().getTime(),
      created: project.created.toDate().getTime(),
    },
    projectRequestType,
  });
}

const searchProjects = async ({ searchedText, isDeactivated }) => {
  try {
    let response = (
      await admin
        .firestore()
        .collection(collectionNames.projects)
        .where("statuses.isDeactivated", "==", isDeactivated === "true" ? true : false)
        .where("statuses.isDeleted", "==", false)
        .where("searchKeywords", "array-contains", searchedText.toLowerCase())
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
          adminId: data.adminId,
          clientId: data.clientId,
          clients: data.clients,
          nickName: data.nickName.admin,
          name: data.name,
          cover: data.cover,
          location: data.location,
          statuses: data.statuses,
          timeline: data.timeline,
          updated: data.updated.toDate().getTime(),
          created: data.created.toDate().getTime(),
        };
      })
    );

    return { data: response };
  } catch (error) {
    console.log("searchProjects ====>", error);
    return { error };
  }
};
const getProjectData = async ({ projectId }) => {
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
        clients,
        updates: updatesCount,
      },
    };
  } catch (error) {
    console.log("searchProjects ====>", error);
    return { error };
  }
};

const createNickName = (string) => {
  if (string.split(" ")[0]) {
    return string.split(" ")[0].replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
  } else if (string.split(",")[0]) {
    return string.split(",")[0].replace(/[.,/#!$%^&*;:{}=\-_`~()]/g, "");
  }
  return string;
};
