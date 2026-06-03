import { renderIconRequestErrorSvg } from "@/lib/icons/error-svg";
import { parseIconRequest } from "@/lib/icons/parse-request";
import { renderIconSvg } from "@/lib/icons/render-svg";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const parsedRequest = parseIconRequest(new URL(request.url).searchParams);

  if (!parsedRequest.success) {
    return new Response(renderIconRequestErrorSvg(parsedRequest.errors), {
      status: 400,
      headers: {
        "Content-Type": "image/svg+xml",
        "Cache-Control": "no-store",
      },
    });
  }

  return new Response(await renderIconSvg(parsedRequest.data), {
    headers: {
      "Content-Type": "image/svg+xml",
      "Cache-Control": "public, max-age=31536000, s-maxage=31536000, immutable",
    },
  });
}
