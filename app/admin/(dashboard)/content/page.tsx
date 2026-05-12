import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContent, saveContent } from "@/lib/content";
import { Field, Input, Textarea } from "@/components/admin/Field";

export const metadata = { title: "Content" };

async function save(formData: FormData) {
  "use server";
  const current = await getContent();

  const milestones = current.story.milestones.map((_, i) => ({
    year: String(formData.get(`m_${i}_year`) ?? ""),
    place: String(formData.get(`m_${i}_place`) ?? ""),
    body: String(formData.get(`m_${i}_body`) ?? ""),
  }));

  const next = {
    ...current,
    hero: {
      ...current.hero,
      headline: String(formData.get("hero_headline") ?? current.hero.headline),
      subhead: String(formData.get("hero_subhead") ?? current.hero.subhead),
      primaryCta: {
        label: String(formData.get("hero_primary_label") ?? current.hero.primaryCta.label),
        href: String(formData.get("hero_primary_href") ?? current.hero.primaryCta.href),
      },
      secondaryCta: {
        label: String(formData.get("hero_secondary_label") ?? current.hero.secondaryCta.label),
        href: String(formData.get("hero_secondary_href") ?? current.hero.secondaryCta.href),
      },
    },
    openingNote: {
      title: String(formData.get("opening_title") ?? current.openingNote.title),
      body: String(formData.get("opening_body") ?? "")
        .split(/\n\s*\n/)
        .map((s) => s.trim())
        .filter(Boolean),
    },
    story: {
      intro: String(formData.get("story_intro") ?? current.story.intro),
      milestones,
    },
  };
  await saveContent(next);
  revalidatePath("/", "layout");
  redirect("/admin/content?saved=1");
}

export default async function ContentPage({
  searchParams,
}: {
  searchParams: { saved?: string };
}) {
  const content = await getContent();

  return (
    <div>
      <p className="label">Content</p>
      <h1 className="mt-3 font-display text-display-md text-coffee">
        Words across the site.
      </h1>
      <p className="editorial mt-3 max-w-prose">
        Hours, addresses and contact details for each shop are managed
        separately on the{" "}
        <a className="anchor font-600" href="/admin/locations">Locations</a>{" "}
        page.
      </p>

      <form action={save} className="mt-10 space-y-14 md:max-w-3xl">
        {/* HERO */}
        <section>
          <h2 className="font-display text-display-sm text-coffee">Hero</h2>
          <div className="mt-6 grid gap-6">
            <Field label="Headline">
              <Input name="hero_headline" defaultValue={content.hero.headline} />
            </Field>
            <Field label="Subhead">
              <Textarea name="hero_subhead" defaultValue={content.hero.subhead} rows={2} />
            </Field>
            <div className="grid gap-6 md:grid-cols-2">
              <Field label="Primary CTA — label">
                <Input name="hero_primary_label" defaultValue={content.hero.primaryCta.label} />
              </Field>
              <Field label="Primary CTA — link">
                <Input name="hero_primary_href" defaultValue={content.hero.primaryCta.href} />
              </Field>
              <Field label="Secondary CTA — label">
                <Input name="hero_secondary_label" defaultValue={content.hero.secondaryCta.label} />
              </Field>
              <Field label="Secondary CTA — link">
                <Input name="hero_secondary_href" defaultValue={content.hero.secondaryCta.href} />
              </Field>
            </div>
          </div>
        </section>

        {/* OPENING NOTE */}
        <section>
          <h2 className="font-display text-display-sm text-coffee">Opening note</h2>
          <div className="mt-6 grid gap-6">
            <Field label="Title">
              <Input name="opening_title" defaultValue={content.openingNote.title} />
            </Field>
            <Field label="Body" hint="Separate paragraphs with a blank line.">
              <Textarea
                name="opening_body"
                defaultValue={content.openingNote.body.join("\n\n")}
                rows={8}
              />
            </Field>
          </div>
        </section>

        {/* STORY */}
        <section>
          <h2 className="font-display text-display-sm text-coffee">Story</h2>
          <div className="mt-6 grid gap-6">
            <Field label="Intro">
              <Textarea name="story_intro" defaultValue={content.story.intro} rows={3} />
            </Field>
            {content.story.milestones.map((m, i) => (
              <div key={i} className="grid gap-3 border-t border-hairline pt-6 md:grid-cols-[6rem_1fr_2fr]">
                <Input name={`m_${i}_year`} defaultValue={m.year} placeholder="1989" />
                <Input name={`m_${i}_place`} defaultValue={m.place} placeholder="West Hampstead" />
                <Textarea name={`m_${i}_body`} defaultValue={m.body} rows={3} />
              </div>
            ))}
          </div>
        </section>

        <div className="flex items-center gap-4 pt-4">
          <button type="submit" className="btn-primary">
            <span>Save changes</span>
          </button>
          {searchParams.saved && (
            <span className="font-display italic text-ember animate-rise">
              Saved.
            </span>
          )}
        </div>
      </form>
    </div>
  );
}
