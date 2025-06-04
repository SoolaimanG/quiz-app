import { useEditTest } from "@/store/test.store";
import {
  BanIcon,
  BotIcon,
  CheckCircleIcon,
  CircleDashed,
  ClockIcon,
  CopyIcon,
  KeySquare,
  LockIcon,
  NavigationIcon,
  PinIcon,
  PrinterIcon,
  ScrollIcon,
  SendIcon,
  ShuffleIcon,
  Video,
} from "lucide-react";
import { Text } from "../text";
import { Switch } from "../ui/switch";
import { Separator } from "../ui/separator";
import { ITestConfigureList } from "@/types/client.types";
import { cn } from "@/lib/client-utils";
import { Button } from "../ui/button";
import { ConfigureAccessCode } from "../configure-access-code";

export const ConfigureTest = () => {
  const { data: test, setData } = useEditTest();

  const configureTestSettingQuestions: ITestConfigureList[] = [
    {
      id: "shuffleQuestions",
      description:
        "Randomize the order of questions for each student to prevent cheating.",
      icon: ShuffleIcon,
    },
    {
      id: "shuffleOptions",
      description: "Randomize the order of answer options for each question.",
      icon: ShuffleIcon,
    },
  ];

  const configureTestSettings: ITestConfigureList[] = [
    {
      id: "allowInternalSystemToGradeTest",
      description:
        "Let our system grade your students for you, you must provide a correct answer for each question you create for this to work.",
      icon: BotIcon,
      useGrayColor: true,
    },
    {
      id: "submitOnPageLeave",
      description:
        "If this is enabled, the system will automatically submit your test when the student leaves the page.",
      icon: SendIcon,
    },
    {
      id: "lockDownBrowser",
      description:
        "Lock down the browser so that the student cannot access the browser.",
      icon: LockIcon,
    },
    {
      id: "screenRecordSession",
      description:
        "If this is enabled, the system will record the screen of the student and send it to the teacher.",
      icon: Video,
    },
    {
      id: "preventScreenCapture",
      description:
        "If this is enabled, the system will prevent the student from capturing the screen.",
      icon: BanIcon,
    },
    {
      id: "showResultAtEnd",
      description:
        "If this is enabled, the system will show the result of the test after the student has finished the test, If this is turn on the internal system grading will be enable",
      icon: ScrollIcon,
    },
    {
      id: "showCorrectAnswers",
      description:
        "Display the correct answers to students after they complete the test.",
      icon: CheckCircleIcon,
    },
    {
      id: "showRemainingTime",
      description:
        "Display a countdown timer showing remaining time for the test.",
      icon: ClockIcon,
    },
    {
      id: "showProgress",
      description:
        "Show progress indicator displaying how many questions have been completed.",
      icon: CircleDashed,
    },
    {
      id: "showNavigation",
      description:
        "Allow students to navigate between questions using next/previous buttons.",
      icon: NavigationIcon,
    },
    {
      id: "showSubmitButton",
      description:
        "Display a submit button allowing students to submit their test manually.",
      icon: SendIcon,
    },
    {
      id: "preventCopyPaste",
      description:
        "Prevent students from copying and pasting content during the test.",
      icon: CopyIcon,
    },
    {
      id: "preventPrint",
      description:
        "Disable printing functionality to prevent students from printing the test.",
      icon: PrinterIcon,
    },
  ];

  return (
    <div className="w-full space-y-4">
      <div className="w-full">
        <h2>Access Code</h2>
        <div className="w-full">
          <div
            className={cn(
              "p-2 rounded-xl border-2 border-primary flex gap-2 mt-3 w-full"
            )}
          >
            <div className="flex gap-4 w-full">
              <div className="border-4 bg-accent rounded-xl w-fit h-fit p-1 flex items-center justify-center">
                <KeySquare size={19} />
              </div>
              <div className="w-[80%]">
                <h2 className="text-sm">Access Code</h2>
                <div>
                  <Text className="flex items-center gap-1">
                    Check this to configure your test with access code.{" "}
                  </Text>
                  <ConfigureAccessCode>
                    <Button variant="link" className="px-0">
                      Configure access code
                    </Button>
                  </ConfigureAccessCode>
                </div>
              </div>
            </div>
            <Switch
              checked={!!Object.keys(test?.accessCode || {})?.length}
              onCheckedChange={(e) => console.log(e)}
            />
          </div>
        </div>
      </div>

      <Separator />

      <div className="w-full">
        <h2>Questions & Options</h2>
        <div className="w-full">
          {configureTestSettingQuestions.map((setting, idx) => (
            <div
              key={idx}
              className={cn(
                "p-2 rounded-xl border-2 border-primary flex gap-2 mt-3 w-full"
              )}
            >
              <div className="flex gap-4 w-full">
                <div className="border-4 bg-accent rounded-xl w-fit h-fit p-1 flex items-center justify-center">
                  <setting.icon size={19} />
                </div>
                <div className="w-[80%]">
                  <h2 className="text-sm">{setting.id}</h2>
                  <Text>{setting?.description}</Text>
                </div>
              </div>
              <Switch
                checked={test?.settings?.[setting?.id!] as boolean}
                onCheckedChange={(e) =>
                  setData({
                    ...test,
                    settings: { ...test?.settings, [setting.id]: e },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
      <Separator />
      <div>
        <h2>Test Settings</h2>

        <div>
          {configureTestSettings.map((setting, idx) => (
            <div
              key={idx}
              className={cn(
                "p-2 rounded-xl border-2 border-primary w-full flex gap-2 mt-3",
                setting?.useGrayColor ? "border-accent" : "border-primary"
              )}
            >
              <div className="flex gap-4">
                <div className="border-4 bg-accent rounded-xl w-fit h-fit p-1 flex items-center justify-center">
                  <setting.icon size={19} />
                </div>
                <div>
                  <h2 className="text-sm">{setting.id}</h2>
                  <Text>{setting.description}</Text>
                </div>
              </div>
              <Switch
                checked={test?.settings?.[setting?.id!] as boolean}
                onCheckedChange={(e) =>
                  setData({
                    ...test,
                    settings: { ...test?.settings, [setting.id]: e },
                  })
                }
              />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
