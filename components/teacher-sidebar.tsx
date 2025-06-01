"use client";

import { LINKS } from "@/lib/constants";
import {
  BookOpenCheck,
  ChartLine,
  GraduationCap,
  Home,
  Plus,
  Search,
  Settings2,
} from "lucide-react";
import React, { FC } from "react";
import { Text } from "./text";
import { Avatar, AvatarFallback, AvatarImage } from "./ui/avatar";
import { utils } from "@/lib/utils";
import { Button } from "./ui/button";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";
import { useUser } from "@/store/user.store";
import { cn } from "@/lib/client-utils";
import { usePathname } from "next/navigation";
import { CreateTest } from "./teacher-components/create-test";

const sidebarNav = [
  {
    path: LINKS.TEACHER_DASHBOARD,
    name: "Home",
    icon: Home,
  },
  {
    path: LINKS.TEACHER_SEARCH,
    name: "Search",
    icon: Search,
  },
  {
    path: LINKS.TEACHER_INSIGHTS,
    name: "Insights",
    icon: ChartLine,
  },
  {
    path: LINKS.TEACHER_TESTS,
    name: "Tests",
    icon: BookOpenCheck,
  },
  {
    path: LINKS.TEACHER_STUDENTS,
    name: "Students",
    icon: GraduationCap,
  },
];

const tools = [
  {
    action: () => {},
    icon: <Plus />,
    name: "Create Test",
  },
  {
    action: () => {},
    icon: <Settings2 />,
    name: "Settings",
  },
  {
    action: () => {},
    icon: (profileImage: string, name = "UNKNOWN") => (
      <Avatar className="rounded-md">
        <AvatarImage src={profileImage} />
        <AvatarFallback className="rounded-md">
          {utils.getInitials(name)}
        </AvatarFallback>
      </Avatar>
    ),
    name: "My Profile",
    isProfile: true,
  },
];

export const TeacherSidebar: FC<{ showName?: boolean; isMobile?: boolean }> = ({
  showName = false,
  isMobile = false,
}) => {
  const { user } = useUser();
  const pathnaname = usePathname();

  return (
    <div className="">
      <div className=" p-2">
        <div
          className={cn(
            "absolute top-10 mt-5 flex flex-col w-full gap-5 left-0 p-2",
            !isMobile && " items-center justify-center"
          )}
        >
          {sidebarNav.map((sidebar, idx) => (
            <Button
              key={idx}
              variant="ghost"
              className={cn(
                "hover:bg-primary-foreground p-2 rounded-md",
                isMobile && "w-full items-start justify-start",
                utils.isPathMatching(sidebar.path.split("/")[2], pathnaname, {
                  level: 2,
                })
                  ? "bg-accent text-primary"
                  : "text-muted-foreground"
              )}
            >
              <sidebar.icon
                size={20}
                className={cn("hover:text-accent-foreground")}
              />
              {showName && <Text>{sidebar.name}</Text>}
            </Button>
          ))}
        </div>
      </div>
      {!isMobile && (
        <footer className="absolute bottom-5 w-full">
          <div className="flex items-center justify-center flex-col gap-5">
            {tools.map((tool, idx) => (
              <TooltipProvider key={idx}>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <div onClick={tool.action}>
                      {idx === 0 ? (
                        <CreateTest>
                          <Button>{tool.icon as React.ReactElement}</Button>
                        </CreateTest>
                      ) : tool.isProfile ? (
                        tool.icon(user?.profilePicture!, user?.name)
                      ) : (
                        <Button variant={"ghost"}>
                          {tool.icon as React.ReactElement}
                        </Button>
                      )}
                    </div>
                  </TooltipTrigger>
                  <TooltipContent side="right">{tool.name}</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            ))}
          </div>
        </footer>
      )}
    </div>
  );
};
