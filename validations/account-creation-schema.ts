import { z } from "zod";

const accountCreationSchema = z.object({
  identifier: z.string().min(4),
  email: z.string().email(),
  name: z
    .string()
    .min(4)
    .refine(
      (value) => {
        const nameParts = value.trim().split(" ");
        return (
          nameParts.length >= 2 &&
          nameParts[0].length > 0 &&
          nameParts[1].length > 0
        );
      },
      {
        message: "Please provide both first name and last name",
      }
    ),
  password: z.string().min(4),
  subjects: z.array(z.string()).optional(),
  type: z.enum(["STUDENT", "TEACHER"]),
});

export default accountCreationSchema;
