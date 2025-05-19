import { z } from "zod";

const accountCreationInvitationSchema = z
  .array(
    z.object({
      accountCreated: z.boolean().default(false),
      email: z.string().email(),
      role: z.enum(["TEACHER", "STUDENT"]),
      expiresAt: z.date().optional(),
    })
  )
  .min(1);

export default accountCreationInvitationSchema;
