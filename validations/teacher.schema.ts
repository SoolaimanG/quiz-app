import { isValidObjectId } from "mongoose";
import { z } from "zod";

const teacherUpdatesSchema = z.object({
  id: z.string().refine(
    (value) => {
      return isValidObjectId(value);
    },
    { message: "Please use a valid Id" }
  ),
  canCreateTest: z.boolean().optional(),
  canGradeTest: z.boolean().optional(),
  students: z
    .array(
      z.string().refine(
        (value) => {
          return isValidObjectId(value);
        },
        { message: "Please use a valid Id" }
      )
    )
    .optional(),
  subjects: z
    .array(
      z.string().refine(
        (value) => {
          return isValidObjectId(value);
        },
        { message: "Please use a valid Id" }
      )
    )
    .optional(),
});

const teacherUpdatesSchemaForTeacher = z
  .array(
    z.string().refine(
      (value) => {
        return isValidObjectId(value);
      },
      { message: "Please use a valid Id" }
    )
  )
  .min(1);

export { teacherUpdatesSchema, teacherUpdatesSchemaForTeacher };
