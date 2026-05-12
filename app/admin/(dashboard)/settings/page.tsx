import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSettings, saveSettings } from "@/lib/settings";
import { Field, Input } from "@/components/admin/Field";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

async function saveOnlineChannels(formData: FormData) {
  "use server";
  const current = await getSettings();
  const next = {
    ...current,
    channels: {
      ...current.channels,
      "click-collect": {
        enabled: formData.get("cc_enabled") === "on",
        leadMinutes: Number(formData.get("cc_leadMinutes") ?? current.channels["click-collect"].leadMinutes),
        cutOffMinutesBeforeClose: Number(formData.get("cc_cutoff") ?? current.channels["click-collect"].cutOffMinutesBeforeClose),
        squareOnlineUrl: String(formData.get("cc_url") ?? "").trim(),
      },
      "order-at-table": {
        enabled: formData.get("oat_enabled") === "on",
        squareOnlineUrl: String(formData.get("oat_url") ?? "").trim(),
      },
    },
  };
  await saveSettings(next);
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=1");
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const settings = await getSettings();
  const cc = settings.channels["click-collect"];
  const oat = settings.channels["order-at-table"];

  return (
    <div className="space-y-10">
      <header>
        <p className="label">Settings</p>
        <h1 className="mt-3 font-display font-700 text-display-md text-coffee">
          Channel configuration.
        </h1>
        <p className="editorial mt-3 max-w-prose">
          Cake and Catering have their own dedicated settings — split out
          so the editor stays focused. Click & collect / Order at table
          live here.
        </p>
      </header>

      {searchParams.saved && (
        <p className="font-display italic text-brick animate-rise">Saved.</p>
      )}

      {/* DEDICATED PAGES */}
      <section className="grid gap-5 md:grid-cols-2">
        <Tile
          href="/admin/settings/cake"
          title="Cake order settings"
          body="Sizes & prices, surcharges, lead time, kitchen reply email. Drives /cakes/order end-to-end."
        />
        <Tile
          href="/admin/settings/catering"
          title="Catering settings"
          body="Lead time, minimum headcount, reply email. Drives the /catering enquiry form."
        />
      </section>

      {/* IN-LINE CHANNELS */}
      <form action={saveOnlineChannels} className="space-y-6">
        <h2 className="font-display font-700 text-coffee text-2xl">Other channels</h2>

        <section className="rounded-xl bg-ivory p-6 md:p-8 shadow-soft space-y-5">
          <header>
            <h3 className="font-display font-700 text-coffee text-xl">Click &amp; collect</h3>
            <p className="font-sans text-sm text-muted mt-1">Walk-in pickup. Plumbed through Square Online.</p>
          </header>
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="cc_enabled" defaultChecked={cc.enabled} className="h-5 w-5 rounded border-2 border-hairline accent-brick" />
            <span className="font-display font-600 text-coffee">Enabled</span>
          </label>
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Lead time (minutes)">
              <Input name="cc_leadMinutes" type="number" defaultValue={cc.leadMinutes} min={1} />
            </Field>
            <Field label="Cut-off before close (minutes)">
              <Input name="cc_cutoff" type="number" defaultValue={cc.cutOffMinutesBeforeClose} min={0} />
            </Field>
            <Field label="Square Online URL">
              <Input name="cc_url" type="url" defaultValue={cc.squareOnlineUrl} placeholder="https://order.ronisbelsize.com" />
            </Field>
          </div>
        </section>

        <section className="rounded-xl bg-ivory p-6 md:p-8 shadow-soft space-y-5">
          <header>
            <h3 className="font-display font-700 text-coffee text-xl">Order at table</h3>
            <p className="font-sans text-sm text-muted mt-1">QR-driven dine-in flow.</p>
          </header>
          <label className="inline-flex items-center gap-3 cursor-pointer">
            <input type="checkbox" name="oat_enabled" defaultChecked={oat.enabled} className="h-5 w-5 rounded border-2 border-hairline accent-brick" />
            <span className="font-display font-600 text-coffee">Enabled</span>
          </label>
          <Field label="Square Online URL" hint="Optional — leave blank if you embed the dine-in menu inline.">
            <Input name="oat_url" type="url" defaultValue={oat.squareOnlineUrl} />
          </Field>
        </section>

        <button type="submit" className="btn-primary"><span>Save channel settings</span></button>
      </form>
    </div>
  );
}

function Tile({ href, title, body }: { href: string; title: string; body: string }) {
  return (
    <Link
      href={href}
      className="block rounded-xl bg-ivory p-6 shadow-soft transition-all hover:-translate-y-0.5 hover:shadow-pop"
    >
      <p className="font-display font-700 text-coffee text-xl">
        {title}{" "}
        <span aria-hidden className="text-brick">&rarr;</span>
      </p>
      <p className="font-sans text-sm text-coffee/75 mt-2 leading-relaxed">{body}</p>
    </Link>
  );
}
