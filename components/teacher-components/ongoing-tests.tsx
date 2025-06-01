import { ITestSummary } from "@/types/index.types";
import React, { FC } from "react";
import {
  Card,
  CardContent,
  CardFooter,
  CardHeader,
  CardTitle,
} from "../ui/card";
import { cn } from "@/lib/client-utils";
import { _CONSTANTS, FONT_STYLES, LINKS } from "@/lib/constants";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "../ui/tooltip";
import {
  AlertCircle,
  ChevronRightIcon,
  ClipboardCheck,
  GraduationCap,
  Plus,
} from "lucide-react";
import { Text } from "../text";
import { Progress } from "../ui/progress";
import { Button } from "../ui/button";
import { Utils } from "@/lib/utils";
import { cookies } from "next/headers";
import Link from "next/link";

const OngoingTestCard: FC<ITestSummary> = ({ ...props }) => {
  return (
    <Card className="w-full md:w-2xl">
      <CardHeader>
        <CardTitle
          className={cn(
            "font-bold flex items-center gap-3",
            FONT_STYLES.IBM_BOLC_ITALIC
          )}
        >
          {props.title}
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger>
                <AlertCircle size={18} />
              </TooltipTrigger>
              <TooltipContent side="right">
                <p>Test is ongoing</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xl">{props.totalSubmitted} submitted</h2>
          <Text>{props.totalAllowedStudents} Allowed Student</Text>
        </div>
        <div className="space-y-2">
          <Progress
            value={props.totalSubmitted}
            max={props.totalAllowedStudents}
          />
          <h4 className="text-muted-foreground">
            {props.submissionRate} Submission rate
          </h4>
        </div>
      </CardContent>
      <CardFooter className="flex items-center w-full justify-between">
        <div className="flex items-center gap-1">
          <div>
            <ClipboardCheck size={18} />
          </div>
          <Text>{props.subject?.toUpperCase()}</Text>
        </div>
        <Button asChild variant="ghost">
          <Link href={LINKS.TEACHER_TESTS + props._id}>
            <ChevronRightIcon className="h-6 w-6" />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export const OngoingTests = async () => {
  const cookiesStore = await cookies();
  const sessionToken = cookiesStore.get(_CONSTANTS.AUTH_HEADER)?.value;

  const util = new Utils(sessionToken);

  const ongoingTests = await util.getOngoingTests();

  if (!ongoingTests?.data?.tests?.length) {
    return (
      <Card className="mt-5 overflow-hidden">
        <CardContent className="relative w-full h-[3.5rem]">
          <GraduationCap
            size={120}
            className="opacity-15 absolute right-0 top-0 -mt-5 -mr-6"
          />
          <Text className="text-xl md:text-2xl">No ongoing tests</Text>
        </CardContent>
        <CardFooter>
          <Button>
            <Plus size={19} />
            Create Test
          </Button>
        </CardFooter>
      </Card>
    );
  }

  return (
    <div className="mt-5">
      {ongoingTests?.data?.tests.map((test) => (
        <OngoingTestCard key={test._id} {...test} />
      ))}
    </div>
  );
};
