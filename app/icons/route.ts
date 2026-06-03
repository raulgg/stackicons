export const runtime = "nodejs";

const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="320" height="96" viewBox="0 0 320 96" role="img" aria-labelledby="title desc">
  <title id="title">README Stack Icons placeholder</title>
  <desc id="desc">Placeholder SVG response for the stack icon service.</desc>
  <rect width="320" height="96" rx="12" fill="#f7f4ed"/>
  <rect x="20" y="20" width="56" height="56" rx="10" fill="#0e7666"/>
  <rect x="92" y="20" width="56" height="56" rx="10" fill="#f07b4b"/>
  <rect x="164" y="20" width="56" height="56" rx="10" fill="#d6e6ed"/>
  <rect x="236" y="20" width="56" height="56" rx="10" fill="#26343b"/>
</svg>`;

export function GET() {
  return new Response(svg, {
    headers: {
      "Content-Type": "image/svg+xml",
    },
  });
}
