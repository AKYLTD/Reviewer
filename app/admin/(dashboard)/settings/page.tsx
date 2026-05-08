import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getSettings, saveSettings, type CakeSizeRecord } from "@/lib/settings";
import { Field, Input } from "@/components/admin/Field";

export const metadata = { title: "Settings" };
export const dynamic = "force-dynamic";

async function saveChannels(formData: FormData) {
  "use server";
  const current = await getSettings();
  const next = {
    ...current,
    channels: {
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
      catering: {
        enabled: formData.get("cat_enabled") === "on",
        leadHours: Number(formData.get("cat_leadHours") ?? current.channels.catering.leadHours),
        minHeadcount: Number(formData.get("cat_min") ?? current.channels.catering.minHeadcount),
        replyEmail: String(formData.get("cat_email") ?? "").trim(),
      },
      cakes: {
        enabled: formData.get("cake_enabled") === "on",
        leadHours: Number(formData.get("cake_leadHours") ?? current.channels.cakes.leadHours),
        replyEmail: String(formData.get("cake_email") ?? "").trim(),
      },
    },
  };
  await saveSettings(next);
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=channels");
}

async function saveCakeSizes(formData: FormData) {
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
        fruits: Math.round(
          Number(formData.get("fruits") ?? current.cake.fillingSurcharges.fruits / 100) * 100,
        ),
        jam: Math.round(
          Number(formData.get("jam") ?? current.cake.fillingSurcharges.jam / 100) * 100,
        ),
      },
    },
  };
  await saveSettings(next);
  revalidatePath("/", "layout");
  redirect("/admin/settings?saved=cake");
}

export default async function SettingsPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const settings = await getSettings();
  const ch = settings.channels;

  return (
    <div className="space-y-12">
      <header>
        <p className="label">Settings</p>
        <h1 className="mt-3 font-display font-700 text-display-md text-coffee">
          How each channel runs.
        </h1>
        <p className="editorial mt-3 max-w-prose">
          Lead times, cut-offs, reply addresses, and the cake price book.
          Changes here update the live site immediately.
        </p>
      </header>

      {searchParams.saved && (
        <p className="font-display italic text-brick animate-rise">
          {searchParams.saved === "channels" && "Channel settings saved."}
          {searchParams.saved === "cake" && "Cake price book saved."}
        </p>
      )}

      {/* CHANNELS */}
      <form action={saveChannels} className="space-y-8">
        <h2 className="font-display font-700 text-coffee text-2xl">Channels</h2>

        <ChannelCard title="Click & collect" description="Walk-in pickup. Plumbed through Square Online.">
          <Toggle name="cc_enabled" defaultChecked={ch["click-collect"].enabled} label="Enabled" />
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Lead time (minutes)">
              <Input name="cc_leadMinutes" type="number" defaultValue={ch["click-collect"].leadMinutes} min={1} />
            </Field>
            <Field label="Cut-off before close (minutes)">
              <Input name="cc_cutoff" type="number" defaultValue={ch["click-collect"].cutOffMinutesBeforeClose} min={0} />
            </Field>
            <Field label="Square Online URL" hint="Where the Order Ahead button takes the customer.">
              <Input name="cc_url" type="url" defaultValue={ch["click-collect"].squareOnlineUrl} placeholder="https://order.ronisbelsize.com" />
            </Field>
          </div>
        </ChannelCard>

        <ChannelCard title="Order at table" description="QR-driven dine-in flow.">
          <Toggle name="oat_enabled" defaultChecked={ch["order-at-table"].enabled} label="Enabled" />
          <Field label="Square Online URL" hint="Optional — leave blank if you embed the dine-in menu inline.">
            <Input name="oat_url" type="url" defaultValue={ch["order-at-table"].squareOnlineUrl} />
          </Field>
        </ChannelCard>

        <ChannelCard title="Catering" description="Enquiry-first; replies sent from the address below.">
          <Toggle name="cat_enabled" defaultChecked={ch.catering.enabled} label="Enabled" />
          <div className="grid gap-5 md:grid-cols-3">
            <Field label="Minimum lead time (hours)">
              <Input name="cat_leadHours" type="number" defaultValue={ch.catering.leadHours} min={1} />
            </Field>
            <Field label="Minimum guests">
              <Input name="cat_min" type="number" defaultValue={ch.catering.minHeadcount} min={1} />
            </Field>
            <Field label="Reply-from email">
              <Input name="cat_email" type="email" defaultValue={ch.catering.replyEmail} />
            </Field>
          </div>
        </ChannelCard>

        <ChannelCard title="Cakes" description="Cake orders with a quoted total. Customer pays on collection.">
          <Toggle name="cake_enabled" defaultChecked={ch.cakes.enabled} label="Enabled" />
          <div className="grid gap-5 md:grid-cols-2">
            <Field label="Minimum lead time (hours)">
              <Input name="cake_leadHours" type="number" defaultValue={ch.cakes.leadHours} min={1} />
            </Field>
            <Field label="Reply-from email">
              <Input name="cake_email" type="email" defaultValue={ch.cakes.replyEmail} />
            </Field>
          </div>
        </ChannelCard>

        <button type="submit" className="btn-primary">
          <span>Save channel settings</span>
        </button>
      </form>

      {/* CAKE PRICE BOOK */}
      <form action={saveCakeSizes} className="space-y-6">
        <header>
          <h2 className="font-display font-700 text-coffee text-2xl">Cake price book</h2>
          <p className="font-sans text-sm text-muted mt-1">
            These sizes and surcharges drive the live cake builder on{" "}
            <a className="anchor" href="/cakes/order">/cakes/order</a>.
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
                  <td className="py-3 pr-4">
                    <Input name={`size_${i}_label`} defaultValue={s.label} />
                  </td>
                  <td className="py-3 pr-4">
                    <Input name={`size_${i}_inches`} type="number" defaultValue={s.inches} min={1} />
                  </td>
                  <td className="py-3 pr-4">
                    <Input name={`size_${i}_serves`} defaultValue={s.serves} />
                  </td>
                  <td className="py-3 pr-4">
                    <Input name={`size_${i}_price`} type="number" step="0.01" defaultValue={(s.price / 100).toFixed(2)} min={0} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="rounded-xl bg-ivory p-6 shadow-soft grid gap-5 md:grid-cols-3">
          <Field label="Image-print surcharge (£)" hint="Added when the customer picks the 'image' shape.">
            <Input name="imageSurcharge" type="number" step="0.01" defaultValue={(settings.cake.imageShapeSurcharge / 100).toFixed(2)} min={0} />
          </Field>
          <Field label="Fruit-layer surcharge (£)">
            <Input name="fruits" type="number" step="0.01" defaultValue={(settings.cake.fillingSurcharges.fruits / 100).toFixed(2)} min={0} />
          </Field>
          <Field label="Jam-layer surcharge (£)">
            <Input name="jam" type="number" step="0.01" defaultValue={(settings.cake.fillingSurcharges.jam / 100).toFixed(2)} min={0} />
          </Field>
        </div>

        <button type="submit" className="btn-primary">
          <span>Save cake price book</span>
        </button>
      </form>
    </div>
  );
}

function ChannelCard({
  title,
  description,
  children,
}: {
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  return (
    <section className="rounded-xl bg-ivory p-6 shadow-soft space-y-5">
      <header>
        <h3 className="font-display font-700 text-coffee text-xl">{title}</h3>
        <p className="font-sans text-sm text-muted mt-1">{description}</p>
      </header>
      {children}
    </section>
  );
}

function Toggle({ name, defaultChecked, label }: { name: string; defaultChecked: boolean; label: string }) {
  return (
    <label className="inline-flex items-center gap-3 cursor-pointer select-none">
      <input
        type="checkbox"
        name={name}
        defaultChecked={defaultChecked}
        className="h-5 w-5 rounded border-2 border-hairline accent-brick"
      />
      <span className="font-display font-600 text-coffee">{label}</span>
    </label>
  );
}
