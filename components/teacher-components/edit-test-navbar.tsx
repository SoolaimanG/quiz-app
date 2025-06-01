"use client";

import React from "react";
import { Button } from "../ui/button";
import { ChevronsLeft, ChevronsRight, Edit3, X } from "lucide-react";
import { Text } from "../text";
import { Separator } from "../ui/separator";
import { useRouter } from "next/navigation";
import { useEditTest } from "@/store/test.store";
import { Utils } from "@/lib/utils";
import { useSession } from "@/store/session.store";
import { toast } from "sonner";
import { Progress } from "../ui/progress";
import { IStudent, ISubject } from "@/types/index.types";
import { LINKS } from "@/lib/constants";

export const EditTestNavbar = () => {
  const r = useRouter();
  const {
    data: test,
    navigateToStep,
    currentStep,
    setIsLoading,
    isLoading,
  } = useEditTest();
  const { sessionToken } = useSession();

  const utils = new Utils(sessionToken);

  const updateTest = async () => {
    setIsLoading(true);
    try {
      navigateToStep(Math.min(2, currentStep! + 1));

      const flattenedSubject = test?.allowedStudents?.map((student) => {
        const _student = student as IStudent;

        return _student?._id!;
      });

      const res = await utils.updateTest(test?._id!, {
        ...test,
        subject: (test?.subject as ISubject)?._id,
        allowedStudents:
          currentStep === 2 ? flattenedSubject! : test?.allowedStudents,
      });

      if (currentStep === 2) {
        toast.success("Test updated successfully", {
          description: res?.message,
        });
        r.push(LINKS.TEACHER_TESTS + res.data?._id + "/questions");
      }
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

  const currentActions = [
    "Modify Test",
    "Configure Test",
    "Add Students",
    "Add Questions",
  ];

  return (
    <div className="w-full relative">
      <nav className="w-full items-center flex justify-between border-b p-3 sticky top-0 right-0">
        <div className="flex items-center gap-4">
          <Button onClick={() => r.back()} variant="secondary" size="icon">
            <X size={18} />
          </Button>
          <h2 className="hidden md:block">Edit Test</h2>
        </div>
        <div className="flex items-center gap-3">
          <Text className="hidden md:block">Step 1: </Text>
          <h2 className="flex items-center gap-2">
            <Edit3 size={17} />{" "}
            {utils.truncateString(test?.title || "Title", 15)}{" "}
          </h2>
        </div>
        <div className="flex items-center gap-3">
          <Text className="hidden md:block">
            Next: {currentActions[currentStep + 1]}
          </Text>
          <Separator className="bg-white h-3" orientation="vertical" />
          <div className="flex items-center gap-2">
            <Button
              onClick={() => navigateToStep(Math.max(0, currentStep! - 1))}
              variant="secondary"
            >
              <ChevronsLeft />
            </Button>
            <Button
              onClick={updateTest}
              disabled={isLoading}
              className="hidden md:block"
            >
              Continue
            </Button>
            <Button
              onClick={updateTest}
              disabled={isLoading}
              className="md:hidden flex"
            >
              <ChevronsRight />
            </Button>
          </div>
        </div>
      </nav>
      <div className="flex items-center gap-4">
        {Array.from({ length: 3 }).map((_, idx) => (
          <Progress
            key={idx}
            className="h-1"
            value={currentStep === idx ? 50 : currentStep > idx ? 100 : 0}
          />
        ))}
      </div>
    </div>
  );
};
