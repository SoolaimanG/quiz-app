import { z } from "zod";
import { isValidObjectId } from "mongoose";

const subjectCreationSchema = z.object({
  teachers: z.array(z.string()).min(1),
  name: z.string().min(3),
  description: z.string().min(10),
});

const subjectCreationSchemaWithId = z.array(
  z.string().refine(
    (value) => {
      return isValidObjectId(value);
    },
    { message: "Please use a valid Id" }
  )
);

export { subjectCreationSchema, subjectCreationSchemaWithId };
