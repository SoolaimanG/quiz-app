//import { IRole } from "@/models/users.model";
import z from "zod";

const loginSchema = z.object({
  identifier: z.string().min(4),
  password: z.string().min(8),
  role: z.enum(["TEACHER", "STUDENT", "ADMIN"]),
});

export default loginSchema;
