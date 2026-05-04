import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { SESSION_COOKIE } from "@/lib/auth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/admin/login";
  url.search = "";
  cookies().delete(SESSION_COOKIE);
  return NextResponse.redirect(url);
}
