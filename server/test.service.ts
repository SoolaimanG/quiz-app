import { IRole } from "@/models/users.model";
import { TeacherService, UserService } from "./services";
import {
  ILogs,
  IOption,
  IQuestion,
  IQuestionsAttempted,
  IQuestionType,
  ISubject,
  ITest,
  ITestAttempt,
  IUser,
} from "@/types/index.types";
import { Test as TestModel } from "@/models/test.model";
import mongoose, { Document } from "mongoose";
import { TestAttempt } from "@/models/test-attempt.model";
import { Student } from "./student.service";
import {
  Question,
  QuestionAnswer,
  QuestionOption,
} from "@/models/question.model";
import { IRole as RoleTypes } from "@/types/index.types";
import { distance } from "fastest-levenshtein";
import { Client as QClient } from "@upstash/qstash";
import { sendEmail } from "./_libs";
import { Student as StudentModel } from "@/models/student.model";

const qstashClient = new QClient({ token: process.env.QSTASH_TOKEN! });

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
    isActive?: string;
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

      const isActivequeryCondition =
        options?.isActive && options?.isActive !== "undefined"
          ? {
              isActive: options?.isActive === "true",
            }
          : {};

      const sortDirection = options?.sort === "asc" ? 1 : -1;

      const [tests, filterTestCount, totalTest] = await Promise.all([
        TestModel.find(
          {
            ...queryCondition,
            ...isActivequeryCondition,
            teacher: options?.teacher,
          },
          {
            title: 1,
            description: 1,
            isActive: 1,
            createdAt: 1,
            updatedAt: 1,
            subject: 1,
            instructions: 1,
            "settings.timeLimit": 1,
          }
        )

          .populate({ path: "subject", select: "name" })
          .sort({ [options?.sortKey || "createdAt"]: sortDirection })
          .skip(options?.offset || 0)
          .limit(options?.limit || 10),
        TestModel.countDocuments({
          ...queryCondition,
          ...isActivequeryCondition,
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

  public async updateTestQuestionById(
    questionId: string,
    updates: Partial<IQuestion>
  ) {
    try {
      this?.session?.session?.startTransaction();

      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
      });

      await this.getTest({
        query: { teacher: teacher?._id, _id: this.id },
        throwOn404: true,
      });

      const question = await Question.findById(questionId);

      if (!question) {
        throw new Error("Question not found");
      }

      question.question = updates.question || question.question;
      question.booleanAnswer = updates.booleanAnswer || question.booleanAnswer;
      question.explanation = updates.explanation || question.explanation;
      question.hint = updates.hint || question.hint;
      question.score = updates.score || question.score;

      const updatedQuestion = await question.save({
        session: this.session?.session,
        validateModifiedOnly: true,
      });

      await this.log.info(`Updated a question for test with id ${this.id}`, {
        action: "test_question_updated",
      });

      await this?.session?.session?.commitTransaction();

      return updatedQuestion.toJSON();
    } catch (error) {
      this.log.error(
        `Tries to update test but fails, Reason: ${(error as Error).message}`
      );

      if (this.session?.session) {
        await this.session.session?.abortTransaction();
      }

      throw error;
    }
  }

  public async deleteTestQuestionById(questionId: string) {
    try {
      this?.session?.session?.startTransaction();

      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
      });

      const { isActive = false } = await this.getTest({
        query: { teacher: teacher?._id, _id: this.id },
        throwOn404: true,
      });

      if (isActive) {
        throw new Error("Cannot delete a question from an active test");
      }

      await Promise.all([
        Question.findByIdAndDelete(questionId, {
          session: this.session.session,
        }),
        QuestionOption.deleteMany(
          { question: questionId },
          { session: this.session.session! }
        ),
        TestAttempt.updateMany(
          { "questionsAttempted.question": questionId },
          { $pull: { questionsAttempted: { question: questionId } } }
        ),
      ]);

      await this.log.info(`Deleted a question for test with id ${this.id}`, {
        action: "test_question_deleted",
      });

      await this?.session?.session?.commitTransaction();

      return true;
    } catch (error) {
      this.log.error(
        `Tries to delete a question but fails, Reason: ${
          (error as Error).message
        }`
      );

      if (this.session?.session) {
        await this.session.session?.abortTransaction();
      }

      throw error;
    }
  }

  public async getOptions(
    questionId: string,
    role: RoleTypes,
    skipValidation = false
  ) {
    if (role === IRole.STUDENT && !skipValidation) {
      const student = await this.student.getStudentProfile({
        throwOn404: true,
      });

      await this.getTest({
        query: { _id: this.id, allowedStudents: { $in: [student?._id] } },
      });
    }

    if (role === IRole.TEACHER && !skipValidation) {
      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
        toJson: true,
      });

      await this.getTest({
        query: { _id: this.id, teacher: teacher?._id },
      });
    }

    const question = await Question.findOne(
      { _id: questionId, test: this.id },
      { _id: 1 }
    );

    const options = await QuestionOption.find({
      question: question?._id,
    }).select(role === IRole.STUDENT ? "-isCorrect" : "");

    return options;
  }

  public async createOptionForQuestion(questionId: string, options: IOption[]) {
    try {
      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
      });

      const question = await Question.findById(questionId);

      if (!question) {
        throw new Error("Could not find the question with this Id");
      }

      const allowedTypes: IQuestionType[] = ["mcq", "obj"];

      if (!allowedTypes.includes(question?.type)) {
        throw new Error("Could not create option for this question type");
      }

      await this.getTest({
        query: { _id: this.id, teacher: teacher?._id },
        throwOn404: true,
      });

      const optionsPayload = options?.map((option) => ({
        ...option,
        question: question._id,
      }));

      const newOptions = await QuestionOption.insertMany(optionsPayload, {
        session: this.session?.session,
        throwOnValidationError: true,
      });

      await this.log.info(`Created an option(s) for question ${questionId}`, {
        action: "option_created",
      });

      await this.session?.session?.commitTransaction();

      return newOptions;
    } catch (error) {
      if (this.session?.session) {
        await this?.session?.session?.abortTransaction();
      }
      this.log.error(
        `Try creating option for question ${questionId} but failed, Reason: ${
          (error as Error).message
        }`
      );

      throw error;
    }
  }

  public async updateOptionForQuestion(
    questionId: string,
    optionId: string,
    updates: Partial<IOption>
  ) {
    try {
      this.session.session?.startTransaction();

      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
      });

      const test = await this.getTest({
        query: { _id: this.id, teacher: teacher?._id },
        throwOn404: true,
      });

      const question = await Question.findOne({
        _id: questionId,
        test: test?._id,
      });

      if (!question) {
        throw new Error("Could not find the question with this Id");
      }

      const option = await QuestionOption.findById(optionId);

      if (!option) {
        throw new Error("Could not find the option with this Id");
      }

      option.option = updates.option || option.option;
      option.isCorrect = updates.isCorrect || option.isCorrect;
      option.media = updates.media || option.media;

      const updatedOption = await option.save({
        session: this.session.session,
        validateModifiedOnly: true,
      });

      return updatedOption?.toJSON();
    } catch (error) {
      if (this.session?.session) {
        await this?.session?.session?.abortTransaction();
      }
      this.log.error(
        `Try updating option for question ${questionId} but failed, Reason: ${
          (error as Error).message
        }`
      );

      throw error;
    }
  }

  public async deleteOptionForQuestion(questionId: string, optionId: string) {
    try {
      this.session.session?.startTransaction();

      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
      });

      const test = await this.getTest({
        query: { _id: this.id, teacher: teacher?._id },
        throwOn404: true,
      });

      const question = await Question.findOne({
        _id: questionId,
        test: test?._id,
      });

      if (!question) {
        throw new Error("Could not find the question with this Id");
      }

      const option = await QuestionOption.findByIdAndDelete(optionId);

      if (!option) {
        throw new Error("Could not find the option with this Id");
      }

      await this.log.info(`Deleted an option for question ${questionId}`, {
        action: "option_deleted",
      });

      await this.session?.session?.commitTransaction();

      return true;
    } catch (error) {
      if (this.session?.session) {
        await this?.session?.session?.abortTransaction();
      }
      this.log.error(
        `Try deleting option for question ${questionId} but failed, Reason: ${
          (error as Error).message
        }`
      );

      throw error;
    }
  }

  public async removeOptions(questionId: string, optionIds: string[] = []) {
    try {
      this.session.session?.startTransaction();

      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
      });

      const question = await Question.findById(questionId);

      if (!question) {
        throw new Error("Could not find the question with this Id");
      }

      await this.getTest({
        query: { _id: this.id, teacher: teacher?._id },
        throwOn404: true,
      });

      await QuestionOption.deleteMany(
        {
          question: questionId,
          ...(!!optionIds.length ? { _id: { $in: optionIds } } : undefined),
        },
        { session: this?.session?.session! }
      );

      await this.log.critical(
        `Deleted options with ids ${optionIds.join(" ,")}`,
        { action: "options_deleted" }
      );
      await this.session.session?.commitTransaction();
    } catch (error) {
      if (this.session.session) {
        await this.session.session.abortTransaction();
      }

      this.log.error(
        `Tries deleting options with ids ${optionIds.join(" ,")} but fails`,
        { action: "options_deletion" }
      );

      throw error;
    }
  }

  public async startTest(options?: { accessCode: string }) {
    try {
      const now = new Date();
      this.session?.session?.startTransaction();

      const student = await this.student.getStudentProfile({
        throwOn404: true,
      });

      const test = await this.getTest({
        throwOn404: true,
        addTeacher: true,
        query: { allowedStudents: { $in: [student?._id] }, _id: this.id },
        select: "+accessCode",
      });

      if (!test.isActive) {
        throw new Error(
          "START_TEST_ERROR: Unable to start this test because it's not active"
        );
      }

      //This test uses accessCode
      if (test?.accessCode?.code) {
        if (!options?.accessCode) {
          throw new Error(
            "START_TEST_ERROR: Access Code is required to start this test"
          );
        }

        if (options?.accessCode !== test?.accessCode?.code) {
          throw new Error(
            "START_TEST_ERROR: Invalid access code, if you believe this is an error please contact your teacher"
          );
        }

        const expiresAt = test.accessCode?.validUntil;

        if (!expiresAt || now > expiresAt) {
          throw new Error(
            "START_TEST_ERROR: Access Code Expired, Please contact your teacher."
          );
        }

        const studentsThatUseAccessCode = new Set(test.accessCode.students);

        if (
          !test.accessCode.allowReuse &&
          studentsThatUseAccessCode.has(student?._id as string)
        ) {
          throw new Error(
            "START_TEST_ERROR: looks like you have use this accessCode already and this test does not allow the reuse of accessCode"
          );
        }

        if (test.accessCode.usageCount >= test.accessCode.maxUsageCount!) {
          throw new Error(
            "START_TEST_ERROR: This test has reached it's max number of access code usage, Please contact the admin"
          );
        }

        await TestModel.findByIdAndUpdate(
          test._id,
          {
            $inc: { "accessCode.usageCount": 1 },
            $addToSet: { "accessCode.students": student?._id },
          },
          { session: this.session.session }
        );
      }

      const testAttempt = await TestAttempt.findOne({
        test: test._id,
        student: student?._id,
      });

      const studentInAnotherTest = await TestAttempt.exists({
        student: student?._id,
        status: "in-progress",
        test: { $ne: test?._id },
      });

      if (Boolean(studentInAnotherTest)) {
        throw new Error(
          `403: Unable to start this test because you already completed this test. : ${studentInAnotherTest?._id}`
        );
      }

      //Looks like this user has attempted this test before
      if (testAttempt && testAttempt?.status === "completed") {
        throw new Error(
          "START_TEST_ERROR: Unable to start this test because you already completed this test."
        );
      }

      if (testAttempt && testAttempt?.status === "in-progress") {
        const questions = await this.getTestQuestions(IRole.STUDENT);

        return questions;
      }

      const testAttemptPayload: ITestAttempt = {
        _id: new mongoose.Types.ObjectId().toString(),
        questionsAttempted: [],
        score: 0,
        startTime: new Date(),
        status: "in-progress",
        student: student?._id as string,
        studentLogs: [
          {
            action: "test_started",
            log: "Started test",
            user: student?._id as string,
          },
        ],
        teacherFeedback: "",
        test: test._id!,
      };

      const newTestAttempt = new TestAttempt(testAttemptPayload);

      const [_testAttempt] = await Promise.all([
        newTestAttempt.save({
          session: this.session.session,
        }),
      ]);

      //Start a workflow to submit the exam on timeUp.
      const questions = await this.getTestQuestions(IRole.STUDENT);

      await this.log.info(`User starts test ${test?._id}`, {
        action: "test_started",
      });

      await qstashClient.publishJSON({
        url: `${process.env.URL}/api/student/test/${test?._id}/submit`,
        body: {
          studentId: student?._id,
          testAttemptId: testAttemptPayload?._id,
        },
        delay: (test.settings?.timeLimit! + 2) * 60,
        retries: 1,
      });

      await this.session?.session?.commitTransaction();

      return questions;
    } catch (error) {
      if (this.session?.session) {
        await this.session?.session?.abortTransaction();
      }
      this.log.error(
        `Tries to start test with id ${this.id} but fails, Reason ${
          (error as Error).message
        }`
      );

      throw error;
    }
  }

  public async submitTest(studentId: string, testAttemptId: string) {
    try {
      this.session?.session?.startTransaction();

      this.log.logPayload = {
        ...(this.log.logPayload as ILogs),
        user: studentId,
      };

      const testAttempt = await TestAttempt.findById(testAttemptId).session(
        this.session.session
      );

      if (!testAttempt) {
        throw new Error("Could not find the test attempt with this Id");
      }

      if (testAttempt.status === "completed") {
        throw new Error("Test attempt has already been submitted");
      }

      const test = await this.getTest({
        query: { _id: this.id, allowedStudents: { $in: [studentId] } },
        throwOn404: true,
        select: "+secretKey",
      });

      const student = await this.student.getStudentProfile({
        throwOn404: true,
        query: { _id: studentId },
      });

      testAttempt.status = "completed";
      testAttempt.endTime = new Date();

      if (
        test?.settings?.showResultAtEnd &&
        test?.settings?.allowInternalSystemToGradeTest
      ) {
        //Calculate the score of the user
        await qstashClient.publishJSON({
          url: `${process.env.URL}/api/student/test/${test?._id}/grade-test/`,
          body: {
            secretKey: test?.secretKey,
            studentId,
          },
          delay: 5,
          retries: 3,
        });
      }

      testAttempt.studentLogs.push({
        action: "test_submitted",
        log: "Submitted test",
        user: student?._id as string,
      });

      await Promise.all([
        testAttempt.save({
          session: this.session?.session,
          validateModifiedOnly: true,
        }),
        this.log.info(`User submitted test ${test?._id}`, {
          action: "test_submitted",
        }),
      ]);

      await this.session?.session?.commitTransaction();
    } catch (error) {
      if (this.session?.session) {
        await this.session?.session?.abortTransaction();
      }

      this.log.error(
        `Tries to submit test with id ${this.id} but fails, Reason ${
          (error as Error).message
        }`
      );

      throw error;
    }
  }

  public async testGrader(studentId: string, secretKey: string) {
    try {
      this.session?.session?.startTransaction();

      if (!secretKey) {
        throw new Error(
          "You do not have the right permissions to access this service"
        );
      }

      const test = await this.getTest({
        throwOn404: true,
        query: { secretKey, _id: this.id },
      });

      if (!test) {
        throw new Error(
          "Test with the query not found or you don't have the right permissions to access this resource."
        );
      }

      const testAttempt = await TestAttempt.findOne({
        test: this.id,
        student: studentId,
        resultIsReady: false,
      }).populate("questionsAttempted.question");

      if (!testAttempt) {
        throw new Error("Could not find the test attempt with this Id");
      }

      if (testAttempt.status !== "completed") {
        throw new Error("Test attempt has not been submitted");
      }

      const questionsAttempted = testAttempt?.questionsAttempted; //Gotten the questions attempted by the student

      const questions = questionsAttempted?.map(
        (question) => question.question as IQuestion
      );

      const [questionOptions, questionAnswers] = await Promise.all([
        QuestionOption.find({
          question: { $in: questions.map((q) => q._id) },
          isCorrect: true,
        }),
        QuestionAnswer.find({
          question: { $in: questions.map((q) => q._id) },
        }),
      ]);

      const questionMap = new Map(
        questions.map((question) => [question._id, question])
      );

      const questionAnswerMap = new Map(
        questionAnswers?.map((answer) => [answer.question, answer])
      );

      const changeAttemptToCorrect = (questionId: string) => {
        testAttempt.questionsAttempted.map((question) =>
          question._id === questionId
            ? { ...question, isCorrect: true }
            : question
        );
      };

      questionsAttempted?.forEach((question) => {
        const _question = questionMap.get(question.question as string);

        let giveScore = false;

        switch (_question?.type) {
          case "boolean":
            //Check if the answer is correct using case insensitive match
            giveScore =
              String(_question.booleanAnswer).toLowerCase() ===
              String(question.answer)?.toLowerCase();

            break;
          case "mcq":
            const userAnswers = question.answer.split(",");

            //If the user did not answer any option
            if (!userAnswers.length) {
              giveScore = false;
              break;
            }

            const correctOptionIds = questionOptions.map((opt) =>
              opt._id.toString()
            );
            const allCorrectSelected = userAnswers.every((ans) =>
              correctOptionIds.includes(ans)
            );

            const noExtraSelected =
              userAnswers.length === correctOptionIds.length;

            if (allCorrectSelected && noExtraSelected) {
              giveScore = true;
            }

            break;
          case "obj":
            const userAnswer = question.answer;

            //If the user did not answer any option
            if (!userAnswer.length) {
              giveScore = false;
              break;
            }

            if (questionOptions[0]?._id === userAnswer) {
              giveScore = true;
            }

            break;
          case "long-answer":
            //Use levenstein distance to calculate the similarity between the user answer and the correct answer
            const similarity = distance(
              questionAnswerMap.get(question?._id!)?.answer!.toLowerCase()!,
              question.answer?.toLowerCase()!
            );

            const THRESHOLD = 2;

            if (similarity <= THRESHOLD) {
              giveScore = true;
            }

            break;
          case "short-answer":
            //Use levenstein distance to calculate the similarity between the user answer and the correct answer
            const similarityDistance = distance(
              questionAnswerMap.get(question?._id!)?.answer!.toLowerCase()!,
              question.answer?.toLowerCase()!
            );

            const SIMILARITYTHRESHOLD = 2;

            if (similarityDistance <= SIMILARITYTHRESHOLD) {
              giveScore = true;
            }
            break;
          default:
            break;
        }

        if (giveScore) {
          changeAttemptToCorrect(question._id!);
          testAttempt.score += questionMap.get(
            question.question as string
          )?.score!;
        }
      });

      testAttempt.resultIsReady = true;
      testAttempt.teacherFeedback = "";
      testAttempt.studentLogs.push({
        action: "test_graded",
        log: "Test was graded with Internal system, Please consider looking into the result",
        user: studentId,
        severity: "warning",
      });

      await testAttempt.save({
        session: this.session?.session,
        validateModifiedOnly: true,
      });

      await this.session?.session?.commitTransaction();
    } catch (error) {
      if (this.session?.session) {
        await this.session?.session?.abortTransaction();
      }
      await this.log.error(
        `Tries to grade test with id ${this.id} but fails, Reason ${
          (error as Error).message
        }`
      );
      throw error;
    }
  }

  public async markQuestionAsCorrect(
    questionId: string,
    testAttemptId: string
  ) {
    try {
      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
        toJson: true,
      });

      await this.getTest({
        throwOn404: true,
        query: { _id: this.id, teacher: teacher?._id },
      });

      const q = await this.getTestQuestionById(questionId, IRole.TEACHER);

      const testAttempt = await TestAttempt.findById(testAttemptId);

      if (!testAttempt) {
        throw new Error(
          "MARK_QUESTION_ERROR: unable to locate this test attempted by user"
        );
      }

      if (testAttempt.status !== "completed") {
        throw new Error("MARK_QUESTION_ERROR: Test attempt is not completed");
      }

      if (testAttempt.resultIsReady) {
        throw new Error(
          "You can no longer modify this student result anymore."
        );
      }

      const questionToMark = testAttempt.questionsAttempted.find(
        (attempt) => attempt.question.toString() === questionId
      );

      if (questionToMark?.isCorrect) {
        throw new Error("Question has already been mark as correct already");
      }

      if (!testAttempt.questionsAttempted.length) {
        testAttempt.questionsAttempted.push({
          answer: "teacher-marked-this-as-correct",
          isCorrect: true,
          question: questionId,
        });
      } else {
        testAttempt.questionsAttempted = testAttempt.questionsAttempted.map(
          (q) =>
            q.question.toString() === questionId ? { ...q, isCorrect: true } : q
        );
      }

      testAttempt.score += q?.score ?? 1;
      testAttempt.studentLogs.push({
        action: "mark_question",
        log: "Student got a question marked as correct",
        user: testAttempt?.student as string,
        severity: "info",
      });

      const updatedTestAttempted = await testAttempt?.save({
        session: this.session.session,
        validateModifiedOnly: true,
      });

      await this.log.info("Question marked successfully", {
        action: "mark_question",
      });

      await this.session?.session?.commitTransaction();

      return updatedTestAttempted;
    } catch (error) {
      if (this.session.session) {
        await this.session.session.abortTransaction();
      }

      this.log.error(
        `Tries to mark question but fails, Reason: ${(error as Error).message}`
      );

      throw error;
    }
  }

  public async attemptQuestion(question: string, answer: string) {
    try {
      this.session?.session?.startTransaction();

      const student = await this.student.getStudentProfile({
        throwOn404: true,
      });

      const test = await this.getTest({
        throwOn404: true,
        addTeacher: true,
        query: { allowedStudents: { $in: [student?._id] }, _id: this.id },
      });

      if (!test.isActive) {
        throw new Error(
          "START_TEST_ERROR: Unable to start this test because it's not active"
        );
      }

      const attemptedQuestion: IQuestionsAttempted = {
        answer,
        question,
        isCorrect: false,
      };

      const testAttempt = await TestAttempt.findOne({
        test: test._id,
        student: student?._id,
      });

      if (!testAttempt) {
        throw new Error(
          "ATTEMPTING_QUESTION_FAILED: Could not find the question of the query provided"
        );
      }

      const questionAlreadyExist = testAttempt?.questionsAttempted?.find(
        (q) => q.question.toString() === question
      );

      if (questionAlreadyExist && testAttempt?.questionsAttempted) {
        testAttempt.questionsAttempted = testAttempt?.questionsAttempted?.map(
          (q) => (q.question.toString() === question ? { ...q, answer } : q)
        );
      } else {
        testAttempt?.questionsAttempted.push(attemptedQuestion);
      }

      testAttempt?.studentLogs.push({
        action: "question_attempted",
        log: "User tries to attempt question",
        user: student?._id as string,
      });

      await this.log.info(`Question ${question} attempted successfully`, {
        action: "attempt_question",
      });

      const updatedAttemptedQuestion = await testAttempt?.save({
        validateModifiedOnly: true,
        session: this.session.session,
      });
      await this.session?.session?.commitTransaction();

      return updatedAttemptedQuestion?.questionsAttempted;
    } catch (error) {
      if (this.session?.session) {
        await this.session?.session?.abortTransaction();
      }

      await this.log.error(
        `Tries to attempt question but fails, Reason: ${
          (error as Error).message
        }`
      );

      throw error;
    }
  }

  public async getStudentAnalysisOnTest(
    student?: string,
    role: RoleTypes = IRole.TEACHER
  ) {
    let studentId = "";

    if (IRole.STUDENT === role) {
      const studentProfile = await this.student?.getStudentProfile({
        throwOn404: true,
      });
      studentId = studentProfile?._id as string;
    } else {
      if (!student) {
        throw new Error(
          "VALIDATION_ERROR: Student ID is required for analysis"
        );
      }
      studentId = student;
    }

    const test = await this.getTest({
      throwOn404: true,
      query: { allowedStudents: { $in: [studentId] } },
    });

    const testAttempt = await TestAttempt.findOne({
      test: test?._id,
      student: studentId,
      status: "completed",
    });

    if (!testAttempt) {
      throw new Error(
        "QUERY_FAILED: Could not find that student actually attempted this test."
      );
    }

    if (testAttempt.status !== "completed") {
      throw new Error(
        "ANALYSIS_ERROR: Cannot get the analysis of this test because it's not yet submitted"
      );
    }

    if (!testAttempt.resultIsReady && role === IRole.STUDENT) {
      throw new Error(
        "ANALYSIS_ERROR: Cannot get the analysis of this test because the result is not ready"
      );
    }

    // Get total possible score for the test
    const result = await Question.aggregate([
      { $match: { test: test._id } },
      { $group: { _id: null, totalScore: { $sum: "$score" } } },
    ]);

    const totalPossibleScore: number = result[0]?.totalScore || 0;

    // Get all questions with their details
    const allQuestions = await Question.find({ test: test._id })
      .select("_id question score type explanation hint media booleanAnswer")
      .lean();

    // Get all question options for MCQ and OBJ questions
    const questionIds = allQuestions.map((q) => q._id);
    const questionOptions = await QuestionOption.find({
      question: { $in: questionIds },
    }).lean();

    // Get all question answers for long-answer and short-answer questions
    const questionAnswers = await QuestionAnswer.find({
      question: { $in: questionIds },
    }).lean();

    // Create options map for easy lookup
    const optionsMap = questionOptions.reduce((acc, option) => {
      if (!acc[option.question.toString()]) {
        acc[option.question.toString()] = [];
      }
      acc[option.question.toString()].push(option);
      return acc;
    }, {} as Record<string, any[]>);

    const answersMap = questionAnswers.reduce((acc, answer) => {
      acc[answer.question.toString()] = answer.answer;
      return acc;
    }, {} as Record<string, string>);

    // Analyze student's performance per question
    const questionAnalysis = allQuestions.map((question) => {
      const attempt = testAttempt.questionsAttempted.find(
        (qa) => qa.question.toString() === question._id.toString()
      );

      let correctAnswer = null;
      let isCorrect = false;

      // Determine correct answer based on question type
      switch (question.type) {
        case "mcq":
          isCorrect = attempt?.isCorrect!;

          break;
        case "obj":
          const options = optionsMap[question._id.toString()] || [];
          const correctOption = options.find((opt) => opt.isCorrect);
          correctAnswer = correctOption?.option || null;
          isCorrect = attempt?.isCorrect!;
          break;
        case "boolean":
          correctAnswer = question.booleanAnswer;
          isCorrect = attempt?.isCorrect!;
          break;
        case "short-answer":
          correctAnswer = answersMap[question._id.toString()] || null;
          isCorrect = attempt?.isCorrect!;
        case "long-answer":
          correctAnswer = answersMap[question._id.toString()] || null;
          isCorrect = attempt?.isCorrect!;
          break;
      }

      return {
        questionId: question._id,
        question: question.question,
        type: question.type,
        maxScore: question.score,
        selectedAnswer: attempt?.answer || null,
        correctAnswer,
        isCorrect: isCorrect,
        scoreEarned: isCorrect ? question.score : 0,
        isAttempted: !!attempt,
        explanation: question.explanation,
        hint: question.hint,
        options:
          question.type === "mcq" || question.type === "obj"
            ? optionsMap[question._id.toString()] || []
            : null,
      };
    });

    // Calculate type-wise performance (since you don't have category/difficulty fields)
    const typePerformance = questionAnalysis.reduce((acc, qa) => {
      const type = qa.type;

      if (!acc[type]) {
        acc[type] = {
          totalQuestions: 0,
          correctAnswers: 0,
          totalScore: 0,
          earnedScore: 0,
          accuracy: 0,
        };
      }

      acc[type].totalQuestions++;
      acc[type].totalScore += qa.maxScore;
      acc[type].earnedScore += qa.scoreEarned;

      if (qa.isCorrect) {
        acc[type].correctAnswers++;
      }

      acc[type].accuracy =
        (acc[type].correctAnswers / acc[type].totalQuestions) * 100;

      return acc;
    }, {} as Record<string, any>);

    // Overall statistics
    const totalQuestionsAttempted = testAttempt.questionsAttempted.length;
    const correctAnswers = questionAnalysis.filter((qa) => qa.isCorrect).length;
    const totalQuestions = allQuestions.length;
    const accuracy =
      totalQuestions > 0 ? (correctAnswers / totalQuestions) * 100 : 0;
    const completionRate =
      totalQuestions > 0 ? (totalQuestionsAttempted / totalQuestions) * 100 : 0;
    const scorePercentage =
      totalPossibleScore > 0
        ? (testAttempt.score / totalPossibleScore) * 100
        : 0;

    // Performance grade
    let grade = "F";
    let performance = "Poor";

    if (scorePercentage >= 90) {
      grade = "A+";
      performance = "Excellent";
    } else if (scorePercentage >= 80) {
      grade = "A";
      performance = "Very Good";
    } else if (scorePercentage >= 70) {
      grade = "B";
      performance = "Good";
    } else if (scorePercentage >= 60) {
      grade = "C";
      performance = "Average";
    } else if (scorePercentage >= 50) {
      grade = "D";
      performance = "Below Average";
    }

    // Strengths and weaknesses based on question types
    const strengths = Object.entries(typePerformance)
      .filter(([_, perf]: [string, any]) => perf.accuracy >= 70)
      .map(([type, _]) => type);

    const weaknesses = Object.entries(typePerformance)
      .filter(([_, perf]: [string, any]) => perf.accuracy < 50)
      .map(([type, _]) => type);

    // Recommendations based on question types
    const recommendations = [];
    if (accuracy < 60) {
      recommendations.push(
        "Focus on understanding fundamental concepts before attempting advanced questions"
      );
    }
    if (completionRate < 80) {
      recommendations.push(
        "Ensure to attempt all questions within the given time limit"
      );
    }

    // Type-specific recommendations
    if (typePerformance["mcq"]?.accuracy < 50) {
      recommendations.push(
        "Practice more multiple choice questions and work on elimination techniques"
      );
    }
    if (typePerformance["obj"]?.accuracy < 50) {
      recommendations.push(
        "Focus on objective questions and factual knowledge"
      );
    }
    if (typePerformance["boolean"]?.accuracy < 50) {
      recommendations.push(
        "Review true/false concepts and avoid common misconceptions"
      );
    }
    if (typePerformance["short-answer"]?.accuracy < 50) {
      recommendations.push(
        "Work on concise and accurate short answer responses"
      );
    }
    if (typePerformance["long-answer"]?.accuracy < 50) {
      recommendations.push(
        "Practice detailed explanations and structured long-form answers"
      );
    }

    if (strengths.length > 0) {
      recommendations.push(
        `Continue strengthening your performance in: ${strengths.join(
          ", "
        )} questions`
      );
    }

    // Calculate time-based metrics (if available in logs)
    const testStartTime = testAttempt.startTime;
    const testEndTime = testAttempt.endTime;
    const totalTimeTaken =
      testEndTime && testStartTime
        ? Math.round(
            (testEndTime.getTime() - testStartTime.getTime()) / 1000 / 60
          ) // in minutes
        : null;

    // Log the analysis request
    await this.log.info(
      `Generated analysis for student ${studentId} on test ${test._id}`,
      {
        action: "analysis_generated",
      }
    );

    return {
      success: true,
      message: "Student analysis generated successfully",
      data: {
        // Test Attempt Information
        attemptInfo: {
          id: testAttempt._id,
          startTime: testAttempt.startTime,
          endTime: testAttempt.endTime,
          status: testAttempt.status,
          totalTimeTaken: totalTimeTaken,
          resultIsReady: testAttempt.resultIsReady,
        },

        // Overall Performance
        overallPerformance: {
          score: testAttempt.score,
          totalPossibleScore,
          scorePercentage: Math.round(scorePercentage * 100) / 100,
          grade,
          performance,
          accuracy: Math.round(accuracy * 100) / 100,
          completionRate: Math.round(completionRate * 100) / 100,
          totalQuestionsAttempted,
          correctAnswers,
          incorrectAnswers: totalQuestionsAttempted - correctAnswers,
          unattemptedQuestions: totalQuestions - totalQuestionsAttempted,
        },

        // Detailed Analysis
        questionAnalysis,
        typePerformance, // Changed from categoryPerformance

        // Insights
        insights: {
          strengths,
          weaknesses,
          recommendations,
        },

        // Teacher Feedback (if available)
        teacherFeedback: testAttempt.teacherFeedback || null,

        // Student Logs
        studentLogs: role === IRole.TEACHER ? testAttempt.studentLogs : [],

        // Generated timestamp
        generatedAt: new Date(),
      },
    };
  }

  public async markTestAsResultsAreReady(
    studentIds?: string[],
    notifyViaEmail = false,
    allStudent = false
  ) {
    try {
      this.session?.session?.startTransaction();

      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
      });

      const test = await this.getTest({
        throwOn404: true,
        query: { teacher: teacher?._id, _id: this.id },
        select: "+allowedStudents",
      });

      // Determine which students to update
      let targetStudentIds: string[];
      if (allStudent) {
        targetStudentIds = test.allowedStudents as string[];
      } else if (!!studentIds?.length) {
        targetStudentIds = studentIds;
      } else {
        throw new Error("No students specified for result notification");
      }

      // Update test attempts
      const testAttempts = await TestAttempt.updateMany(
        {
          test: test._id,
          student: { $in: targetStudentIds },
          resultIsReady: false,
        },
        {
          $set: {
            resultIsReady: true,
          },
          $push: {
            studentLogs: {
              action: "result_ready",
              log: "Result is ready",
              severity: "info",
              user: teacher?._id,
              timestamp: new Date(),
            },
          },
        },
        {
          session: this.session.session!,
          runValidators: true,
        }
      );

      if (testAttempts.modifiedCount === 0) {
        throw new Error("TEST_ATTEMPT_QUERY_ERROR: No test attempts found");
      }

      if (notifyViaEmail) {
        await this.sendResultNotificationEmails(targetStudentIds, test);
      }

      await this.log.info(
        `Successfully marked test results as ready for ${testAttempts.modifiedCount} attempts`
      );
      await this.session.session?.commitTransaction();
    } catch (error) {
      // Rollback transaction on error
      if (this?.session?.session) {
        await this?.session.session.abortTransaction();
      }

      await this.log.error(
        `Failed to mark test as result ready. Reason: ${
          (error as Error).message
        }`
      );

      throw error;
    }
  }

  private async sendResultNotificationEmails(studentIds: string[], test: any) {
    try {
      const students = await StudentModel.find({
        _id: { $in: studentIds },
      }).populate("user");

      // Filter out students without valid email addresses
      const validEmails = students
        .map((student) => (student.user as IUser)?.email)
        .filter((email): email is string => Boolean(email));

      if (validEmails.length === 0) {
        await this.log.warning("No valid email addresses found for students");
        return;
      }

      const emailTemplate = `<div style="font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 5px;">
        <h2 style="color: #2c3e50; text-align: center;">Your Test Results Are Ready! 📝</h2>
        
        <div style="background-color: #f8f9fa; border-radius: 8px; padding: 20px; margin: 20px 0;">
          <p style="color: #34495e; font-size: 16px; line-height: 1.6;">
            Hello,
          </p>
          <p style="color: #34495e; font-size: 16px; line-height: 1.6;">
            We're excited to inform you that your test results are now available! You can view your detailed results by logging into your account.
          </p>
          
          <div style="text-align: center; margin: 30px 0;">
            <a href="${process.env.URL}/test/${test?._id}/results" 
               style="background-color: #3498db; 
                      color: white; 
                      padding: 12px 24px; 
                      text-decoration: none; 
                      border-radius: 4px;
                      font-weight: bold;
                      display: inline-block;">
              View My Results
            </a>
          </div>
          
          <p style="color: #34495e; font-size: 16px; line-height: 1.6;">
            If you have any questions about your results, please don't hesitate to contact your teacher.
          </p>
        </div>
        
        <div style="text-align: center; color: #7f8c8d; font-size: 14px; margin-top: 30px;">
          <p>This is an automated message, please do not reply to this email.</p>
        </div>
      </div>`;

      await qstashClient.publishJSON({
        url: `${process.env.URL}/api/email/send`,
        body: {
          emails: validEmails,
          subject: "Your Test Results Are Ready!",
          emailTemplate,
        },
        delay: 10,
      });

      await this.log.info(
        `Queued result notification emails for ${validEmails.length} students`
      );
    } catch (error) {
      await this.log.error(
        `Failed to send email notifications: ${(error as Error).message}`
      );
      // Don't throw here - email failure shouldn't break the main operation
    }
  }

  async queueEmailToSend(
    emails: string[],
    emailTemplate: string,
    subject = ""
  ) {
    for (const email of emails) {
      await sendEmail({ emails: [email], email: emailTemplate, subject });
    }
  }

  async modifyTestAttempt(
    testAttemptId: string,
    updates: Partial<ITestAttempt>
  ) {
    try {
      const testAttempt = await TestAttempt.findById(testAttemptId);

      if (!testAttempt) {
        throw new Error(
          "Could not find the test attempt with the Id you provide"
        );
      }

      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
      });

      await this.getTest({
        query: { _id: testAttempt.test, teacher: teacher?._id },
        throwOn404: true,
      });

      testAttempt.score = updates.score || testAttempt?.score;
      testAttempt.teacherFeedback =
        updates.teacherFeedback || testAttempt?.teacherFeedback;
      testAttempt.status = updates.status || testAttempt?.status;

      const updatedTestAttempt = await testAttempt.save({
        session: this.session.session,
        validateModifiedOnly: true,
      });

      return updatedTestAttempt;
    } catch (error) {
      if (this.session.session) {
        await this.session?.session?.abortTransaction();
      }

      await this.log.error(
        `Tries to modify test attempt with Id ${testAttemptId} but fails, Reason ${
          (error as Error).message
        }`
      );

      throw error;
    }
  }

  public async getTestAttempts(options?: {
    limit?: number;
    offset?: number;
    sortKey?: string;
    sort?: "asc" | "desc";
    query?: string;
    studentId?: string;
  }) {
    try {
      let targetStudentId = "";

      if (!options?.studentId) {
        const student = await this.student.getStudentProfile({
          throwOn404: true,
        });

        targetStudentId = student?._id as string;
      } else {
        targetStudentId = options?.studentId!;
      }

      const queryCondition = options?.query
        ? {
            $or: [{ status: { $regex: options.query, $options: "i" } }],
          }
        : {};

      const sortDirection = options?.sort === "asc" ? 1 : -1;

      const [testAttempts, filterTestAttemptsCount, totalTestAttempts] =
        await Promise.all([
          TestAttempt.find(
            { ...queryCondition, student: targetStudentId },
            {
              status: 1,
              score: 1,
              test: 1,
              createdAt: 1,
              resultIsReady: 1,
            }
          )
            .populate({
              path: "test",
              select: "title instructions subject isActive",
            })
            .sort({ [options?.sortKey || "createdAt"]: sortDirection })
            .skip(options?.offset || 0)
            .limit(options?.limit || 10)
            .exec(),
          TestAttempt.countDocuments({
            ...queryCondition,
            student: targetStudentId,
          }),
          TestModel.countDocuments(),
        ]);

      return {
        testAttempts,
        filterTestAttemptsCount,
        pagination: {
          limit: options?.limit || 10,
          offset: options?.offset || 0,
          total: totalTestAttempts,
        },
      };
    } catch (error) {
      throw error;
    }
  }

  public async getTestAttemptId(id: string, role?: RoleTypes) {
    const selections =
      role === IRole.STUDENT
        ? "-allowedStudents -accessCode"
        : "+allowedStudents";

    const testAttempt = await TestAttempt.findById(id).populate({
      path: "test",
      select: selections,
    });

    if (!testAttempt) {
      throw new Error("Test Attempt with this Id not found");
    }

    const test = testAttempt.test as ITest;

    if (role === IRole.STUDENT) {
      const student = await this.student.getStudentProfile({
        throwOn404: true,
      });

      //@ts-ignore
      if (!test.allowedStudents.includes(student?._id?.toString())) {
        throw new Error(
          "You do not have the right permissions to view this test attempt"
        );
      }
    } else {
      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
      });

      if (test.teacher?.toString() !== teacher?._id?.toString()) {
        throw new Error(
          "You do not have the right permissions to view this test attempt"
        );
      }
    }

    return testAttempt;
  }

  public async getOngoingTests() {
    const teacher = await this.teacher?.getTeacherProfile({
      throwOn404: true,
    });

    const activeTests = await TestModel.find(
      {
        isActive: true,
        teacher: teacher?._id,
      },
      { allowedStudents: 1, title: 1, subject: 1 }
    )
      .limit(3)
      .sort({ createdAt: -1 })
      .populate("subject")
      .exec();

    // Get submission counts for each test individually
    const testsWithSubmissions = await Promise.all(
      activeTests.map(async (test) => {
        const submissionCount = await TestAttempt.countDocuments({
          test: test._id,
          status: "completed",
        });

        return {
          _id: test._id,
          title: test.title,
          subject: (test.subject as ISubject)?.name,
          totalAllowedStudents: test.allowedStudents?.length || 0,
          totalSubmitted: submissionCount,
          submissionRate: test.allowedStudents?.length
            ? ((submissionCount / test.allowedStudents.length) * 100).toFixed(
                1
              ) + "%"
            : "0%",
        };
      })
    );

    // Calculate overall statistics
    const totalOngoingTests = activeTests.length;
    const totalSubmissionsAcrossAllTests = testsWithSubmissions.reduce(
      (sum, test) => sum + test.totalSubmitted,
      0
    );
    const totalAllowedStudentsAcrossAllTests = testsWithSubmissions.reduce(
      (sum, test) => sum + test.totalAllowedStudents,
      0
    );

    return {
      totalOngoingTests,
      totalSubmissionsAcrossAllTests,
      totalAllowedStudentsAcrossAllTests,
      overallSubmissionRate: totalAllowedStudentsAcrossAllTests
        ? (
            (totalSubmissionsAcrossAllTests /
              totalAllowedStudentsAcrossAllTests) *
            100
          ).toFixed(1) + "%"
        : "0%",
      tests: testsWithSubmissions,
    };
  }

  public async getRecentSubmissions() {
    try {
      const teacher = await this.teacher?.getTeacherProfile({
        throwOn404: true,
        toJson: true,
      });

      const test = await TestModel.findOne({
        teacher: teacher?._id,
      }).sort({ createdAt: -1 });

      const testAttempts = await TestAttempt.find({
        test: test?._id,
        status: "completed",
      })
        .populate({
          path: "student",
          populate: {
            path: "user",
            select: "name email profilePicture createdAt",
          },
        })
        .sort({ createdAt: -1 })
        .limit(8);

      return testAttempts;
    } catch (error) {
      throw error;
    }
  }
}
