import { ITeacher } from "@/types/index.types";
import { Model, Schema, UpdateQuery, model, models } from "mongoose";
import { Subject } from "./subjects.model";
import { Student } from "./student.model";
import { User } from "./users.model";

const teacherSchema = new Schema<ITeacher>({
  canCreateTest: {
    type: Boolean,
    default: true,
  },
  canGradeTest: {
    type: Boolean,
    default: true,
  },
  students: {
    type: [{ ref: "Student", type: Schema.Types.ObjectId }],
    default: [],
  },
  subjects: {
    type: [
      {
        ref: "Subject",
        type: Schema.Types.ObjectId,
      },
    ],
    default: [],
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
});

teacherSchema.statics.findByUserId = async function (userId: string) {
  return await this.findOne({ user: userId }).populate("user");
};

teacherSchema.methods.addStudent = async function (studentId: string) {
  this.students.push(studentId);
};

teacherSchema.methods.removeStudent = async function (studentId: string) {
  this.students = this.students.filter(
    (student: string) => student.toString() !== studentId.toString()
  );
};

teacherSchema.methods.addStudents = async function (studentIds: string[]) {
  this.students.push(...studentIds);
};

teacherSchema.methods.addSubjects = async function (subjectIds: string[]) {
  // Convert existing subjects to strings for consistent comparison
  const currentSubjects = this.subjects.map((subject: string) =>
    subject.toString()
  );

  const uniqueSubjects = new Set([...currentSubjects, ...subjectIds]);

  this.subjects = Array.from(uniqueSubjects);
};

teacherSchema.methods.removeSubject = async function (subjectId: string) {
  this.subjects = this.subjects.filter(
    (subject: string) => subject.toString() !== subjectId.toString()
  );
};

//teacherSchema.index({ user: 1 });

teacherSchema.pre("save", async function (next) {
  try {
    if (this.isModified("subjects")) {
      if (this.subjects && this.subjects.length > 0) {
        const subjectsCount = await Subject.countDocuments({
          _id: { $in: this.subjects },
          teachers: { $in: [this._id] },
        });

        // If any subject is not properly assigned to this teacher
        if (subjectsCount !== this.subjects.length) {
          const err = new Error(
            "Some subjects you provided are not assigned to you, please contact the admin."
          );
          return next(err);
        }
      }
    }

    if (this.isModified("students")) {
      if (this.students && this.students.length > 0) {
        const studnetCount = await Student.countDocuments({
          _id: { $in: this.students },
          subjects: { $in: this.subjects },
        });

        // If any subject is not properly assigned to this teacher
        if (studnetCount !== this?.students?.length) {
          const err = new Error(
            "Some student you provided do not offer your course, please contact the admin."
          );
          return next(err);
        }
      }
    }

    return next();
  } catch (error) {
    return next(error as Error);
  }
});

teacherSchema.pre("findOneAndUpdate", async function (this) {
  const query = this.getQuery();
  const update = this.getUpdate() as UpdateQuery<ITeacher>;

  const subjects = update?.$set?.subjects;

  if (update?.$set?.subjects) {
    if (subjects && subjects.length > 0) {
      const subjectsCount = await Subject.countDocuments({
        _id: { $in: subjects },
        teachers: { $in: [query._id] },
      });

      // If any subject is not properly assigned to this teacher
      if (subjectsCount !== subjects.length) {
        const err = new Error(
          "Some subjects you provided are not assigned to you, please contact the admin."
        );
        throw err;
      }
    }
  }
});

export const Teacher: Model<ITeacher> =
  models?.Teacher ?? model<ITeacher>("Teacher", teacherSchema);
