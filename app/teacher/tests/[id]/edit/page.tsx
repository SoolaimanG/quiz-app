import { CompleteTestViews } from "@/components/teacher-components/complete-test-views";
import { EditTestNavbar } from "@/components/teacher-components/edit-test-navbar";
import React from "react";

const Page = async ({ params }: { params: Promise<{ id: string }> }) => {
  const { id: testId } = await params;

  return (
    <div className="w-full">
      <EditTestNavbar />
      <CompleteTestViews testId={testId} />
    </div>
  );
};

export default Page;
