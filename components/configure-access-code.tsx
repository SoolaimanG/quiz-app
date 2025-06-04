import React, { FC, useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "./ui/dialog";
import { Button } from "./ui/button";

export const ConfigureAccessCode: FC<{
  onSuccess?: () => void;
  onError?: () => void;
  isOpen?: boolean;
  children?: React.ReactNode;
}> = ({ isOpen = false, ...props }) => {
  const [open, setOpen] = useState(isOpen);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      {props.children && (
        <DialogTrigger asChild>{props.children}</DialogTrigger>
      )}
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Configure Access Code</DialogTitle>
        </DialogHeader>
      </DialogContent>
    </Dialog>
  );
};
