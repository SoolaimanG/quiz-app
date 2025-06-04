"use client";

import { Utils } from "@/lib/utils";
import { useSession } from "@/store/session.store";
import { useEditTest } from "@/store/test.store";
import { useQuery } from "@tanstack/react-query";
import React, { FC, useEffect } from "react";
import { Text } from "../text";
import { Separator } from "../ui/separator";
import { Check, CheckCheck, SearchIcon } from "lucide-react";
import { Input } from "../ui/input";
import { EmptyUI } from "../empty-ui";
import { Button } from "../ui/button";
import Link from "next/link";
import { LINKS } from "@/lib/constants";
import { IStudent, IUser } from "@/types/index.types";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { Badge } from "../ui/badge";
import { cn } from "@/lib/client-utils";

export const SelectAllowedStudent: FC<{ testId: string }> = ({ testId }) => {
  const { sessionToken } = useSession();
  const { currentStep, setData, data: test } = useEditTest();

  const utils = new Utils(sessionToken);

  const { isLoading, data } = useQuery({
    queryKey: ["test", testId],
    queryFn: () => utils.getTest(testId),
    enabled: currentStep === 2,
  });

  const { isLoading: studentsLoading, data: availableStudents } = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: () => utils.getTeacherProfile(),
    enabled: currentStep === 2,
  });

  const students = (availableStudents?.data?.students || []) as IStudent[];

  const isSelected = (studentId: string) => {
    const students = (test?.allowedStudents || []) as IStudent[];
    const studentExist = students?.find(
      (_student) => _student?._id === studentId
    );

    return !!studentExist;
  };

  const selectStudent = (student: IStudent) => {
    let newStudents: IStudent[] = [];
    const students = (test?.allowedStudents || []) as IStudent[];

    const alreadyExist = students?.find(
      (_student) => _student?._id === student?._id
    );

    if (alreadyExist) {
      newStudents = students?.filter(
        (_student) => _student?._id !== student?._id
      );
    } else {
      newStudents = [...students, student];
    }

    setData({
      ...test,
      allowedStudents: newStudents,
    });
  };

  const allowAll = () => {
    setData({
      ...test,
      allowedStudents: students,
    });
  };

  useEffect(() => {
    if (!data?.data || !availableStudents?.data?.students?.length) return;

    const students = (availableStudents?.data?.students || []) as IStudent[];

    const allowedStudents = students?.filter((student) => {
      const studentExist = data?.data?.allowedStudents?.find(
        (_student) => ((_student as IStudent)?._id || _student) === student?._id
      );

      return !!studentExist;
    });

    setData({
      ...test,
      allowedStudents,
    });
  }, [data?.data, availableStudents?.data]);

  return (
    <div className="">
      <header>
        <h2 className="md:text-3xl text-xl">Select Allowed Students</h2>
        <Text>
          Enroll students that you want them to participate in this test.
        </Text>
      </header>

      <div className="flex items-center md:gap-2 gap-1 mt-3 w-full">
        <h3 className="md:text-base text-xs">
          {availableStudents?.data?.students?.length} Available Students
        </h3>
        <Separator orientation="vertical" />
        <div className="flex items-center">
          <SearchIcon size={19} className="text-muted-foreground" />
          <Input
            placeholder="search student"
            className="border-none dark:bg-input/10 placeholder:text-lg text-xs md:placeholder:text-2xl md:text-xl h-4 focus-visible:border-none focus-visible:ring-0"
          />
        </div>
      </div>

      <div className="w-full flex items-end justify-end">
        <Button onClick={allowAll} variant="link">
          <CheckCheck size={19} />
          Allow all
        </Button>
      </div>
      <div className="mt-10">
        {!!students?.length ? (
          <div className="grid lg:grid-cols-3 grid-cols-1 md:grid-cols-2">
            {students?.map((student) => (
              <div
                key={student?._id}
                onClick={() => selectStudent(student)}
                className={cn(
                  "border-2 p-3 border-accent-foreground rounded-xl space-y-3 cursor-pointer hover:bg-sidebar relative",
                  isSelected(student?._id!) && "bg-sidebar"
                )}
              >
                <div className="flex items-center gap-2">
                  <Avatar>
                    <AvatarImage
                      src={(student?.user as IUser)?.profilePicture}
                      alt={(student?.user as IUser)?.name}
                    />
                    <AvatarFallback>
                      {utils.getInitials((student?.user as IUser)?.name)}
                    </AvatarFallback>
                  </Avatar>
                  <h2>{(student?.user as IUser)?.name}</h2>
                </div>
                <Separator className="bg-muted" />
                <div className="space-x-2">
                  <Badge variant="secondary">
                    {(student?.user as IUser)?.identifier}
                  </Badge>
                  <Badge
                    title={(student?.user as IUser)?.email}
                    variant="secondary"
                  >
                    {utils.truncateString((student?.user as IUser)?.email, 12)}
                  </Badge>
                  <Badge
                    variant={
                      !(student?.user as IUser)?.isActive
                        ? "destructive"
                        : "default"
                    }
                  >
                    {(student?.user as IUser)?.isActive
                      ? "Active"
                      : "Not Active"}
                  </Badge>
                </div>

                {/* Check Icon To Indicate Selection */}
                {isSelected(student?._id!) && (
                  <Check className=" absolute top-0 right-0 bg-primary rounded-full p-0.5 -mr-2 -mt-2" />
                )}
              </div>
            ))}
          </div>
        ) : (
          <EmptyUI
            title="No Students Found"
            message="Looks like you don't have any student on your student listing"
            className="mt-20 gap-3"
          >
            <Button asChild size="lg">
              <Link href={LINKS.TEACHER_SEARCH}>
                {" "}
                <SearchIcon />
                Find Students
              </Link>
            </Button>
          </EmptyUI>
        )}
      </div>
    </div>
  );
};
