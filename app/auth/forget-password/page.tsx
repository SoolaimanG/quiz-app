"use client";

import { Text } from "@/components/text";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { FONT_STYLES } from "@/lib/constants";
import { utils } from "@/lib/utils";
import { IUser } from "@/types/index.types";
import React, { useState } from "react";
import { toast } from "sonner";
import { Loader2, MailOpen } from "lucide-react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/client-utils";

const Page = () => {
  const [isRequesting, setIsRequesting] = useState(false);
  const [isOpen, setIsOpen] = useState(false);
  const [data, setData] = useState<Partial<IUser>>({
    identifier: "",
  });

  const handleSubmit = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    try {
      setIsRequesting(true);
      await utils.requestPasswordReset({
        identifier: data?.identifier!,
      });

      setIsOpen(true);
    } catch (error) {
      const { errors, message: errMsg } = utils.structureError(error);

      const message = errors
        ?.map((error) => `${error.path[0]}: ${error.message}`)
        .join(", ");

      toast.error("Error", {
        description: !!errors?.length ? message : errMsg,
      });
    } finally {
      setIsRequesting(false);
    }
  };

  //This is a dialog modal that will show when request is successfully sent
  const ResetInstructionSent = () => {
    return (
      <Dialog open={isOpen} onOpenChange={setIsOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>PASSWORD RESET INSTRUCTIONS SENT!</DialogTitle>
            <DialogDescription>
              We have sent you an instruction on how to reset your password,
              Please check your email
            </DialogDescription>
          </DialogHeader>
          <div className="w-full flex items-center justify-center">
            <MailOpen size={100} />
          </div>
          <DialogFooter className="mt-5 flex-col">
            <Button
              variant="outline"
              onClick={() => {
                const emailUrl = "mailto:";
                window.location.href = emailUrl;
              }}
            >
              Open Email App
            </Button>
            <Button onClick={() => handleSubmit()} variant="outline">
              {isRequesting && <Loader2 size={19} className="animate-spin" />}
              Resend Instructions
            </Button>
            <DialogClose asChild>
              <Button>Close</Button>
            </DialogClose>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  };

  return (
    <div className="md:p-6 p-0 py-3 space-y-5 md:max-w-3xl mx-auto flex items-center justify-center h-full">
      <ResetInstructionSent />
      <form onSubmit={handleSubmit} action="" className="w-full space-y-4">
        <header>
          <h1>REQUEST PASSWORD RESET</h1>
          <Text>
            Enter your identifier or email address to get reset instructions
          </Text>
        </header>
        <div className="w-full">
          <div className="flex items-center w-full justify-between">
            <label
              htmlFor="identifier"
              className="text-lg text-muted-foreground"
            >
              IDENTIFIER OR EMAIL
            </label>
          </div>
          <Input
            type="identifier"
            name="identifier"
            id="identifier"
            placeholder="Tea001 or Stu001 or John@doe.com"
            value={data?.identifier}
            autoComplete={"off"}
            onChange={(e) =>
              setData({
                ...data,
                identifier: e.target.value,
              })
            }
            className="w-full mt-2 rounded-md border border-muted-foreground/50 p-2 text-lg text-muted-foreground"
          />
        </div>
        <Button
          disabled={isRequesting}
          type="submit"
          className={cn(FONT_STYLES.IBM_MEDIUM, "font-bold text-lg mt-5")}
        >
          {isRequesting && <Loader2 size={19} className="animate-spin" />}
          {isRequesting ? "REQUESTING..." : "REQUEST RESET"}
        </Button>
      </form>
    </div>
  );
};

export default Page;
