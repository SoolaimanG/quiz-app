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

export { questionCreationSchema, optionCreationSchema };
