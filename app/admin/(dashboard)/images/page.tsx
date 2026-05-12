import { promises as fs } from "fs";
import path from "path";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export const metadata = { title: "Images" };

const UPLOADS_DIR = path.join(process.cwd(), "public", "uploads");
const MAX_BYTES = 8 * 1024 * 1024;
const ALLOWED = new Set(["image/jpeg", "image/png", "image/webp", "image/svg+xml"]);

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

async function listUploads(): Promise<{ name: string; href: string; size: number }[]> {
  try {
    await ensureUploadsDir();
    const files = await fs.readdir(UPLOADS_DIR);
    const out = await Promise.all(
      files.map(async (f) => {
        const stat = await fs.stat(path.join(UPLOADS_DIR, f));
        return { name: f, href: `/uploads/${f}`, size: stat.size };
      }),
    );
    return out
      .filter((f) => !f.name.startsWith("."))
      .sort((a, b) => a.name.localeCompare(b.name));
  } catch {
    return [];
  }
}

async function upload(formData: FormData) {
  "use server";
  await ensureUploadsDir();
  const file = formData.get("file") as File | null;
  if (!file || file.size === 0) redirect("/admin/images?error=empty");
  if (file.size > MAX_BYTES) redirect("/admin/images?error=too-big");
  if (!ALLOWED.has(file.type)) redirect("/admin/images?error=type");
  const safeName = file.name
    .toLowerCase()
    .replace(/[^a-z0-9._-]+/g, "-")
    .replace(/-+/g, "-");
  const buf = Buffer.from(await file.arrayBuffer());
  await fs.writeFile(path.join(UPLOADS_DIR, safeName), buf);
  revalidatePath("/", "layout");
  redirect("/admin/images?uploaded=1");
}

async function remove(formData: FormData) {
  "use server";
  const name = String(formData.get("name") ?? "");
  // Reject anything that smells like path traversal.
  if (!/^[a-z0-9._-]+$/i.test(name)) redirect("/admin/images?error=name");
  await fs.unlink(path.join(UPLOADS_DIR, name)).catch(() => {});
  revalidatePath("/", "layout");
  redirect("/admin/images?deleted=1");
}

export default async function ImagesPage({
  searchParams,
}: {
  searchParams: { uploaded?: string; deleted?: string; error?: string };
}) {
  const files = await listUploads();
  return (
    <div>
      <p className="label">Images</p>
      <h1 className="mt-3 font-display text-display-md text-ink">
        Photographs &amp; sign artwork.
      </h1>
      <p className="editorial mt-4 max-w-prose">
        Upload images here, then reference them on the relevant page (Brand,
        Menu, etc) using the path printed beside each file. JPEG, PNG, WebP
        and SVG up to 8&nbsp;MB.
      </p>

      <form
        action={upload}
        encType="multipart/form-data"
        className="mt-10 grid gap-4 md:max-w-2xl border border-hairline p-6 bg-bone"
      >
        <input
          type="file"
          name="file"
          accept="image/jpeg,image/png,image/webp,image/svg+xml"
          required
          className="font-editorial text-[1rem]"
        />
        <button type="submit" className="btn-ink self-start">
          <span>Upload</span>
        </button>
      </form>

      {searchParams.uploaded && (
        <p className="mt-6 font-editorial italic text-ember">Uploaded.</p>
      )}
      {searchParams.deleted && (
        <p className="mt-6 font-editorial italic text-ember">Deleted.</p>
      )}
      {searchParams.error && (
        <p className="mt-6 font-editorial italic text-ember">
          {searchParams.error === "too-big"
            ? "That file is over 8 MB."
            : searchParams.error === "type"
              ? "We can only accept JPEG, PNG, WebP, or SVG."
              : "Something went wrong."}
        </p>
      )}

      <section className="mt-16 border-t border-hairline pt-10">
        <h2 className="font-display text-display-sm text-ink">Uploaded</h2>
        {files.length === 0 ? (
          <p className="editorial mt-4 text-muted">Nothing yet.</p>
        ) : (
          <ul className="mt-6 grid gap-6 md:grid-cols-3">
            {files.map((f) => (
              <li key={f.name} className="border border-hairline">
                <div className="aspect-[4/3] overflow-hidden bg-bone">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={f.href} alt={f.name} className="h-full w-full object-cover" />
                </div>
                <div className="p-4">
                  <p className="font-editorial text-[1rem] text-ink truncate">{f.name}</p>
                  <p className="label text-muted mt-1">{f.href}</p>
                  <form action={remove} className="mt-3">
                    <input type="hidden" name="name" value={f.name} />
                    <button
                      type="submit"
                      className="font-sans text-[0.7rem] font-light uppercase tracking-widest text-ember underline-offset-4 hover:underline"
                    >
                      Remove
                    </button>
                  </form>
                </div>
              </li>
            ))}
          </ul>
        )}
      </section>
    </div>
  );
}
