export const dynamic = "force-dynamic";

const BASE = "https://maps.googleapis.com/maps/api/place/photo";

// Server-side proxy for Google Places Photo so the API key never leaves the server.
export async function GET(req: Request) {
  const apiKey = process.env.GOOGLE_PLACES_API_KEY;
  if (!apiKey) return new Response("not configured", { status: 404 });

  const url = new URL(req.url);
  const ref = url.searchParams.get("ref");
  const width = Math.min(Number(url.searchParams.get("w") ?? 160), 800);
  if (!ref) return new Response("ref required", { status: 400 });

  const upstream = `${BASE}?maxwidth=${width}&photo_reference=${encodeURIComponent(ref)}&key=${apiKey}`;
  const res = await fetch(upstream, { redirect: "follow" });
  if (!res.ok) return new Response("upstream error", { status: 502 });

  const contentType = res.headers.get("content-type") ?? "image/jpeg";
  const buf = await res.arrayBuffer();
  return new Response(buf, {
    headers: {
      "content-type": contentType,
      "cache-control": "public, max-age=86400, stale-while-revalidate=604800",
    },
  });
}
