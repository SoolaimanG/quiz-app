import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";
import { isAuthenticated } from "@/middlewares/authentication-checkers.middlewares";
import { IRole } from "@/models/users.model";
import { UserService } from "@/server/services";
import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const cookiesStore = await cookies();

    const { res, user } = await isAuthenticated(request, IRole.ADMIN);

    console.log({ user });

    if (!res.status) {
      return NextResponse.json(res, HTTPSTATUS["401"]);
    }

    const userService = new UserService(user?.identifier);

    const suspendedUser = await userService.suspendUser(id);

    const auth = await user?.refreshSessionToken?.();

    cookiesStore.set(
      _CONSTANTS.AUTH_HEADER,
      auth?.sessionToken!,
      COOKIES_OPTION
    );

    cookiesStore.set("user_session", "true", COOKIES_OPTION);

    return NextResponse.json({
      status: true,
      statusCode: 200,
      message: `user with ${id} has been suspended`,
      data: suspendedUser,
    });
  } catch (error) {
    console.log(error);
    return NextResponse.json(
      { status: 500, statusCode: 500, message: (error as Error).message },
      HTTPSTATUS["500"]
    );
  }
}
