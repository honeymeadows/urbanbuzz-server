import { admin, collectionNames, adminInstance, bucket } from "../config/firebase.js";
import { errorTypes } from "../resources/types/index.js";
import axios from "axios";
// const sendEmail = require("../utils/emails.js");
import { emailTypes } from "../resources/types/index.js";
// const userController = require("./userController");
import { getArrayFromString } from "../utils/index.js";
import sendEmail from "../services/email.servce.js";
import { authRequestTypes } from "../resources/types/requests/auth.js";
import { v4 as uuidv4 } from "uuid";
import { streamToPromise } from "../services/storage/firebase.service.js";
import { inviteTypes } from "../resources/types/invite.js";
import { decodeJwtToken } from "../utils/jwt.js";
import dayjs from "dayjs";

export async function authentications(req, res) {
  const { authRequestType } = req.params;
  const { firebaseToken, inviteToken } = req.body;

  if (!authRequestType) {
    return res.status(400).json({ message: "Auth request type is required" });
  }

  //
  // @ desc login with username/email and password
  //
  if (authRequestType === authRequestTypes.credentials) {
    let user = await validateFirebaseToken(firebaseToken);
    if (user?.error) {
      return res.status(400).json({ error: user?.error });
    }

    const { uid } = user;

    user = (await admin.firestore().collection(collectionNames.users).doc(uid).get()).data();

    return res.json({ user, firebaseToken });
  } else if (
    authRequestType === authRequestTypes.signUp ||
    authRequestType === authRequestTypes.providerSignUp
  ) {
    const { email, password, name, phone, photoURL, displayName, phoneNumber } = req.body;

    if (!inviteToken) {
      return res.status(400).json({ error: errorTypes.notInvited });
    }
    const { tokenId, invitedEmail, inviteType, error } = decodeJwtToken(inviteToken);
    if (error) {
      return res.status(400).json({ error: error });
    }

    let user;
    let signUpHandler;
    if (authRequestType === authRequestTypes.providerSignUp) {
      if (!firebaseToken) {
        return res.status(400).json({ message: "Invalid body of data" });
      }
      if (!email || !photoURL || !displayName) {
        return res.status(400).json({ message: "Invalid body of data" });
      }
      user = await validateFirebaseToken(firebaseToken);
      user = { ...user, email, photoURL, displayName, phoneNumber };

      signUpHandler = providerSignup;
    } else if (authRequestType === authRequestTypes.signUp) {
      if (!email || !password || !name) {
        return res.status(400).json({ message: "Invalid body of data" });
      }
      user = await admin
        .auth()
        .getUserByEmail(email)
        .then((userData) => userData)
        .catch((err) => false);
      if (!user) {
        return res.status(400).json({ error: errorTypes.notInvited });
      }
      user = {
        ...user,
        email,
        password,
        name,
        phoneNumber: phone,
      };
      signUpHandler = credentialSignup;
    }

    const invite = (
      await admin
        .firestore()
        .collection(collectionNames.invites)
        .where("tokenId", "==", tokenId)
        .get()
    ).docs;

    if (
      !invite ||
      invite?.length === 0 ||
      !invitedEmail ||
      invitedEmail.trim() !== invite[0].data()?.email?.trim() ||
      user?.email !== invite[0].data()?.email.trim()
    ) {
      return res.status(400).json({ error: errorTypes.notInvited });
    }

    let newUser;
    if (signUpHandler) {
      newUser = await signUpHandler(user, inviteType);
    }
    if (!newUser || newUser?.error) {
      return res.status(400).json({ error: newUser?.error });
    }

    updateClientProjects(newUser.id, newUser.name);

    return res.json({ newUser });
  } else if (authRequestType === authRequestTypes.requestResetPassword) {
    const { email } = req.body;
    if (!req?.body?.email) {
      return res.status(400).json({ message: " User email is required" });
    }
    const response = await requestPasswordReset(req?.body?.email);

    if (response?.error) {
      return res.status(400).json(response?.error);
    } else {
      return res.json(response);
    }
  } else if (authRequestType === authRequestTypes.resetPassword) {
    if (!req.body.password || !firebaseToken) {
      return res.status(400).json({ error: errorTypes.invalidToken });
    }
    let user = await validateFirebaseToken(firebaseToken);

    if (user?.error) {
      return res.status(400).json({ error: errorTypes.invalidToken });
    }
    if (
      user?.password?.status !== "requested" ||
      dayjs(new Date(user?.password?.expiration)).isBefore(new Date())
    ) {
      return res.status(400).json({ error: errorTypes.invalidToken });
    }

    const { uid } = user;

    const response = await admin
      .auth()
      .updateUser(uid, { password: req.body.password })
      .then((user) => user)
      .catch((error) => ({ error }));

    if (response?.error) {
      return res.status(400).json(response?.error);
    } else {
      await admin.auth().setCustomUserClaims(uid, {
        ...response.customClaims,
        password: { status: "not-requested", expiration: "" },
      });
      await admin.firestore().collection(collectionNames.users).doc(uid).update({
        lastPasswordUpdated: new Date().getTime(),
      });
      return res.json(response);
    }
  }

  return res.status(400).json({ message: "Auth request type is invalid." });
}

export async function newUserSignUp(user) {
  const { uid, email, displayName, photoURL, emailVerified, phoneNumber, providerData } = user;

  const name = displayName;
  const accessToken = uuidv4();
  const profileImageName = `users/profile/${uid}`;
  let profileImage = `https://firebasestorage.googleapis.com/v0/b/urbanbuzz-bcfbd.appspot.com/o/${encodeURIComponent(
    uid
  )}?alt=media&token=${accessToken}`;
  const phone = phoneNumber ?? "";
  const adminId = user?.adminId ?? "";
  let isCredential = false;
  let isGoogleProvider = false;
  if (providerData?.providerId && providerData.providerId === "password") {
    isCredential = true;
  } else if (providerData?.providerId && providerData.providerId === "google.com") {
    isGoogleProvider = true;
  }

  try {
    if (photoURL) {
      const imgResponse = await axios({
        url: photoURL,
        method: "GET",
        responseType: "stream",
      });

      const file = bucket.file(profileImageName);
      const stream = file.createWriteStream({
        metadata: {
          contentType: imgResponse.headers["content-type"],
          metadata: {
            firebaseStorageDownloadTokens: accessToken,
          },
        },
      });

      imgResponse.data.pipe(stream);
      await streamToPromise(stream);

      profileImage = `https://firebasestorage.googleapis.com/v0/b/urbanbuzz-bcfbd.appspot.com/o/${encodeURIComponent(
        file.name
      )}?alt=media&token=${accessToken}`;
    }

    const lastName = name.split(" ")[1];

    await admin
      .firestore()
      .collection(collectionNames.users)
      .doc(uid)
      .set(
        {
          id: uid,
          adminId,
          name: name.toLowerCase(),
          profileImage: {
            name: profileImageName,
            url: profileImage,
            accessToken: accessToken,
          },
          email,
          searchKeywords: [
            ...new Set([
              ...getArrayFromString(email)
                .concat(getArrayFromString(name))
                .concat(getArrayFromString(lastName ? lastName : "")),
            ]),
          ],
          isVerified: emailVerified ?? false,
          phone: phone ?? "",
          joined: new Date().getTime(),
          updated: new Date(),
          created: new Date(),
          permissions: {
            cookies: {
              accepted: false,
            },
          },
          provider: {
            isCredential,
            isGoogleProvider,
          },
          lastPasswordUpdated: null,
        },
        { merge: true }
      );

    await admin.firestore().collection(collectionNames.notifications).doc(uid).set({
      new: 0,
      notifications: [],
    });

    const newUser = (
      await admin.firestore().collection(collectionNames.users).doc(uid).get()
    ).data();
    return newUser;
  } catch (error) {
    console.log("onNewUser:", error);
    return { error };
  }
}

const providerSignup = async (
  { uid, email, displayName, photoURL, emailVerified, phoneNumber, providerData },
  inviteType
) => {
  let user = await admin
    .auth()
    .updateUser(uid, {
      email,
      displayName,
      photoURL,
      emailVerified,
      phoneNumber,
      providerData,
    })
    .then((data) => data)
    .catch(() => false);

  if (!user) {
    return { error: errorTypes.notInvited };
  }

  const customClaims = {
    ...user?.customClaims,
    roles: {
      ...user?.customClaims?.roles,
      isClient: inviteType === inviteTypes.client ? true : user?.customClaims?.roles?.isClient,
      isAdmin: inviteType === inviteTypes.admin ? true : user?.customClaims?.roles?.isAdmin,
    },
    invite: {
      status: "joined",
    },
  };

  const userData = await this.newUserSignUp({
    uid,
    email,
    displayName,
    photoURL,
    emailVerified,
    phoneNumber,
    providerData,
  });
  if (userData?.error) {
    return { error: errorTypes.serverError };
  }

  const userUpdatedData = {
    joined: new Date().getTime(),
    invite: {
      ...userData.invite,
      status: "joined",
    },
    ...customClaims,
  };
  await admin.auth().setCustomUserClaims(user.uid, customClaims);
  await admin.firestore().collection(collectionNames.users).doc(user.uid).update(userUpdatedData);

  return { ...userData, ...userUpdatedData };
};
const credentialSignup = async ({ uid, name, password }, inviteType) => {
  let user = await admin
    .auth()
    .updateUser(uid, { displayName: name, password })
    .then((data) => data)
    .catch(() => false);

  if (!user) {
    return { error: errorTypes.notInvited };
  }

  const customClaims = {
    ...user?.customClaims,
    roles: {
      ...user?.customClaims?.roles,
      isClient: inviteType === inviteTypes.client ? true : user?.customClaims?.roles?.isClient,
      isAdmin: inviteType === inviteTypes.admin ? true : user?.customClaims?.roles?.isAdmin,
    },
    invite: {
      status: "joined",
    },
  };

  const userData = await this.newUserSignUp(user);
  if (userData?.error) {
    return { error: errorTypes.serverError };
  }

  const userUpdatedData = {
    joined: new Date().getTime(),
    invite: {
      ...userData.invite,
      status: "joined",
    },
    ...customClaims,
  };

  await admin.auth().setCustomUserClaims(user.uid, customClaims);
  await admin.firestore().collection(collectionNames.users).doc(user.uid).update(userUpdatedData);

  return { ...userData, ...userUpdatedData };
};

const requestPasswordReset = async (email) => {
  const user = await admin
    .auth()
    .getUserByEmail(email)
    .then((response) => response)
    .catch(() => ({ error: errorTypes.noUser }));

  if (user?.error) {
    return user;
  }

  if (!user.providerData.find((provider) => provider.providerId === "password")) {
    return { error: errorTypes.differentProvider };
  }
  const token = await admin.auth().createCustomToken(user.uid, {
    tokenId: new Date().getTime(),
  });

  await admin.auth().setCustomUserClaims(user.uid, {
    ...user.customClaims,
    password: {
      status: "requested",
      expiration: new Date(dayjs(new Date().getTime()).add(1, "h")).getTime(),
    },
  });

  const response = await sendEmail({
    emailType: emailTypes.passwordReset,
    email,
    emailData: { token, name: user.displayName },
  });

  return { response };
};

const validateFirebaseToken = async (firebaseToken) => {
  if (!firebaseToken) {
    return { error: errorTypes.invalidToken };
  }

  let user;
  try {
    user = await admin.auth().verifyIdToken(firebaseToken);
  } catch (error) {
    console.log(error);
    return { error: errorTypes.invalidToken };
  }

  if (!user) {
    return { error: errorTypes.noUser };
  }
  return user;
};

const updateClientProjects = async (clientId, name) => {
  const updatesRef = admin
    .firestore()
    .collection(collectionNames.updates)
    .where("clientId", "==", clientId);
  const projectRef = admin
    .firestore()
    .collection(collectionNames.projects)
    .where("clientId", "==", clientId);
  await admin.firestore().runTransaction(async (transaction) => {
    const updatesSnapshot = await updatesRef.get();
    const ProjectsSnapshot = await projectRef.get();
    updatesSnapshot.forEach((updateDoc) => {
      if (updateDoc.exists) {
        const updateDocRef = admin
          .firestore()
          .collection(collectionNames.updates)
          .doc(updateDoc.id);
        const searchKeywords = [
          ...new Set([
            ...getArrayFromString(name)
              .concat(getArrayFromString(name.split(" ")[1] ? name.split(" ")[1] : ""))
              .concat(getArrayFromString(updateDoc.data().location.address))
              .concat(getArrayFromString(updateDoc.data().location.city))
              .concat(getArrayFromString(updateDoc.data().location.country)),
          ]),
        ];
        transaction.update(updateDocRef, {
          searchKeywords,
        });
      }
    });
    ProjectsSnapshot.forEach((projectDoc) => {
      if (projectDoc.exists) {
        const projectDocRef = admin
          .firestore()
          .collection(collectionNames.updates)
          .doc(projectDoc.id);
        const searchKeywords = [
          ...new Set([
            ...getArrayFromString(projectDoc.data().nickName.admin)
              .concat(getArrayFromString(name))
              .concat(getArrayFromString(name.split(" ")[1] ? name.split(" ")[1] : ""))
              .concat(getArrayFromString(projectDoc.data().location.address))
              .concat(getArrayFromString(projectDoc.data().location.city))
              .concat(getArrayFromString(projectDoc.data().location.country)),
          ]),
        ];
        transaction.update(projectDocRef, {
          searchKeywords,
        });
      }
    });
  });
};
