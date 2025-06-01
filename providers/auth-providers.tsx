import { Logo } from "@/components/logo";
import { Testimonies } from "@/components/testimonies";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
} from "@/components/ui/card";
import React, { FC, ReactNode } from "react";

const AuthProviders: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <main className="p-6 flex w-full h-screen gap-10">
      {/* Authentication Design, Shows only on large screens */}
      <Card className="basis-1/3 h-full md:flex hidden">
        <CardContent className="h-full">
          <CardHeader className="p-0">
            <Logo />
          </CardHeader>

          <div className="mt-20 space-y-3">
            <h2 className="text-4xl font-bold">
              Welcome to Quiz App, How are you?
            </h2>
            <CardDescription className="text-2xl">
              Create, manage and administer assessments with ease
            </CardDescription>
          </div>
        </CardContent>
        <CardFooter>
          <Testimonies />
        </CardFooter>
      </Card>

      <div className="md:w-2/3 w-full">
        {/* Authentication Children e.g Sign Up, Sign In, Forget Password and rest */}
        {children}
      </div>
    </main>
  );
};

export default AuthProviders;
