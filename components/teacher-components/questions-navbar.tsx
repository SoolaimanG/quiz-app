"use client";

import React, { FC, useCallback, useEffect } from "react";
import { Button } from "../ui/button";
import {
  ChevronLeft,
  Ellipsis,
  EyeIcon,
  Rocket,
  SaveIcon,
  ScrollIcon,
  Settings,
} from "lucide-react";
import { Text } from "../text";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select";
import { cn } from "@/lib/client-utils";
import { useSession } from "@/store/session.store";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Utils } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { useQuestion } from "@/store/question.store";
import { useEditTest } from "@/store/test.store";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { formatDistanceToNow } from "date-fns";

import { useRouter } from "next/navigation";
import { LINKS } from "@/lib/constants";
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "../ui/sheet";
import { ScrollArea } from "../ui/scroll-area";
import { ConfigureTest } from "./configure-test";
import { toast } from "sonner";

export const QuestionNavbar: FC<{ testId: string }> = ({ testId }) => {
  const { sessionToken } = useSession();
  const { setIsLoading } = useQuestion();
  const { setData, data: _test } = useEditTest();
  const queryClient = useQueryClient();
  const r = useRouter();

  const utils = new Utils(sessionToken);

  const { isLoading, data: tests } = useQuery({
    queryKey: ["tests", sessionToken],
    queryFn: () => utils.getTests({ limit: 5 }),
    enabled: !!sessionToken,
  });

  const { isLoading: testLoading, data: test } = useQuery({
    queryKey: ["test", sessionToken, testId],
    queryFn: () => utils.getTest(testId!),
    enabled: !!sessionToken && !!testId,
  });

  useEffect(() => {
    setIsLoading(testLoading);

    if (!test?.data) return;

    setData({ ...test?.data }); //Setting the current test
  }, [test?.data, testLoading, tests?.data]);

  const _currentTest = useCallback(() => {
    return tests?.data?.tests?.find((test) => test?._id?.toString() === testId);
  }, [tests?.data, testId]);

  const updateTest = async () => {
    try {
      await utils.updateTest(testId!, _test!);
    } catch (error) {
      const { errors, message: errMsg } = utils.structureError(error);

      const message = errors
        ?.map((error) => `${error.path[0]}: ${error.message}`)
        .join(", ");

      toast.error("Error", {
        description: !!errors?.length ? message : errMsg,
      });

      toast.error("ERROR", {
        description: "",
      });
    }
  };

  return (
    <div className="border-b-2 p-4">
      <nav className="flex items-center justify-between">
        <div className="flex items-center gap-1">
          <Button size="icon" variant="secondary">
            <ChevronLeft size={19} />
          </Button>
          {_test?.updatedAt && (
            <Text className="hidden md:flex">
              {formatDistanceToNow(_test?.updatedAt!, { addSuffix: true })}
            </Text>
          )}
        </div>
        {isLoading ? (
          <Skeleton className="h-9 w-24" />
        ) : (
          <div className="flex items-center gap-2">
            <ScrollIcon
              size={30}
              className="p-1 bg-primary text-white rounded-xl"
            />
            <Select
              value={testId}
              onValueChange={(e) => {
                r.push(LINKS.TEACHER_TESTS + e + "/questions");
              }}
            >
              <SelectTrigger
                className={cn(
                  "focus-visible:border-none focus-visible:ring-0 dark:hover:bg-transparent border-none bg-transparent dark:bg-transparent outline-none"
                )}
              >
                <SelectValue
                  defaultValue={utils?.truncateString(_currentTest()?.title, 8)}
                  placeholder="Theme"
                />
              </SelectTrigger>
              <SelectContent>
                {tests?.data?.tests?.map((test) => (
                  <SelectItem value={test?._id!} key={test?._id}>
                    {utils.truncateString(test?.title, 10)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button className="flex md:hidden" variant="secondary">
                <Ellipsis />
              </Button>
            </PopoverTrigger>
            <PopoverContent
              side="bottom"
              className="p-2 rounded-xl flex flex-col"
            >
              <Button
                className="flex items-start justify-start"
                variant="ghost"
              >
                <Settings />
                Settings
              </Button>
              <Button
                className="flex items-start justify-start"
                variant="ghost"
              >
                <EyeIcon />
                Preview
              </Button>
            </PopoverContent>
          </Popover>
          <Sheet>
            <SheetTrigger asChild>
              <Button className="hidden md:flex" variant="secondary">
                <Settings />
              </Button>
            </SheetTrigger>
            <SheetContent className="md:max-w-md w-full">
              <SheetHeader>
                <SheetTitle className="text-xl">Configure Test</SheetTitle>
                <SheetDescription>
                  Here you can configure your test settings and define the
                  security features
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

          <Button className="hidden md:flex" variant="secondary">
            <SaveIcon />
            Save
          </Button>
          <Button>
            <Rocket />
            <Text className="text-white hidden md:flex">Publish</Text>
          </Button>
        </div>
      </nav>
    </div>
  );
};
