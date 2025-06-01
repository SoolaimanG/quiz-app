"use client";

import React from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "./ui/sheet";
import { Menu, Plus } from "lucide-react";
import { Logo } from "./logo";
import { TeacherSidebar } from "./teacher-sidebar";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { Button } from "./ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { utils } from "@/lib/utils";
import { useUser } from "@/store/user.store";
import { CreateTest } from "./teacher-components/create-test";

export const TeacherNavBar = () => {
  const { user } = useUser();

  return (
    <div>
      {/* This is the navbar that will show on mobile only */}
      <nav className="w-full md:hidden flex">
        <div className="flex items-center justify-between w-full border-b border-b-gray-800 pb-3 p-5">
          <Sheet>
            <SheetTrigger asChild>
              <Menu size={22} />
            </SheetTrigger>
            <SheetContent className="max-w-xl w-sm">
              <SheetHeader>
                <SheetTitle>
                  <Logo />
                </SheetTitle>
              </SheetHeader>

              <div className="w-full flex items-start justify-start">
                <TeacherSidebar isMobile showName />
              </div>
            </SheetContent>
          </Sheet>
          <div className="flex items-center space-x-2">
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <CreateTest>
                    <Button size="icon" className="rounded-full">
                      <Plus />
                    </Button>
                  </CreateTest>
                </TooltipTrigger>
                <TooltipContent>Create new test</TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <Avatar className="size-12">
              <AvatarImage />
              <AvatarFallback>{utils.getInitials(user?.name!)}</AvatarFallback>
            </Avatar>
          </div>
        </div>

        {/*<Separator />*/}
      </nav>
    </div>
  );
};
