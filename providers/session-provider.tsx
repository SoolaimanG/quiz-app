"use client";

import { useSession } from "@/store/session.store";
import { useUser } from "@/store/user.store";
import { IUser } from "@/types/index.types";
import React, { FC, ReactNode, useEffect } from "react";

export const SessionProvider: FC<{
  children: ReactNode;
  sessionToken?: string;
  user: Partial<IUser>;
}> = ({ children, sessionToken, user }) => {
  const { setSessionToken } = useSession();
  const { setUser } = useUser();

  useEffect(() => {
    if (!sessionToken) return;

    setSessionToken(sessionToken);

    if (!user) return;

    setUser(user);
  }, [sessionToken, user]);

  return <div>{children}</div>;
};
