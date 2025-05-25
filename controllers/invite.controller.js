import { admin, collectionNames } from "../config/firebase.js";
import jwt from "jsonwebtoken";
import { randomBytes } from "crypto";
import { createId } from "@paralleldrive/cuid2";
import { newUserSignUp } from "./auth.controller.js";

import { errorTypes, emailTypes } from "../resources/types/index.js";
import sendEmail from "../services/email.servce.js";
import { inviteTypes } from "../resources/types/invite.js";

export async function createInvite(req, res) {
  const { inviteRequestType } = req.params;
  const { name, email } = req.body;

  if (!inviteRequestType) {
    return res.status(400).json({ message: "invite request type is required" });
  }

  const adminId = req?.user?.uid;

  if (!name || !email) {
    return res.status(400).json({ message: "Invalid body of data" });
  }

  let user = await admin
    .auth()
    .getUserByEmail(email)
    .then((user) => user)
    .catch((err) => false);

  if (
    (inviteRequestType === inviteTypes.admin && user?.customClaims?.roles?.isAdmin) ||
    (inviteRequestType === inviteTypes.client && user?.customClaims?.roles?.isClient)
  ) {
    return res.status(400).json({ error: errorTypes.alreadyExists });
  }

  if (!user) {
    user = await admin
      .auth()
      .createUser({
        email,
        displayName: name,
        emailVerified: true,
      })
      .then((user) => user)
      .catch((error) => {
        return { error };
      });
    if (user?.error) {
      return res.status(400).json({ error: user?.error });
    }
  }
  const customClaims = {
    roles: {
      isClient: inviteRequestType === inviteTypes.client,
      isAdmin: inviteRequestType === inviteTypes.admin,
      isSuperAdmin: false,
    },
    statuses: {
      isBanned: false,
      isDeleted: false,
    },
    invite: {
      status: "invited",
    },
    password: {
      status: "not-requested",
      expiration: "",
    },
    adminId,
  };
  await admin.auth().setCustomUserClaims(user.uid, customClaims);

  user = await newUserSignUp({ ...user, ...customClaims, adminId });

  if (user?.error) {
    return res.status(400).json({ error: user?.error });
  }

  const jwtSecret = randomBytes(64).toString("base64");
  const { inviteData, tokenData, error } = await generateInviteData({
    userId: user.id,
    adminId,
    jwtSecret,
    inviteType: inviteRequestType,
    email,
    tokenId: createId(),
  });
  if (error) {
    return res.status(500).json({ message: error });
  }
  const inviteRef = admin.firestore().collection(collectionNames.invites).doc();
  await inviteRef.create(inviteData);

  const inviteToken = await admin
    .firestore()
    .collection(collectionNames.tokens)
    .doc(tokenData.id)
    .create({ ...tokenData, inviteId: inviteRef.id });
  const userUpdatedData = {
    joined: "",
    invite: {
      id: inviteRef.id,
      url: inviteData.url,
      invitedOn: new Date().getTime(),
      status: "invited",
    },
    roles: {
      isClient: inviteRequestType === inviteTypes.client,
      isAdmin: inviteRequestType === inviteTypes.admin,
      isSuperAdmin: false,
    },
    statuses: {
      isBanned: false,
      isDeleted: false,
    },
  };
  await admin.firestore().collection(collectionNames.users).doc(user.id).update(userUpdatedData);

  await sendEmail({
    email,
    emailType:
      inviteRequestType === inviteTypes.client
        ? emailTypes.clientInvitation
        : emailTypes.adminInvitation,
    emailData: {
      url: inviteData.url,
    },
  });

  return res.json({
    client: {
      ...user,
      ...userUpdatedData,
    },
  });
}

export async function createAdminInvite(req, res) {
  const { emails } = req.body;

  const adminId = req?.user?.uid;

  if (!emails) {
    return res.status(400).json({ message: "Invalid body of data" });
  }

  const invitedAdmins = [];
  for (let index = 0; index < emails.length; index++) {
    const email = emails[index];
    let user = await admin
      .auth()
      .getUserByEmail(email)
      .then((user) => user)
      .catch((err) => false);

    if (user?.customClaims?.roles?.isAdmin) {
      continue;
    }

    if (user?.customClaims?.roles?.isClient) {
      await admin.auth().setCustomUserClaims(user.uid, {
        ...user.customClaims,
        roles: {
          ...user.customClaims?.roles,
          isAdmin: true,
        },
      });
      await sendEmail({
        email,
        emailType: emailTypes.adminAssigned,
      });
    }

    if (!user) {
      user = await admin
        .auth()
        .createUser({
          email,
          emailVerified: true,
        })
        .then((user) => user)
        .catch((error) => {
          return { error };
        });
      if (user?.error) {
        return res.status(400).json({ error: user?.error });
      }
    }
    const customClaims = {
      roles: {
        isClient: true,
        isAdmin: true,
        isSuperAdmin: false,
      },
      statuses: {
        isBanned: false,
        isDeleted: false,
      },
      invite: {
        status: "invited",
        isAdminInvite: true,
      },
      password: {
        status: "not-requested",
        expiration: "",
      },
      adminId,
    };
    await admin.auth().setCustomUserClaims(user.uid, customClaims);

    user = await newUserSignUp({
      ...user,
      ...customClaims,
      displayName: email.split("@")[0],
      adminId,
    });

    if (user?.error) {
      return res.status(400).json({ error: user?.error });
    }

    const jwtSecret = randomBytes(64).toString("base64");
    const { inviteData, tokenData, error } = await generateInviteData({
      userId: user.id,
      adminId,
      jwtSecret,
      inviteType: inviteTypes.admin,
      email,
      tokenId: createId(),
    });

    if (error) {
      return res.status(500).json({ message: error });
    }
    const inviteRef = admin.firestore().collection(collectionNames.invites).doc();
    await inviteRef.create(inviteData);

    const inviteToken = await admin
      .firestore()
      .collection(collectionNames.tokens)
      .doc(tokenData.id)
      .create({ ...tokenData, inviteId: inviteRef.id });
    const userUpdatedData = {
      joined: "",
      invite: {
        id: inviteRef.id,
        url: inviteData.url,
        invitedOn: new Date().getTime(),
        status: "invited",
      },
      roles: {
        isClient: true,
        isAdmin: true,
        isSuperAdmin: false,
      },
      statuses: {
        isBanned: false,
        isDeleted: false,
      },
    };
    await admin.firestore().collection(collectionNames.users).doc(user.id).update(userUpdatedData);

    await sendEmail({
      email,
      emailType: emailTypes.adminInvitation,
      emailData: {
        url: inviteData.url,
      },
    });

    invitedAdmins.push({
      ...user,
      ...userUpdatedData,
    });
  }

  return res.json({
    admins: invitedAdmins,
  });
}
export async function resendInvite(req, res) {
  const { inviteRequestType } = req.params;
  const { inviteId } = req.body;

  if (!inviteRequestType) {
    return res.status(400).json({ message: "invite request type is required" });
  }

  if (!inviteId) {
    return res.status(400).json({ message: "Invalid body of data" });
  }

  const inviteRef = admin.firestore().collection(collectionNames.invites).doc(inviteId);

  try {
    const inviteData = (await inviteRef.get()).data();

    await sendEmail({
      email: inviteData.email,
      emailType:
        inviteData?.type === inviteTypes.client
          ? emailTypes.clientInvitation
          : emailTypes.adminInvitation,
      emailData: {
        url: inviteData.url,
      },
    });

    return res.json({ message: "success" });
  } catch (error) {
    console.log("resendInvite ====>", error);
    return res.status(500).json({ error: "server-error" });
  }
}
// exports.createAdminInvite = async (req, res) => {
//   const { email } = req.body;

//   if (!req) {
//     return res.status(400).json({ message: "Program id is required" });
//   }

//   const userId = req.user.id;
//   const domain = req.user.domain;

//   const configs = (
//     await admin.firestore().collection(collectionNames.configs).doc("index").get()
//   ).data();
//   const jwtSecret = crypto.randomBytes(64).toString("base64");

//   let user = await prisma.user.findFirst({
//     where: {
//       email,
//       domains: {
//         some: {
//           domain: {
//             id: domain.id,
//           },
//         },
//       },
//     },
//   });

//   if (user) {
//     const userRole = await prisma.userRole.findFirst({
//       where: {
//         user: {
//           email,
//         },
//       },
//     });

//     if (userRole.name === UserRoles.ADMIN) {
//       return res.status(500).json({ message: "already-admin" });
//     } else if (userRole.name === UserRoles.USER) {
//       return res.status(500).json({ message: "already-user" });
//     }
//     const response = await prisma.userRole.create({
//       data: {
//         name: "ADMIN",
//         userId: Number(userId),
//       },
//     });
//     if (response?.error) {
//       return res.status(400).json({ error: response?.error });
//     }
//     user = await prisma.user.findFirst({
//       where: {
//         email,
//       },
//       include: {
//         role: true,
//         session: true,
//         status: true,
//       },
//     });

//     return res.json({
//       user,
//       message: "admin-created",
//     });
//   }

//   const { inviteData, tokenData, error } = await generateInviteData({
//     userId,
//     tokenLife: configs.invitation.tokenLife,
//     jwtSecret,
//     email,
//     inviteType: UserRoles.ADMIN,
//     domain,
//   });

//   if (error) {
//     return res.status(500).json({ message: error });
//   }

//   const tokens = await createAdminInvite(tokenData, "token");
//   const invite = await createAdminInvite(inviteData, "invite");

//   if (invite?.error || tokens?.error) {
//     return res.status(500).json({ message: error });
//   }

//   await sendEmailInvites({
//     email,
//     emailType: emailTypes.adminInvitation,
//     expiration: inviteData.expiration,
//     qrUrl: inviteData.qr,
//     url: inviteData.url,
//   });

//   return res.json({
//     invite: invite,
//   });
// };
// exports.updateInvite = async (req, res) => {
//   const { requestType } = req.params;
//   const { inviteId } = req.body;

//   if (!requestType) {
//     return res.status(400).json({ message: "Request type is required" });
//   }

//   let fetcherHandler = null; // Function handler which will fetch data from db
//   let args = null; // Object of Arguments for the handler. Order is important
//   let responseName = null; // String name to use in store

//   if (requestType === inviteRequestTypes.resendInvite) {
//     fetcherHandler = resendInvite;
//     args = { inviteId, domain: req.user.domain };
//     responseName = "invite";
//   }
//   if (!fetcherHandler || !responseName) {
//     return res.status(400).json({ message: "Invalid Request type." });
//   }
//   const data = await fetcherHandler(args);
//   if (data?.error) {
//     return res.status(400).json(data?.error);
//   } else {
//     return res.json({
//       [responseName]: data,
//     });
//   }
// };
async function generateInviteData({ email, userId, adminId, jwtSecret, inviteType, tokenId }) {
  let data = {
    email,
    inviteType,
    jwtSecret,
  };

  let tokenData = {
    id: createId(),
  };
  if (tokenId) {
    tokenData = { id: tokenId };
  }

  const signupUrl = `https://app.honeymeadows.ca/auth/sign-up?token=${tokenData.id}`;

  const { jwtToken } = createJwtToken({
    ...data,
    tokenId: tokenData.id,
  });

  const inviteData = {
    email: email,
    userId,
    adminId,
    url: signupUrl,
    tokenId: tokenData.id,
    type: inviteType,
    jwtSecret,
  };

  tokenData = { ...tokenData, token: jwtToken };

  return { inviteData, tokenData };
}

const createJwtToken = ({ email, inviteType, tokenId, jwtSecret }) => {
  const token = jwt.sign(
    {
      isSignUp: true,
      tokenId,
      inviteType,
      invitedEmail: email,
    },
    jwtSecret
  );
  return { jwtToken: token };
};
// const resendInvite = async ({ inviteId, domain }) => {
//   try {
//     const configs = (
//       await admin.firestore().collection(collectionNames.configs).doc("index").get()
//     ).data();
//     const jwtSecret = crypto.randomBytes(64).toString("base64");

//     let invite = await prisma.invite.findFirst({
//       where: {
//         id: Number(inviteId),
//       },
//     });

//     const { inviteData, tokenData, error } = await generateInviteData({
//       email: invite.email,
//       userId: invite.invitedBy,
//       userId: invite.invitedBy,
//       programId: invite.programId,
//       tokenLife: configs.invitation.tokenLife,
//       jwtSecret,
//       inviteType: invite.type,
//       tokenId: invite.tokenId,
//       domain,
//     });
//     if (error) {
//       return { error: errorTypes.alreadyRegistered };
//     }

//     await sendEmailInvites({
//       email: invite.email,
//       emailType: emailTypes.programRegistration,
//       banner: program?.banner,
//       expiration: inviteData.expiration,
//       qrUrl: inviteData.qr,
//       url: inviteData.url,
//     });
//     invite = await prisma.invite.update({
//       where: {
//         id: Number(inviteId),
//       },
//       data: {
//         qr: inviteData.qr,
//         url: inviteData.signupUrl,
//         expiration: inviteData.expiration,
//       },
//       include: {
//         signedUpUser: true,
//       },
//     });
//     await prisma.token.update({
//       where: {
//         id: invite.tokenId,
//       },
//       data: {
//         token: tokenData.token,
//       },
//     });

//     return invite;
//   } catch (error) {
//     console.log("resendinvite", error);
//     return { error };
//   }
// };

// const createAdminInvite = async (data, schema) => {
//   try {
//     const response = await prisma[schema].create({ data });
//     return response;
//   } catch (error) {
//     console.log("createAdminInvite", error);
//     return { error };
//   }
// };
