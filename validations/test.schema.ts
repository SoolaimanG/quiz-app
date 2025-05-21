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
    .min(1),
  description: z.string().min(10).max(500),
  instructions: z.string().min(10).max(500),
  isActive: z.boolean().default(true),
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
        .optional(),
    })
    .optional(),
  subject: z
    .string()
    .refine((value) => isValidObjectId(value))
    .optional(),
  title: z.string().optional(),
});

export { createTestSchema, updateTestSchema };
