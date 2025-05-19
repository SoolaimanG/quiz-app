import { _CONSTANTS } from "@/lib/constants";
import { findUserBySessionToken, IRole } from "@/models/users.model";
import { NextRequest } from "next/server";
import { Document } from "mongoose";
import { IApiResponse, IUser } from "@/types/index.types";
import { connectToDatabase } from "@/server/_libs";
import { Log } from "@/server/services";

const unauthenticatedResponse = (
  message = "You are not authorize to make this request.",
  status = false,
  statusCode = 401
): IApiResponse => {
  return {
    data: "",
    message,
    status,
    statusCode,
  };
};

// isAuthentication function to check if a user is authenticated
export const isAuthenticated = async (
  req: NextRequest,
  roleAccess?: IRole
): Promise<{
  user?: Document<unknown, {}, IUser> & IUser;
  res: IApiResponse;
}> => {
  // Validate token existence and format
  const token = req.cookies.get(_CONSTANTS.AUTH_HEADER)?.value;

  if (!token) {
    return { res: unauthenticatedResponse() };
  }

  await connectToDatabase();

  const user = await findUserBySessionToken(token).select("+authentication");

  if (!user) {
    return { res: unauthenticatedResponse() };
  }

  const log = new Log(user.identifier);

  // Check token expiration
  const now = new Date();
  const expirationDate = user.authentication.expiresAt;

  if (!expirationDate || now > expirationDate) {
    await log.error("You tries to make request after token expiration");
    return { res: unauthenticatedResponse() };
  }

  if (roleAccess && user.role !== roleAccess) {
    await log.critical(
      "User tries to make request that their are not allow to make",
      { action: "account_unathorization" }
    );
    return { res: unauthenticatedResponse() };
  }

  // Refresh session token and return user
  await user.refreshSessionToken?.();

  return {
    user,
    res: unauthenticatedResponse("Request Permitted", true, 100),
  };
};
