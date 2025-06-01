import React, { FC } from "react";
import { Button } from "../ui/button";
import { Ellipsis, GraduationCap, Plus } from "lucide-react";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { CreateTest } from "./create-test";

export const QuickAction: FC<{}> = () => {
  return (
    <div className="flex items-center gap-2 mt-3">
      <Button className="md:flex hidden" variant="secondary">
        <GraduationCap />
        Create Assignments
      </Button>
      <Button className="md:flex hidden" variant="secondary">
        View Subjects
      </Button>
      <CreateTest>
        <Button>
          <Plus />
          Create Test
        </Button>
      </CreateTest>
      <Popover>
        <PopoverTrigger asChild>
          <Button
            variant="secondary"
            className="rounded-full flex md:hidden"
            size="icon"
          >
            <Ellipsis size={20} />
          </Button>
        </PopoverTrigger>
        <PopoverContent side="right" className="p-1 rounded-xl">
          <CreateTest>
            <Button
              className="w-full flex items-start justify-start rounded-xl"
              variant="ghost"
            >
              <GraduationCap />
              Create Assignments
            </Button>
          </CreateTest>
          <Button
            className="w-full flex items-start justify-start rounded-xl"
            variant="ghost"
          >
            View Subjects
          </Button>
        </PopoverContent>
      </Popover>
    </div>
  );
};
