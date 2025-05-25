// controllers
// resources
import { userRequestTypes } from "../resources/types/requests/user.js";
// utils
import { collectionNames, admin } from "../config/firebase.js";
import { uploadToStorage } from "../services/storage/firebase.service.js";
import axios from "axios";
import { errorTypes } from "../resources/types/index.js";
import { dashboardRequestTypes } from "../resources/types/requests/dashboard.js";

export async function updateUser(req, res) {
  const { userRequestType } = req.params;
  const { email, newPassword, currentPassword, file } = req.body;

  let fetcherHandler = null;
  let args = null;
  let responseName = null;
  if (!userRequestType) {
    return res.status(400).json({ message: "User request type is required" });
  }
  if (!req?.user?.uid) {
    return res.status(400).json({ message: "User id is required" });
  }

  const userId = req.user.uid;

  const userRef = admin.firestore().collection(collectionNames.users).doc(userId);
  const user = (await userRef.get()).data();

  if (userRequestType === userRequestTypes.updateProfileImage) {
    if (!file) {
      return res.status(400).json({ message: "file are required" });
    }
    fetcherHandler = updateProfileImage;
    args = {
      userId,
      imageFile: file,
      accessToken: user.profileImage.accessToken,
    };
    responseName = "user";
  }

  if (userRequestType === userRequestTypes.createPassword) {
    if (!email || !newPassword) {
      return res.status(400).json({ message: "Email & Passwords are required" });
    }
    fetcherHandler = createPassword;
    args = { uid: userId, email, newPassword };
    responseName = "user";
  } else if (userRequestType === userRequestTypes.updatePassword) {
    if (!email || !newPassword || !currentPassword) {
      return res.status(400).json({ message: "Email & Passwords are required" });
    }
    fetcherHandler = changePassword;
    args = { uid: userId, email, currentPassword, newPassword };
    responseName = "user";
  }

  if (!fetcherHandler || !responseName || !args) {
    return res.status(400).json({ message: "Invalid Request type." });
  }

  const result = await fetcherHandler(args);
  if (result?.error) {
    return res.status(400).json(result?.error);
  } else {
    let response = {
      [responseName]: result,
    };
    return res.json(response);
  }
}

export async function updateClient(req, res) {
  const { dashboardRequestType } = req.params;
  const { email, newPassword, currentPassword, file } = req.body;

  let fetcherHandler = null;
  let args = null;
  let responseName = null;
  if (!dashboardRequestType) {
    return res.status(400).json({ message: "Client request type is required" });
  }

  const userId = req.user.uid;

  const userRef = admin.firestore().collection(collectionNames.users).doc(userId);
  const user = (await userRef.get()).data();

  if (dashboardRequestType === dashboardRequestTypes.updateClientProfileImage) {
    if (!file) {
      return res.status(400).json({ message: "file are required" });
    }
    fetcherHandler = updateProfileImage;
    args = {
      userId,
      imageFile: file,
      accessToken: user.profileImage.accessToken,
    };
    responseName = "user";
  }

  if (dashboardRequestType === dashboardRequestTypes.updateClientPassword) {
    if (!email || !newPassword || !currentPassword) {
      return res.status(400).json({ message: "Email & Passwords are required" });
    }
    fetcherHandler = changePassword;
    args = { uid: userId, email, currentPassword, newPassword };
    responseName = "user";
  }

  if (!fetcherHandler || !responseName || !args) {
    return res.status(400).json({ message: "Invalid Request type." });
  }

  const result = await fetcherHandler(args);
  if (result?.error) {
    return res.status(400).json(result?.error);
  } else {
    let response = {
      [responseName]: result,
    };
    return res.json(response);
  }
}

const updateProfileImage = async ({ userId, imageFile, accessToken }) => {
  try {
    const fileType = imageFile.type;
    const file = Buffer.from(imageFile.buffer);
    const newFileName = `users/profile/${userId}`;

    const fileData = await uploadToStorage(newFileName, file, fileType, accessToken);
    const userRef = admin.firestore().collection(collectionNames.users).doc(userId);

    await admin.firestore().runTransaction(async (transaction) => {
      transaction.update(userRef, {
        profileImage: {
          name: fileData.name,
          accessToken,
          url: fileData.url,
        },
      });
    });

    const data = (await userRef.get()).data();

    const user = {
      id: userId,
      profileImage: data.profileImage,
      name: data.name,
      email: data.email,
      joined: data.joined,
      roles: data.roles,
      statuses: data.statuses,
    };
    return user;
  } catch (error) {
    console.log("updateProfileImage =====>", error);
    return { error };
  }
};

const changePassword = async ({ uid, email, currentPassword, newPassword }) => {
  try {
    const isCorrectPassword = await axios
      .post(
        `https://identitytoolkit.googleapis.com/v1/accounts:signInWithPassword?key=${process.env.AUTH_API_KEY}`,
        {
          email,
          password: currentPassword,
        },
        {
          headers: {
            "Content-Type": "application/json",
            "User-Agent": "Node.js",
          },
        }
      )
      .then((result) => true)
      .catch((error) => false);

    if (!isCorrectPassword) {
      return { error: errorTypes.incorrectPassword };
    }
    const user = await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    return { email: user.email };
  } catch (error) {
    console.log("changePassword ===========>", error);
    return { error };
  }
};
const createPassword = async ({ uid, email, newPassword }) => {
  try {
    const user = await admin.auth().updateUser(uid, {
      password: newPassword,
    });

    return { email: user.email };
  } catch (error) {
    console.log("changePassword ===========>", error);
    return { error };
  }
};
