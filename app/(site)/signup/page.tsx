import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import Link from "next/link";
import { createCustomer } from "@/lib/customers";
import { createCustomerSessionToken, CUSTOMER_COOKIE, CUSTOMER_MAX_AGE } from "@/lib/customerAuth";

export const metadata = { title: "Create your account" };

async function signUp(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "").trim();
  const email = String(formData.get("email") ?? "").trim();
  const phone = String(formData.get("phone") ?? "").trim();
  const password = String(formData.get("password") ?? "");
  const next = String(formData.get("next") ?? "/account");

  if (!name || !email || password.length < 8) {
    redirect(`/signup?error=fields&next=${encodeURIComponent(next)}`);
  }

  try {
    const customer = await createCustomer({ name, email, phone, password });
    const token = await createCustomerSessionToken(customer.id);
    cookies().set(CUSTOMER_COOKIE, token, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: CUSTOMER_MAX_AGE,
      path: "/",
    });
    redirect(next);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Something went wrong";
    redirect(`/signup?error=${encodeURIComponent(message)}&next=${encodeURIComponent(next)}`);
  }
}

export default function SignupPage({
  searchParams,
}: {
  searchParams: { error?: string; next?: string };
}) {
  const next = searchParams.next ?? "/account";
  const error = searchParams.error;

  return (
    <main className="grid min-h-[80vh] place-items-center bg-cream px-page-x py-12">
      <div className="w-full max-w-md card p-8 md:p-10">
        <p className="label-rule">Create an account</p>
        <h1 className="mt-4 font-display font-700 text-display-md text-coffee leading-tight">
          Earn points on every order.
        </h1>
        <p className="editorial mt-3 text-[1rem]">
          One account across all four shops. Save your details for one-tap
          orders, and collect points that turn into rewards.
        </p>

        <form action={signUp} className="mt-8 space-y-5">
          <input type="hidden" name="next" value={next} />

          <Field label="Full name">
            <Input name="name" required />
          </Field>
          <Field label="Email">
            <Input name="email" type="email" required />
          </Field>
          <Field label="Phone (optional)">
            <Input name="phone" type="tel" />
          </Field>
          <Field label="Password" hint="At least 8 characters.">
            <Input name="password" type="password" required />
          </Field>

          {error && (
            <p className="font-display text-brick">
              {error === "fields"
                ? "Please fill in your name, email, and a password with 8+ characters."
                : decodeURIComponent(error)}
            </p>
          )}

          <button type="submit" className="btn-primary w-full">
            <span>Create account</span>
          </button>

          <p className="mt-3 text-center font-sans text-sm text-coffee/70">
            Already a customer?{" "}
            <Link href={`/login?next=${encodeURIComponent(next)}`} className="anchor font-600 text-coffee">
              Sign in
            </Link>
          </p>
        </form>
      </div>
    </main>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="block font-sans font-600 text-sm uppercase tracking-wide text-coffee">{label}</label>
      <div className="mt-2">{children}</div>
      {hint && <p className="mt-1 font-sans text-[0.85rem] text-muted">{hint}</p>}
    </div>
  );
}
function Input({
  name, type = "text", required,
}: { name: string; type?: string; required?: boolean }) {
  return (
    <input
      name={name}
      type={type}
      required={required}
      className="w-full rounded-md bg-cream/60 border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee focus:bg-cream focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 min-h-11"
    />
  );
}
