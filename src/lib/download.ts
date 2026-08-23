/** Dispara una descarga en el browser. Solo cliente. */
export function downloadBlob(blob: Blob, filename: string): void {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.rel = "noopener";
  a.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
}
