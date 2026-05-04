import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { getContent, saveContent } from "@/lib/content";
import { Field, Input, Textarea } from "@/components/admin/Field";

export const metadata = { title: "Content" };

async function save(formData: FormData) {
  "use server";
  const current = await getContent();

  const hours = (current.hours.length ? current.hours : [{ day: "", hours: "" }]).map((_, i) => ({
    day: String(formData.get(`hours_${i}_day`) ?? ""),
    hours: String(formData.get(`hours_${i}_hours`) ?? ""),
  }));

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
    address: {
      line1: String(formData.get("address_line1") ?? current.address.line1),
      line2: String(formData.get("address_line2") ?? current.address.line2),
      phone: String(formData.get("address_phone") ?? current.address.phone),
      email: String(formData.get("address_email") ?? current.address.email),
    },
    hours,
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
      <h1 className="mt-3 font-display text-display-md text-ink">
        Words across the site.
      </h1>

      <form action={save} className="mt-10 space-y-14 md:max-w-3xl">
        {/* HERO */}
        <section>
          <h2 className="font-display text-display-sm text-ink">Hero</h2>
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
          <h2 className="font-display text-display-sm text-ink">Opening note</h2>
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

        {/* HOURS */}
        <section>
          <h2 className="font-display text-display-sm text-ink">Opening hours</h2>
          <div className="mt-6 grid gap-3">
            {content.hours.map((row, i) => (
              <div key={i} className="grid gap-3 md:grid-cols-[1fr_1fr]">
                <Input name={`hours_${i}_day`} defaultValue={row.day} placeholder="Mon — Fri" />
                <Input name={`hours_${i}_hours`} defaultValue={row.hours} placeholder="7:00 — 20:00" />
              </div>
            ))}
          </div>
        </section>

        {/* ADDRESS */}
        <section>
          <h2 className="font-display text-display-sm text-ink">Address &amp; contact</h2>
          <div className="mt-6 grid gap-6 md:grid-cols-2">
            <Field label="Address line 1">
              <Input name="address_line1" defaultValue={content.address.line1} />
            </Field>
            <Field label="Address line 2">
              <Input name="address_line2" defaultValue={content.address.line2} />
            </Field>
            <Field label="Phone">
              <Input name="address_phone" defaultValue={content.address.phone} />
            </Field>
            <Field label="Email">
              <Input name="address_email" defaultValue={content.address.email} type="email" />
            </Field>
          </div>
        </section>

        {/* STORY */}
        <section>
          <h2 className="font-display text-display-sm text-ink">Story</h2>
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
