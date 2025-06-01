import { TeacherSearchInput } from "@/components/teacher-components/teacher-search-input";
import { TeacherNavBar } from "@/components/teacher-navbar";
import { Text } from "@/components/text";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/client-utils";
import {
  _CONSTANTS,
  FONT_STYLES,
  LINKS,
  TEACHER_SEARCH,
} from "@/lib/constants";
import { Utils } from "@/lib/utils";
import { FilterIcon, Headphones, Search } from "lucide-react";
import { cookies } from "next/headers";
import Link from "next/link";
import React from "react";

const Page = async () => {
  const cookiesStore = await cookies();

  const sessionToken = cookiesStore.get(_CONSTANTS.AUTH_HEADER)?.value;

  const utils = new Utils(sessionToken);

  const user = await utils?.getCurrentUser();

  return (
    <div className="w-full">
      <TeacherNavBar />
      <div className="md:max-w-6xl mx-auto w-full p-6 md:p-0 md:mt-20 mt-10 space-y-10">
        <header>
          <h2 className="text-3xl text-center">
            Find Students, Tests and Results
          </h2>
          <TeacherSearchInput />
        </header>

        <div className="gap-5 md:grid md:grid-cols-2 flex flex-col">
          {TEACHER_SEARCH.map((search, idx) => (
            <Card key={idx} className="flex flex-col md:flex-row p-0">
              <div className="w-full md:w-[40%] flex items-center justify-center bg-muted">
                <search.icon size={150} />
              </div>
              <CardContent className="p-2 w-full md:w-[60%] space-y-5">
                <CardHeader className="p-0">
                  <CardTitle className="text-xl font-extrabold">
                    {search.title}
                  </CardTitle>
                  <CardDescription>{search.description}</CardDescription>
                </CardHeader>
                <div className="flex gap-2 ">
                  <Avatar className="size-12 rounded-md">
                    <AvatarImage
                      src={user?.data?.profilePicture}
                      alt={user?.data?.name}
                    />
                    <AvatarFallback className="rounded-md">
                      {utils.getInitials(user?.data.name)}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <h4>Current User</h4>
                    <Text className={cn(FONT_STYLES.IBM_SEMI_BOLD_ITALIC)}>
                      {user?.data?.name}
                    </Text>
                  </div>
                </div>
                <CardFooter className="px-0 pt-10 gap-3">
                  <Button asChild>
                    <Link href={LINKS.TEACHER_SEARCH + search.path}>
                      Search Here
                    </Link>
                  </Button>
                  <Button
                    size="icon"
                    className="rounded-full"
                    variant="outline"
                  >
                    <Headphones size={19} />
                  </Button>
                </CardFooter>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Page;
