import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { authenticate } from "@/lib/customers";
import { createCustomerSessionToken, CUSTOMER_COOKIE, CUSTOMER_MAX_AGE } from "@/lib/customerAuth";

export const metadata = { title: "Sign in" };

async function signIn(formData: FormData) {
  "use server";
  const email = String(formData.get("email") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/account");

  const customer = await authenticate(email, password);
  if (!customer) {
    redirect(`/login?error=1&next=${encodeURIComponent(next)}`);
  }
  const token = await createCustomerSessionToken(customer.id);
  cookies().set(CUSTOMER_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: CUSTOMER_MAX_AGE,
    path: "/",
  });
  redirect(next);
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const next = searchParams.next ?? "/account";
  const error = searchParams.error;

  return (
    <main className="grid min-h-[80vh] place-items-center bg-cream px-page-x py-12">
      <div className="w-full max-w-md card p-8 md:p-10">
        <p className="label-rule">Welcome back</p>
        <h1 className="mt-4 font-display font-700 text-display-md text-coffee leading-tight">
          Sign in.
        </h1>

        <form action={signIn} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next} />

          <div>
            <label className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">Email</label>
            <input
              name="email"
              type="email"
              required
              className="mt-2 w-full rounded-md bg-cream/60 border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee focus:bg-cream focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 min-h-11"
            />
          </div>
          <div>
            <label className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">Password</label>
            <input
              name="password"
              type="password"
              required
              className="mt-2 w-full rounded-md bg-cream/60 border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee focus:bg-cream focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 min-h-11"
            />
          </div>

          {error && (
            <p className="font-display text-brick">
              Email or password didn&rsquo;t match.
            </p>
          )}

          <button type="submit" className="btn-primary w-full">
            <span>Sign in</span>
          </button>

          <p className="mt-3 text-center font-sans text-sm text-coffee/70">
            New here?{" "}
            <Link href={`/signup?next=${encodeURIComponent(next)}`} className="anchor font-600 text-coffee">
              Create an account
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}
