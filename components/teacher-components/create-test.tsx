"use client";

import React, { FC, ReactNode, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "../ui/dialog";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/store/session.store";
import { Utils } from "@/lib/utils";
import { SelectionItem } from "../selection-item";
import { ISubject } from "@/types/index.types";
import { Button } from "../ui/button";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";
import { useRouter } from "next/navigation";
import { LINKS } from "@/lib/constants";

export const CreateTest: FC<{ children: ReactNode }> = ({ children }) => {
  const { sessionToken } = useSession();

  const utils = new Utils(sessionToken);

  const r = useRouter();
  const [isOpen, setIsOpen] = React.useState(false);
  const [isPending, startTransition] = useState(false);
  const [selectedSubject, setSelectedSubject] = useState<string>();
  const [_data, setData] = useState({
    title: "",
    instructions: "",
    description: "",
  });

  const { isLoading, data, error } = useQuery({
    queryKey: ["teacher-profile", sessionToken],
    queryFn: () => utils.getTeacherProfile(),
    enabled: !!sessionToken && isOpen,
  });

  const subjects = data?.data?.subjects as ISubject[];

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    setData({ ..._data, [name]: value });
  };

  const createTest = async (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault?.();
    startTransition(true);

    try {
      const res = await utils.createTest({
        ..._data,
        subject: selectedSubject!,
      });

      setIsOpen(false);
      toast.success("Test created successfully", { description: res.message });
      r.push(LINKS.TEACHER_TESTS + res.data._id + "/edit");
    } catch (error) {
      const { errors, message: errMsg } = utils.structureError(error);

      const message = errors
        ?.map((error) => `${error.path[0]}: ${error.message}`)
        .join(", ");

      toast.error("Error", {
        description: !!errors?.length ? message : errMsg,
      });
    } finally {
      startTransition(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogTrigger asChild>{children}</DialogTrigger>
      <DialogContent className="md:max-w-xl">
        <DialogHeader>
          <DialogTitle>CREATE TEST</DialogTitle>
          <DialogDescription>
            Fill out the form to create your test and be redirected to a page to
            continue your test creation.
          </DialogDescription>
        </DialogHeader>
        <form className="space-y-3" action="" onSubmit={createTest}>
          <div>
            <label htmlFor="title">Title</label>
            <Input
              id="title"
              name="title"
              placeholder="What is the name of this test"
              value={_data?.title}
              onChange={handleChange}
              className=""
            />
          </div>
          <div>
            <label htmlFor="instructions">Instructions</label>
            <Textarea
              id="instructions"
              name="instructions"
              placeholder="Instructions you want to give the students."
              value={_data?.instructions}
              onChange={handleChange}
              className="resize-none"
            />
          </div>
          <div>
            <label htmlFor="description">Descriptions</label>
            <Textarea
              id="description"
              name="description"
              placeholder="Describe the test you are about to create for your students"
              value={_data?.description}
              onChange={handleChange}
              className="resize-none"
            />
          </div>
          <div>
            <label htmlFor="subjects">SUBJECTS</label>
            <div className="grid grid-cols-2 gap-3">
              {subjects?.map((subject: ISubject) => (
                <SelectionItem
                  key={subject?._id}
                  onSelect={setSelectedSubject}
                  item={subject?._id}
                  value={subject?.name}
                  isSelected={selectedSubject === subject?._id}
                />
              ))}
            </div>
          </div>
        </form>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="secondary">Close</Button>
          </DialogClose>
          <Button
            disabled={isPending || isLoading}
            onClick={() => createTest()}
          >
            {isPending && <Loader2 size={19} className="animate-spin" />}
            {isPending ? "Creating..." : "Create"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
