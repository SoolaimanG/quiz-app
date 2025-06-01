import { IForgetPassword } from "@/types/forget-password.types";
import mongoose, { Model, model, models, Schema } from "mongoose";

const ForgetPasswordSchema = new Schema<IForgetPassword>(
  {
    expiresAt: { type: Date, required: true },
    resetToken: { type: String, required: true },
    user: { type: mongoose.Schema.ObjectId, ref: "User", required: true },
  },
  {
    timestamps: true,
  }
);

const ForgetPassword: Model<IForgetPassword> =
  models.ForgetPassword ?? model("ForgetPassword", ForgetPasswordSchema);

export { ForgetPassword };
