// Превращает обычную ссылку на YouTube/Vimeo в embed-URL для iframe.
// Если формат не распознан, возвращает исходную ссылку как есть —
// возможно, это уже embed-ссылка.

export function getEmbedUrl(videoUrl: string | null): string | null {
  if (!videoUrl) return null;

  try {
    const url = new URL(videoUrl);

    if (url.hostname.includes("youtube.com")) {
      if (url.pathname.startsWith("/embed/")) return videoUrl;
      const id = url.searchParams.get("v");
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (url.hostname === "youtu.be") {
      const id = url.pathname.slice(1);
      if (id) return `https://www.youtube.com/embed/${id}`;
    }

    if (url.hostname.includes("vimeo.com")) {
      if (url.hostname.startsWith("player.")) return videoUrl;
      const id = url.pathname.split("/").filter(Boolean).pop();
      if (id) return `https://player.vimeo.com/video/${id}`;
    }

    return videoUrl;
  } catch {
    return null;
  }
}
