import { IStudent } from "@/types/index.types";
import { Model, model, models, Schema } from "mongoose";
import { Subject } from "./subjects.model";
import { User } from "./users.model";

const studentSchema = new Schema<IStudent>({
  contact: {
    type: String,
  },
  dob: {
    type: Date,
  },
  subjects: {
    type: [{ ref: "Subject", type: Schema.Types.ObjectId }],
    default: [],
    validate: {
      validator: async function (subjects: string[]) {
        if (!subjects || subjects.length === 0) return true;

        // Check if all subjects exists
        const existingSubjects = await Subject.exists({
          subjects: { $all: subjects },
          teachers: this._id,
        });

        return Boolean(existingSubjects);
      },
      message:
        "One or more subjects are invalid or not assigned to this teacher",
    },
  },
  user: {
    type: Schema.Types.ObjectId,
    ref: "User",
    required: true,
    validate: {
      validator: async function (userId: string) {
        return Boolean(await User.findById(userId));
      },
      message: "The user id provide does not exist in our database",
    },
    unique: true,
  },
  endDate: {
    type: Date,
    default: new Date().setFullYear(new Date().getFullYear() + 1),
    validate: {
      validator: function (value: Date) {
        return value > new Date();
      },
      message: "End date must be a future date",
    },
  },
});

//studentSchema.index({ user: 1 });

studentSchema.statics.findByUserId = async function (userId: string) {
  return await this.findOne({ user: userId }).populate("user");
};

studentSchema.post("save", async function (doc) {
  if (doc.isNew) {
    //Send an email to admin about account
  }
});

export const Student: Model<IStudent> =
  models?.Student ?? model<IStudent>("Student", studentSchema);
