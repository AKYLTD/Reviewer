import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import Link from "next/link";
import { getSettings, saveSettings, type CakeSizeRecord } from "@/lib/settings";
import { Field, Input } from "@/components/admin/Field";

export const metadata = { title: "Cake order settings" };
export const dynamic = "force-dynamic";

async function saveChannel(formData: FormData) {
  "use server";
  const current = await getSettings();
  const next = {
    ...current,
    channels: {
      ...current.channels,
      cakes: {
        enabled: formData.get("enabled") === "on",
        leadHours: Math.max(0, Number(formData.get("leadHours") ?? current.channels.cakes.leadHours)),
        replyEmail: String(formData.get("replyEmail") ?? "").trim(),
      },
    },
  };
  await saveSettings(next);
  revalidatePath("/", "layout");
  redirect("/admin/settings/cake?saved=channel");
}

async function saveSizes(formData: FormData) {
  "use server";
  const current = await getSettings();
  const sizes: CakeSizeRecord[] = current.cake.sizes.map((s, i) => ({
    id: s.id,
    inches: Number(formData.get(`size_${i}_inches`) ?? s.inches),
    label: String(formData.get(`size_${i}_label`) ?? s.label),
    serves: String(formData.get(`size_${i}_serves`) ?? s.serves),
    price: Math.round(Number(formData.get(`size_${i}_price`) ?? s.price / 100) * 100),
  }));
  const next = {
    ...current,
    cake: {
      ...current.cake,
      sizes,
      imageShapeSurcharge: Math.round(
        Number(formData.get("imageSurcharge") ?? current.cake.imageShapeSurcharge / 100) * 100,
      ),
      fillingSurcharges: {
        fruits: Math.round(Number(formData.get("fruits") ?? current.cake.fillingSurcharges.fruits / 100) * 100),
        jam: Math.round(Number(formData.get("jam") ?? current.cake.fillingSurcharges.jam / 100) * 100),
      },
    },
  };
  await saveSettings(next);
  revalidatePath("/", "layout");
  redirect("/admin/settings/cake?saved=sizes");
}

export default async function CakeSettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const settings = await getSettings();
  const ch = settings.channels.cakes;

  return (
    <div className="space-y-12">
      <header>
        <p className="label">Cake order settings</p>
        <h1 className="mt-3 font-display font-700 text-display-md text-coffee">
          Sizes, surcharges, lead time.
        </h1>
        <p className="editorial mt-3 max-w-prose">
          Everything that drives the live cake builder on{" "}
          <Link href="/cakes/order" className="anchor font-600">/cakes/order</Link>{" "}
          and the kitchen reply flow. Catering has its own page{" "}
          <Link href="/admin/settings/catering" className="anchor font-600">here</Link>.
        </p>
      </header>

      {searchParams.saved === "channel" && (
        <p className="font-display italic text-brick animate-rise">Channel saved.</p>
      )}
      {searchParams.saved === "sizes" && (
        <p className="font-display italic text-brick animate-rise">Cake price book saved.</p>
      )}

      {/* CHANNEL */}
      <form action={saveChannel} className="rounded-xl bg-ivory p-6 md:p-8 shadow-soft space-y-5">
        <header>
          <h2 className="font-display font-700 text-coffee text-xl">Channel</h2>
          <p className="font-sans text-sm text-muted mt-1">Turn cake ordering on/off, set the minimum lead time, and choose where replies come from.</p>
        </header>
        <label className="inline-flex items-center gap-3 cursor-pointer">
          <input
            type="checkbox"
            name="enabled"
            defaultChecked={ch.enabled}
            className="h-5 w-5 rounded border-2 border-hairline accent-brick"
          />
          <span className="font-display font-600 text-coffee">Cake orders enabled</span>
        </label>
        <div className="grid gap-5 md:grid-cols-2">
          <Field label="Minimum lead time (hours)">
            <Input name="leadHours" type="number" min={1} defaultValue={String(ch.leadHours)} />
          </Field>
          <Field label="Reply-from email">
            <Input name="replyEmail" type="email" defaultValue={ch.replyEmail} />
          </Field>
        </div>
        <button type="submit" className="btn-primary text-sm"><span>Save channel</span></button>
      </form>

      {/* PRICE BOOK */}
      <form action={saveSizes} className="space-y-6">
        <header>
          <h2 className="font-display font-700 text-coffee text-2xl">Price book</h2>
          <p className="font-sans text-sm text-muted mt-1">
            Edit the cake sizes shown to customers. Prices are in pounds.
          </p>
        </header>

        <div className="rounded-xl bg-ivory p-6 shadow-soft overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead>
              <tr className="border-b border-hairline">
                <th className="py-3 pr-4 font-sans font-600 uppercase tracking-wide text-xs text-coffee/70">Label</th>
                <th className="py-3 pr-4 font-sans font-600 uppercase tracking-wide text-xs text-coffee/70">Inches</th>
                <th className="py-3 pr-4 font-sans font-600 uppercase tracking-wide text-xs text-coffee/70">Serves</th>
                <th className="py-3 pr-4 font-sans font-600 uppercase tracking-wide text-xs text-coffee/70">Price (£)</th>
              </tr>
            </thead>
            <tbody>
              {settings.cake.sizes.map((s, i) => (
                <tr key={s.id} className="border-b border-hairline last:border-0">
                  <td className="py-3 pr-4"><Input name={`size_${i}_label`} defaultValue={s.label} /></td>
                  <td className="py-3 pr-4"><Input name={`size_${i}_inches`} type="number" defaultValue={s.inches} min={1} /></td>
                  <td className="py-3 pr-4"><Input name={`size_${i}_serves`} defaultValue={s.serves} /></td>
                  <td className="py-3 pr-4"><Input name={`size_${i}_price`} type="number" step="0.01" defaultValue={(s.price / 100).toFixed(2)} min={0} /></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-ivory p-6 shadow-soft grid gap-5 md:grid-cols-3">
          <Field label="Image-print surcharge (£)" hint="Added when shape = 'image'.">
            <Input name="imageSurcharge" type="number" step="0.01" defaultValue={(settings.cake.imageShapeSurcharge / 100).toFixed(2)} min={0} />
          </Field>
          <Field label="Fruit-layer surcharge (£)">
            <Input name="fruits" type="number" step="0.01" defaultValue={(settings.cake.fillingSurcharges.fruits / 100).toFixed(2)} min={0} />
          </Field>
          <Field label="Jam-layer surcharge (£)">
            <Input name="jam" type="number" step="0.01" defaultValue={(settings.cake.fillingSurcharges.jam / 100).toFixed(2)} min={0} />
          </Field>
        </div>

        <button type="submit" className="btn-primary"><span>Save price book</span></button>
      </form>
    </div>
  );
}
