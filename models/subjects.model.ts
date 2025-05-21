import { ISubject } from "@/types/index.types";
import mongoose, { Model, Schema } from "mongoose";
import { Teacher } from "./teacher.model";

// Schema for Subject
const SubjectSchema = new Schema<ISubject>(
  {
    name: {
      type: String,
      required: true,
      unique: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
      trim: true,
    },
    teachers: {
      type: [{ type: mongoose.Types.ObjectId, ref: "Teacher" }],
      required: true,
      validate: {
        validator: async function (teachers: string[]) {
          if (teachers.length === 0) return true;

          const teacherIds = await Teacher.countDocuments({
            _id: { $in: teachers },
          });
          return teacherIds === teachers.length;
        },
        message: "Invalid teacher IDs provided.",
      },
    },
  },
  {
    timestamps: true,
  }
);

SubjectSchema.statics.getAll = async function () {
  return this.find();
};

SubjectSchema.statics.getSubjectByName = async function (subjectName: string) {
  return this.findOne({ name: subjectName });
};

// Create and export the Subject model
export const Subject: Model<ISubject> =
  mongoose?.models?.Subject ??
  mongoose.model<ISubject>("Subject", SubjectSchema);
