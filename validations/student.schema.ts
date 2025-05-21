import { z } from "zod";

const updateStudentSchema = z.object({
  contact: z
    .string()
    .refine(
      (contact) => {
        return contact?.startsWith("+234") || contact?.startsWith("0");
      },
      { message: "Please enter a valid phone number" }
    )
    .optional(),
  dob: z
    .date()
    .refine((dob) => dob && dob < new Date(2017, 0, 0, 0, 0), {
      message: "Your date of birth must be a previous date",
    })
    .optional(),
});

export { updateStudentSchema };
