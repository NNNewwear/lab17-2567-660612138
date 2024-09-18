import { NextResponse } from "next/server";

export const GET = async () => {
  return NextResponse.json({
    ok: true,
    fullName: "Kantapong Temeesak",
    studentId: "660612138",
  });
};
