import { IMedia } from "@/types/index.types";
import { isValidObjectId } from "mongoose";
import { z } from "zod";

const createTestSchema = z.object({
  accessCode: z
    .object({
      allowReuse: z.boolean().optional().default(true),
      code: z.string().max(8),
      maxUsageCount: z.number().default(10),
      students: z.array(
        z.string().refine((value) => {
          return isValidObjectId(value);
        })
      ),
      usageCount: z.number().default(0),
      validUntil: z.date().default(new Date(new Date().getDate() + 5)),
    })
    .optional(),
  allowedStudents: z
    .array(z.string().refine((value) => isValidObjectId(value)))
    .optional(),
  description: z.string().min(10).max(500),
  instructions: z.string().min(10).max(500),
  isActive: z.boolean().default(true).optional(),
  settings: z
    .object({
      endNote: z.string().optional(),
      lockDownBrowser: z.boolean().default(true),
      preventCopyPaste: z.boolean().default(true),
      preventPrint: z.boolean().default(true),
      preventScreenCapture: z.boolean().default(true),
      screenRecordSession: z.boolean().default(true),
      showCorrectAnswers: z.boolean().default(false),
      showNavigation: z.boolean().default(true),
      showProgress: z.boolean().default(true),
      showRemainingTime: z.boolean().default(true),
      showResultAtEnd: z.boolean().default(false),
      showSubmitButton: z.boolean().default(true),
      shuffleOptions: z.boolean().default(true),
      shuffleQuestions: z.boolean().default(true),
      submitOnPageLeave: z.boolean().default(true),
      timeLimit: z
        .number({
          message: "Time is required, please provide a time in minute",
        })
        .min(5)
        .max(180),
    })
    .optional(),
  subject: z.string().refine((value) => isValidObjectId(value)),
  title: z.string().min(3).max(100),
  media: z
    .object({
      url: z.string().url(),
      publicId: z.string().optional(),
      type: z.enum(["image", "document"]),
    })
    .optional(),
});

const updateTestSchema = z.object({
  accessCode: z
    .object({
      allowReuse: z.boolean().optional().default(true),
      code: z.string().max(8),
      maxUsageCount: z.number().default(10),
      students: z.array(
        z.string().refine((value) => {
          return isValidObjectId(value);
        })
      ),
      usageCount: z.number().default(0),
      validUntil: z.date().default(new Date(new Date().getDate() + 5)),
    })
    .optional(),
  allowedStudents: z
    .array(z.string().refine((value) => isValidObjectId(value)))
    .optional(),
  description: z.string().optional(),
  instructions: z.string().optional(),
  settings: z
    .object({
      endNote: z.string().optional(),
      lockDownBrowser: z.boolean().optional(),
      preventCopyPaste: z.boolean().optional(),
      preventPrint: z.boolean().optional(),
      preventScreenCapture: z.boolean().optional(),
      screenRecordSession: z.boolean().optional(),
      showCorrectAnswers: z.boolean().optional(),
      showNavigation: z.boolean().optional(),
      showProgress: z.boolean().optional(),
      showRemainingTime: z.boolean().optional(),
      showResultAtEnd: z.boolean().optional(),
      showSubmitButton: z.boolean().optional(),
      shuffleOptions: z.boolean().optional(),
      shuffleQuestions: z.boolean().optional(),
      submitOnPageLeave: z.boolean().optional(),
      timeLimit: z
        .number({
          message: "Time is required, please provide a time in minute",
        })
        .optional(),
      allowInternalSystemToGradeTest: z.boolean().optional(),
    })
    .optional(),
  subject: z
    .string()
    .refine((value) => isValidObjectId(value))
    .optional(),
  title: z.string().optional(),
});

const startTestSchema = z.object({
  accessCode: z.string().min(2).optional(),
});

const gradeTestSchema = z.object({
  studentId: z.string().refine((value) => isValidObjectId(value)),
  secretKey: z.string().min(10),
});

const attemptQuestionSchema = z.object({
  question: z.string().refine((value) => isValidObjectId(value)),
  answer: z.string().refine((value) => isValidObjectId(value)),
});

const markQuestionAsCorrectSchema = z.object({
  testAttemptId: z.string().refine((value) => isValidObjectId(value)),
});

const markTestAsResultsAreReadySchema = z.object({
  studentIds: z
    .array(z.string().refine((value) => isValidObjectId(value)))
    .optional(),
  notifyViaEmail: z.boolean().default(false),
  allStudent: z.boolean().default(false),
});

const testAttemptUpdateSchema = z.object({
  score: z.number().optional(),
  status: z.enum(["in-progress", "completed", "not-started"]).optional(),
  teacherFeedback: z.string().optional(),
  testAttemptId: z.string().refine((value) => isValidObjectId(value)),
});

const questionAnswerSchema = z.object({
  answerId: z
    .string()
    .refine((value) => isValidObjectId(value))
    .optional(),
  answer: z.string().optional(),
});

export {
  createTestSchema,
  updateTestSchema,
  startTestSchema,
  attemptQuestionSchema,
  gradeTestSchema,
  markQuestionAsCorrectSchema,
  markTestAsResultsAreReadySchema,
  testAttemptUpdateSchema,
  questionAnswerSchema,
};
