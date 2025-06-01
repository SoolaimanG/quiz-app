"use client";

import { utils, Utils } from "@/lib/utils";
import { useSession } from "@/store/session.store";
import { ISubject, ITest } from "@/types/index.types";
import { useQuery } from "@tanstack/react-query";
import React, { FC } from "react";
import { Avatar, AvatarFallback } from "../ui/avatar";
import { Card } from "../ui/card";
import { Text } from "../text";
import { ChevronRight, Clock, Edit3, Ellipsis, Eye } from "lucide-react";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Skeleton } from "../ui/skeleton";
import Link from "next/link";
import { LINKS } from "@/lib/constants";

const UnfinishedTestCardSkeleton = () => {
  return (
    <Card className="bg-card p-3 md:w-fit w-full flex flex-row items-center justify-between">
      <div className="flex flex-row gap-3">
        <Skeleton className="size-14 rounded-md" />
        <div>
          <Skeleton className="h-6 w-40 mb-2" />
          <Skeleton className="h-4 w-24" />
        </div>
      </div>
      <Skeleton className="h-9 w-9 rounded-full" />
    </Card>
  );
};

const UnfinishedTestCard: FC<Partial<ITest>> = ({ ...props }) => {
  const subject = props?.subject as ISubject;

  return (
    <Card className="bg-card p-3 md:w-fit w-full flex flex-row items-center justify-between">
      <div className="flex flex-row gap-3">
        <Avatar className="size-14 rounded-md">
          <AvatarFallback className="rounded-md font-bold">
            {utils.getInitials(subject?.name)}
          </AvatarFallback>
        </Avatar>
        <div>
          <Text className="text-lg">
            {utils.truncateString(props.instructions, 20)}
          </Text>
          <div className="flex items-center gap-1">
            <Clock size={18} className="text-muted-foreground" />
            {props.settings?.timeLimit
              ? props.settings.timeLimit + " Mins"
              : "Not specified"}
          </div>
        </div>
      </div>
      <Popover>
        <PopoverTrigger asChild>
          <Button size="icon" variant="secondary" className="rounded-full">
            <Ellipsis size={19} />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="rounded-xl flex flex-col p-1 w-52">
          <Button variant="ghost" asChild>
            <Link
              className="items-start rounded-xl justify-start"
              href={LINKS.TEACHER_TESTS + props._id + "/edit"}
            >
              <Edit3 size={18} />
              Edit Test
            </Link>
          </Button>
          <Button
            variant="ghost"
            className="items-start rounded-xl justify-start"
          >
            <Eye size={18} />
            View Test
          </Button>
        </PopoverContent>
      </Popover>
    </Card>
  );
};

export const UnfinishedTests = () => {
  const { sessionToken } = useSession();
  const utils = new Utils(sessionToken);

  const { isLoading, data, error } = useQuery({
    queryKey: ["unfinished-tests", sessionToken],
    queryFn: () => utils.getUnfinishedTests(),
    enabled: !!sessionToken,
  });

  if (isLoading) {
    return (
      <div className="mt-5 space-y-2">
        <h2>Unfinished Tests</h2>
        <div className="w-full flex md:flex-row flex-col gap-3">
          <UnfinishedTestCardSkeleton />
          <UnfinishedTestCardSkeleton />
          <UnfinishedTestCardSkeleton />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-5 space-y-2">
      <h2>Unfinished Tests</h2>
      <div className="w-full flex md:flex-row flex-col gap-3">
        {data?.data?.tests?.map((test) => (
          <UnfinishedTestCard key={test?._id} {...test} />
        ))}
      </div>
    </div>
  );
};
