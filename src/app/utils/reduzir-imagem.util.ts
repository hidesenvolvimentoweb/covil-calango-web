/** Maior lado da foto enviada: o bastante para conferir o item, bem abaixo do limite de 5 MB da API. */
const LADO_MAXIMO = 1600;
const QUALIDADE_JPEG = 0.85;

/**
 * Reduz uma foto (as do celular passam fácil de 5 MB) para JPEG com no máximo {@link LADO_MAXIMO} px no maior lado.
 * Se o navegador não conseguir ler a imagem, devolve o arquivo original (a API valida o formato).
 */
export async function reduzirImagem(arquivo: File): Promise<Blob> {
  try {
    const bitmap = await createImageBitmap(arquivo);
    const escala = Math.min(1, LADO_MAXIMO / Math.max(bitmap.width, bitmap.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.round(bitmap.width * escala);
    canvas.height = Math.round(bitmap.height * escala);
    canvas.getContext("2d")!.drawImage(bitmap, 0, 0, canvas.width, canvas.height);
    bitmap.close();
    const blob = await new Promise<Blob | null>((resolve) => canvas.toBlob(resolve, "image/jpeg", QUALIDADE_JPEG));
    return blob ?? arquivo;
  } catch {
    return arquivo;
  }
}
