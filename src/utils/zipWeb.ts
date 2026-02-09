import JSZip from 'jszip';

export async function generateAndDownloadZipWeb(
  modName: string,
  manifest: any,
  content: any,
  i18n: any,
  _audioFiles: any[]
) {
  const zip = new JSZip();
  
  const cleanName = modName.replace(/[^a-zA-Z0-9 ]/g, '');
  const folderName = `[CP] ${cleanName || 'MyAudioMod'}`;
  const root = zip.folder(folderName);

  if (!root) throw new Error("Failed to create zip folder");

  root.file('manifest.json', JSON.stringify(manifest, null, 2));
  root.file('content.json', JSON.stringify(content, null, 2));

  const i18nFolder = root.folder('i18n');
  i18nFolder?.file('default.json', JSON.stringify(i18n, null, 2));

  const assetsFolder = root.folder('assets');
  
  const readmeContent = `ASSETS FOLDER
==================

Como você gerou este mod pela versão WEB, os arquivos de áudio não foram copiados automaticamente (segurança do navegador).

INSTRUÇÕES:
1. Coloque seus arquivos .ogg nesta pasta.
2. Certifique-se que os nomes dos arquivos são EXATAMENTE:
   ${extractFileNames(content).join('\n   ')}

DICA:
Use a versão Desktop do gerador para cópia automática de arquivos.
`;

  assetsFolder?.file('README.txt', readmeContent);

  const contentZip = await zip.generateAsync({ type: 'blob' });

  const url = window.URL.createObjectURL(contentZip);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${folderName}.zip`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  window.URL.revokeObjectURL(url);
}

function extractFileNames(content: any): string[] {
  const files: string[] = [];
  try {
    if (content.Changes) {
      content.Changes.forEach((change: any) => {
        if (change.Entries) {
          Object.values(change.Entries).forEach((entry: any) => {
            if (entry.FilePaths) {
              entry.FilePaths.forEach((path: string) => {
                const clean = path.replace('{{AbsoluteFilePath: assets/', '').replace('}}', '');
                files.push(clean);
              });
            }
          });
        }
      });
    }
  } catch (e) {
    return ['(Erro ao listar arquivos)'];
  }
  return [...new Set(files)];
}