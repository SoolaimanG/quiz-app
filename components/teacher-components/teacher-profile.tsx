"use client";

import { FC } from "react";
import { Button } from "../ui/button";
import { CheckIcon, Edit3, Mail, User } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "../ui/avatar";
import { useSession } from "@/store/session.store";
import { Utils } from "@/lib/utils";
import { UploadImage } from "../upload-image";
import { useQuery } from "@tanstack/react-query";
import { ISubject, IUser } from "@/types/index.types";
import { Text } from "../text";
import { Separator } from "../ui/separator";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { LINKS } from "@/lib/constants";

export const TeacherProfile: FC<{ teacherId?: string }> = ({ teacherId }) => {
  const { sessionToken } = useSession();
  const utils = new Utils(sessionToken);

  const { isLoading, data, error } = useQuery({
    queryKey: ["teacher-profile", teacherId, sessionToken],
    queryFn: () => utils.getTeacherProfile(),
    enabled: !!sessionToken,
  });

  const currentUser = data?.data?.user as IUser;
  const subjects = data?.data.subjects?.slice(0, 5) as ISubject[];

  if (isLoading) {
    return (
      <div className="p-3 w-full">
        <header className="flex items-center justify-between w-full">
          <Skeleton className="h-7 w-24" />
          <Skeleton className="h-9 w-9 rounded-full" />
        </header>
        <div className="w-full flex flex-col gap-2 items-center justify-center mt-5">
          <Skeleton className="size-20 rounded-md" />
          <div className="flex items-center flex-col gap-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-40" />
          </div>
        </div>
        <Separator className="mt-4" />
        <div className="mt-3">
          <Skeleton className="h-4 w-24" />
          <div className="mt-5 space-y-4">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between">
                <Skeleton className="h-4 w-24" />
                <Skeleton className="h-8 w-40 rounded-xl" />
              </div>
            ))}
          </div>
        </div>
        <Separator className="w-full mt-5" />
        <div className="mt-3">
          <Skeleton className="h-4 w-32 mb-3" />
          <Skeleton className="h-4 w-24 mb-3" />
          <div className="space-y-3">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center gap-3">
                <Skeleton className="size-14 rounded-md" />
                <div className="flex-1">
                  <Skeleton className="h-4 w-32 mb-2" />
                  <Skeleton className="h-3 w-48" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-3 w-full sticky top-0 right-0">
      <header className="flex items-center justify-between w-full">
        <h2 className="text-xl">Profile</h2>
        <Button variant="secondary" size="icon" className="rounded-full">
          <Edit3 size={19} />
        </Button>
      </header>
      <div className="w-full flex flex-col gap-2 items-center justify-center mt-5">
        <UploadImage multiple>
          <Avatar className="size-20 cursor-pointer rounded-md">
            <AvatarImage src="" className="rounded-md" />
            <AvatarFallback className="rounded-md">
              {utils.getInitials(currentUser?.name)}
            </AvatarFallback>
          </Avatar>
        </UploadImage>
        <div className="flex items-center flex-col">
          <h3>{currentUser?.name}</h3>
          <Text className="text-xs">(Click profile to update)</Text>
        </div>
      </div>
      <Separator className="mt-4" />
      <div className="mt-3">
        <Text>USER INFO</Text>
        <div className="mt-5 space-y-4">
          <div className="flex items-center justify-between">
            <h2>IDENTIFIER</h2>
            <div className="flex items-center gap-2 border px-3 py-0.5 bg-primary/15 border-primary rounded-xl w-fit">
              <User size={18} />
              {currentUser?.identifier}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <h2>EMAIL</h2>
            <div className="flex items-center gap-2 border px-3 py-0.5 bg-primary/15 border-primary rounded-xl w-fit">
              <Mail size={18} />
              {currentUser?.email}
            </div>
          </div>
          <div className="flex items-center justify-between">
            <h2>ACCOUNT STATUS</h2>
            <div className="flex items-center gap-2 border px-3 py-0.5 bg-primary/15 border-primary rounded-xl w-fit">
              <CheckIcon size={18} />
              ACTIVE
            </div>
          </div>
        </div>
      </div>
      <Separator className="w-full mt-5" />
      <div className="mt-3">
        <Text>TEACHER PROFILE</Text>
        <div className="mt-3">
          <div className="flex items-center justify-between">
            <h2>My Subjects</h2>
            <Link href={LINKS.TEACHER_SUBJECT} className="text-xs underline">
              View All
            </Link>
          </div>
          <div className="mt-3 overflow-y-scroll min-h-80">
            {subjects?.map((subject) => (
              <Link
                href={LINKS.TEACHER_SUBJECT + subject._id}
                key={subject?._id}
                className="p-3 bg-muted flex items-center gap-3 rounded-md"
              >
                <Avatar className="size-14 rounded-md bg-muted-foreground">
                  <AvatarFallback className="rounded-md font-bold bg-inherit">
                    {utils.getInitials(subject?.name)}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h3>{subject.name}</h3>
                  <Text>{utils.truncateString(subject.description, 40)}</Text>
                </div>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};
