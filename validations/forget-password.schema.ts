import { z } from "zod";

const requestPasswordReset = z.object({
  identifier: z.string().min(3),
});

const resetPassword = z.object({
  newPassword: z.string(),
});

export { requestPasswordReset, resetPassword };
