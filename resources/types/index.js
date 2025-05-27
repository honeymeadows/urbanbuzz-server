export const adminUpdateTypes = {
  createAdmin: "create-admin",
  updateAdmin: "update-admin",
  deleteAdmin: "delete-admin",
};

export const errorTypes = {
  notInvited: "not-invited",
  expiredInvitation: "expired-invitation",
  invalidToken: "invalid-token",
  noUser: "no-user",
  differentProvider: "different-provider",
  alreadyRegistered: "already-registered",
  notRegistered: "not-registered",
  alreadyInvited: "already-invited",
  alreadyExists: "already-exists",
  jwtError: "jwt-error",
  expiredJwt: "expired-token",
  invalidJwtSignature: "invalid-signature",
  emailError: "email-error",
  serverError: "server-error",
  userBanned: "user-banned",
  userCreationFailed: "user-creation-failed",
  incorrectPassword: "incorrect-password",
};
export const emailTypes = {
  passwordReset: "pass-reset",

  clientInvitation: "client-invitation",
  adminInvitation: "admin-invitation",
  adminAssigned: "admin-assigned",
  projectCreate: "project-create",
  projectUpdate: "project-update",
};
export const updateTypes = {
  userBanStatus: "user-ban-status",
  userDeleteStatus: "user-delete-status",
  acceptInviteRequest: "accept-invite-request",
  declineInviteRequest: "decline-invite-request",
};
