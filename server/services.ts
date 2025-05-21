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
} from "@/types/index.types";
import mongoose, { Document } from "mongoose";
import { authentication } from "./_libs";
import { Student } from "@/models/student.model";
import { IAccountCreationInvite } from "@/types/invites.types";
import { genSalt, hash } from "bcrypt";
import { Log as LogModel } from "@/models/log.model";
import { Subject as SubjectModel } from "@/models/subjects.model";

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
      ).select(options?.select!);

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
