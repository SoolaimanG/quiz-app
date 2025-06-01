import { HTTPSTATUS } from "@/lib/constants";
import { Test } from "@/server/test.service";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const { emails, emailTemplate, subject } = body;

    const test = new Test();

    await test.queueEmailToSend(emails, emailTemplate, subject);

    return NextResponse.json(
      { status: true, statusCode: 200, message: "Email queued successfully" },
      { ...HTTPSTATUS["200"] }
    );
  } catch (error) {
    return NextResponse.json(
      {
        status: 500,
        statusCode: 500,
        message: (error as Error).message,
      },
      HTTPSTATUS["500"]
    );
  }
}
