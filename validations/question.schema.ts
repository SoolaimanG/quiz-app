import { z } from "zod";

const optionCreationSchema = z
  .array(
    z.object({
      isCorrect: z.boolean().default(false),
      media: z
        .object({
          type: z.enum(["image"]).default("image"),
          url: z.string().refine((url) => url.startsWith("https")),
        })
        .optional(),
      option: z.string().min(1),
    })
  )
  .optional();

const questionCreationSchema = z.object({
  booleanAnswer: z.boolean().default(false),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  media: z
    .object({
      type: z.enum(["image"]),
      url: z.string(),
    })
    .optional(),
  question: z.string().min(3).max(255),
  score: z.number().default(0),
  type: z.enum(["mcq", "boolean", "short-answer", "long-answer", "obj"]),
  options: optionCreationSchema,
});

const updateQuestionSchema = z.object({
  booleanAnswer: z.boolean().optional(),
  explanation: z.string().optional(),
  hint: z.string().optional(),
  media: z
    .object({
      type: z.enum(["image"]),
      url: z.string(),
    })
    .optional(),
  question: z.string().min(3).max(255).optional(),
  score: z.number().optional(),
  type: z
    .enum(["mcq", "boolean", "short-answer", "long-answer", "obj"], {
      message: "Please select a valid question type",
      invalid_type_error: "Please select a valid question type",
    })
    .optional(),
});

const updateOptionSchema = z.object({
  isCorrect: z.boolean().optional(),
  media: z
    .object({
      type: z.enum(["image"]),
      url: z.string(),
    })
    .optional(),
  option: z.string().min(1).optional(),
});

export {
  questionCreationSchema,
  optionCreationSchema,
  updateQuestionSchema,
  updateOptionSchema,
};
