import { connectToDatabase } from "@/server/_libs";
import { UserService } from "@/server/services";
import { IRole } from "@/types/index.types";
import loginSchema from "@/validations/login.schema";
import { NextResponse } from "next/server";
import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = loginSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          message: "Validation failed",
          errors: result.error.errors,
          statusCode: 400,
        },
        { ...HTTPSTATUS["400"] }
      );
    }

    const { identifier, password, role } = result.data;

    await connectToDatabase();

    const user = new UserService(identifier);

    const res = await user.login(password, role as IRole);

    // Create a single response object
    const response = NextResponse.json(
      {
        status: true,
        message: "You are successfully logged in.",
        data: { token: res?.token },
        statusCode: 200,
      },
      { status: 200, statusText: "OK" }
    );

    // Set the cookie on the same response object
    response.cookies.set(_CONSTANTS.AUTH_HEADER, res?.token!, COOKIES_OPTION);

    response.cookies.set("user_session", "true", COOKIES_OPTION); //To tell the client the user isLogged In

    // Return the response with cookies
    return response;
  } catch (error) {
    console.log(error);
    //logger.error((error as Error).message);
    return NextResponse.json(
      {
        status: false,
        message: (error as Error).message || "Something went wrong",
        statusCode: 500,
      },
      { status: 500, statusText: "BAD REQUEST" }
    );
  }
}
