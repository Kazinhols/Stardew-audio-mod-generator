import JSZip from 'jszip';

export async function generateAndDownloadZipWeb(
  modName: string,
  manifest: Record<string, unknown>,
  content: Record<string, unknown>,
  i18n: Record<string, string>,
  _audioFiles: unknown[]
) {
  const zip = new JSZip();
  const clean = modName.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const folderName = `[CP] ${clean}`;
  const folder = zip.folder(folderName)!;

  folder.file('manifest.json', JSON.stringify(manifest, null, 4));
  folder.file('content.json', JSON.stringify(content, null, 4));

  if (Object.keys(i18n).length > 0) {
    const i18nFolder = folder.folder('i18n')!;
    i18nFolder.file('default.json', JSON.stringify(i18n, null, 4));
  }

  // Create empty assets folder
  folder.folder('assets');

  const blob = await zip.generateAsync({ type: 'blob', compression: 'DEFLATE' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
