import React, { FC, ReactNode } from "react";
import { forbidden, redirect } from "next/navigation";
import { _CONSTANTS, LINKS } from "@/lib/constants";
import { IRole as RoleType } from "@/types/index.types";
import { IRole } from "@/models/users.model";
import { cookies } from "next/headers";
import { Utils } from "@/lib/utils";
import { SessionProvider } from "./session-provider";

export const AuthGuard: FC<{ children: ReactNode; role?: RoleType }> = async ({
  children,
  role = IRole.STUDENT,
}) => {
  const cookiesStore = await cookies();

  const sessionToken = cookiesStore.get(_CONSTANTS.AUTH_HEADER)?.value;

  const utils = new Utils(sessionToken);

  const user = await utils.getCurrentUser();

  //When the server is experiencing a server error --> 500
  if (user.statusCode === 500) {
    //Show a 500 err UI
  }

  //If the user is not authenticated return to sign-in page
  if (user.statusCode === 401) {
    redirect(LINKS.SIGNIN);
  }

  if (user?.data?.role !== role) {
    forbidden();
  }

  return (
    <SessionProvider user={user.data} sessionToken={sessionToken}>
      {children}
    </SessionProvider>
  );
};
