import Link from "next/link";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContent, saveContent, type Location } from "@/lib/content";
import { Field, Input, Textarea } from "@/components/admin/Field";

export const metadata = { title: "Locations" };

function slug(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "location";
}

function parseHours(raw: string): { day: string; hours: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      // Each row: "Day | Hours" — pipe-delimited so commas in days don't split.
      const [day, hours] = line.split("|").map((s) => s.trim());
      return { day: day ?? "", hours: hours ?? "" };
    });
}

function parseTransport(raw: string): { label: string; detail: string }[] {
  return raw
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, detail] = line.split("|").map((s) => s.trim());
      return { label: label ?? "", detail: detail ?? "" };
    });
}

function stringifyHours(hours: Location["hours"]): string {
  return hours.map((h) => `${h.day} | ${h.hours}`).join("\n");
}
function stringifyTransport(t: Location["transport"]): string {
  return t.map((x) => `${x.label} | ${x.detail}`).join("\n");
}

async function addLocation(formData: FormData) {
  "use server";
  const content = await getContent();
  const name = String(formData.get("name") ?? "").trim();
  if (!name) redirect("/admin/locations?error=missing-name");

  let id = slug(name);
  if (content.locations.find((l) => l.id === id)) {
    id = `${id}-${Date.now().toString(36)}`;
  }

  const next: Location = {
    id,
    name,
    shortName: name.replace(/^Roni'?s\s*/i, "").trim() || name,
    addressLine1: "",
    addressLine2: "",
    phone: "",
    email: "",
    hours: [],
    transport: [],
    squareLocationId: "",
  };
  content.locations.push(next);
  await saveContent(content);
  revalidatePath("/", "layout");
  redirect(`/admin/locations?added=${id}`);
}

async function updateLocation(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const content = await getContent();
  const idx = content.locations.findIndex((l) => l.id === id);
  if (idx === -1) redirect("/admin/locations?error=missing");

  content.locations[idx] = {
    ...content.locations[idx],
    name: String(formData.get("name") ?? content.locations[idx].name),
    shortName: String(formData.get("shortName") ?? content.locations[idx].shortName),
    addressLine1: String(formData.get("addressLine1") ?? ""),
    addressLine2: String(formData.get("addressLine2") ?? ""),
    phone: String(formData.get("phone") ?? ""),
    email: String(formData.get("email") ?? ""),
    hours: parseHours(String(formData.get("hours") ?? "")),
    transport: parseTransport(String(formData.get("transport") ?? "")),
    squareLocationId: String(formData.get("squareLocationId") ?? "").trim(),
    lat: Number(formData.get("lat") ?? content.locations[idx].lat ?? 0) || undefined,
    lng: Number(formData.get("lng") ?? content.locations[idx].lng ?? 0) || undefined,
    tablesInside: Math.max(0, Math.round(Number(formData.get("tablesInside") ?? content.locations[idx].tablesInside ?? 0))) || undefined,
    tablesOutside: Math.max(0, Math.round(Number(formData.get("tablesOutside") ?? content.locations[idx].tablesOutside ?? 0))) || undefined,
  };

  if (formData.get("makePrimary") === "1") {
    content.primaryLocationId = id;
  }

  await saveContent(content);
  revalidatePath("/", "layout");
  redirect("/admin/locations?saved=1");
}

async function deleteLocation(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const content = await getContent();
  if (content.locations.length <= 1) {
    redirect("/admin/locations?error=last-location");
  }
  content.locations = content.locations.filter((l) => l.id !== id);
  if (content.primaryLocationId === id) {
    content.primaryLocationId = content.locations[0]?.id ?? "";
  }
  await saveContent(content);
  revalidatePath("/", "layout");
  redirect("/admin/locations?deleted=1");
}

async function setPrimary(formData: FormData) {
  "use server";
  const id = String(formData.get("id") ?? "");
  const content = await getContent();
  if (!content.locations.find((l) => l.id === id)) {
    redirect("/admin/locations?error=missing");
  }
  content.primaryLocationId = id;
  await saveContent(content);
  revalidatePath("/", "layout");
  redirect("/admin/locations?primary=1");
}

export default async function LocationsAdminPage({
  searchParams,
}: {
  searchParams: {
    saved?: string;
    added?: string;
    deleted?: string;
    primary?: string;
    error?: string;
  };
}) {
  const content = await getContent();
  const squareConnected = Boolean(process.env.SQUARE_ACCESS_TOKEN);

  return (
    <div>
      <p className="label">Locations</p>
      <h1 className="mt-3 font-display text-display-md text-coffee">
        Shops, hours, addresses, Square IDs.
      </h1>
      <p className="editorial mt-3 max-w-prose">
        Each shop appears on the Visit page, in the cake-order pickup chips,
        and (when configured) routes its own till orders. The shop marked
        <strong className="font-600"> primary</strong> is what shows in the
        homepage hero and the footer.
      </p>

      {(searchParams.saved || searchParams.added || searchParams.deleted || searchParams.primary) && (
        <p className="mt-6 font-display italic text-ember animate-rise">
          {searchParams.added && "Location added — fill in its details below."}
          {searchParams.saved && "Location updated."}
          {searchParams.deleted && "Location removed."}
          {searchParams.primary && "Primary shop set."}
        </p>
      )}
      {searchParams.error && (
        <p className="mt-6 font-display italic text-brick">
          {searchParams.error === "last-location"
            ? "You can't remove the last location."
            : searchParams.error === "missing-name"
              ? "Please give the location a name."
              : "Something went wrong."}
        </p>
      )}

      {/* ADD A SHOP -------------------------------------------------------- */}
      <section className="mt-10 border border-hairline bg-bone p-6 rounded-md max-w-2xl">
        <h2 className="font-display font-700 text-coffee">Add a new shop</h2>
        <p className="font-sans text-sm text-muted mt-2">
          We&rsquo;ll create a blank record &mdash; address, hours and Square
          ID get filled in below.
        </p>
        <form action={addLocation} className="mt-4 flex flex-wrap gap-3">
          <input
            name="name"
            placeholder="e.g. Roni's Hampstead"
            required
            className="flex-1 min-w-[16rem] rounded-md bg-ivory border border-hairline px-4 py-3 font-sans text-[1rem] text-coffee focus:border-brick focus:outline-none focus:ring-2 focus:ring-brick/20 transition"
          />
          <button type="submit" className="btn-primary">
            <span>Add shop</span>
          </button>
        </form>
      </section>

      {/* SQUARE NOTICE ---------------------------------------------------- */}
      {!squareConnected && (
        <div className="mt-8 border border-brick rounded-md bg-cream/60 p-5 max-w-3xl">
          <p className="font-display font-700 text-coffee">Square is not configured</p>
          <p className="editorial mt-2 text-[0.95rem]">
            Cake orders won&rsquo;t print at the till until the Square
            credentials are set in the deployment&rsquo;s environment
            variables. Until then, orders are captured server-side and can be
            forwarded by email.
          </p>
        </div>
      )}

      {/* EXISTING SHOPS --------------------------------------------------- */}
      <section className="mt-12 space-y-6">
        {content.locations.map((loc) => {
          const isPrimary = loc.id === content.primaryLocationId;
          return (
            <article key={loc.id} className="rounded-xl bg-ivory p-6 md:p-8 shadow-soft">
              <header className="flex flex-wrap items-baseline justify-between gap-4">
                <div className="min-w-0">
                  <h2 className="font-display font-700 text-coffee text-2xl">
                    {loc.name}
                    {isPrimary && (
                      <span className="ml-3 inline-flex items-center rounded-pill bg-saffron text-coffee px-3 py-1 font-display font-700 text-xs align-middle">
                        Primary
                      </span>
                    )}
                  </h2>
                  <p className="font-sans text-sm text-muted mt-1">
                    /admin/locations · id: <code>{loc.id}</code>
                    {loc.squareLocationId && (
                      <>
                        {" · square: "}
                        <code className="text-coffee">{loc.squareLocationId}</code>
                      </>
                    )}
                  </p>
                </div>
                <Link href={`/visit#${loc.id}`} className="anchor font-display font-600 text-sm">
                  View on /visit →
                </Link>
              </header>

              <form
                action={updateLocation}
                className="mt-6 grid gap-5 md:grid-cols-2"
              >
                <input type="hidden" name="id" value={loc.id} />

                <Field label="Display name">
                  <Input name="name" defaultValue={loc.name} />
                </Field>
                <Field label="Short name">
                  <Input name="shortName" defaultValue={loc.shortName} />
                </Field>

                <Field label="Address line 1">
                  <Input name="addressLine1" defaultValue={loc.addressLine1} />
                </Field>
                <Field label="Address line 2">
                  <Input name="addressLine2" defaultValue={loc.addressLine2} />
                </Field>

                <Field label="Phone">
                  <Input name="phone" defaultValue={loc.phone} />
                </Field>
                <Field label="Email">
                  <Input name="email" defaultValue={loc.email} type="email" />
                </Field>

                <div className="md:col-span-2">
                  <Field
                    label="Square location ID"
                    hint="Find it in Square Dashboard → Account → Locations. Required for orders to ring up at this shop."
                  >
                    <Input
                      name="squareLocationId"
                      defaultValue={loc.squareLocationId}
                      placeholder="e.g. L7XHJYABCDE12"
                    />
                  </Field>
                </div>

                <Field label="Latitude" hint="For 'nearest shop' detection.">
                  <Input name="lat" type="number" defaultValue={String(loc.lat ?? "")} placeholder="51.5476" />
                </Field>
                <Field label="Longitude">
                  <Input name="lng" type="number" defaultValue={String(loc.lng ?? "")} placeholder="-0.1697" />
                </Field>

                <Field label="Inside tables" hint="Number of tables inside. QR codes generated for 1 → N.">
                  <Input name="tablesInside" type="number" min={0} defaultValue={String(loc.tablesInside ?? 0)} />
                </Field>
                <Field label="Outside tables">
                  <Input name="tablesOutside" type="number" min={0} defaultValue={String(loc.tablesOutside ?? 0)} />
                </Field>

                <div className="md:col-span-2">
                  <Field
                    label="Hours"
                    hint="One row per line, pipe-delimited: Day | Hours"
                  >
                    <Textarea
                      name="hours"
                      defaultValue={stringifyHours(loc.hours)}
                      rows={4}
                      placeholder={"Monday — Friday | 7:00 — 20:00\nSaturday | 8:00 — 20:00\nSunday | 8:00 — 18:00"}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2">
                  <Field
                    label="Transport &amp; getting there"
                    hint="One row per line: Label | Detail"
                  >
                    <Textarea
                      name="transport"
                      defaultValue={stringifyTransport(loc.transport)}
                      rows={3}
                      placeholder={"Belsize Park | Northern line · 6 min walk\nBus | 46 · 268 · C11"}
                    />
                  </Field>
                </div>

                <div className="md:col-span-2 flex flex-wrap items-center justify-between gap-3 pt-2">
                  <div className="flex items-center gap-3">
                    <button type="submit" className="btn-primary">
                      <span>Save</span>
                    </button>
                    {!isPrimary && (
                      <button
                        type="submit"
                        formAction={setPrimary}
                        className="btn-ghost text-xs px-4 py-2"
                      >
                        Make primary
                      </button>
                    )}
                  </div>
                  {!isPrimary && (
                    <button
                      type="submit"
                      formAction={deleteLocation}
                      className="font-sans text-[0.75rem] font-600 uppercase tracking-widest text-brick hover:underline"
                    >
                      Remove this shop
                    </button>
                  )}
                </div>
              </form>
            </article>
          );
        })}
      </section>
    </div>
  );
}
