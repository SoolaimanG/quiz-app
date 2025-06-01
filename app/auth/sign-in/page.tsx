"use client";

import { SelectionItem } from "@/components/selection-item";
import { Text } from "@/components/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ACCOUNT_TYPES, FONT_STYLES, LINKS } from "@/lib/constants";
import { utils } from "@/lib/utils";
import { IRole, IUser } from "@/types/index.types";
import Link from "next/link";
import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/client-utils";
import { useRouter } from "next/navigation";

const Page = () => {
  const r = useRouter();
  const [isSingingIn, setIsSingingIn] = useState(false);
  const [data, setData] = useState<Partial<IUser>>({
    role: "STUDENT",
    identifier: "",
    authentication: {
      password: "",
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsSingingIn(true);
      const res = await utils.loginAccount({
        identifier: data?.identifier!,
        password: data?.authentication?.password!,
        role: data?.role as "STUDENT",
      });

      toast.success("SUCCESS", {
        description: res.message,
      });

      r.push(LINKS.TEACHER_DASHBOARD);
    } catch (error) {
      const { errors, message: errMsg } = utils.structureError(error);

      const message = errors
        ?.map((error) => `${error.path[0]}: ${error.message}`)
        .join(", ");

      toast.error("Error", {
        description: !!errors?.length ? message : errMsg,
      });
    } finally {
      setIsSingingIn(false);
    }
  };

  return (
    <div className="md:p-6 p-0 py-3 space-y-5 md:max-w-3xl mx-auto">
      <header>
        <h2 className={cn(FONT_STYLES.IBM_SEMI_BOLD_ITALIC, "text-3xl")}>
          Sign In
        </h2>
        <Text className="text-lg">
          {"If you don't have an account,"}{" "}
          <Link
            href={LINKS.SIGNUP}
            className="hover:underline font-bold text-accent-foreground"
          >
            Sign Up
          </Link>
        </Text>
      </header>

      <form onSubmit={handleSubmit} action="" className="w-full space-y-4">
        <div className="w-full">
          <label
            htmlFor="account-type"
            className="text-lg text-muted-foreground"
          >
            Who do you want to login as?
          </label>
          <div className="flex items-center gap-2 w-full mt-3">
            {ACCOUNT_TYPES.map((accountType, idx) => (
              <SelectionItem
                key={idx}
                onSelect={(role) => setData({ ...data, role: role as IRole })}
                item={accountType}
                isSelected={data.role === accountType}
                className="rounded-xl"
              />
            ))}
          </div>
        </div>

        <div className="">
          <label htmlFor="email" className="text-lg text-muted-foreground">
            IDENTIFIER
          </label>
          <Input
            autoComplete="off"
            type="text"
            name="identifier"
            id="identifier"
            placeholder={
              data?.role === "STUDENT"
                ? "Enter your student ID"
                : "Enter your staff ID"
            }
            value={data?.identifier}
            onChange={(e) => setData({ ...data, identifier: e.target.value })}
            className="w-full mt-2 rounded-md border border-muted-foreground/50 p-2 text-lg text-muted-foreground"
          />
        </div>
        <div className="w-full">
          <div className="flex items-center w-full justify-between">
            <label htmlFor="password" className="text-lg text-muted-foreground">
              PASSWORD
            </label>
            <Link
              href={LINKS.FORGET_PASSWORD}
              className="hover:underline text-sm"
            >
              Forget Password?
            </Link>
          </div>
          <Input
            autoComplete="off"
            type="password"
            name="password"
            id="password"
            placeholder="Create your password"
            value={data?.authentication?.password}
            onChange={(e) =>
              setData({
                ...data,
                authentication: {
                  ...data?.authentication,
                  password: e.target.value,
                },
              })
            }
            className="w-full mt-2 rounded-md border border-muted-foreground/50 p-2 text-lg text-muted-foreground"
          />
        </div>
        <Button
          disabled={isSingingIn}
          type="submit"
          className={cn(FONT_STYLES.IBM_MEDIUM, "font-bold text-lg mt-5")}
        >
          {isSingingIn && <Loader2 size={19} className="animate-spin" />}
          {isSingingIn ? "SIGNING IN..." : "SIGN IN"}
        </Button>
      </form>
    </div>
  );
};

export default Page;
