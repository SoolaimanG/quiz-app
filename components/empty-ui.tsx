import React, { FC, ReactNode } from "react";
import { FolderIcon, LucideProps } from "lucide-react";
import { cn } from "@/lib/client-utils";

export const EmptyUI: FC<{
  title?: string;
  message?: string;
  children?: ReactNode;
  icon?: React.ForwardRefExoticComponent<
    Omit<LucideProps, "ref"> & React.RefAttributes<SVGSVGElement>
  >;
  className?: string;
}> = ({ title, message, children, icon: Icon = FolderIcon, className }) => {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center min-h-[250px] gap-4",
        className
      )}
    >
      <Icon className="h-8 w-8 text-gray-400" />
      <h3 className="font-semibold text-lg">{title || "Empty"}</h3>
      <p className="text-sm text-gray-500 w-[80%] text-center">
        {message || "No items to display"}
      </p>
      {children}
    </div>
  );
};
