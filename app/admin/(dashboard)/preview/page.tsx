import { PreviewFrame } from "@/components/admin/PreviewFrame";

export const metadata = { title: "Preview" };
export const dynamic = "force-dynamic";

export default function PreviewPage() {
  return (
    <div className="space-y-8">
      <header>
        <p className="label">Preview</p>
        <h1 className="mt-3 font-display font-700 text-display-md text-coffee">
          See the site as your customers do.
        </h1>
        <p className="editorial mt-3 max-w-prose">
          Pick a device size and a page to see exactly how each viewport
          renders. Pages reflect every change you make in admin in real time
          — useful for sanity-checking the homepage on iPhone after editing
          brand copy, or the shop on iPad after creating a promotion.
        </p>
      </header>
      <PreviewFrame />
    </div>
  );
}
