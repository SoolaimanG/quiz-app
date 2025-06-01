import { TeacherSidebar } from "@/components/teacher-sidebar";
import React, { FC, ReactNode } from "react";

export const TeacherProvider: FC<{ children: ReactNode }> = ({ children }) => {
  return (
    <div className="w-screen flex md:flex-row flex-col h-screen overflow-hidden">
      {/* This is the teachers navbar which will only show on desktop view */}
      <div className="relative h-full md:w-[3.5%] md:flex hidden bg-sidebar">
        <nav className="w-full h-full top-0 sticky left-0">
          <TeacherSidebar />
        </nav>
      </div>
      <div className="w-full overflow-y-auto">{children}</div>
    </div>
  );
};
