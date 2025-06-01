import { cn } from "@/lib/client-utils";
import { FONT_STYLES } from "@/lib/constants";
import Link from "next/link";
import React, { FC } from "react";

export const Logo: FC<{
  navigateToHomeOnClick?: boolean;
  className?: string;
}> = ({ navigateToHomeOnClick, ...props }) => {
  return (
    <Link
      href={navigateToHomeOnClick ? "/" : ""}
      className={cn("text-xl", FONT_STYLES.IBM_BOLC_ITALIC, props.className)}
    >
      Quiz App
    </Link>
  );
};
