import { _CONSTANTS, COOKIES_OPTION, HTTPSTATUS } from "@/lib/constants";
import { IRole } from "@/models/users.model";
import { aj, connectToDatabase } from "@/server/_libs";
import { UserService } from "@/server/services";
import accountCreationSchema from "@/validations/account-creation-schema";
import { NextResponse } from "next/server";
import { cookies } from "next/headers";

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const cookiesStore = await cookies();

    const result = accountCreationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          message: result.error.message,
          errors: result.error.errors,
          statusCode: 400,
        },
        { ...HTTPSTATUS["400"] }
      );
    }

    const { identifier, email, name, subjects = [], ...data } = result.data;

    const availableTypes = new Set(Object.values(IRole));

    if (!availableTypes.has(data.type as IRole)) {
      return NextResponse.json(
        {
          status: false,
          message: "Invalid Account Type",
          statusCode: 400,
        },
        { ...HTTPSTATUS["400"] }
      );
    }

    const decision = await aj.protect(request, { email, requested: 1 });

    if (decision.isDenied()) {
      if (decision.reason.isBot()) {
        return NextResponse.json(
          {
            status: false,
            statusCode: 403,
            message:
              "SYSTEM_SECURITY: Our internal system just raised a concern that you might be a bot",
            errors: decision.results,
          },
          HTTPSTATUS["403"]
        );
      }

      if (decision.reason.isEmail()) {
        return NextResponse.json(
          {
            status: false,
            statusCode: 403,
            message:
              "SYSTEM_SECURITY: Our internal system just raised a concern that the email you provided might be a fake email address, Please try changing your email address and try again",
            errors: decision.results,
          },
          HTTPSTATUS["403"]
        );
      }
    }

    await connectToDatabase();

    const user = new UserService(identifier);

    let newlyCreatedUser;

    if (data.type === IRole.STUDENT) {
      newlyCreatedUser = await user.createStudent(
        email,
        data.password,
        name,
        subjects
      );
    }

    if (data.type === IRole.TEACHER) {
      newlyCreatedUser = await user.createTeacher(
        email,
        data.password,
        name,
        subjects
      );
    }

    if (newlyCreatedUser) {
      cookiesStore.set(
        _CONSTANTS.AUTH_HEADER,
        newlyCreatedUser?.authentication?.sessionToken!,
        COOKIES_OPTION
      );
      cookiesStore.set("user_session", "true", COOKIES_OPTION);
    }

    return NextResponse.json(
      {
        status: true,
        message: "Account Created Successfully",
        data: newlyCreatedUser,
        statusCode: 201,
      },
      { ...HTTPSTATUS["201"] }
    );
  } catch (error) {
    //logger.error((error as Error).message || "Account Creation Failed");
    return NextResponse.json(
      {
        status: false,
        message: (error as Error).message || "Account Creation Failed",
        statusCode: 500,
      },
      { ...HTTPSTATUS["500"] }
    );
  }
}
