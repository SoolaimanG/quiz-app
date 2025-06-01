"use client";

import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "../ui/card";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "../ui/table";
import { Button } from "../ui/button";
import { useQuery } from "@tanstack/react-query";
import { useSession } from "@/store/session.store";
import { Utils } from "@/lib/utils";
import { Skeleton } from "../ui/skeleton";
import { EmptyUI } from "../empty-ui";
import { Plus } from "lucide-react";
import { CreateTest } from "./create-test";

export const RecentTestSubmission = () => {
  const { sessionToken } = useSession();

  const utils = new Utils(sessionToken);

  const { isLoading, data, error } = useQuery({
    queryKey: ["recent-test-submission"],
    queryFn: () => utils.getRecentTestSubmissions(),
  });

  if (isLoading) {
    return (
      <Card className="mt-5">
        <CardHeader>
          <Skeleton className="h-8 w-[200px]" />
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="mt-5">
      <CardHeader>
        <CardTitle className="text-xl">Recent Submissions</CardTitle>
      </CardHeader>
      <CardContent>
        <Table>
          <TableCaption>
            A list of your recent submissions by students
          </TableCaption>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[100px]">ID</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Email</TableHead>
              <TableHead>Time Taken</TableHead>
              <TableHead>Action</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody className="w-full">
            {!data?.data?.length ? (
              <TableRow className="w-full">
                <TableCell colSpan={5}>
                  <EmptyUI
                    title="NO SUBMISSIONS"
                    message="No don't have submission submitted by your students"
                  >
                    <CreateTest>
                      <Button size="lg">
                        <Plus />
                        Create Test
                      </Button>
                    </CreateTest>
                  </EmptyUI>
                </TableCell>
              </TableRow>
            ) : (
              data?.data?.map((test) => (
                <TableRow>
                  <TableCell key={test?._id as string} className="font-medium">
                    INV001
                  </TableCell>
                  <TableCell>Paid</TableCell>
                  <TableCell>Credit Card</TableCell>
                  <TableCell>$250.00</TableCell>
                  <TableCell>
                    <Button>Grade</Button>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
};
