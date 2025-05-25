export const adminSuccessMessages = {
  roleAdded: "Request fulfilled. Admin role added to ${email}.",
  superAdminRoleAdded: "Request fulfilled. Super Admin role added to ${email}.",
  adminCreated: "Admin created successfully for email ${email}.",
};
export const adminErrorMessages = {
  adminRequestTypeRequired: "Admin request type is required.",
  invalidEmail: "Email is invalid.",
  invalidRequestType: "Reques type is invalid.",
  roleAlreadyExists: "Role already exists.",
  userEmailRequired: "User email is required.",
  userPasswordRequired: "User password is required.",
  userNameRequired: "User name is required.",
  userExists: "User already exists.",
  validEmailRequired: "Valid email is required.",
};
export const authErrorMessages = {
  avatarUrlIsNotValid: "Avatar URL is not valid.",
  authRequestTypeIsRequired: "Authentication request type is required.",
  authTypeIsRequired: "Authentication type is required.",
  firstNameIsRequired: "First name is required.",
  firebaseTokenIsRequired: "Firebase token is required.",
  genderIsRequired: "Gender is required.",
  incorrectPassword: "Incorrect Password.",
  invalidToken: "The provided authentication token is invalid.",
  lastNameIsRequired: "Last name is required.",
  notificationTokenIsRequired: "Notification token is required.",
  passwordIsRequired: "Please insert a password.",
  providerTokenRequired: "The provided authentication token is required.",
  tooManyFailedRequest: "Too many failed requests have been made.",
  tryAgainDelayInSeconds: "Try again after $ seconds.",
  userExists: "User already exists with this email.",
  userNotExists: "No user found with this email.",
  userDoesntExists: "No user found.",
  userIdNotExists: "No user found with this id.",
  validEmailIsRequired: "Please enter a valid email.",
};
export const passwordValidationError = {
  lengthError: "Must Contain 8 Characters.",
  formatError:
    "Must Contain One Uppercase, One Lowercase, One Number and one special case Character.",
};

export const systemErrorMessages = {
  serverBusy: "The server is busy.",
  somethingWentWrong: "Something went wrong. Try again later.",
  invalidCsrf: "Invalid csrf token.",
  invalidJwt: "Invalid jwt token.",
  noJwt: "access denied. No jwt token provided.",
  tooManyAccounts: "Too many accounts created subsequently. Try again later.",
  tooManyStories: "Too many story uploaded subsequently. Try again later.",
  unAuthorizedRequest: "You dont have the necessary authorization to perform this action.",
  overviewIdRequired: "Overview id required",
  noCsrf: "access denied. No csrf token provided",
};
export const notificationErrorMessages = {
  notificationIdIsRequired: "Notification id is required.",
  notificationUserTypeIsRequired: "Notification user type is required.",
  notificationUpdateTypeIsRequired: "Notification update type is required.",
  storyReadsIncreasedSuccessfully: "Story reads increased successfully.",
};
