import { sendEmail } from "@/server/_libs";
import { IAccountCreationInvite } from "@/types/invites.types";
import { Model, model, models, Schema } from "mongoose";
import { format } from "date-fns";

const AccountInviteSchema = new Schema<IAccountCreationInvite>(
  {
    email: {
      type: String,
      required: true,
      trim: true,
      match: [
        /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/,
        "Invalid email address",
      ],
      unique: [
        true,
        "DUPLICATE_EMAIL: Looks like this email has been invited before and therefore, cannot be invited again",
      ],
      lowercase: true,
    },
    role: {
      type: String,
      required: true,
      enum: ["TEACHER", "STUDENT"],
    },
    expiresAt: {
      type: String,
      default: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(),
    },
    accountCreated: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

AccountInviteSchema.methods.checkInvitation = async function (
  message = "ACCOUNT_CREATION_ERROR: You are not allow to create an account, Please contact your admin."
) {
  const now = new Date();
  const expirationDate = new Date(this.expiresAt);

  if (this.accountCreated) {
    throw new Error(message);
  }

  if (now > expirationDate) {
    throw new Error(message);
  }
};

AccountInviteSchema.post("save", async function (doc) {
  if (doc.isNew) {
    //Send invation email

    const email = `
        <div style="font-family: Arial, sans-serif; max-width: 700px; margin: 0 auto; padding: 5px;">
            <h2 style="color: #333;">Account Creation Invitation</h2>
            <p>Hello,</p>
            <p>You have been invited to create an account as a ${doc.role.toLowerCase()} on our platform.</p>
            <p>This invitation will expire on ${format(
              new Date(doc.expiresAt),
              "PPP"
            )}.</p>
            <p>Please click the link below to create your account:</p>
            <a href="${process.env.NEXT_PUBLIC_APP_URL}/auth/signup?invite=${
      doc._id
    }" 
               style="display: inline-block; padding: 10px 20px; background-color: #007bff; color: white; text-decoration: none; border-radius: 5px; width: 100%;">
                Create Account
            </a>
            <p style="margin-top: 20px;">If you did not expect this invitation, please ignore this email.</p>
            <p>Best regards,<br>The Team</p>
        </div>
    `;

    sendEmail({
      email,
      emails: this.email,
      subject: "Account Creation Invitation",
    });
  }
});

export const AccountCreationInvite: Model<IAccountCreationInvite> =
  models?.AccountCreationInvite ??
  model<IAccountCreationInvite>("AccountCreationInvite", AccountInviteSchema);
