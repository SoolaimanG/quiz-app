import { z } from "zod";

const userSchema = z.object({
  email: z.string().email().optional(),
  gender: z.enum(["MALE", "FEMALE"]).optional(),
  name: z
    .string()
    .optional()
    .refine(
      (value) => {
        const nameParts = value?.trim()?.split(" ");
        return (
          nameParts?.length! >= 2 &&
          nameParts?.[0].length! > 0 &&
          nameParts?.[1].length! > 0
        );
      },
      {
        message: "Please provide both first name and last name",
      }
    ),
  profilePicture: z.string().url().optional(),
});

export default userSchema;
