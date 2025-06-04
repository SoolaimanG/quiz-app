"use client";

import React, { FC, useState } from "react";
import { TestDetailCard } from "./test-detail-card";
import { useEditTest } from "@/store/test.store";
import { cn } from "@/lib/client-utils";
import { motion } from "framer-motion";
import { ConfigureTest } from "./configure-test";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "../ui/sheet";
import { ScrollArea } from "../ui/scroll-area";
import { Button } from "../ui/button";
import { Utils } from "@/lib/utils";
import { useSession } from "@/store/session.store";
import { IStudent, ISubject, IUser } from "@/types/index.types";
import { toast } from "sonner";
import { SelectAllowedStudent } from "./select-allowed-students";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Separator } from "../ui/separator";
import { EmptyUI } from "../empty-ui";
import { Ban, X } from "lucide-react";
import { Badge } from "../ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";

export const CompleteTestViews: FC<{ testId: string }> = ({ testId }) => {
  const { currentStep, data: test, navigateToStep, setData } = useEditTest();
  const { sessionToken } = useSession();
  const isMobile = useMediaQuery("(max-width: 767px)");

  const [isLoading, setIsLoading] = useState(false);

  const utils = new Utils(sessionToken);

  const updateTest = async () => {
    setIsLoading(true);
    try {
      navigateToStep(currentStep! + 1);

      await utils.updateTest(test?._id!, {
        ...test,
        subject: (test?.subject as ISubject)?._id,
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
      setIsLoading(false);
    }
  };

  const removeStudent = (student: IStudent) => {
    const newStudents = test?.allowedStudents?.filter(
      (_student) => (_student as IStudent)?._id !== student?._id
    );

    setData({
      ...test,
      allowedStudents: newStudents,
    });
  };

  return (
    <motion.div
      initial={{ width: "100%" }}
      animate={{ width: "100%" }}
      className={cn("w-full  flex")}
    >
      {" "}
      <motion.div
        initial={{ width: "w-full" }}
        animate={{ width: currentStep === 2 && !isMobile ? "65%" : "100%" }}
        className={cn("w-full", currentStep < 2 ? "mt-10" : "")}
      >
        {currentStep < 2 ? (
          <TestDetailCard testId={testId} />
        ) : (
          <div className="p-6">
            <SelectAllowedStudent testId={testId} />
          </div>
        )}
      </motion.div>
      {/* This is the second step of editting the test. It's a sheet modal */}
      <Sheet open={currentStep === 1}>
        <SheetContent className="md:max-w-md w-full">
          <SheetHeader>
            <SheetTitle className="text-xl">Configure Test</SheetTitle>
            <SheetDescription>
              Here you can configure your test settings and define the security
              features
            </SheetDescription>
          </SheetHeader>
          <ScrollArea className="p-4 h-[calc(100vh-13rem)] w-full">
            <ConfigureTest />
          </ScrollArea>
          <SheetFooter>
            <SheetClose asChild>
              <Button
                onClick={updateTest}
                disabled={isLoading}
                className="mb-3"
              >
                Continue
              </Button>
            </SheetClose>
          </SheetFooter>
        </SheetContent>
      </Sheet>
      {/* Show the component to select student */}
      {currentStep === 2 && !isMobile && (
        <motion.div
          initial={{ width: "35%" }}
          animate={{ width: "35%" }}
          className="bg-sidebar h-[calc(100vh-65px)] w-full hidden md:flex flex-col"
        >
          <header className="w-full p-3 items-center justify-between flex">
            <div>
              <h2 className="text-xl flex items-center gap-2">
                Allowed Students <Badge>{test?.allowedStudents?.length}</Badge>
              </h2>
            </div>
            <Button
              onClick={() => setData({ ...test, allowedStudents: [] })}
              variant="link"
            >
              Unselect All
            </Button>
          </header>
          <Separator className="bg-muted-foreground" />
          <div className="p-5">
            {!!test?.allowedStudents?.length ? (
              <div className="flex items-center gap-3 flex-wrap">
                {test?.allowedStudents?.map((student) => {
                  const _student = student as IStudent;
                  const user = _student?.user as IUser;

                  return (
                    <Badge
                      variant="secondary"
                      key={_student?._id}
                      className="rounded-full cursor-pointer hover:bg-muted flex items-center gap-2"
                    >
                      <Avatar className="">
                        <AvatarImage
                          src={user?.profilePicture}
                          alt={user?.name}
                        />
                        <AvatarFallback className="bg-sidebar">
                          {utils.getInitials(user?.name)}
                        </AvatarFallback>
                      </Avatar>
                      {user?.name}
                      <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => removeStudent(_student)}
                        className="cursor-pointer"
                      >
                        <X />
                      </Button>
                    </Badge>
                  );
                })}
              </div>
            ) : (
              <EmptyUI
                icon={Ban}
                title="No Student Selected"
                message="You haven't selected any student yet to be allowed in this test"
                className="gap-2 mt-20"
              />
            )}
          </div>
        </motion.div>
      )}
    </motion.div>
  );
};
