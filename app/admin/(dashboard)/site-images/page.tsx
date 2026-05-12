import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { IMAGE_SLOTS, getSlots, setSlot, clearSlot } from "@/lib/imageSlots";
import { mockupUrl } from "@/lib/mockups";

export const metadata = { title: "Site images" };
export const dynamic = "force-dynamic";

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads", "slots");
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp"]);

async function upload(formData: FormData) {
  "use server";
  const key = String(formData.get("key") ?? "");
  const file = formData.get("file") as File | null;
  if (!key || !file || file.size === 0) redirect("/admin/site-images?error=empty");
  if (file.size > MAX_BYTES) redirect("/admin/site-images?error=too-big");
  if (!ALLOWED.has(file.type)) redirect("/admin/site-images?error=type");
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  const ext = file.type === "image/png" ? "png" : file.type === "image/webp" ? "webp" : "jpg";
  const filename = `${key}-${Date.now()}.${ext}`;
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, filename), buf);
  await setSlot(key, `/uploads/slots/${filename}`);
  revalidatePath("/", "layout");
  redirect(`/admin/site-images?uploaded=${encodeURIComponent(key)}`);
}

async function revert(formData: FormData) {
  "use server";
  const key = String(formData.get("key") ?? "");
  await clearSlot(key);
  revalidatePath("/", "layout");
  redirect(`/admin/site-images?reverted=${encodeURIComponent(key)}`);
}

export default async function SiteImagesPage({
  searchParams,
}: {
  searchParams: { uploaded?: string; reverted?: string; error?: string };
}) {
  const slots = await getSlots();

  const groups = new Map<string, typeof IMAGE_SLOTS>();
  for (const s of IMAGE_SLOTS) {
    const arr = groups.get(s.group) ?? [];
    arr.push(s);
    groups.set(s.group, arr);
  }

  return (
    <div className="space-y-10">
      <header>
        <p className="label">Site images</p>
        <h1 className="mt-3 font-display font-700 text-display-md text-coffee">
          Every photo on the site, in one place.
        </h1>
        <p className="editorial mt-3 max-w-prose">
          Upload a JPEG, PNG, or WebP (up to 8&nbsp;MB) for any slot below
          and the public site uses it everywhere automatically. The mockup
          stock photo steps aside the moment you upload. Revert puts the
          stock back in place.
        </p>
      </header>

      {searchParams.uploaded && (
        <p className="font-display italic text-brick animate-rise">
          Uploaded {searchParams.uploaded}.
        </p>
      )}
      {searchParams.reverted && (
        <p className="font-display italic text-brick animate-rise">
          Reverted {searchParams.reverted}.
        </p>
      )}
      {searchParams.error && (
        <p className="font-display italic text-brick">
          {searchParams.error === "too-big" ? "That file is over 8 MB." :
           searchParams.error === "type" ? "Use JPEG, PNG, or WebP." :
           "Something went wrong."}
        </p>
      )}

      {Array.from(groups.entries()).map(([group, slotsArr]) => (
        <section key={group}>
          <h2 className="font-display font-700 text-coffee text-2xl mb-4">{group}</h2>
          <ul className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
            {slotsArr.map((s) => {
              const current = slots[s.key] ?? "";
              const previewUrl = current || mockupUrl(s.fallback);
              const isOverridden = Boolean(current);
              return (
                <li key={s.key} className="rounded-xl bg-ivory shadow-soft overflow-hidden">
                  <div className="relative bg-bone" style={{ aspectRatio: s.aspect }}>
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={previewUrl}
                      alt={s.label}
                      className="absolute inset-0 h-full w-full object-cover"
                    />
                    <span className={`absolute top-3 left-3 inline-flex items-center rounded-pill px-2.5 py-1 font-display font-700 text-xs uppercase tracking-wide ${
                      isOverridden ? "bg-brick text-cream" : "bg-cream/80 text-coffee"
                    }`}>
                      {isOverridden ? "Yours" : "Stock"}
                    </span>
                  </div>
                  <div className="p-4 space-y-3">
                    <div>
                      <p className="font-display font-700 text-coffee">{s.label}</p>
                      <p className="font-sans text-xs text-muted mt-0.5">
                        {s.key} · {s.aspect}
                      </p>
                    </div>
                    <form action={upload} encType="multipart/form-data" className="space-y-2">
                      <input type="hidden" name="key" value={s.key} />
                      <input
                        type="file"
                        name="file"
                        accept="image/jpeg,image/png,image/webp"
                        required
                        className="block w-full text-sm text-coffee file:mr-3 file:rounded-pill file:border-0 file:bg-coffee file:text-cream file:px-4 file:py-2 file:font-display file:font-600 file:cursor-pointer cursor-pointer"
                      />
                      <button type="submit" className="btn-primary w-full text-xs">
                        <span>Upload &amp; replace</span>
                      </button>
                    </form>
                    {isOverridden && (
                      <form action={revert}>
                        <input type="hidden" name="key" value={s.key} />
                        <button
                          type="submit"
                          className="font-sans text-xs font-600 uppercase tracking-widest text-brick hover:underline"
                        >
                          Revert to stock
                        </button>
                      </form>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        </section>
      ))}
    </div>
  );
}
