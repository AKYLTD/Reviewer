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
    <main className="grid min-h-[80vh] place-items-center px-page-x">
      <div className="w-full max-w-md">
        <p className="label">Roni&rsquo;s · Admin</p>
        <h1 className="mt-3 font-display text-display-md text-ink">Sign in.</h1>
        <p className="editorial mt-4 text-muted">
          Edit brand text, hours, menu items, and prices.
        </p>

        <form action={signIn} className="mt-10 space-y-6">
          <input type="hidden" name="next" value={next} />
          <div>
            <label
              htmlFor="password"
              className="label block"
            >
              Password
            </label>
            <input
              id="password"
              name="password"
              type="password"
              required
              autoFocus
              className="mt-3 w-full border-0 border-b border-hairline bg-transparent px-0 py-3 font-editorial text-[1.0625rem] text-ink placeholder:text-muted focus:border-ink focus:outline-none focus:ring-0"
              placeholder="Enter admin password"
            />
          </div>
          {error && (
            <p className="font-editorial italic text-[0.95rem] text-ember">
              That password didn&rsquo;t match. Try again.
            </p>
          )}
          <button type="submit" className="btn-ink w-full">
            <span>Sign in</span>
          </button>
        </form>
      </div>
    </main>
  );
}
