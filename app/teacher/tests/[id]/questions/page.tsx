import { CreateQuestionViewPort } from "@/components/teacher-components/create-questions-viewport";
import { QuestionSidebar } from "@/components/teacher-components/question-sidebar";
import { QuestionNavbar } from "@/components/teacher-components/questions-navbar";
import React from "react";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id: testId } = await params;

  return (
    <div className="overflow-hidden">
      <QuestionNavbar testId={testId} />
      <div className="h-[calc(100vh-4.5rem)] overflow-hidden w-full flex">
        <QuestionSidebar />
        <div className="flex md:w-[80%] w-full overflow-y-auto pb-10">
          <CreateQuestionViewPort testId={testId} />
        </div>
      </div>
    </div>
  );
};

export default Page;
