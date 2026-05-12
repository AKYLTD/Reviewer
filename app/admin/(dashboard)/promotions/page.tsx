import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { createPromotion, deletePromotion, listPromotions, updatePromotion } from "@/lib/promotionsStore";
import { describeDiscount, type Promotion } from "@/lib/promotions";
import { Field, Input, Textarea } from "@/components/admin/Field";

export const metadata = { title: "Promotions" };
export const dynamic = "force-dynamic";

async function create(formData: FormData) {
  "use server";
  const kind = String(formData.get("kind") ?? "banner") as Promotion["kind"];
  const discountType = String(formData.get("discount_type") ?? "");
  const discountValue = Number(formData.get("discount_value") ?? 0);

  let discount: Promotion["discount"];
  if (kind !== "banner") {
    if (discountType === "percent") discount = { type: "percent", value: discountValue };
    else if (discountType === "amount") discount = { type: "amount", value: Math.round(discountValue * 100) };
    else discount = { type: "freebie", value: String(formData.get("freebie") ?? "Free item") };
  }

  await createPromotion({
    kind,
    enabled: true,
    title: String(formData.get("title") ?? "").trim(),
    description: String(formData.get("description") ?? "").trim(),
    discount,
    itemIds: kind === "item"
      ? String(formData.get("itemIds") ?? "").split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    categoryNames: kind === "category"
      ? String(formData.get("categoryNames") ?? "").split(",").map((s) => s.trim()).filter(Boolean)
      : undefined,
    code: String(formData.get("code") ?? "").trim() || undefined,
    accent: (String(formData.get("accent") ?? "brick") as Promotion["accent"]),
    startsAt: String(formData.get("startsAt") ?? "") || undefined,
    endsAt: String(formData.get("endsAt") ?? "") || undefined,
  });
  revalidatePath("/", "layout");
  redirect("/admin/promotions?created=1");
}

async function toggle(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  const current = (await listPromotions()).find((p) => p.id === id);
  if (!current) redirect("/admin/promotions");
  await updatePromotion(id, { enabled: !current.enabled });
  revalidatePath("/", "layout");
  redirect("/admin/promotions?toggled=1");
}

async function remove(formData: FormData) {
  "use server";
  const id = String(formData.get("id"));
  await deletePromotion(id);
  revalidatePath("/", "layout");
  redirect("/admin/promotions?deleted=1");
}

export default async function PromotionsPage({
  searchParams,
}: {
  searchParams: { created?: string; toggled?: string; deleted?: string };
}) {
  const promotions = await listPromotions();

  return (
    <div className="space-y-10">
      <header>
        <p className="label">Promotions</p>
        <h1 className="mt-3 font-display font-700 text-display-md text-coffee">
          Banners, discounts, codes.
        </h1>
        <p className="editorial mt-3 max-w-prose">
          A <strong>banner</strong> shows at the top of /shop. An <strong>item</strong> or{" "}
          <strong>category</strong> promo applies a discount in the cart for matching items.
        </p>
      </header>

      {(searchParams.created || searchParams.toggled || searchParams.deleted) && (
        <p className="font-display italic text-brick animate-rise">
          {searchParams.created && "Promotion created."}
          {searchParams.toggled && "Promotion toggled."}
          {searchParams.deleted && "Promotion deleted."}
        </p>
      )}

      {/* CREATE */}
      <section className="rounded-xl bg-ivory p-6 md:p-8 shadow-soft">
        <h2 className="font-display font-700 text-coffee text-xl">Create promotion</h2>
        <form action={create} className="mt-6 grid gap-5 md:grid-cols-2">
          <Field label="Kind">
            <select
              name="kind"
              defaultValue="banner"
              className="w-full rounded-md bg-cream border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 min-h-11"
            >
              <option value="banner">Banner (shop top)</option>
              <option value="item">Item discount (cart)</option>
              <option value="category">Category discount (cart)</option>
            </select>
          </Field>
          <Field label="Accent">
            <select
              name="accent"
              defaultValue="brick"
              className="w-full rounded-md bg-cream border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 min-h-11"
            >
              <option value="brick">Brick</option>
              <option value="saffron">Saffron</option>
              <option value="dusk">Dusk</option>
              <option value="ember">Ember (deep brick)</option>
            </select>
          </Field>

          <Field label="Title">
            <Input name="title" placeholder="e.g. New Year, new bagel" />
          </Field>
          <Field label="Promo code (optional)">
            <Input name="code" placeholder="e.g. NY25" />
          </Field>

          <div className="md:col-span-2">
            <Field label="Description">
              <Textarea name="description" rows={2} placeholder="Short tagline shown beneath the title." />
            </Field>
          </div>

          <Field label="Discount type">
            <select
              name="discount_type"
              defaultValue="percent"
              className="w-full rounded-md bg-cream border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 min-h-11"
            >
              <option value="percent">Percent off (e.g. 10)</option>
              <option value="amount">Amount off £ (e.g. 2.00)</option>
              <option value="freebie">Freebie (no monetary discount)</option>
            </select>
          </Field>
          <Field label="Discount value">
            <Input name="discount_value" type="number" step="0.01" defaultValue="10" />
          </Field>

          <Field label="Item ids (comma-separated) — for item kind">
            <Input name="itemIds" placeholder="bagel-plain, bagel-everything" />
          </Field>
          <Field label="Category names (comma-separated) — for category kind">
            <Input name="categoryNames" placeholder="Bagels, Coffee" />
          </Field>

          <Field label="Starts at (optional)">
            <Input name="startsAt" type="datetime-local" />
          </Field>
          <Field label="Ends at (optional)">
            <Input name="endsAt" type="datetime-local" />
          </Field>

          <div className="md:col-span-2 pt-2">
            <button type="submit" className="btn-primary">
              <span>Create promotion</span>
            </button>
          </div>
        </form>
      </section>

      {/* LIST */}
      <section>
        <h2 className="font-display font-700 text-coffee text-xl mb-4">Active &amp; scheduled</h2>
        {promotions.length === 0 ? (
          <p className="editorial text-muted">No promotions yet.</p>
        ) : (
          <ul className="space-y-4">
            {promotions.map((p) => (
              <li key={p.id} className="rounded-xl bg-ivory p-6 shadow-soft">
                <div className="flex flex-wrap items-baseline justify-between gap-3">
                  <div className="min-w-0">
                    <p className="label">{p.kind} · {p.enabled ? "active" : "disabled"}</p>
                    <p className="mt-1 font-display font-700 text-coffee text-lg">{p.title}</p>
                    {p.description && (
                      <p className="font-sans text-sm text-coffee/80 mt-1">{p.description}</p>
                    )}
                    {p.discount && (
                      <p className="mt-2 inline-flex items-center rounded-pill bg-saffron px-3 py-1 font-display font-700 text-xs text-coffee">
                        {describeDiscount(p.discount)}
                      </p>
                    )}
                    {p.code && (
                      <p className="mt-2 font-sans text-sm text-coffee/80">
                        Code: <code className="bg-cream rounded px-2 py-0.5 font-display font-700">{p.code}</code>
                      </p>
                    )}
                    {p.itemIds?.length && (
                      <p className="mt-1 font-sans text-xs text-muted">Items: {p.itemIds.join(", ")}</p>
                    )}
                    {p.categoryNames?.length && (
                      <p className="mt-1 font-sans text-xs text-muted">Categories: {p.categoryNames.join(", ")}</p>
                    )}
                    <p className="mt-2 font-sans text-xs text-muted">
                      {p.startsAt && `From ${new Date(p.startsAt).toLocaleDateString("en-GB")}`}
                      {p.startsAt && p.endsAt && " · "}
                      {p.endsAt && `Until ${new Date(p.endsAt).toLocaleDateString("en-GB")}`}
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-2">
                    <form action={toggle}>
                      <input type="hidden" name="id" value={p.id} />
                      <button type="submit" className="btn-ghost text-xs px-4 py-2 min-h-11">
                        {p.enabled ? "Disable" : "Enable"}
                      </button>
                    </form>
                    <form action={remove}>
                      <input type="hidden" name="id" value={p.id} />
                      <button
                        type="submit"
                        className="font-sans text-xs font-600 uppercase tracking-widest text-brick hover:underline px-2 self-center"
                      >
                        Delete
                      </button>
                    </form>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
