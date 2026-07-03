// Клиентское сжатие изображений перед загрузкой: canvas-ресайз по большей
// стороне + toBlob(quality). Без внешней библиотеки — тот же результат, что
// у browser-image-compression, но без лишней зависимости (см. confetti.tsx,
// где по той же причине не используется библиотека для конфетти).

const ALLOWED_TYPES = ["image/jpeg", "image/png", "image/webp"];
const MAX_SIZE_BYTES = 5 * 1024 * 1024;

export function validateImageFile(file: File): string | null {
  if (!ALLOWED_TYPES.includes(file.type)) {
    return "Поддерживаются только форматы JPG, PNG и WEBP.";
  }
  if (file.size > MAX_SIZE_BYTES) {
    return "Файл слишком большой. Максимальный размер — 5 МБ.";
  }
  return null;
}

export async function compressImage(
  file: File,
  maxDimension: number,
  quality = 0.85
): Promise<Blob> {
  const bitmap = await createImageBitmap(file);

  const scale = Math.min(1, maxDimension / Math.max(bitmap.width, bitmap.height));
  const width = Math.round(bitmap.width * scale);
  const height = Math.round(bitmap.height * scale);

  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const ctx = canvas.getContext("2d");
  if (!ctx) {
    bitmap.close();
    return file;
  }
  ctx.drawImage(bitmap, 0, 0, width, height);
  bitmap.close();

  const outputType = file.type === "image/png" ? "image/png" : "image/jpeg";

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (blob) resolve(blob);
        else reject(new Error("Не удалось обработать изображение"));
      },
      outputType,
      quality
    );
  });
}
