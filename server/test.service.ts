import { IRole } from "@/models/users.model";
import { TeacherService, UserService } from "./services";
import { IQuestion, ITest } from "@/types/index.types";
import { Test as TestModel } from "@/models/test.model";
import { Document } from "mongoose";
import { TestAttempt } from "@/models/test-attempt.model";
import { Student } from "./student.service";
import { Question } from "@/models/question.model";
import { IRole as RoleTypes } from "@/types/index.types";

export class Test extends UserService {
  teacher?: TeacherService;
  id?: string;
  student: Student;

  constructor(identifier?: string, id?: string) {
    super(identifier);

    this.id = id;
    this.teacher = new TeacherService(identifier);
    this.student = new Student(identifier);
  }

  public async createTest(test: Partial<ITest>) {
    try {
      this.session?.session?.startTransaction();

      const user = await this.getUser();

      if (user.role === IRole.STUDENT) {
        this.log.critical(`Tries to create a test but was denied access.`, {
          action: "test_creation_failed",
        });
        throw new Error("You are not allow to create a test");
      }

      const teacherProfile = await this.teacher?.getTeacherProfile();

      if (!teacherProfile) {
        this.log.critical(
          `Tries to create a test but was denied access Reason Unable to locate teacher profile.`,
          {
            action: "test_creation_failed",
          }
        );
        throw new Error("You are not allow to create a test");
      }

      if (!teacherProfile.canCreateTest) {
        this.log.error(
          `Tries to create test but fails, Reason: Teacher does not have the right permissions`
        );

        throw new Error(
          "You are not allow to create a test, please contact the admin"
        );
      }

      const testPayload: Partial<ITest> = {
        ...test,
        teacher: teacherProfile._id!,
        isActive: false,
      };

      const createdTest = new TestModel(testPayload);

      const newTest = await createdTest.save({
        session: this.session?.session,
      });

      await this.log.info(`Created a test`);
      await this.session?.session?.commitTransaction();

      return newTest;
    } catch (error) {
      this.log.error(`Failed to create a test`, {
        action: "test_creation_failed",
      });
      if (this.session?.session) {
        await this.session.session.abortTransaction();
      }

      throw error;
    }
  }

  public async getTest<T = Document<unknown, {}, ITest> & ITest>(options?: {
    query?: any;
    toJson?: boolean;
    throwOn404?: boolean;
    addTeacher?: boolean;
    select?: string;
  }): Promise<T> {
    let test: Document<unknown, {}, ITest> | null = null;

    if (options?.query) {
      const query = TestModel.findOne({ ...options.query });

      if (options.addTeacher) {
        test = await query.populate("teacher").select(options?.select || "");
      } else {
        test = await query.select(options?.select || "");
      }
    } else {
      // If no query is provided, find by ID
      const query = TestModel.findById(this.id);

      if (options?.addTeacher) {
        test = await query.populate("teacher");
      } else {
        test = await query;
      }
    }

    if (!test && options?.throwOn404) {
      throw new Error("Unable to find the test with the related query");
    }

    if (options?.toJson) {
      return test?.toJSON() as T;
    }

    return test as T;
  }

  public async getTests(options?: {
    limit?: number;
    offset?: number;
    sortKey?: string;
    sort?: "asc" | "desc";
    query?: string;
    teacher?: string;
  }) {
    try {
      const queryCondition = options?.query
        ? {
            $or: [
              { title: { $regex: options.query, $options: "i" } },
              { description: { $regex: options.query, $options: "i" } },
            ],
          }
        : {};

      const sortDirection = options?.sort === "asc" ? 1 : -1;

      const [tests, filterTestCount, totalTest] = await Promise.all([
        TestModel.find(
          { ...queryCondition, teacher: options?.teacher },
          {
            title: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1,
            instructions: 1,
            "settings.timeLimit": 1,
          }
        )
          .sort({ [options?.sortKey || "createdAt"]: sortDirection })
          .skip(options?.offset || 0)
          .limit(options?.limit || 10),
        TestModel.countDocuments({
          ...queryCondition,
          teacher: options?.teacher,
        }),
        TestModel.countDocuments(),
      ]);

      return {
        tests,
        filterTestCount,
        pagination: {
          limit: options?.limit || 10,
          offset: options?.offset || 0,
          total: totalTest,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  public async updateTest(updates: Partial<ITest>) {
    try {
      const test = await this.getTest({ throwOn404: true });

      if (updates?.settings) {
        test.settings = {
          ...test.settings,
          ...updates.settings,
        };
      }

      if (updates?.accessCode) {
        test.accessCode = {
          ...test.accessCode,
          ...updates.accessCode,
        };
      }

      test.title = updates?.title || test.title;
      test.description = updates?.description || test.description;
      test.allowedStudents = updates.allowedStudents!;
      test.instructions = updates?.instructions || test.instructions;

      const updatedTest = await test.save({
        validateModifiedOnly: true,
        session: this.session.session,
      });

      await this.log.info(
        `Test updated successfully, Updated keys: ${Object.keys(updates).join(
          " ,"
        )}`
      );
      await this.session.session?.commitTransaction();

      return updatedTest;
    } catch (error) {
      if (this.session.session) {
        await this.session.session?.abortTransaction();
      }

      this.log.error(
        `Tries to update test but fails, Reason: ${(error as Error).message}`
      );

      throw error;
    }
  }

  public async stopOrContinueTest() {
    const test = await this.getTest({ throwOn404: true });

    test.isActive = !test.isActive;

    const updatedTest = await test.save({ validateModifiedOnly: true });

    return updatedTest.toJSON();
  }

  public async getAvailableTestForStudent() {
    try {
      //Get the student
      const student = await this.student.getStudentProfile({
        throwOn404: true,
        toJson: true,
      });

      //First get all the test ids the student has completed

      const completedTests = await TestAttempt.find(
        {
          student: student?._id,
          status: "completed",
        },
        { _id: 1 }
      );

      //Map the completed test to return string of id e.g ["id1", "id2", "id3"];
      const listOfIds = completedTests.map((test) => test._id);

      const returnOptions = {
        _id: 1,
        isActive: 1,
        subject: 1,
        teacher: 1,
        instructions: 1,
        title: 1,
        "settings.timeLimit": 1,
      };

      //Get the available tests that the user has not completed and the student is allow to write the test
      const availableTests = await TestModel.find(
        {
          _id: {
            $nin: listOfIds,
          },
          allowedStudents: {
            $in: [student?._id],
          },
          isActive: true,
        },
        returnOptions
      )
        .populate("subject", { name: 1 })
        .select("-allowedStudents");

      return availableTests;
    } catch (error) {
      throw error;
    }
  }

  public async createQuestion(question: IQuestion) {
    try {
      this?.session?.session?.startTransaction();

      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
        toJson: true,
      });

      const test = await this.getTest({
        query: { teacher: teacher?._id, _id: this.id },
        throwOn404: true,
        toJson: true,
      });

      const questionPayload: IQuestion = {
        ...question,
        test: test._id!,
      };

      const _question = new Question(questionPayload);

      const newQuestion = await _question.save({
        session: this.session?.session,
        validateBeforeSave: true,
      });

      await this.log.info(`Created a question for test with id ${test._id}`, {
        action: "test_question_created",
      });
      await this?.session?.session?.commitTransaction();

      return newQuestion.toJSON();
    } catch (error) {
      if (this.session.session) {
        await this.session?.session?.abortTransaction();
      }
      this.log.error(
        `Tries to create a question but fails, Reason: ${
          (error as Error).message
        }`
      );

      throw error;
    }
  }

  public async getTestQuestions(
    role: RoleTypes,
    options: { limit?: number; offset?: number } = {}
  ) {
    // Validate role immediately
    if (role !== IRole.STUDENT && role !== IRole.TEACHER) {
      throw new Error("Invalid role");
    }

    try {
      // Common variables
      let profileId: string;
      let testQuery: Record<string, any> = { _id: this.id };
      let fieldsToExclude: string | null = null;

      if (role === IRole.STUDENT) {
        const student = await this.student.getStudentProfile({
          throwOn404: true,
          toJson: true,
        });
        profileId = student?._id as string;
        testQuery.allowedStudents = { $in: [profileId] };
        fieldsToExclude = "-booleanAnswer -explanation -hint";
      } else {
        const teacher = await this.teacher?.getTeacherProfile({
          throwOn404: true,
          toJson: true,
        });

        profileId = teacher?._id!;
        testQuery.teacher = profileId;
      }

      const test = await this.getTest({
        query: testQuery,
        throwOn404: true,
        toJson: true,
      });

      const questionQuery = Question.find(
        { test: test._id },
        role === IRole.STUDENT ? { _id: 1 } : undefined
      );
      const totalQuestions = await Question.countDocuments({
        test: test._id,
      });

      if (fieldsToExclude) {
        questionQuery.select(fieldsToExclude);
      }

      if (options.limit !== undefined) {
        questionQuery.limit(options.limit);
      }

      if (options.offset !== undefined) {
        questionQuery.skip(options.offset);
      }

      return { totalQuestions, questions: await questionQuery };
    } catch (error) {
      throw error;
    }
  }

  public async getTestQuestionById(questionId: string, role?: RoleTypes) {
    try {
      let id = "";

      if (role === IRole.STUDENT) {
        const student = await this.student?.getStudentProfile({
          throwOn404: true,
        });

        id = student?._id as string;

        //Validate that the student is included in this test
        await this.getTest({
          query: { _id: this.id, allowedStudents: { $in: id } },
        });
      }

      if (role === IRole.TEACHER) {
        const teacher = await this.teacher?.getTeacherProfile({
          throwOn404: true,
        });

        id = teacher?._id!;

        await this.getTest({
          query: { teacher: id },
          throwOn404: true,
        });
      }

      const selections = IRole.TEACHER === role ? "" : "-booleanAnswer -score";

      const question = await Question.findById(questionId).select(selections);

      return question;
    } catch (error) {
      throw error;
    }
  }
}
