import { ITimeStamp, IUser } from "./index.types";

export interface IForgetPassword extends ITimeStamp {
  user: string | IUser;
  resetToken: string;
  expiresAt: Date | string;
}
