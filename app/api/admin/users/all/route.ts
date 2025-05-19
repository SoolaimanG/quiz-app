import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { UserService } from "@/server/services";
import { NextRequest, NextResponse } from "next/server";
import { IRole as RoleType } from "@/types/index.types";

export async function GET(request: NextRequest) {
  try {
    const q = request.nextUrl.searchParams;

    const limit = Number(q.get("limit") || 10);
    const query = q.get("query")!;
    const sort = q.get("sort") as unknown as "asc" | "desc";
    const sortKey = q.get("sortKey")!;
    const offset = Number(q.get("offset") || 0);
    const role = q.get("role") as RoleType;

    const { res, user } = await isAuthenticated(request, IRole.ADMIN);

    if (!res.status) {
      return NextResponse.json({ ...res }, { ...HTTPSTATUS["401"] });
    }

    const userService = new UserService(user?.id);

    const queriedUsers = await userService.getUsers({
      query,
      limit,
      sort,
      sortKey,
      offset,
      role,
    });

    return NextResponse.json(
      {
        statusCode: 200,
        status: true,
        message: "Users has been fetched successfully",
        data: queriedUsers,
      },
      { ...HTTPSTATUS["200"] }
    );
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { status: false, statusCode: 500, message: (error as Error).message },
      { ...HTTPSTATUS["500"] }
    );
  }
}
