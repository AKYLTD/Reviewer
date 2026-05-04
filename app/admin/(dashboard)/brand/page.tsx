import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContent, saveContent } from "@/lib/content";
import { Field, Input } from "@/components/admin/Field";

export const metadata = { title: "Brand" };

async function save(formData: FormData) {
  "use server";
  const current = await getContent();
  const next = {
    ...current,
    brand: {
      wordmark: String(formData.get("wordmark") ?? current.brand.wordmark),
      subtitle: String(formData.get("subtitle") ?? current.brand.subtitle),
      descriptor: String(formData.get("descriptor") ?? current.brand.descriptor),
      addressNumber: String(formData.get("addressNumber") ?? current.brand.addressNumber),
      logoSrc: String(formData.get("logoSrc") ?? "").trim(),
      tagline: String(formData.get("tagline") ?? current.brand.tagline),
    },
  };
  await saveContent(next);
  revalidatePath("/", "layout");
  redirect("/admin/brand?saved=1");
}

export default async function BrandPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const content = await getContent();
  const { brand } = content;

  return (
    <div>
      <p className="label">Brand</p>
      <h1 className="mt-3 font-display text-display-md text-ink">
        Logo, taglines, address.
      </h1>
      <p className="editorial mt-4 max-w-prose">
        These fields drive the masthead, the navigation lockup, the footer,
        and every page header. Changes show on the live site immediately.
      </p>

      <form action={save} className="mt-10 grid gap-8 md:max-w-2xl">
        <Field label="Wordmark" hint="The big serif word at the top of the masthead.">
          <Input name="wordmark" defaultValue={brand.wordmark} required />
        </Field>
        <Field label="Subtitle" hint="The italic line beneath. Usually 'Belsize Village'.">
          <Input name="subtitle" defaultValue={brand.subtitle} required />
        </Field>
        <Field label="Descriptor" hint="The wide-tracked label between the address numbers.">
          <Input name="descriptor" defaultValue={brand.descriptor} required />
        </Field>
        <Field label="Address numbers" hint="Use an en-dash, e.g. 37–39.">
          <Input name="addressNumber" defaultValue={brand.addressNumber} required />
        </Field>
        <Field label="Tagline" hint="Used in the footer and meta description.">
          <Input name="tagline" defaultValue={brand.tagline} />
        </Field>
        <Field
          label="Sign artwork"
          hint="Path to the shopfront artwork (e.g. /logos/sign-final.png). Leave blank to use the typographic reconstruction."
        >
          <Input name="logoSrc" defaultValue={brand.logoSrc} placeholder="/logos/sign-final.png" />
        </Field>

        <div className="flex items-center gap-4 pt-4">
          <button type="submit" className="btn-ink">
            <span>Save changes</span>
          </button>
          {searchParams.saved && (
            <span className="font-editorial italic text-[0.95rem] text-ember animate-rise">
              Saved.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
