"use client";

import { FilterIcon, Search } from "lucide-react";
import React, { FC, useState } from "react";
import { Input } from "../ui/input";
import { Button } from "../ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover";
import { Separator } from "../ui/separator";

export const TeacherSearchInput: FC<{
  onSearch?: (q?: string) => void;
  onFilter?: (filter?: string) => void;
  filters?: string[];
}> = ({ onSearch, ...props }) => {
  const [search, setSearch] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("");

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSearch?.(search);
  };

  return (
    <form
      onSubmit={handleSubmit}
      className="mt-5 flex items-center w-full md:gap-3 gap-1"
    >
      <div className="md:w-[80%] w-[75%] relative">
        <Search className="absolute top-3 text-muted-foreground left-3" />
        <Input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search anything..."
          className="w-full rounded-2xl pl-10 text-2xl"
        />
      </div>
      <div className="md:w-[20%] w-[25%] flex items-center md:gap-3 gap-1">
        <Popover>
          <PopoverTrigger asChild>
            <Button
              type="button"
              size="icon"
              variant="secondary"
              className="size-11 rounded-2xl"
            >
              <FilterIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent>
            <h3 className="text-lg font-semibold mb-3">Filters</h3>
            <Separator className="mb-3" />
            {props?.filters?.map((filter, idx) => (
              <Button
                onClick={() => {
                  props?.onFilter?.(selectedFilter ? undefined : filter);
                  setSelectedFilter(filter);
                }}
                variant={selectedFilter === filter ? "secondary" : "ghost"}
                key={idx}
                className="w-full flex items-start justify-start"
              >
                {filter}
              </Button>
            ))}
          </PopoverContent>
        </Popover>
        <Button className="rounded-2xl h-11">Search</Button>
      </div>
    </form>
  );
};
