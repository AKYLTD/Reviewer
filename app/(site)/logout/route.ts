import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { CUSTOMER_COOKIE } from "@/lib/customerAuth";

export async function GET(req: Request) {
  const url = new URL(req.url);
  url.pathname = "/";
  url.search = "";
  cookies().delete(CUSTOMER_COOKIE);
  return NextResponse.redirect(url);
}
