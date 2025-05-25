// controllers
// resources
import { adminRequestTypes } from "../resources/types/requests/admins.js";
// utils
import { collectionNames, admin } from "../config/firebase.js";
import { getCollectionData } from "./collection.controller.js";

export async function createNotification({ sender, receiver, project, type }) {
  const notificationRef = admin
    .firestore()
    .collection(collectionNames.notifications)
    .doc(receiver.id);
  const newNotification = {
    id: admin.firestore().collection(collectionNames.notifications).doc().id,
    admin: sender,
    project,
    type,
    created: new Date(),
    isViewed: false,
  };

  try {
    const notificationData = (await notificationRef.get()).data();
    await notificationRef.update({
      notifications:
        notificationData?.notifications?.length > 0
          ? notificationData?.notifications?.concat([newNotification])
          : [newNotification],
    });
    return { newNotification };
  } catch (error) {
    return { error };
  }
}

export async function createNotifications({ sender, receivers, project, type }) {
  if (!receivers?.length) return;
  for (let index = 0; index < receivers.length; index++) {
    const receiver = receivers[index];
    const notificationRef = admin
      .firestore()
      .collection(collectionNames.notifications)
      .doc(receiver);
    const newNotification = {
      id: admin.firestore().collection(collectionNames.notifications).doc().id,
      admin: sender,
      project,
      type,
      created: new Date(),
      isViewed: false,
    };

    try {
      const notificationData = (await notificationRef.get()).data();
      await notificationRef.update({
        notifications:
          notificationData?.notifications?.length > 0
            ? notificationData?.notifications?.concat([newNotification])
            : [newNotification],
      });
      return { newNotification };
    } catch (error) {
      return { error };
    }
  }
}

export async function updateNotification(req, res) {
  const { notificationsArr } = req.body;
  if (!notificationsArr) {
    return res.status(400).json({ message: "Notification array required" });
  }

  try {
    const notificationsRef = admin
      .firestore()
      .collection(collectionNames.notifications)
      .doc(req.user.uid);
    const notificationsData = (await notificationsRef.get()).data();

    let newData;
    if (notificationsArr?.length > 0 && notificationsData.notifications?.length > 0) {
      newData = notificationsData.notifications.map((n) => {
        if (notificationsArr.includes(n.id)) return { ...n, isViewed: true };
        else return n;
      });
      await notificationsRef.update({
        notifications: newData,
      });
    }
    return res.json({ message: "notification updated" });
  } catch (error) {
    console.log("updateNotification ====>", error);
    return { error };
  }
}
