import { passwordResetEmailTemplate } from "../resources/email-templates/PasswordReset.js";
import { invitationEmailTemplate } from "../resources/email-templates/Invitation.js";
import { adminAssigned } from "../resources/email-templates/adminAssigned.js";
import { adminInvitation } from "../resources/email-templates/adminInvitation.js";
import { emailTypes } from "../resources/types/index.js";
import { Resend } from "resend";
import "dotenv/config";
import { projectUpdate } from "../resources/email-templates/projectUpdate.js";
import { projectCreate } from "../resources/email-templates/projectCreate.js";

const sendEmail = async ({ emailType, email, emailData }) => {
  const resend = new Resend(`${process.env.RESEND_API_KEY}`);
  return resend.emails.send({
    from: "Honey Meadows <admin@app.honeymeadows.ca>",
    to: email,
    reply_to: "connect@bitechx.com",
    ...generateEmailContent(emailType, { ...emailData, email }),
  });
};

const generateEmailContent = (emailType, emailData) => {
  const { name, email, url, token, project, update } = emailData;
  const baseUrl = process.env.APP_DOMAIN;
  if (emailType === emailTypes.passwordReset) {
    return {
      subject: "Password Reset",
      text: "Reset Your password",
      html: passwordResetEmailTemplate({
        email,
        name,
        resetUrl: `${baseUrl}/auth/password-reset?token=${token}`,
      }),
    };
  } else if (emailType === emailTypes.clientInvitation) {
    return {
      text: "You Are Invited",
      html: invitationEmailTemplate({
        email,
        inviteLink: url,
      }),
      subject: "Join Invitation",
    };
  } else if (emailType === emailTypes.adminInvitation) {
    return {
      text: "Invited As an Admin",
      html: adminInvitation({
        email,
        inviteLink: url,
      }),
      subject: "Admin Invitation",
    };
  } else if (emailType === emailTypes.adminAssigned) {
    return {
      text: "Assigned As an Admin",
      html: adminAssigned({
        email,
      }),
      subject: "Admin Invitation",
    };
  } else if (emailType === emailTypes.projectCreate) {
    return {
      text: "",
      html: projectCreate({
        project,
      }),
      subject: `${project?.name} Project Created`,
    };
  } else if (emailType === emailTypes.projectUpdate) {
    return {
      text: "",
      html: projectUpdate({
        project,
        update,
      }),
      subject: `${project?.nickName?.client} Project`,
    };
  }
};

export default sendEmail;

// const { mailOptions, transporter } = require("../config/nodemailer");

// const nodemailerConfig = {
//   ...mailOptions,
//   to: email,
//   text: "You Are Invited",
//   html: `<a href="http://localhost:3000/auth/sign-up?email=${email}" target:"_blank">Sign up</a>`,
//   subject: "Program Registration Invitation"
// };
// await transporter.sendMail(nodemailerConfig);
