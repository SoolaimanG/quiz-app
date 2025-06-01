import { Greetings } from "@/components/greetings";
import { OngoingTests } from "@/components/teacher-components/ongoing-tests";
import { QuickAction } from "@/components/teacher-components/quick-action";
import { RecentTestSubmission } from "@/components/teacher-components/recent-test-submission";
import { TeacherProfile } from "@/components/teacher-components/teacher-profile";
import { UnfinishedTests } from "@/components/teacher-components/unfinished-tests";
import { TeacherNavBar } from "@/components/teacher-navbar";
import { _CONSTANTS } from "@/lib/constants";
import React from "react";

const Page = async () => {
  return (
    <div className="w-full flex h-screen overflow-hidden">
      <div className="md:basis-3/4 w-full overflow-auto">
        <TeacherNavBar />
        <div className="p-5">
          <Greetings />
          <div>
            <QuickAction />
            <OngoingTests />
            <UnfinishedTests />
            <RecentTestSubmission />
          </div>
        </div>
      </div>
      <div className="basis-1/4 w-full hidden md:flex bg-sidebar h-full ">
        <TeacherProfile />
      </div>
    </div>
  );
};

export default Page;
