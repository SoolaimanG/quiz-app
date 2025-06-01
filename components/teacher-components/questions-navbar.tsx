import React from "react";
import { Button } from "../ui/button";
import { ChevronLeft } from "lucide-react";
import { Text } from "../text";

export const QuestionNavbar = () => {
  return (
    <div>
      <nav>
        <div>
          <Button size="icon" variant="secondary">
            <ChevronLeft size={19} />
          </Button>
          <Text>Edited Just Now</Text>
        </div>
      </nav>
    </div>
  );
};
