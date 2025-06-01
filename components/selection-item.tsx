import React, { FC, ReactNode } from "react";
import { Text } from "./text";
import { cn } from "@/lib/client-utils";

export const SelectionItem: FC<{
  onSelect: (item?: string) => void;
  isSelected?: boolean;
  className?: string;
  item?: string;
  value?: string;
}> = ({ onSelect, ...props }) => {
  return (
    <div
      onClick={() => onSelect(props.item)}
      className={cn(
        "border border-muted-foreground/50 h-14 p-2 rounded-md cursor-pointer text-lg text-muted-foreground/50 hover:bg-muted-foreground/10 hover:text-muted-foreground/80 transition-all duration-300 ease-in-out flex items-center gap-3 w-full",
        props.className,
        props.isSelected && "bg-muted-foreground/10"
      )}
    >
      <div
        className={cn(
          "p-1 border border-muted-foreground rounded-full",
          props.isSelected && "border-primary"
        )}
      >
        <div
          className={cn(
            "size-3 bg-muted-foreground rounded-full",
            props.isSelected && "bg-primary"
          )}
        />
      </div>
      <Text className="text-accent-foreground text-lg">
        {props?.value || props.item}
      </Text>
    </div>
  );
};
