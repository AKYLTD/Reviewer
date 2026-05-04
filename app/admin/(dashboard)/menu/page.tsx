import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getMenu, saveMenu, priceFromPence } from "@/lib/content";
import { Field, Input, Textarea } from "@/components/admin/Field";

export const metadata = { title: "Menu" };

async function addItem(formData: FormData) {
  "use server";
  const menu = await getMenu();
  const name = String(formData.get("name") ?? "").trim();
  const description = String(formData.get("description") ?? "").trim();
  const categoryId = String(formData.get("categoryId") ?? "").trim() ||
    menu.categories[0]?.id ||
    "uncategorised";
  const price = Math.round(Number(formData.get("price") ?? 0) * 100);
  const imageSrc = String(formData.get("imageSrc") ?? "").trim();

  if (!name) redirect("/admin/menu?error=missing-name");

  const id = `${categoryId}-${slug(name)}-${Date.now().toString(36)}`;
  menu.items.push({ id, name, description, categoryId, price, imageSrc });
  await saveMenu(menu);
  revalidatePath("/menu");
  redirect("/admin/menu?added=1");
}

async function updateItem(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const menu = await getMenu();
  const idx = menu.items.findIndex((i) => i.id === id);
  if (idx === -1) redirect("/admin/menu?error=missing");
  menu.items[idx] = {
    ...menu.items[idx],
    name: String(formData.get("name") ?? menu.items[idx].name),
    description: String(formData.get("description") ?? menu.items[idx].description),
    categoryId: String(formData.get("categoryId") ?? menu.items[idx].categoryId),
    price: Math.round(Number(formData.get("price") ?? menu.items[idx].price / 100) * 100),
    imageSrc: String(formData.get("imageSrc") ?? menu.items[idx].imageSrc),
  };
  await saveMenu(menu);
  revalidatePath("/menu");
  redirect("/admin/menu?saved=1");
}

async function deleteItem(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const menu = await getMenu();
  menu.items = menu.items.filter((i) => i.id !== id);
  await saveMenu(menu);
  revalidatePath("/menu");
  redirect("/admin/menu?deleted=1");
}

async function addCategory(formData: FormData) {
  "use server";
  const menu = await getMenu();
  const name = String(formData.get("category_name") ?? "").trim();
  if (!name) redirect("/admin/menu?error=missing-category");
  const id = slug(name);
  if (menu.categories.find((c) => c.id === id)) redirect("/admin/menu?error=duplicate");
  menu.categories.push({ id, name });
  await saveMenu(menu);
  revalidatePath("/menu");
  redirect("/admin/menu?cat=1");
}

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "item";
}

export default async function MenuAdminPage({
  searchParams,
}: {
  searchParams: { saved?: string; added?: string; deleted?: string; cat?: string; error?: string };
}) {
  const menu = await getMenu();
  const squareConnected = Boolean(process.env.SQUARE_ACCESS_TOKEN);

  return (
    <div>
      <p className="label">Menu</p>
      <h1 className="mt-3 font-display text-display-md text-ink">
        Dishes, prices, categories.
      </h1>

      {squareConnected && (
        <div className="mt-6 border border-hairline bg-bone p-6 max-w-3xl">
          <p className="label">Square is connected</p>
          <p className="editorial mt-3 text-[1rem]">
            Your live menu on{" "}
            <Link href="/menu" className="anchor">
              /menu
            </Link>{" "}
            is pulled directly from Square Catalog every minute. Edits below
            only show if Square is unavailable. To change items / prices for
            the live site, edit them in Square &mdash;{" "}
            <a className="anchor" href="https://squareup.com/dashboard/items/library" target="_blank" rel="noopener noreferrer">
              dashboard.squareup.com
            </a>
            .
          </p>
        </div>
      )}

      {(searchParams.saved || searchParams.added || searchParams.deleted || searchParams.cat) && (
        <p className="mt-6 font-editorial italic text-[0.95rem] text-ember animate-rise">
          {searchParams.added && "Item added."}
          {searchParams.saved && "Item updated."}
          {searchParams.deleted && "Item removed."}
          {searchParams.cat && "Category added."}
        </p>
      )}

      {/* ADD ITEM */}
      <section className="mt-12 border-t border-hairline pt-10">
        <h2 className="font-display text-display-sm text-ink">Add a dish</h2>
        <form action={addItem} className="mt-6 grid gap-5 md:grid-cols-12 md:max-w-4xl">
          <div className="md:col-span-4">
            <Field label="Name">
              <Input name="name" placeholder="Plain bagel" required />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Category">
              <select
                name="categoryId"
                defaultValue={menu.categories[0]?.id}
                className="w-full border-0 border-b border-hairline bg-transparent px-0 py-3 font-editorial text-[1.0625rem] text-ink focus:border-ink focus:outline-none focus:ring-0"
              >
                {menu.categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </Field>
          </div>
          <div className="md:col-span-2">
            <Field label="Price (£)">
              <Input name="price" type="number" step="0.01" min={0} placeholder="2.50" required />
            </Field>
          </div>
          <div className="md:col-span-3">
            <Field label="Image (optional)">
              <Input name="imageSrc" placeholder="/uploads/…" />
            </Field>
          </div>
          <div className="md:col-span-12">
            <Field label="Description">
              <Textarea name="description" rows={2} placeholder="Boiled, baked, hand-rolled." />
            </Field>
          </div>
          <div className="md:col-span-12">
            <button type="submit" className="btn-ink">
              <span>Add dish</span>
            </button>
          </div>
        </form>
      </section>

      {/* EXISTING ITEMS */}
      <section className="mt-16 border-t border-hairline pt-10">
        <h2 className="font-display text-display-sm text-ink">Existing dishes</h2>
        {menu.items.length === 0 ? (
          <p className="editorial mt-6 text-muted">
            No items yet. Add one above to get started.
          </p>
        ) : (
          <ul className="mt-6 divide-y divide-hairline">
            {menu.items.map((item) => {
              const cat = menu.categories.find((c) => c.id === item.categoryId);
              return (
                <li key={item.id} className="py-6">
                  <details className="group">
                    <summary className="flex cursor-pointer items-baseline justify-between gap-6 list-none">
                      <div className="min-w-0">
                        <h3 className="font-editorial text-[1.2rem] text-ink">
                          {item.name}{" "}
                          <span className="label text-muted ml-2">{cat?.name ?? "—"}</span>
                        </h3>
                        {item.description && (
                          <p className="editorial mt-1 text-[0.95rem] text-muted">
                            {item.description}
                          </p>
                        )}
                      </div>
                      <span className="price-chip whitespace-nowrap">
                        {priceFromPence(item.price)}
                      </span>
                    </summary>

                    <form
                      action={updateItem}
                      className="mt-6 grid gap-4 md:grid-cols-12 border-t border-hairline pt-6"
                    >
                      <input type="hidden" name="id" value={item.id} />
                      <div className="md:col-span-4">
                        <Field label="Name">
                          <Input name="name" defaultValue={item.name} />
                        </Field>
                      </div>
                      <div className="md:col-span-3">
                        <Field label="Category">
                          <select
                            name="categoryId"
                            defaultValue={item.categoryId}
                            className="w-full border-0 border-b border-hairline bg-transparent px-0 py-3 font-editorial text-[1.0625rem] text-ink focus:border-ink focus:outline-none"
                          >
                            {menu.categories.map((c) => (
                              <option key={c.id} value={c.id}>
                                {c.name}
                              </option>
                            ))}
                          </select>
                        </Field>
                      </div>
                      <div className="md:col-span-2">
                        <Field label="Price (£)">
                          <Input name="price" type="number" step="0.01" min={0} defaultValue={(item.price / 100).toFixed(2)} />
                        </Field>
                      </div>
                      <div className="md:col-span-3">
                        <Field label="Image">
                          <Input name="imageSrc" defaultValue={item.imageSrc} placeholder="/uploads/…" />
                        </Field>
                      </div>
                      <div className="md:col-span-12">
                        <Field label="Description">
                          <Textarea name="description" defaultValue={item.description} rows={2} />
                        </Field>
                      </div>
                      <div className="md:col-span-12 flex gap-3">
                        <button type="submit" className="btn-ink">
                          <span>Save</span>
                        </button>
                      </div>
                    </form>

                    <form action={deleteItem} className="mt-3">
                      <input type="hidden" name="id" value={item.id} />
                      <button
                        type="submit"
                        className="font-sans text-[0.7rem] font-light uppercase tracking-widest text-ember underline-offset-4 hover:underline"
                      >
                        Remove this dish
                      </button>
                    </form>
                  </details>
                </li>
              );
            })}
          </ul>
        )}
      </section>

      {/* CATEGORIES */}
      <section className="mt-16 border-t border-hairline pt-10">
        <h2 className="font-display text-display-sm text-ink">Categories</h2>
        <ul className="mt-4 editorial space-y-1">
          {menu.categories.map((c) => (
            <li key={c.id}>
              {c.name}{" "}
              <span className="text-muted text-[0.85rem]">({c.id})</span>
            </li>
          ))}
        </ul>
        <form action={addCategory} className="mt-6 flex max-w-md gap-3">
          <Input name="category_name" placeholder="New category" />
          <button type="submit" className="btn-ghost whitespace-nowrap">
            Add
          </button>
        </form>
      </section>
    </div>
  );
}
