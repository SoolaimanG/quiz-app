"use client";

import { TESTIMONIALS } from "@/lib/constants";
import { ITestimonial } from "@/types/client.types";
import { AnimatePresence, motion } from "framer-motion";
import { FC, useEffect, useState } from "react";
import { Text } from "./text";
import Image from "next/image";
import { cn } from "@/lib/client-utils";

const TestimonyCard: FC<ITestimonial> = ({ ...props }) => {
  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -20 }}
      transition={{ duration: 0.5 }}
      className="space-y-2 rounded-lg p-4 border border-muted-foreground bg-muted bg-opacity-10 shadow-md flex flex-col"
    >
      <Text>{props.content}</Text>
      <div className="flex items-center gap-2">
        <Image
          width={30}
          height={30}
          alt={props.name}
          src={`https://vercel.com/api/www/avatar/${props.name}`}
          className="rounded-md"
        />
        <h2>{props.name}</h2>
      </div>
    </motion.div>
  );
};

export const Testimonies = () => {
  const [step, setStep] = useState(0);

  // set interval to change step every 5 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      setStep((step) => {
        if (step === TESTIMONIALS.length - 1) {
          return 0;
        } else {
          return step + 1;
        }
      });
    }, 7000);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex items-center gap-2 flex-col">
      <AnimatePresence mode="wait">
        <TestimonyCard key={step} {...TESTIMONIALS[step]} />
      </AnimatePresence>
      <div className="flex items-center gap-1">
        {Array.from({ length: TESTIMONIALS.length }).map((_, index) => (
          <div
            key={index}
            className={cn(
              "size-1.5 rounded-full bg-accent",
              step === index && "bg-accent-foreground"
            )}
          />
        ))}
      </div>
    </div>
  );
};
