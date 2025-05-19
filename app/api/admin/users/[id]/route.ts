import { HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { UserService } from "@/server/services";
import { NextRequest, NextResponse } from "next/server";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;

    const { res } = await isAuthenticated(request, IRole.ADMIN);

    if (!res.status) {
      return NextResponse.json(
        {
          ...res,
        },
        { ...HTTPSTATUS["401"] }
      );
    }

    const userService = new UserService();

    const user = await userService.getUser({
      query: { _id: id },
      throwOn404: true,
      toJSON: true,
    });

    return NextResponse.json(
      { status: true, statusCode: 200, message: "", data: user },
      { ...HTTPSTATUS["200"] }
    );
  } catch (error) {
    return NextResponse.json(
      { status: false, statusCode: 500, message: (error as Error).message },
      { ...HTTPSTATUS["500"] }
    );
  }
}
