"use client";

import { Utils } from "@/lib/utils";
import { useSession } from "@/store/session.store";
import { useQuery } from "@tanstack/react-query";
import React, { FC, useEffect, useState } from "react";
import { Input } from "../ui/input";
import { cn } from "@/lib/client-utils";
import {
  ChevronLeft,
  ChevronRight,
  Image,
  LayoutGridIcon,
  TimerIcon,
  User2Icon,
} from "lucide-react";
import { Textarea } from "../ui/textarea";
import { Separator } from "../ui/separator";
import { useEditTest } from "@/store/test.store";
import { Button } from "../ui/button";
import { UploadImage } from "../upload-image";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Skeleton } from "../ui/skeleton";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { ISubject } from "@/types/index.types";
import { SelectionItem } from "../selection-item";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";

export const TestDetailCard: FC<{
  testId: string;
  mode?: "display" | "edit";
}> = ({ testId, mode = "edit" }) => {
  const { sessionToken } = useSession();
  const { data: test, setData } = useEditTest();
  const [openDialog, setOpenDialog] = useState<string>();
  const [timeFormat, setTimeFormat] = useState<"Minutes" | "Hours" | "Seconds">(
    "Minutes"
  );

  const utils = new Utils(sessionToken);

  const { isLoading, data, error } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => utils.getTest(testId),
    enabled: Boolean(sessionToken),
  });

  const { isLoading: teacherProfileLoading, data: teacherProfileData } =
    useQuery({
      queryKey: ["teacher-profile"],
      queryFn: () => utils.getTeacherProfile(),
    });

  const handleTimeFormatChange = (direction: "up" | "down") => {
    const timeFormats = [
      "Minutes",
      "Hours",
      "Seconds",
    ] as (typeof timeFormat)[];
    const currentIndex = timeFormats.indexOf(timeFormat);
    const newIndex = direction === "up" ? currentIndex + 1 : currentIndex - 1;
    setTimeFormat(
      timeFormats[
        newIndex < 0 ? timeFormats.length - 1 : newIndex % timeFormats.length
      ]
    );
  };

  const changeTimeFormatToMinutes = (time: number) => {
    let _time = time;

    if (timeFormat === "Hours") {
      _time *= 60;
    }

    if (timeFormat === "Seconds") {
      _time /= 60;
    }

    return _time;
  };

  const subjects = (teacherProfileData?.data?.subjects || []) as ISubject[];

  //Populating the test from useEditTest
  useEffect(() => {
    if (!data?.data) return;
    setData({ ...data?.data });
  }, [data?.data]);

  if (isLoading || teacherProfileLoading) {
    return (
      <div className="w-full flex items-center justify-center">
        <div className="md:max-w-3xl rounded-xl mx-auto w-full p-6 md:p-0">
          <Skeleton className="w-full h-56 rounded-t-xl" />
          <div className="pt-5 border p-2 rounded-b-xl">
            <Skeleton className="w-3/4 h-10 mb-4" />
            <div className="p-3 space-y-4">
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center gap-6">
                  <Skeleton className="w-32 h-6" />
                  <Skeleton className="w-24 h-6" />
                </div>
              ))}
            </div>
            <div className="p-3 space-y-4">
              <Skeleton className="w-full h-24" />
              <Separator />
              <Skeleton className="w-full h-24" />
              <Separator />
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full flex items-center justify-center">
      <div className="md:max-w-3xl rounded-xl mx-auto w-full p-6 md:p-0">
        <header className="w-full h-56 bg-amber-400 rounded-t-xl relative">
          {/* Upload Media */}
          <UploadImage>
            <Button disabled className=" absolute bottom-2 right-2" size="sm">
              <Image size={18} />
              Update Media
            </Button>
          </UploadImage>
          {/*  */}
          <Avatar className="size-14 rounded-md absolute bottom-0 left-3 -mb-7">
            <AvatarFallback className="rounded-md">
              {utils.getInitials(test?.title)}
            </AvatarFallback>
          </Avatar>
        </header>
        <div className="pt-7 border p-2 rounded-b-xl">
          <Input
            placeholder="What's your test title?"
            readOnly={mode === "display"}
            value={test?.title || ""}
            onChange={(e) => setData({ ...test, title: e.target.value })}
            className={cn(
              "border-none dark:bg-input/10 placeholder:text-lg text-lg md:placeholder:text-2xl md:text-2xl",
              "focus-visible:border-none focus-visible:ring-0",
              mode === "display" && "caret-current"
            )}
          />
          <div className="p-3 space-y-4">
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1 text-muted-foreground">
                <LayoutGridIcon size={15} />
                Subject
              </div>
              <Dialog
                open={mode === "edit" && openDialog === "0"}
                onOpenChange={(e) => setOpenDialog(!e ? undefined : "0")}
              >
                <DialogTrigger asChild>
                  <div className="font-bold cursor-pointer">
                    {(test?.subject as ISubject)?.name || "Empty"}
                  </div>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Select Subject</DialogTitle>
                    <DialogDescription>
                      Below are the subjects that you are teaching, Please click
                      on any to select
                    </DialogDescription>
                  </DialogHeader>
                  <div className="grid grid-cols-2 gap-3">
                    {subjects.map((subject) => (
                      <SelectionItem
                        key={subject?._id}
                        onSelect={(item) => {
                          setData({
                            ...test,
                            subject: subjects.find((s) => s?._id === item),
                          });
                          setOpenDialog(undefined);
                        }}
                        value={subject.name}
                        item={subject?._id}
                        isSelected={
                          subject?._id === (test?.subject as ISubject)?._id
                        }
                      />
                    ))}
                  </div>
                  <DialogFooter>
                    <DialogClose asChild>
                      <Button>Close</Button>
                    </DialogClose>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1 text-muted-foreground">
                <TimerIcon size={15} />
                Estimated Duration
              </div>
              <Popover
                open={openDialog === "1" && mode === "edit"}
                onOpenChange={(e) => {
                  setOpenDialog(!e ? undefined : "1");
                }}
              >
                <PopoverTrigger asChild>
                  <div className="font-bold cursor-pointer">Empty</div>
                </PopoverTrigger>
                <PopoverContent className="p-0 rounded-xl w-full">
                  <header className="p-2 w-full flex items-center justify-center">
                    <h2>Time Limit</h2>
                  </header>
                  <Separator />
                  <div className="w-full flex items-center">
                    <Input
                      className="border-none dark:bg-input/10 md:placeholder:text-xl md:text-xl focus-visible:border-none focus-visible:ring-0 w-1/2 text-center"
                      placeholder="Time Limit"
                      value={test?.settings?.timeLimit || "0"}
                      onChange={(e) => {
                        if (isNaN(Number(e.target.value))) return;

                        setData({
                          ...test,
                          settings: {
                            ...test?.settings,
                            timeLimit: changeTimeFormatToMinutes(
                              Number(e.target.value)
                            ),
                          },
                        });
                      }}
                    />
                    <Separator orientation="vertical" />
                    <div className="w-1/2 text-center flex items-center gap-1 justify-center">
                      <Button
                        onClick={() => handleTimeFormatChange("down")}
                        variant="ghost"
                        size="icon"
                      >
                        <ChevronLeft size={15} />
                      </Button>
                      {timeFormat}
                      <Button
                        onClick={() => handleTimeFormatChange("up")}
                        variant="ghost"
                        size="icon"
                      >
                        <ChevronRight size={15} />
                      </Button>
                    </div>
                  </div>
                </PopoverContent>
              </Popover>
            </div>
            <div className="flex items-center gap-6">
              <div className="flex items-center gap-1 text-muted-foreground">
                <User2Icon size={15} />
                Teacher
              </div>
              <div className="font-bold cursor-pointer">
                {utils.truncateString(teacherProfileData?.data?._id, 17)}
              </div>
            </div>
          </div>
          <div className="p-3">
            <Textarea
              className="border-none border-b dark:bg-input/10 focus-visible:border-none focus-visible:ring-0 resize-none h-fit"
              placeholder="Enter your text description here.."
              value={test?.description || ""}
              onChange={(e) =>
                setData({ ...test, description: e.target.value })
              }
            />
            <Separator />
            <Textarea
              className="border-none border-b dark:bg-input/10 focus-visible:border-none focus-visible:ring-0 resize-none h-fit"
              placeholder="Enter your text instruction here.."
              value={test?.instructions || ""}
              onChange={(e) =>
                setData({ ...test, instructions: e.target.value })
              }
            />
            <Separator />
          </div>
        </div>
      </div>
    </div>
  );
};
