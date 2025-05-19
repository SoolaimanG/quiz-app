import { IRole, ITimeStamp } from "./index.types";

export interface IAccountCreationInvite extends ITimeStamp {
  email: string;
  expiresAt: string;
  role: Exclude<IRole, "ADMIN">;
  accountCreated: boolean;

  checkInvitation?: (message?: string) => Promise<void>;
}
