"use client";

import { useUser } from "@/store/user.store";
import React from "react";

export const Greetings = () => {
  const { user } = useUser();

  return (
    <h2 className="text-2xl md:text-4xl">
      Good morning, {user?.name?.split(" ")[0]}
    </h2>
  );
};
