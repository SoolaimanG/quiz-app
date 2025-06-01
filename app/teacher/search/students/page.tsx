"use client";

import { EmptyUI } from "@/components/empty-ui";
import { TeacherSearchInput } from "@/components/teacher-components/teacher-search-input";
import { TeacherNavBar } from "@/components/teacher-navbar";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Drawer,
  DrawerClose,
  DrawerContent,
  DrawerDescription,
  DrawerFooter,
  DrawerHeader,
  DrawerTitle,
} from "@/components/ui/drawer";
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Utils } from "@/lib/utils";
import { useSession } from "@/store/session.store";
import { IStudent, IUser } from "@/types/index.types";
import { useQuery } from "@tanstack/react-query";
import { useMediaQuery } from "@uidotdev/usehooks";
import { Headphones } from "lucide-react";
import React, { FC, useCallback, useEffect, useState } from "react";
import { toast } from "sonner";

const Page = () => {
  const { sessionToken } = useSession();
  const [filteredStudents, setFilteredStudents] = useState<IStudent[]>([]);
  const [selectedStudents, setSelectedStudents] = useState(
    new Map<string, IStudent>()
  );

  const [data, setData] = useState({
    open: false,
    isAllSelected: false,
    lastSelected: "",
  });

  const utils = new Utils(sessionToken);

  const { isLoading, data: students } = useQuery({
    queryKey: ["find-my-students"],
    queryFn: () => utils.findMyStudents(),
  });

  const { data: teacher } = useQuery({
    queryKey: ["teacher-profile"],
    queryFn: () => utils.getTeacherProfile(),
  });

  // Helper functions to manage selections
  const addStudent = (studentId: string, student: IStudent) => {
    setSelectedStudents((prev) => {
      const newMap = new Map(prev);
      newMap.set(studentId, student);
      return newMap;
    });
  };

  const removeStudent = (studentId: string) => {
    setSelectedStudents((prev) => {
      const newMap = new Map(prev);
      newMap.delete(studentId);
      return newMap;
    });
  };

  const isStudentSelected = (studentId: string) => {
    return selectedStudents.has(studentId);
  };

  useEffect(() => {
    if (!teacher?.data?.students?.length || !students?.data?.length) return;

    const selectedStudents = students?.data?.filter(
      (student) => !teacher?.data?.students?.includes(student?._id?.toString()!)
    );

    const newMap = new Map<string, IStudent>();
    selectedStudents?.forEach((student) => {
      newMap.set(student._id!, student);
    });
    setSelectedStudents(newMap);
    setFilteredStudents(students?.data);
  }, [teacher?.data, students?.data]);

  const onSearch = (e: string) => {
    const filtered = students?.data?.filter((student) => {
      const studentName = (student?.user as IUser)?.name?.toLowerCase();
      const studentEmail = (student?.user as IUser)?.email?.toLowerCase();
      const studentIdentifier = (
        student?.user as IUser
      )?.identifier?.toLowerCase();

      return (
        studentName?.includes(e.toLowerCase()) ||
        studentEmail?.includes(e.toLowerCase()) ||
        studentIdentifier?.includes(e.toLowerCase())
      );
    });

    setFilteredStudents(filtered!);
  };

  const onFilter = (e: string) => {
    const filtered = students?.data?.filter(
      //@ts-ignore
      (student) => !(student?.user as IUser)?.[e]
    );

    console.log({ filtered });

    setFilteredStudents(filtered!);
  };

  return (
    <div>
      <TeacherNavBar />
      <div className="md:max-w-6xl mx-auto w-full md:mt-20 mt-10 p-6 md:p-0">
        <header>
          <h2 className="md:text-2xl text-xl text-center">
            See All Students That Offers Your Courses
          </h2>
          <TeacherSearchInput
            filters={["isActive"]}
            onSearch={(q?: string) => q && onSearch(q)}
            onFilter={(q?: string) => q && onFilter(q)}
          />
        </header>

        <div className="mt-10">
          <Table>
            <TableCaption>
              A list of all the students that offers your courses.
            </TableCaption>
            <TableHeader className="bg-muted/50">
              <TableRow>
                <TableHead>
                  <Checkbox
                    checked={data?.isAllSelected}
                    onCheckedChange={(e: boolean) => {
                      const newMap = new Map<string, IStudent>();
                      if (e) {
                        filteredStudents?.forEach((student) => {
                          newMap.set(student._id!, student);
                        });
                      }
                      setSelectedStudents(newMap);
                      setData({ ...data, isAllSelected: e, open: e });
                    }}
                  />
                </TableHead>
                <TableHead className="w-[100px] font-bold">Name</TableHead>
                <TableHead className="font-bold">Account Status</TableHead>
                <TableHead className="font-bold">Email</TableHead>
                <TableHead className="text-right font-bold">
                  Identifier
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {!!filteredStudents?.length ? (
                filteredStudents?.map((student) => (
                  <TableRow
                    key={student?._id}
                    onClick={() => {
                      if (isStudentSelected(student?._id!)) {
                        removeStudent(student?._id!);
                        setData({
                          ...data,
                          open: false,
                        });
                      } else {
                        addStudent(student?._id!, student);
                        setData({
                          ...data,
                          open: true,
                          lastSelected: student?._id!,
                        });
                      }
                    }}
                    className="hover:border-l-2 hover:border-l-primary cursor-pointer"
                  >
                    <TableCell>
                      <Checkbox
                        checked={isStudentSelected(student?._id!)}
                        onCheckedChange={(checked) => {
                          if (checked) {
                            addStudent(student?._id!, student);
                            setData({
                              ...data,
                              open: true,
                              lastSelected: student?._id!,
                            });
                          } else {
                            removeStudent(student?._id!);
                          }
                        }}
                      />
                    </TableCell>
                    <TableCell className="font-medium">
                      {utils.truncateString((student?.user as IUser)?.name, 30)}
                    </TableCell>
                    <TableCell>
                      {(student?.user as IUser)?.isActive ? (
                        <Badge>Active</Badge>
                      ) : (
                        <Badge variant="destructive">Not Active</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {utils.truncateString(
                        (student?.user as IUser)?.email,
                        25
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      {(student?.user as IUser)?.identifier}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5}>
                    <EmptyUI className="gap-2">
                      <Button size="sm">
                        <Headphones size={19} />
                        Contact Admin
                      </Button>
                    </EmptyUI>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>

        <NotifyAboutSelection
          data={data}
          setData={setData}
          selectedStudents={selectedStudents}
          onClose={() => {
            removeStudent(data.lastSelected);
            setData({ ...data, isAllSelected: false });
            setSelectedStudents(new Map<string, IStudent>());
          }}
        />
      </div>
    </div>
  );
};

const NotifyAboutSelection: FC<{
  data: {
    open: boolean;
    isAllSelected: boolean;
    lastSelected: string;
  };
  setData: React.Dispatch<
    React.SetStateAction<{
      open: boolean;
      isAllSelected: boolean;
      lastSelected: string;
    }>
  >;
  selectedStudents?: Map<string, IStudent>;
  onClose?: () => void;
}> = ({ data, setData, ...props }) => {
  const isMobile = useMediaQuery("(max-width: 767px)");
  const [isPending, startTransition] = useState(false);
  const { sessionToken } = useSession();

  const utils = new Utils(sessionToken);

  const addStudents = async () => {
    startTransition(true);

    const students = Array.from(props.selectedStudents?.keys() || []);

    try {
      const res = await utils.addNewStudent(students);
      setData({ ...data, open: false });

      toast.success("Success", {
        description: res?.message,
      });
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

  if (!isMobile) {
    return (
      <Dialog
        open={data.open}
        onOpenChange={(e) => {
          if (!e) {
            props?.onClose?.();
          }
          setData({ ...data, open: e });
        }}
      >
        <DialogContent className="md:max-w-xl">
          <DialogHeader>
            <DialogTitle className="font-extrabold text-2xl">
              Confirm Selection
            </DialogTitle>
            <DialogDescription>
              Please confirm that you are about to request the selected
              student(s) to be your student(s), they will be able to see your
              tests/assignments when you post them
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <Button disabled={isPending} onClick={addStudents}>
              Confirm ({props.selectedStudents?.size})
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    );
  }
  return (
    <Drawer
      open={data.open}
      onOpenChange={(e) => {
        if (!e) {
          props?.onClose?.();
        }
        setData({ ...data, open: e });
      }}
    >
      <DrawerContent>
        <DrawerHeader className="text-left">
          <DrawerTitle className="font-extrabold text-2xl">
            Confirm Selection
          </DrawerTitle>
          <DrawerDescription>
            Please confirm that you are about to request the selected students
            to be your student(s)
          </DrawerDescription>
        </DrawerHeader>
        {/*<ProfileForm className="px-4" />*/}
        <DrawerFooter className="pt-2">
          <DrawerClose asChild>
            <Button variant="outline">Cancel</Button>
          </DrawerClose>
          <Button disabled={isPending} onClick={addStudents}>
            Confirm ({props.selectedStudents?.size})
          </Button>
        </DrawerFooter>
      </DrawerContent>
    </Drawer>
  );
};

export default Page;
