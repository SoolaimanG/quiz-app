import { isValidObjectId } from "mongoose";
import { z } from "zod";

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
});

export { questionCreationSchema };
