import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSettings, saveSettings } from "@/lib/settings";
import { Field, Input } from "@/components/admin/Field";

export const metadata = { title: "Catering settings" };
export const dynamic = "force-dynamic";

async function save(formData: FormData) {
  "use server";
  const current = await getSettings();
  const next = {
    ...current,
    channels: {
      ...current.channels,
      catering: {
        enabled: formData.get("enabled") === "on",
        leadHours: Math.max(0, Number(formData.get("leadHours") ?? current.channels.catering.leadHours)),
        minHeadcount: Math.max(1, Number(formData.get("minHeadcount") ?? current.channels.catering.minHeadcount)),
        replyEmail: String(formData.get("replyEmail") ?? "").trim(),
      },
    },
  };
  await saveSettings(next);
  revalidatePath("/", "layout");
  redirect("/admin/settings/catering?saved=1");
}

export default async function CateringSettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const settings = await getSettings();
  const ch = settings.channels.catering;

  return (
    <div className="space-y-10">
      <header>
        <p className="label">Catering settings</p>
        <h1 className="mt-3 font-display font-700 text-display-md text-coffee">
          Lead time, headcount, replies.
        </h1>
        <p className="editorial mt-3 max-w-prose">
          Controls the catering enquiry form on{" "}
          <Link href="/catering" className="anchor font-600">/catering</Link>{" "}
          and the kitchen reply flow. Cake orders have their own page{" "}
          <Link href="/admin/settings/cake" className="anchor font-600">here</Link>.
        </p>
      </header>

      {searchParams.saved && (
        <p className="font-display italic text-brick animate-rise">Catering settings saved.</p>
      )}

      <form action={save} className="rounded-xl bg-ivory p-6 md:p-8 shadow-soft space-y-5 max-w-2xl">
        <label className="inline-flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={ch.enabled}
            className="h-5 w-5 rounded border-2 border-hairline accent-brick"
          />
          <span className="font-display font-600 text-coffee">Catering enquiries enabled</span>
        </label>

        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Minimum lead time (hours)">
            <Input name="leadHours" type="number" min={1} defaultValue={String(ch.leadHours)} />
          </Field>
          <Field label="Minimum guest count">
            <Input name="minHeadcount" type="number" min={1} defaultValue={String(ch.minHeadcount)} />
          </Field>
        </div>

        <Field label="Reply-from email">
          <Input name="replyEmail" type="email" defaultValue={ch.replyEmail} />
        </Field>

        <button type="submit" className="btn-primary"><span>Save catering settings</span></button>
      </form>

      <section className="rounded-xl bg-rose p-6 md:p-8 shadow-soft max-w-2xl">
        <p className="label">Sample platters</p>
        <h2 className="mt-3 font-display font-700 text-coffee text-xl">
          Coming next
        </h2>
        <p className="editorial mt-3 text-[0.95rem] max-w-prose">
          A dedicated editor for the catering platters list (currently
          hard-coded on <code className="bg-cream/70 rounded px-2 py-0.5">/catering</code>) is the
          next step on this page. Tell me when you want it and I&rsquo;ll
          move the platter table into a JSON store under data/.
        </p>
      </section>
    </div>
  );
}
