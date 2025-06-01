import { AccountCreationInvite } from "@/models/account-creation-invites";
import { Teacher } from "@/models/teacher.model";
import { User } from "@/models/users.model";
import {
  ILogs,
  IRole,
  IStudent,
  ISubject,
  ITeacher,
  IUser,
  UploadDocsOptions,
} from "@/types/index.types";
import mongoose, { Document } from "mongoose";
import { authentication, getDocumentInfo, random, sendEmail } from "./_libs";
import { Student } from "@/models/student.model";
import { IAccountCreationInvite } from "@/types/invites.types";
import { genSalt, hash } from "bcrypt";
import { Log as LogModel } from "@/models/log.model";
import { Subject as SubjectModel } from "@/models/subjects.model";
import { ForgetPassword } from "@/models/forget-password.model";
import { IForgetPassword } from "@/types/forget-password.types";
import { v2 as cloudinary, UploadApiResponse } from "cloudinary";
import { IAccecptableFile } from "@/types/client.types";
import { TransformationOptions } from "cloudinary";

//Configuring the cloudinary sdk
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME!,
  api_key: process.env.CLOUDINARY_API_KEY!,
  api_secret: process.env.CLOUDINARY_API_SECRET!,
});

export class Session {
  session: mongoose.ClientSession | null = null;

  async startSession() {
    this.session = await mongoose.startSession();
    this.session?.startTransaction();
  }

  async commitTransaction() {
    this.session?.commitTransaction();
    this.session?.endSession();
  }

  async abortTransaction() {
    if (this.session) {
      this.session?.abortTransaction();
      this.session?.endSession();
    }
  }
}

export class UserService {
  private identifier: string;
  session: Session = new Session();
  log: Log;

  constructor(identifier = "") {
    this.identifier = identifier;

    this.log = new Log(identifier);
  }

  public async createAccount(payload: Partial<IUser>, type: IRole) {
    try {
      this?.session?.session?.startTransaction();

      if (!payload.email) {
        throw new Error("EMAIL_ERROR: Email is required");
      }

      if (!payload.authentication?.password) {
        throw new Error("PASSWORD_ERROR: Password is required");
      }

      if (!payload.name) {
        throw new Error("NAME_ERROR: Name is required");
      }

      const invite = await AccountCreationInvite.findOne({
        email: payload.email.toLowerCase(),
        accountCreated: false,
        role: type,
      }).session(this.session?.session);

      if (!invite) {
        throw new Error("INVITE_ERROR: Invite not found");
      }

      invite?.checkInvitation?.();

      const user: Partial<IUser> = {
        ...payload,
        email: invite?.email,
        role: invite?.role,
        identifier: this.identifier,
        authentication: {
          password: "",
          salt: "",
        },
        pendingSubjects: [],
      };

      const newUser = new User(user);

      const salt = await genSalt(10);

      newUser.authentication.salt = salt;
      newUser.authentication.sessionToken = authentication(newUser._id, salt!);
      newUser.authentication.password = await hash(
        payload.authentication.password,
        salt!
      );

      await newUser.save({
        session: this.session?.session,
        validateBeforeSave: true,
      });

      invite.accountCreated = true;

      await invite.save({ session: this.session?.session });

      await this.session?.session?.commitTransaction();
      await this.log.info("User created an account");

      return newUser;
    } catch (error) {
      if (this.session?.session) {
        await this?.session?.session?.abortTransaction();
      }
      await this.log.error(
        `User tries to create an account but failed, Reason: ${
          (error as Error).message
        }`
      );
      throw error;
    }
  }

  public async createTeacher(
    email: string,
    password: string,
    name: string,
    subjects: string[]
  ) {
    try {
      this.session?.session?.startTransaction();

      const user = await this.createAccount(
        {
          email,
          identifier: this.identifier,
          name,
          authentication: {
            password,
          },
          isSubjectsApproved: false,
        },
        "TEACHER"
      );

      const teacherPayload: ITeacher = {
        user: user._id,
        students: [],
        subjects,
      };

      const teacher = new Teacher(teacherPayload);

      const newTeacher = await teacher.save({
        validateBeforeSave: true,
        session: this.session.session,
      });

      await this.session?.session?.commitTransaction();

      await this.log.info("Teacher account created for user");

      return { ...newTeacher.toJSON(), ...user?.toJSON() };

      //Create teacher
    } catch (error) {
      if (this.session?.session) {
        await this.session?.session?.abortTransaction();
      }
      await this.log.error(
        `Teacher account created failed, Reason: ${(error as Error).message}`
      );
      throw error;
    }
  }

  public async createStudent(
    email: string,
    password: string,
    name: string,
    subjects: string[]
  ) {
    try {
      this.session?.session?.startTransaction();

      const user = await this.createAccount(
        {
          email,
          identifier: this.identifier,
          name,
          authentication: {
            password,
          },
          isSubjectsApproved: false,
        },
        "STUDENT"
      );

      const studentPayload: IStudent = {
        user: user._id,
        subjects,
      };

      const newStudent = new Student(studentPayload);

      const student = await newStudent.save({
        validateBeforeSave: true,
        session: this.session.session,
      });

      await this.log.info("Student account assigned to user");
      await this?.session?.session?.commitTransaction();

      return { ...student.toJSON(), ...user?.toJSON() };
    } catch (error) {
      await this.log.error(
        `Student account creation failed, Reason: ${(error as Error).message}`
      );

      if (this.session.session) {
        await this.session?.session?.abortTransaction();
      }

      throw error;
    }
  }

  public async getUser<T = Document<unknown, {}, IUser> & IUser>(options?: {
    toJSON?: boolean;
    throwOn404?: boolean;
    query?: any;
    select?: string;
  }): Promise<T> {
    const user = await User.findOne(
      options?.query || {
        $or: [{ identifier: this.identifier }, { id: this.identifier }],
      }
    ).select(options?.select!);

    if (options?.throwOn404 && !user) {
      throw new Error("USER_NOT_FOUND");
    }

    if (options?.toJSON) {
      return user?.toJSON() as T;
    }

    return user as T;
  }

  public async suspendUser(userId: string) {
    try {
      this.session?.session?.startTransaction();

      const user = await this.getUser({
        query: { _id: userId },
        throwOn404: true,
        select: "+authentication",
      });

      user.authentication.sessionToken = "account-suspended";
      user.isActive = false;

      await user.save({ validateModifiedOnly: true });

      const { authentication, ...suspendedUser } = user.toJSON();

      await this.log.critical(`You suspended a user with Id-${userId}`, {
        action: "account_suspention",
      });
      await this.session?.session?.commitTransaction();

      return suspendedUser;
    } catch (error) {
      await this.session?.session?.abortTransaction();
      throw error;
    }
  }

  public async reInstateUser(userId: string) {
    try {
      this.session?.session?.startTransaction();

      const user = await this.getUser({
        query: { _id: userId },
        throwOn404: true,
      });

      user.isActive = true;

      await user.save({ validateModifiedOnly: true });

      const { authentication, ...activeUser } = user.toJSON();

      await this.log.critical(`You reinstated a user with Id-${userId}`, {
        action: "account_reinstation",
      });
      await this.session?.session?.commitTransaction();

      return activeUser;
    } catch (error) {
      await this.session?.session?.abortTransaction();
      throw error;
    }
  }

  //This method is use to login a teacher
  public async login(password: string, role: IRole) {
    try {
      const now = new Date();

      this.session.session?.startTransaction();

      const user = await this.getUser({
        select: "+authentication",
        query: { identifier: this.identifier, role },
      });

      if (!user) {
        this.session?.session?.abortTransaction();
        throw new Error("LOGIN_ERROR: User with this query not found");
      }

      now.setHours(now.getHours() + 1);

      //Check if the password is correct
      await user?.validatePassword?.(password);

      await user?.validateUser?.(role);

      const SALT = user?.generateSalt?.() as string;
      const token = authentication(user?._id!, SALT);

      //Update the user session to a new session
      user?.setSession?.(token, SALT, now);

      //Changing the user last login time
      user.updateLastLogin?.();

      await user.save({
        session: this.session.session,
        validateModifiedOnly: true,
      });

      await this.log.info("You login your account", {
        action: "account_login",
      });
      await this.session?.session?.commitTransaction();

      return {
        user: user.toJSON(),
        token,
        expiresAt: now.toISOString(),
      };
    } catch (error) {
      //logger.error((error as Error).message);
      if (this.session?.session) {
        await this.session.session?.abortTransaction();
      }

      await this.log.error(
        `Account login failed, Reason: ${(error as Error).message}`
      );

      throw error;
    }
  }

  public async updateDetail(userId: string, user: Partial<IUser>) {
    try {
      const restrictedUpdateKeys = new Set([
        "identifier",
        "role",
        "isActive",
        "isSubjectsApproved",
      ]);

      const keys = Object.keys(user);

      for (const key in keys) {
        await this.log.critical(
          `Tries to update properties that user is not allow to make`,
          { action: "unauthorize_request" }
        );
        if (restrictedUpdateKeys.has(key)) {
          throw new Error(
            "You are not allow to make modification to some of the properties you specified"
          );
        }
      }

      this.session.session?.startTransaction();

      const updatedUser = await User.findByIdAndUpdate(
        userId,
        {
          $set: user,
        },
        {
          new: true,
          session: this.session.session,
        }
      );

      await this.log.info(
        `User updates their details, Modified keys: ${keys.join(" ,")}`
      );
      await this.session.session?.commitTransaction();

      return updatedUser;
    } catch (error) {
      if (this.session.session) {
        await this.session.session.abortTransaction();
      }

      this.log.error(
        `User details update failed, Reason: ${(error as Error).message}`
      );

      throw error;
    }
  }

  public async getUsers(options?: {
    limit?: number;
    offset?: number;
    sortKey?: string;
    sort?: "asc" | "desc";
    query?: string;
    role?: IRole;
  }) {
    const queryCondition = options?.query
      ? {
          $or: [
            { email: { $regex: options.query, $options: "i" } },
            { name: { $regex: options.query, $options: "i" } },
            { identifier: { $regex: options.query, $options: "i" } },
          ],
        }
      : {};

    const roleQuery = options?.role ? { role: options.role } : {};

    const sortDirection = options?.sort === "asc" ? 1 : -1;

    const [users, filterUsersCount, totalUsers] = await Promise.all([
      User.find(
        { ...roleQuery, ...queryCondition },
        {
          email: 1,
          identifier: 1,
          isActive: true,
          name: 1,
          role: 1,
        }
      )
        .sort({ [options?.sortKey || "createdAt"]: sortDirection })
        .skip(options?.offset || 0)
        .limit(options?.limit || 10),
      User.countDocuments({ ...roleQuery, ...queryCondition }),
      User.countDocuments(),
    ]);

    return {
      users,
      filterUsersCount,
      totalUsers,
      pagination: {
        limit: options?.limit || 10,
        offset: options?.offset || 0,
        total: filterUsersCount,
      },
    };
  }

  public async requestResetPassword(identifier: string) {
    try {
      this.session.session?.startTransaction();

      const user = await User.findOne({
        $or: [{ identifier }, { email: identifier }],
      }).session(this.session.session);

      if (!user) {
        throw new Error(
          "We could not locate your account in our database, If you believe this is not correct, Please contact the admin"
        );
      }

      this.log.logPayload = {
        ...(this.log.logPayload as ILogs),
        user: user?._id,
      };

      const REQUEST_THRESHOLD = 4 as const;

      // Check if user has made any password reset requests in the last hour
      const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000);

      const requestInLastHourCount = await ForgetPassword.countDocuments({
        createdAt: {
          $gte: oneHourAgo,
        },
        user: user?._id!,
      }).session(this.session.session);

      if (requestInLastHourCount >= REQUEST_THRESHOLD) {
        throw new Error(
          "PASSWORD_RESET_REQUEST_FAILS: Look's like you have requested password reset."
        );
      }

      const RESET_TOKEN = random(16);

      const passwordRequestPayload: IForgetPassword = {
        expiresAt: new Date(
          new Date().getFullYear(),
          new Date().getMonth(),
          new Date().getMonth(),
          new Date().getHours(),
          new Date().getMinutes() + 30
        ),
        resetToken: RESET_TOKEN,
        user: user?._id,
      };

      const forgetPassword = new ForgetPassword(passwordRequestPayload);

      await forgetPassword.save({
        session: this.session?.session,
        validateBeforeSave: true,
      });

      const emailTemplate = `
        <div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 5px;">
          <h2 style="color: #333;">Password Reset Request</h2>
          <p>Hello,</p>
          <p>We received a request to reset your password. Click the button below to reset your password:</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.CLIENT_URL}/reset-password?token=${RESET_TOKEN}" 
               style="background-color: #007bff; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 4px;
                      font-weight: bold;">
              Reset Password
            </a>
          </div>
          <p>This link will expire in 30 minutes. If you did not request a password reset, please ignore this email.</p>
          <p>For security reasons, please do not share this link with anyone.</p>
          <p>If the button doesn't work, copy and paste this link into your browser:</p>
          <p style="word-break: break-all; color: #666;">
            ${process.env.URL}/auth/reset-password/${RESET_TOKEN}
          </p>
          <p style="margin-top: 30px;">Best regards,<br>Quiz App Team</p>
        </div>
      `;

      sendEmail({
        emails: user.email,
        email: emailTemplate,
        subject: "Password Reset Token",
      });

      await this.log.info("User request password reset", {
        action: "password-reset",
      });
      await this.session.session?.commitTransaction();
    } catch (error) {
      if (this.session?.session) {
        await this.session.session.abortTransaction();
      }
      this.log.error(
        `User tries to request password reset but fails, Reason: ${
          (error as Error).message
        }`,
        {
          action: "password-reset-fails",
        }
      );
      throw error;
    }
  }

  public async resetPassword(resetToken: string, newPassword: string) {
    try {
      this.log.logPayload = {
        ...(this.log.logPayload as ILogs),
        user: resetToken,
      };

      const forgetPassword = await ForgetPassword.findOne({ resetToken });

      if (!forgetPassword) {
        throw new Error(
          "PASSWORD_RESET_FAILED: Could not find the reset token provided"
        );
      }

      const now = new Date();
      const expiresAt = new Date(forgetPassword.expiresAt);

      if (now > expiresAt) {
        throw new Error(
          "PASSWORD_RESET_FAILED: The token you provided seems to have been expired."
        );
      }

      const user = await this.getUser({
        query: { _id: forgetPassword?.user },
        throwOn404: true,
        select: "+authentication",
      });

      const salt = await genSalt(10);

      user.authentication.salt = salt;
      user.authentication.password = await hash(newPassword, salt!);

      user.clearSession?.();

      await Promise.all([
        user?.save({
          session: this.session.session,
          validateModifiedOnly: true,
        }),
        forgetPassword?.deleteOne({ session: this.session?.session }),
      ]);

      return "Password reset successful, Please proceed to login your account.";
    } catch (error) {
      if (this.session?.session) {
        await this.session.session.abortTransaction();
      }
      this.log.error(
        `User tries to request password reset but fails, Reason: ${
          (error as Error).message
        }`,
        {
          action: "password-reset-fails",
        }
      );
      throw error;
    }
  }

  public async uploadImage(docs: string[], type: IAccecptableFile) {
    let uploadResults: UploadApiResponse[] = [];

    docs.forEach(async (doc) => {
      const docInfo = getDocumentInfo(doc);

      const acceptableFiles = new Set([
        "pdf",
        "image",
        "vnd.openxmlformats-officedocument.wordprocessingml.document",
      ]);

      if (!docInfo?.type || !acceptableFiles.has(docInfo?.type)) {
        throw new Error(
          "FILE_TYPE_UNACCEPTED: The type of file you provided is not a type of file that is accepted."
        );
      }

      if (!docInfo?.sizeMB || docInfo?.sizeMB > 3) {
        throw new Error(
          "FILE_SIZE_EXCEEDED: The file you provided is too large, Please upload a file that is less than 3MB"
        );
      }

      if (!docInfo?.hasDataUri) {
        throw new Error("FILE_UPLOAD_ERROR: Please use a valid file in base64");
      }

      const randomFileName = random(16);

      const transformation: TransformationOptions = [];

      const result = await cloudinary.uploader.upload(doc, {
        resource_type: "auto",
        public_id: randomFileName,
        folder: type,
        use_filename: true,
        unique_filename: false,
        transformation,
        overwrite: true,
      });

      uploadResults.push(result);
    });

    return uploadResults;
  }

  async uploadProfileImage(base64Data: string) {
    if (!base64Data.startsWith("data:")) {
      throw new Error("Please upload image in base 64 format");
    }

    const matches = base64Data.match(/^data:image\/([a-zA-Z]*);base64,/);

    const sizeInBytes = (base64Data.length * 3) / 4;
    const sizeInMB = sizeInBytes / (1024 * 1024);

    const MAX_SIZE = 3;

    if (sizeInMB > MAX_SIZE) {
      throw new Error(
        `Please use a file that the file is less than ${MAX_SIZE} MB`
      );
    }

    if (!matches) {
      throw new Error("Invalid image, Please use image encoded in base64 data");
    }

    const user = await this.getUser({
      throwOn404: true,
      toJSON: true,
    });

    const userId = user?._id;

    try {
      const result = await cloudinary.uploader.upload(base64Data, {
        public_id: `profile_${userId}`,
        folder: "profiles",
        gravity: "face",
        crop: "thumb",
        width: 400,
        height: 400,
        quality: "auto:good",
        eager: [
          { width: 150, height: 150, crop: "thumb", gravity: "face" },
          { width: 300, height: 300, crop: "thumb", gravity: "face" },
          { width: 50, height: 50, crop: "thumb", gravity: "face" },
        ],
        detection: "face",
        overwrite: true,
      });

      return result;
    } catch (error) {
      throw error;
    }
  }
}

export class AccountInvitation extends UserService {
  public async createInvitations<T = any[]>(
    payload: Partial<IAccountCreationInvite>[]
  ): Promise<T> {
    try {
      this?.session?.session?.startTransaction();

      const invitations = payload.map((invite) => ({
        ...invite,
        accountCreated: false,
      }));

      const newInvitation = await AccountCreationInvite.create(invitations, {
        session: this.session?.session,
      });

      await this.log.info(
        `You invites ${invitations.length} user to join this platform`,
        { action: "account_creation_invitation" }
      );
      await this.session?.session?.commitTransaction();

      return newInvitation as T;
    } catch (error) {
      if (this.session?.session) {
        await this.session?.session?.abortTransaction();
      }

      await this.log.error(
        `User invitations failed, Reason: ${(error as Error).message}`
      );
      throw error;
    }
  }
}

export class Subject extends UserService {
  public async createSubject(payload: Partial<ISubject>) {
    try {
      this.session?.session?.startTransaction();

      const subject = new SubjectModel(payload);

      const newSubject = await subject.save({
        validateBeforeSave: true,
        session: this.session.session,
      });

      await this?.session?.session?.commitTransaction();

      return newSubject.toJSON();
    } catch (error) {
      if (this.session?.session) {
        await this?.session?.session?.abortTransaction();
      }
      this.log.error(
        `Unable to create subject, Reason: ${(error as Error).message}`
      );
      throw error;
    }
  }

  public async getSubjects() {
    try {
      const subjects = await SubjectModel.find({});
      return subjects;
    } catch (error) {
      throw error;
    }
  }

  public async deleteSubjects(subjectIds: string[]) {
    try {
      this.session?.session?.startTransaction();

      await SubjectModel.deleteMany({
        _id: { $in: subjectIds },
      }).session(this.session.session);

      await this.session.session?.commitTransaction();
      this.log.info(`You deleted subjects with Ids: ${subjectIds.join(" ,")}`, {
        action: "delete_subject",
      });
    } catch (error) {
      if (this.session.session) {
        await this.session.session.abortTransaction();
      }

      this.log.error(
        `Attempted to delete a subject with Ids: ${subjectIds.join(" ,")}`
      );

      throw error;
    }
  }
}

export class TeacherService extends UserService {
  async getTeacherProfile(options?: {
    query?: any;
    toJson?: boolean;
    throwOn404?: boolean;
    select?: string;
  }): Promise<(Document<unknown, {}, ITeacher> & ITeacher) | null> {
    try {
      const user = await this.getUser({ throwOn404: !Boolean(options?.query) });

      const teacher = await Teacher.findOne(
        options?.query || { user: user._id }
      )
        .populate("user")
        .populate({ path: "subjects", select: "+name" })
        .populate({
          path: "students",
          populate: { path: "user", select: "email name isActive identifier" },
        })
        .select(options?.select!);

      if (!teacher && options?.throwOn404) {
        throw new Error("TEACHER_QUERY_ERROR: Teacher not found.");
      }

      if (options?.toJson) {
        return teacher?.toJSON() as unknown as
          | (Document<unknown, {}, ITeacher> & ITeacher)
          | null;
      }

      return teacher;
    } catch (error) {
      throw error;
    }
  }

  async getAvailableSubjectsForMe() {
    const teacher = await this.getTeacherProfile({
      throwOn404: true,
      toJson: true,
    });

    const subjects = await SubjectModel.find({
      teachers: {
        $in: [teacher?._id],
      },
    }).select("-teachers");

    return subjects;
  }

  async addNewSubjects(subjectIds: string[]) {
    try {
      this.session.session?.startTransaction();

      const user = await this.getUser();

      user.pendingSubjects = [...subjectIds];

      const updatedUser = await user?.save({
        validateModifiedOnly: true,
        session: this.session?.session,
      });

      await this.log.info(
        `Added ${subjectIds.length} new subjects to existing subjects`,
        { action: "subjects_added" }
      );

      await this.session.session?.commitTransaction();

      return updatedUser;
    } catch (error) {
      if (this.session.session) {
        await this.session.session.abortTransaction();
      }

      this.log.error(
        `Tries to add new subject but failed, Reason: ${
          (error as Error).message
        }`
      );

      throw error;
    }
  }

  async updateTeacher(id: string, updates: Partial<ITeacher>) {
    try {
      this.session.session?.startTransaction();

      const updatedTeacher = await Teacher.findByIdAndUpdate(
        id,
        { $set: updates },
        {
          session: this.session.session,
          new: true,
          runValidators: true,
        }
      );

      await this.log.info(
        `Update a teacher profile, change keys: ${Object.keys(updates).join(
          " , "
        )}`,
        { action: "teacher_profile_update" }
      );

      await this.session.session?.commitTransaction();
      return updatedTeacher;
    } catch (error) {
      if (this.session.session) {
        await this.session.session.abortTransaction();
      }

      this.log.error(
        `Unable to update teacher profile, Reason: ${(error as Error).message}`,
        { action: "teacher_profile_update_failed" }
      );

      throw error;
    }
  }

  async getStudentOfferingMySubject() {
    const teacher = await this.getTeacherProfile({ throwOn404: true });

    const students = await Student.find({
      subjects: { $in: teacher?.subjects },
    })
      .populate({
        path: "user",
        select: "name email profilePicture identifier isActive",
      })
      .populate({
        path: "subjects",
        select: "name",
      });

    return students;
  }
}

export class Log {
  logPayload?: ILogs;

  constructor(user = "") {
    this.logPayload = {
      action: "",
      log: "",
      severity: "info",
      user: user!,
      userAgent: "",
    };
  }

  private async saveLog() {
    const log = new LogModel(this.logPayload);

    await log.save();
  }

  public async info(log: string, options?: Partial<ILogs>) {
    this.logPayload = {
      ...this.logPayload!,
      ...options,
      severity: "info",
      log,
    };

    await this.saveLog();
  }

  public async critical(log: string, options?: Partial<ILogs>) {
    this.logPayload = {
      ...this.logPayload!,
      ...options,
      severity: "critical",
      log,
    };

    await this.saveLog();
  }

  public async error(log: string, options?: Partial<ILogs>) {
    this.logPayload = {
      ...this.logPayload!,
      ...options,
      severity: "error",
      log,
    };

    await this.saveLog();
  }

  public async warning(log: string, options?: Partial<ILogs>) {
    this.logPayload = {
      ...this.logPayload!,
      ...options,
      severity: "warning",
      log,
    };

    await this.saveLog();
  }
}
