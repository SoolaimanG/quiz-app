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

const Page = () => {
  const [isCreating, setIsCreating] = useState(false);
  const [data, setData] = useState<Partial<IUser>>({
    role: "STUDENT",
    email: "",
    name: "",
    identifier: "",
    authentication: {
      password: "",
    },
  });

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    try {
      setIsCreating(true);
      await utils.createAccount({
        identifier: data.identifier!,
        email: data.email!,
        name: data?.name!,
        password: data?.authentication?.password!,
        type: data.role as "STUDENT",
      });

      toast.success("Account created successfully", {
        description: "",
      });
    } catch (error) {
      const { errors, message: errMsg } = utils.structureError(error);

      const message = errors
        ?.map((error) => `${error.path[0]}: ${error.message}`)
        .join(", ");

      toast.error("Error", {
        description: !!errors?.length ? message : errMsg,
      });
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="md:p-6 p-0 py-3 space-y-5 md:max-w-3xl mx-auto">
      <header>
        <h2 className={cn(FONT_STYLES.IBM_SEMI_BOLD_ITALIC, "text-3xl")}>
          Sign Up
        </h2>
        <Text className="text-lg">
          If you have an account,{" "}
          <Link
            href={LINKS.SIGNIN}
            className="hover:underline font-bold text-accent-foreground"
          >
            Sign In
          </Link>
        </Text>
      </header>

      <form onSubmit={handleSubmit} action="" className="w-full space-y-4">
        <div className="w-full">
          <label
            htmlFor="account-type"
            className="text-lg text-muted-foreground"
          >
            ACCOUNT TYPE
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
            EMAIL
          </label>
          <Input
            autoComplete="off"
            type="email"
            name="email"
            id="email"
            placeholder="Enter your email"
            value={data?.email}
            onChange={(e) => setData({ ...data, email: e.target.value })}
            className="w-full mt-2 rounded-md border border-muted-foreground/50 p-2 text-lg text-muted-foreground"
          />
        </div>
        <div className="">
          <label htmlFor="name" className="text-lg text-muted-foreground">
            NAME
          </label>
          <Input
            autoComplete="off"
            type="text"
            name="name"
            id="name"
            placeholder="Enter your full name (JOHN DOE)"
            value={data?.name}
            onChange={(e) => setData({ ...data, name: e.target.value })}
            className="w-full mt-2 rounded-md border border-muted-foreground/50 p-2 text-lg text-muted-foreground"
          />
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
        <div className="">
          <label htmlFor="password" className="text-lg text-muted-foreground">
            PASSWORD
          </label>
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
          disabled={isCreating}
          type="submit"
          className={cn(FONT_STYLES.IBM_MEDIUM, "font-bold text-lg mt-5")}
        >
          {isCreating && <Loader2 size={19} className="animate-spin" />}
          {isCreating ? "CREATING..." : "CREATE ACCOUNT"}
        </Button>
      </form>
    </div>
  );
};

export default Page;
