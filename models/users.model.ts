import { Model, Schema, model, models } from "mongoose";
import bcrypt, { compare } from "bcrypt";
import crypto from "crypto";
import { IUser } from "@/types/index.types";
import { Student } from "./student.model";
import { IRole as Role } from "@/types/index.types";
import { cookies } from "next/headers";
import { _CONSTANTS, COOKIES_OPTION } from "@/lib/constants";
import { TeacherService } from "@/server/services";
import { Subject } from "./subjects.model";

export enum IRole {
  ADMIN = "ADMIN",
  STUDENT = "STUDENT",
  TEACHER = "TEACHER",
}

export enum IGender {
  MALE = "MALE",
  FEMALE = "FEMALE",
  OTHER = "OTHER",
}

const authenticationSchema = new Schema(
  {
    password: {
      type: String,
      required: true,
      trim: true,
    },
    salt: {
      type: String,
      required: true,
    },
    sessionToken: {
      type: String,
    },
    expiresAt: {
      type: Date, // Using Date type for timestamp
    },
  },
  { _id: false }
);

const userSchema = new Schema<IUser>(
  {
    identifier: { type: String, required: true, unique: true, trim: true },
    email: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true },
    isActive: { type: Boolean, default: true },
    role: { type: String, enum: Object.values(IRole), required: true },
    lastLogin: { type: String },
    gender: {
      type: String,
      enum: Object.values(IGender),
      default: IGender.MALE,
    },
    profilePicture: { type: String },
    authentication: {
      type: authenticationSchema,
      select: false,
    },
    isSubjectsApproved: { type: Boolean, default: false },
    pendingSubjects: {
      type: [{ type: Schema.Types.ObjectId, ref: "Subject" }],
      validate: {
        validator: async function (v: string[]) {
          if (!v || v.length === 0) return true;

          const subjectCount = await Subject.countDocuments({
            _id: { $in: v },
          });

          return subjectCount === v.length;
        },
        message: "One or more subjects do not exist",
      },
      default: undefined,
    },
  },
  {
    timestamps: true,
  }
);

// Methods implementation
userSchema.methods.validatePassword = async function (password: string) {
  const expectedPasswordHash = this.authentication.password;

  const isPasswordCorrect = await compare(password, expectedPasswordHash);

  if (!isPasswordCorrect) {
    throw new Error("LOGIN_ERROR: Invalid password");
  }
};

userSchema.methods.setPassword = function (password: string): void {
  this.password = bcrypt.hashSync(password, 10);
};

userSchema.methods.generateSalt = function (size = 128): string {
  return crypto.randomBytes(size).toString("base64");
};

userSchema.methods.generateToken = function (): string {
  return crypto.randomBytes(32).toString("hex");
};

userSchema.methods.setSession = async function (
  token: string,
  salt: string,
  expiresAt: string
): Promise<void> {
  this.authentication = {
    ...this.authentication,
    sessionToken: token,
    salt,
    expiresAt,
  };

  const cookiesStore = await cookies();

  cookiesStore.set(_CONSTANTS.AUTH_HEADER, token, COOKIES_OPTION);
};

userSchema.methods.clearSession = function (): void {
  this.authentication = {
    ...this.authentication,
    sessionToken: undefined,
    expiresAt: undefined,
  };
};

userSchema.methods.isSessionExpired = function (): boolean {
  return (
    !this.authentication.expiresAt ||
    new Date(this.authentication.expiresAt) < new Date()
  );
};

userSchema.methods.updateProfilePicture = function (url: string): void {
  this.profilePicture = url;
};

userSchema.methods.updateLastLogin = function (): void {
  this.lastLogin = new Date().toISOString();
};

userSchema.methods.updatePassword = function (password: string): void {
  this.setPassword(password);
};

userSchema.methods.updateEmail = function (email: string): void {
  this.email = email;
};

userSchema.methods.updateName = function (name: string): void {
  this.name = name;
};

userSchema.methods.refreshSessionToken = async function () {
  const now = new Date();

  if (!this.authentication?.sessionToken || this?.isSessionExpired()) {
    throw new Error("SESSION_ERROR: Looks like your session has expired");
  }

  const expirationTime = new Date(this.authentication?.expiresAt);
  const timeUntilExpiration = expirationTime.getTime() - now.getTime();
  const twentyFiveMinutes = 25 * 60 * 1000; // 25 minutes in milliseconds

  // Refresh token if less than 25 minutes remaining
  if (timeUntilExpiration <= twentyFiveMinutes) {
    const newExpirationTime = new Date(now.getTime() + 60 * 60 * 1000);
    this.setSession(
      this.generateToken(),
      this.generateSalt(),
      newExpirationTime
    );
  }

  // Verify if provided token matches stored token
  return this.authentication;
};

userSchema.methods.validateUser = async function (role: Role) {
  const now = new Date();

  if (!this.isActive) {
    throw new Error("USER_ERROR: Your account is not active");
  }

  if (this.role !== role) {
    throw new Error(`LOGIN_ERROR: You are not allow to login as a ${role}`);
  }

  if (role === IRole.STUDENT) {
    const student = await Student.findOne({ user: this._id }, { endDate: 1 });

    if (!student) {
      throw new Error("USER_ERROR: You are not a student");
    }

    if (!student.endDate || now > student.endDate) {
      throw new Error(
        "USER_ERROR: Looks like your student account has expired"
      );
    }
  }
};

export const findUserBySessionToken = (sessionToken: string) => {
  return User.findOne({ "authentication.sessionToken": sessionToken });
};

export const findUserByEmail = (email: string) => {
  return User.findOne({ email });
};

//Middleware

userSchema.pre("save", async function (next) {
  try {
    if (this.isModified("pendingSubjects")) {
      this.isSubjectsApproved = false;
    }

    next();
  } catch (error) {
    next(error as Error);
  }
});

userSchema.post("save", async function (doc) {
  if (this.isNew) {
    //Send an email to the admin that a new user has been created
  }

  if (doc.isModified("isSubjectsApproved") && doc.isSubjectsApproved) {
    //Check if the user is a teacher or a student

    if (doc.role === IRole.TEACHER) {
      const teacherService = new TeacherService(doc.identifier);

      const teacher = await teacherService.getTeacherProfile({
        query: { user: doc._id },
        throwOn404: true,
        toJson: true,
      });

      teacher?.addSubjects?.(doc.pendingSubjects as string[]);

      await teacher?.save({
        validateModifiedOnly: true,
      });
    }

    //TODO: add student logic here
    if (doc.role === IRole.STUDENT) {
    }
  }
});

export const User: Model<IUser> =
  models?.User ?? model<IUser>("User", userSchema);
