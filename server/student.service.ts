import { IStudent } from "@/types/index.types";
import { UserService } from "./services";
import { Document } from "mongoose";
import { Student as StudentModel } from "@/models/student.model";

export class Student extends UserService {
  id?: string;

  constructor(identifier?: string, id?: string) {
    super(identifier);

    this.id = id;
  }

  async getStudentProfile(options?: {
    query?: any;
    toJson?: boolean;
    throwOn404?: boolean;
    select?: string;
  }): Promise<(Document<unknown, {}, IStudent> & IStudent) | null> {
    try {
      const user = await this.getUser({ throwOn404: !Boolean(options?.query) });

      const student = await StudentModel.findOne(
        options?.query || { user: user._id }
      ).select(options?.select!);

      if (!student && options?.throwOn404) {
        throw new Error("STUDENT_QUERY_ERROR: student not found.");
      }

      if (options?.toJson) {
        return student?.toJSON() as unknown as
          | (Document<unknown, {}, IStudent> & IStudent)
          | null;
      }

      return student;
    } catch (error) {
      throw error;
    }
  }

  async updateStudentProfile(id: string, updates: Partial<IStudent>) {
    try {
      this?.session?.session?.startTransaction();

      const updatedStudent = await StudentModel.findByIdAndUpdate(
        id,
        {
          $set: updates,
        },
        { new: true, session: this.session?.session }
      );

      await this.log.info(`Student profile updated`, {
        action: "profile_updated",
      });
      await this?.session?.session?.commitTransaction();

      return updatedStudent?.toJSON();
    } catch (error) {
      if (this.session?.session) {
        await this?.session?.session?.abortTransaction();
      }

      this.log.error(
        `Tries to modify profile but fails, Reason: ${
          (error as Error).message
        }`,
        { action: "student_profile_update_failed" }
      );

      throw error;
    }
  }
}
