import { HTTPSTATUS } from "@/lib/constants";
import { IRole } from "@/models/users.model";
import { connectToDatabase } from "@/server/_libs";
import { UserService } from "@/server/services";
import accountCreationSchema from "@/validations/account-creation-schema";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const result = accountCreationSchema.safeParse(body);

    if (!result.success) {
      return NextResponse.json(
        {
          status: false,
          message: "ACCOUNT_CREATION_ERROR: Missing required parameters",
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
