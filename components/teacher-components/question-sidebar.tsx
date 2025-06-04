"use client";

import { BanIcon, Ellipsis, Plus } from "lucide-react";
import { Text } from "../text";
import { Button } from "../ui/button";
import { useQuestion } from "@/store/question.store";
import { Skeleton } from "../ui/skeleton";
import { ScrollArea } from "../ui/scroll-area";
import { EmptyUI } from "../empty-ui";
import { FC } from "react";
import { IQuestion, IQuestionType } from "@/types/index.types";
import { Badge } from "../ui/badge";
import { utils } from "@/lib/utils";
import { useRouter } from "next/navigation";

const QuestionDetail: FC<IQuestion & { idx?: number }> = ({ ...props }) => {
  const r = useRouter();
  const questionTypes: Record<IQuestionType, string> = {
    boolean: "Boolean",
    "long-answer": "Long Answer",
    mcq: "Multiple Choice Question",
    obj: "Objective",
    "short-answer": "Short Answer",
  };

  return (
    <div
      onClick={() => r.push(`#${props._id}`)}
      className="bg-sidebar p-3 space-y-5 rounded-xl hover:bg-sidebar/70 cursor-pointer"
    >
      <div className="flex items-center gap-2">
        <Badge>{props.idx! + 1}</Badge>
        <h2>{utils.truncateString(props.question, 25)}</h2>
      </div>
      <div className="flex items-center justify-between">
        <Badge variant="secondary">{questionTypes[props.type]}</Badge>
        <Button variant="ghost" size="icon" className="size-6">
          <Ellipsis size={17} />
        </Button>
      </div>
    </div>
  );
};

export const QuestionSidebar = () => {
  const { questions, isLoading } = useQuestion();

  return (
    <div className="w-[20%] h-full bg-muted hidden md:flex flex-col px-2 py-4">
      <header className="flex h-fit items-center w-full justify-between">
        <Text>Question ({questions?.size})</Text>
        <Button size="icon" className="size-7 rounded-full">
          <Plus size={15} />
        </Button>
      </header>

      <ScrollArea className="w-full mt-5 h-[calc(100vh-10rem)]">
        {/* When the questions are loading */}
        {isLoading ? (
          <div className="flex flex-col gap-3 w-full">
            {Array.from({ length: 10 }).map((_, idx) => (
              <Skeleton key={idx} className="w-full h-24 bg-sidebar" />
            ))}
          </div>
        ) : //The questions are done loading but there are no questions
        questions?.size! <= 0 ? (
          <EmptyUI
            title="No Questions"
            message="Add some questions to get started"
            icon={BanIcon}
            className="gap-2"
          >
            <Button
              size="sm"
              variant="secondary"
              className="bg-sidebar hover:bg-sidebar/80"
            >
              <Plus size={15} />
              Add Question
            </Button>
          </EmptyUI>
        ) : (
          <div className="space-y-3">
            {Array.from(questions?.values()!).map((question, idx) => (
              <QuestionDetail key={idx} {...question} idx={idx} />
            ))}
          </div>
        )}
      </ScrollArea>
    </div>
  );
};
