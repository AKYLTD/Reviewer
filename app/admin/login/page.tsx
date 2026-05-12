import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createSessionToken, passwordMatches, SESSION_COOKIE, SESSION_MAX_AGE } from "@/lib/auth";

export const metadata = { title: "Admin · Sign in" };

async function signIn(formData: FormData) {
  "use server";
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/admin");
  if (!passwordMatches(password)) {
    redirect(`/admin/login?error=1&next=${encodeURIComponent(next)}`);
  }
  const token = await createSessionToken();
  cookies().set(SESSION_COOKIE, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    maxAge: SESSION_MAX_AGE,
    path: "/",
  });
  redirect(next.startsWith("/admin") ? next : "/admin");
}

export default function LoginPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const error = searchParams.error === "1";
  const next = searchParams.next ?? "/admin";

  return (
    <main className="grid min-h-screen place-items-center bg-cream px-page-x">
      <div className="card w-full max-w-md p-10">
        <span className="label">Admin</span>
        <h1 className="mt-3 font-display font-700 text-display-md text-coffee leading-tight">
          Sign in.
        </h1>
        <p className="editorial mt-3">
          Edit brand text, hours, menu items, and prices.
        </p>

        <form action={signIn} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next} />
          <div>
            <label htmlFor="password" className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="mt-2 w-full rounded-md bg-cream/60 border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee placeholder:text-muted focus:bg-cream focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 transition"
              placeholder="Enter admin password"
            />
          </div>
          {error && (
            <p className="font-display text-brick">
              That password didn&rsquo;t match. Try again.
            </p>
          )}
          <button type="submit" className="btn-primary w-full">
            <span>Sign in</span>
          </button>
        </form>
      </div>
    </main>
  );
}
