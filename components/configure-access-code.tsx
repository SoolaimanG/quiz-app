import React, { FC, useState } from "react";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";
import { Input } from "./ui/input";
import { Switch } from "./ui/switch";
import { DatePicker } from "./date-picker";
import { useEditTest } from "@/store/test.store";
import { ITest } from "@/types/index.types";

export const ConfigureAccessCode: FC<{
  onSuccess?: () => void;
  onError?: () => void;
  isOpen?: boolean;
  children?: React.ReactNode;
}> = ({ isOpen = false, ...props }) => {
  const [open, setOpen] = useState(isOpen);
  const { setData, data: test } = useEditTest();

  const handleSubmit = (e?: React.FormEvent<HTMLFormElement>) => {
    e?.preventDefault();
    setOpen(false);

    if (!test?.accessCode?.code) {
      setData({ ...test, accessCode: undefined });
    }

    props?.onSuccess?.();
  };

  return (
    <Dialog
      open={open}
      onOpenChange={(e) => {
        if (!e) {
          handleSubmit();
        }

        setOpen(e);
      }}
    >
      {props.children && (
        <DialogTrigger asChild>{props.children}</DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Access Code</DialogTitle>
          <DialogDescription>
            Here you can configure your access code for your test.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="flex flex-col gap-3" action="">
          <div>
            <label htmlFor="access-code">Access Code</label>
            <Input
              value={test?.accessCode?.code || ""}
              onChange={(e) =>
                setData({
                  ...test,
                  accessCode: { ...test?.accessCode!, code: e.target.value },
                })
              }
              type="text"
              id="access-code"
            />
          </div>
          <div>
            <label htmlFor="usage-count">Usage Count</label>
            <Input
              value={test?.accessCode?.usageCount || 0}
              onChange={(e) =>
                setData({
                  ...test,
                  accessCode: {
                    ...test?.accessCode!,
                    usageCount:
                      typeof Number(e.target.value) === "undefined"
                        ? test?.accessCode?.usageCount!
                        : Number(e.target.value),
                  },
                })
              }
              type="text"
              id="usage-count"
            />
          </div>
          <div className="flex items-center justify-between">
            <h2>Allow Reuse</h2>
            <Switch
              checked={test?.accessCode?.allowReuse}
              onCheckedChange={(e) =>
                setData({
                  ...test,
                  accessCode: { ...test?.accessCode!, allowReuse: !!e },
                })
              }
            />
          </div>
          <div>
            <h2>Max Usage Count</h2>
            <Input
              value={test?.accessCode?.maxUsageCount || 0}
              onChange={(e) =>
                setData({
                  ...test,
                  accessCode: {
                    ...test?.accessCode!,
                    maxUsageCount:
                      typeof Number(e.target.value) === "undefined"
                        ? test?.accessCode?.usageCount!
                        : Number(e.target.value),
                  },
                })
              }
              type="text"
              id="max-usage-count"
            />
          </div>
          <div className="flex flex-col gap-2">
            <label htmlFor="valid-until">Valid Until</label>
            <DatePicker
              setDate={(date) =>
                setData({
                  ...test,
                  accessCode: { ...test?.accessCode!, validUntil: date },
                })
              }
              date={test?.accessCode?.validUntil}
              className="w-full h-12"
            />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button type="submit">Save</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};
