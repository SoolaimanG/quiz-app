import { ITest, ITestAccessCode, ITestSettings } from "@/types/index.types";
import { model, Model, models, Schema } from "mongoose";
import { Student } from "./student.model";
import { Subject } from "./subjects.model";
import { Question, QuestionAnswer, QuestionOption } from "./question.model";
import { random } from "@/server/_libs";

const TestSettingSchema = new Schema<ITestSettings>(
  {
    endNote: {
      type: String,
      min: 10,
      max: 255,
    },
    showNavigation: {
      type: Boolean,
      default: false,
    },
    lockDownBrowser: {
      type: Boolean,
      default: true,
    },
    preventCopyPaste: {
      type: Boolean,
      default: true,
    },
    preventPrint: {
      type: Boolean,
      default: true,
    },
    preventScreenCapture: {
      type: Boolean,
      default: true,
    },
    screenRecordSession: {
      type: Boolean,
      default: true,
    },
    showCorrectAnswers: {
      type: Boolean,
      default: true,
    },
    showProgress: {
      type: Boolean,
      default: true,
    },
    showRemainingTime: {
      type: Boolean,
      default: true,
    },
    showResultAtEnd: {
      type: Boolean,
      default: true,
    },
    showSubmitButton: {
      type: Boolean,
      default: true,
    },
    timeLimit: {
      type: Number,
      default: 60,
    },
    shuffleOptions: {
      type: Boolean,
      default: true,
    },
    submitOnPageLeave: {
      type: Boolean,
      default: true,
    },
    allowInternalSystemToGradeTest: {
      type: Boolean,
      default: false,
    },
  },
  { _id: false }
);

const TestAccessCode = new Schema<ITestAccessCode>(
  {
    allowReuse: {
      type: Boolean,
      default: false,
    },
    code: {
      type: String,
      required: true,
      min: 10,
      max: 255,
    },
    maxUsageCount: {
      type: Number,
      default: 5,
    },
    usageCount: {
      type: Number,
      default: 0,
    },
    students: {
      type: [{ type: Schema.Types.ObjectId, ref: "Student" }],
      default: [],
    },
  },
  { _id: false }
);

const TestSchema = new Schema<ITest>({
  accessCode: { type: TestAccessCode },
  allowedStudents: {
    type: [{ type: Schema.Types.ObjectId, ref: "Student", required: true }],
    validate: {
      validator: async function (v: string[]) {
        const studentsThatOfferSubject = await Student.countDocuments({
          subjects: {
            $in: this.subject,
          },
          _id: { $in: v },
        });

        return studentsThatOfferSubject === v.length;
      },
      message: "At least one student is not offering your subject",
    },
  },
  description: { type: String, required: true, min: 10, max: 255 },
  instructions: { type: String, required: true, min: 10, max: 255 },
  settings: { type: TestSettingSchema },
  teacher: { type: Schema.Types.ObjectId, ref: "Teacher", required: true },
  title: { type: String, required: true, min: 3, max: 100 },
  subject: {
    type: Schema.Types.ObjectId,
    ref: "Subject",
    required: true,
    validate: {
      validator: async function (v: string) {
        const teacherSubjects = await Subject.exists({
          _id: v,
          teachers: {
            $in: this.teacher,
          },
        });

        return Boolean(teacherSubjects);
      },
      message:
        "You must be teaching this subject before you can create a test for it",
    },
  },
  isActive: {
    type: Boolean,
    default: false,
  },
  secretKey: {
    select: false,
    type: String,
    default: random(16),
  },
});

TestSchema.pre("save", async function (nxt) {
  try {
    // Only proceed if isActive is modified and set to true
    if (
      this.isModified("isActive") &&
      this.isActive &&
      this.settings?.showResultAtEnd
    ) {
      const ERROR_MESSAGE =
        "You set this test to show result at the end and a question is still missing an answer, Please provide an answer.";

      // Get all questions for this test in a single query
      const allTestQuestions = await Question.find(
        { test: this._id },
        { _id: 1, type: 1 }
      );

      // Exit early if no questions
      if (!allTestQuestions.length) return nxt();

      // Group questions by type for batch processing
      const objMcqQuestions: string[] = [];
      const essayQuestions: string[] = [];

      allTestQuestions.forEach((question) => {
        if (question.type === "obj" || question.type === "mcq") {
          objMcqQuestions.push(question._id);
        } else if (
          question.type === "short-answer" ||
          question.type === "long-answer"
        ) {
          essayQuestions.push(question._id);
        }
      });

      // Process objective/MCQ questions (if any)
      if (objMcqQuestions.length > 0) {
        // Get counts for each question in one aggregate query
        const objResults = await QuestionOption.aggregate([
          {
            $match: {
              question: { $in: objMcqQuestions },
              isCorrect: true,
            },
          },
          {
            $group: {
              _id: "$question",
              count: { $sum: 1 },
            },
          },
        ]);

        // Create a map for quick lookup of results
        const questionCountMap: Record<string, any> = {};
        objResults.forEach((result) => {
          questionCountMap[result._id.toString()] = result.count;
        });

        // Check if any question doesn't have the required number of correct options
        for (const question of allTestQuestions) {
          if (question.type === "obj" || question.type === "mcq") {
            const compareCount = question.type === "obj" ? 0 : 1;
            const count = questionCountMap[question._id.toString()] || 0;

            if (count <= compareCount) {
              return nxt(new Error(ERROR_MESSAGE));
            }
          }
        }
      }

      // Process essay questions (if any)
      if (essayQuestions.length > 0) {
        // Get counts for each question in one aggregate query
        const answerResults = await QuestionAnswer.aggregate([
          {
            $match: {
              question: { $in: essayQuestions },
              answer: { $gte: 3 },
            },
          },
          {
            $group: {
              _id: "$question",
              count: { $sum: 1 },
            },
          },
        ]);

        // Create a map for quick lookup
        const answerCountMap: Record<string, any> = {};
        answerResults.forEach((result) => {
          answerCountMap[result._id.toString()] = result.count;
        });

        // Check if any question doesn't have an answer
        for (const question of allTestQuestions) {
          if (
            question.type === "short-answer" ||
            question.type === "long-answer"
          ) {
            const count = answerCountMap[question._id.toString()] || 0;

            if (count <= 0) {
              return nxt(new Error(ERROR_MESSAGE));
            }
          }
        }
      }
    }

    // If we reach here, all validations passed
    nxt();
  } catch (error) {
    nxt(error as Error);
  }
});

export const Test: Model<ITest> = models.Test ?? model("Test", TestSchema);
