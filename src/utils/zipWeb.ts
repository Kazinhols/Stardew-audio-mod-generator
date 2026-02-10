import JSZip from 'jszip';

interface JukeboxConfig {
  name: string;
  available: boolean;
}

interface Audio {
  id: string;
  type: 'replace' | 'custom';
  originalName: string | null;
  category: string;
  files: string[];
  looped: boolean;
  jukebox: JukeboxConfig | null;
}

function generateReadme(audioEntries: Audio[], modName: string, modAuthor: string, modVersion: string): string {
  // Group files by audio entry
  const audioList = audioEntries.length > 0 
    ? audioEntries.map((audio, index) => {
        const displayName = audio.originalName || audio.id;
        const categoryEmoji = audio.category === 'Music' ? '🎵' : 
                            audio.category === 'Ambient' ? '🌿' :
                            audio.category === 'Sound' ? '🔊' : '👣';
        const typeLabel = audio.type === 'replace' ? 'Substitui' : 'Custom';
        const loopLabel = audio.looped ? '🔁 Loop' : '▶️ No Loop';
        const jukeboxLabel = audio.jukebox ? `📻 Jukebox: "${audio.jukebox.name}"` : '';
        
        const filesList = audio.files.map(f => `     • \`${f}\``).join('\n');
        
        return `**${index + 1}. ${categoryEmoji} ${displayName}** (${typeLabel})
   ${loopLabel}${jukeboxLabel ? ' | ' + jukeboxLabel : ''}
   Arquivos necessários:
${filesList}`;
      }).join('\n\n')
    : '(Nenhum áudio configurado)';

  // Get unique files
  const allFiles = audioEntries
    .flatMap(a => a.files)
    .filter((f, i, arr) => arr.indexOf(f) === i)
    .sort();

  const fileCount = allFiles.length;
  const audioCount = audioEntries.length;

  return `# 🎵 ${modName}

## 📋 O que você baixou

Este arquivo contém um mod de áudio personalizado para Stardew Valley 1.6+.

**Estatísticas:**
- 🎵 ${audioCount} áudio(s) configurado(s)
- 📁 ${fileCount} arquivo(s) .ogg necessário(s)

**Arquivos incluídos:**
- \`manifest.json\` - Configuração do mod
- \`content.json\` - Define quais áudios substituir
- \`i18n/default.json\` - Traduções (se aplicável)
- \`README.md\` - Este arquivo

---

## ⚠️ IMPORTANTE: Adicione os arquivos de áudio!

Este mod **NÃO inclui** os arquivos de áudio (.ogg). Você precisa adicioná-los manualmente na pasta \`assets/\`.

---

## 🎼 Áudios Configurados

Abaixo está a lista completa de todos os áudios configurados neste mod:

${audioList}

---

## 📁 Lista de Arquivos .ogg Necessários

Você precisa colocar os seguintes **${fileCount} arquivos** na pasta **\`assets/\`**:

${allFiles.map(f => `- \`${f}\``).join('\n')}

> **Formato:** Todos os arquivos devem estar no formato **OGG Vorbis**
> 
> **Origem:** Use os arquivos originais do Stardew Valley ou crie/baixe seus próprios áudios

---

## 📦 Como Instalar

### 1️⃣ Instalar Dependências

Você precisa ter instalado:

- **SMAPI** - Baixe em: https://smapi.io/
- **Content Patcher** - Baixe em: https://www.nexusmods.com/stardewvalley/mods/1915

### 2️⃣ Instalar o Mod

1. Localize a pasta de mods do Stardew Valley:
   - **Windows:** \`C:\\Program Files (x86)\\Steam\\steamapps\\common\\Stardew Valley\\Mods\\\`
   - **Mac:** \`~/Library/Application Support/Steam/steamapps/common/Stardew Valley/Contents/MacOS/Mods/\`
   - **Linux:** \`~/.local/share/Steam/steamapps/common/Stardew Valley/Mods/\`

2. Extraia este ZIP para dentro da pasta Mods

3. **CRIE** uma pasta chamada \`assets\` dentro da pasta do mod (se não existir)

4. Coloque todos os **${fileCount} arquivos** .ogg listados acima dentro da pasta \`assets/\`

### 3️⃣ Estrutura Final

\`\`\`
Stardew Valley/
└── Mods/
    └── ${modName}/
        ├── manifest.json
        ├── content.json
        ├── README.md
        ├── i18n/
        │   └── default.json
        └── assets/          ← COLOQUE OS ${fileCount} ARQUIVOS .OGG AQUI
            ├── arquivo1.ogg
            ├── arquivo2.ogg
            ├── ...
            └── arquivo${fileCount}.ogg
\`\`\`

---

## 🎮 Como Usar

1. Inicie o Stardew Valley através do **SMAPI**
2. O mod será carregado automaticamente
3. As músicas serão substituídas conforme configurado!

**Testando:**
- Vá para os locais/situações que acionam os áudios substituídos
- Verifique se as músicas personalizadas estão tocando
- Confira o console do SMAPI para confirmar que não há erros

---

## 🔧 Converter Áudios para .ogg

Use uma destas ferramentas:

### Opção 1: Audacity (Gratuito - Recomendado)
1. Baixe em: https://www.audacityteam.org/
2. Abra o arquivo de áudio (MP3, WAV, etc)
3. Vá em **Arquivo** → **Exportar** → **Exportar como OGG**
4. Salve com o nome **exato** listado acima

### Opção 2: FFmpeg (Linha de comando)
\`\`\`bash
# Converter um arquivo
ffmpeg -i input.mp3 -c:a libvorbis -q:a 5 output.ogg

# Converter vários arquivos
for f in *.mp3; do ffmpeg -i "$f" -c:a libvorbis -q:a 5 "\${f%.mp3}.ogg"; done
\`\`\`

### Opção 3: Online (Rápido)
- https://convertio.co/pt/mp3-ogg/
- https://cloudconvert.com/mp3-to-ogg

**Dicas:**
- Use qualidade média/alta (128-192 kbps)
- Mantenha a taxa de amostragem original (geralmente 44100 Hz)
- Arquivos menores = carregamento mais rápido no jogo

---

## ❓ Problemas Comuns

### ❌ O mod não carrega
**Possíveis causas:**
- SMAPI não está instalado → Instale em https://smapi.io/
- Content Patcher não está instalado → Baixe no NexusMods
- Arquivos na pasta errada → Verifique a estrutura acima

**Solução:**
1. Abra o console do SMAPI (janela preta que abre com o jogo)
2. Procure por erros relacionados a "${modName}"
3. Verifique se todos os arquivos estão no lugar certo

### ❌ Os áudios não tocam
**Possíveis causas:**
- Arquivos .ogg faltando na pasta \`assets/\`
- Nomes de arquivo incorretos (case-sensitive!)
- Formato de arquivo errado

**Solução:**
1. Verifique se **todos os ${fileCount} arquivos** estão na pasta \`assets/\`
2. Confira se os nomes são **exatamente** iguais (maiúsculas/minúsculas importam!)
3. Teste os arquivos .ogg em um player de áudio antes
4. Verifique o console do SMAPI para mensagens de erro

### ❌ "Arquivo não encontrado"
**Causa:** Nome do arquivo não confere exatamente

**Solução:**
- No Windows: nomes **são** case-sensitive no jogo!
- \`Spring1.ogg\` é diferente de \`spring1.ogg\`
- Não adicione espaços ou caracteres especiais
- Copie e cole os nomes exatos da lista acima

### ❌ Áudio cortado ou com problemas
**Possíveis causas:**
- Arquivo corrompido
- Formato não é OGG Vorbis puro
- Taxa de bits muito baixa

**Solução:**
1. Reconverta o arquivo usando Audacity
2. Use qualidade 5-7 no FFmpeg
3. Evite OGG Opus (use OGG Vorbis)

---

## 🎵 Onde Conseguir Áudios

### Opção 1: Extrair do Jogo Original
Os arquivos originais estão em:
\`Stardew Valley/Content/Music/\` e \`Content/Sounds/\`

### Opção 2: Sites de Música Livre
- **Freesound:** https://freesound.org/
- **Incompetech:** https://incompetech.com/
- **Purple Planet:** https://www.purple-planet.com/

### Opção 3: Criar Suas Próprias
Use DAWs como:
- FL Studio
- Ableton Live
- GarageBand (Mac)
- LMMS (Grátis)

**⚠️ Importante:** Respeite direitos autorais! Use apenas músicas que você tem permissão para usar.

---

## 📝 Informações do Mod

- **Nome:** ${modName}
- **Autor:** ${modAuthor}
- **Versão:** ${modVersion}
- **Requer:** SMAPI, Content Patcher
- **Compatibilidade:** Stardew Valley 1.6+
- **Total de Áudios:** ${audioCount}
- **Total de Arquivos:** ${fileCount}

---

## 🔄 Atualizar o Mod

Para adicionar ou remover áudios:

1. Edite o \`content.json\` manualmente, ou
2. Use o **Stardew Audio Mod Generator** para regenerar o mod
3. Substitua os arquivos antigos pelos novos
4. Reinicie o jogo

---

## 🆘 Suporte

Se precisar de ajuda:

1. **Console do SMAPI:** Veja a janela preta que abre com o jogo
2. **Log do SMAPI:** Arquivo em \`Stardew Valley/ErrorLogs/SMAPI-latest.txt\`
3. **Atualize tudo:** SMAPI e Content Patcher devem estar atualizados

**Onde pedir ajuda:**
- Fórum do SMAPI: https://smapi.io/community
- Discord do Stardew Valley Modding
- Subreddit: r/StardewValleyMods

---

## ⚖️ Avisos Legais

- Este é um mod feito por fãs para uso pessoal
- Respeite os direitos autorais dos áudios que você usar
- Não distribua áudios protegidos sem permissão
- Stardew Valley é propriedade de ConcernedApe

---

## 🌟 Créditos

**Mod criado por:** ${modAuthor}
**Ferramenta usada:** Stardew Audio Mod Generator v3.0
**GitHub:** https://github.com/kazinhols/stardew-audio-mod

---

**Divirta-se com suas músicas personalizadas! 🎵**

*Se você gostou deste mod, considere dar estrela no repositório do generator!*
`;
}

export async function generateAndDownloadZipWeb(
  modName: string,
  manifest: Record<string, unknown>,
  content: Record<string, unknown>,
  i18n: Record<string, string>,
  audioFiles: Audio[]
) {
  const zip = new JSZip();
  const clean = modName.replace(/[^a-zA-Z0-9 ]/g, '').trim();
  const folderName = `[CP] ${clean}`;
  const folder = zip.folder(folderName)!;

  // Generate README with detailed audio information
  const readme = generateReadme(
    audioFiles,
    String(manifest.Name || modName),
    String(manifest.Author || 'Unknown'),
    String(manifest.Version || '1.0.0')
  );

  folder.file('manifest.json', JSON.stringify(manifest, null, 4));
  folder.file('content.json', JSON.stringify(content, null, 4));
  folder.file('README.md', readme);

  if (Object.keys(i18n).length > 0) {
    const i18nFolder = folder.folder('i18n')!;
    i18nFolder.file('default.json', JSON.stringify(i18n, null, 4));
  }

  // Create empty assets folder with placeholder
  const assetsFolder = folder.folder('assets')!;
  const uniqueFiles = audioFiles
    .flatMap(a => a.files)
    .filter((f, i, arr) => arr.indexOf(f) === i)
    .sort();
  
  assetsFolder.file('.gitkeep', 
`# 📁 Coloque seus arquivos .ogg aqui
# Place your .ogg files here

Total de arquivos necessários: ${uniqueFiles.length}

Lista completa:
${uniqueFiles.map(f => `- ${f}`).join('\n')}
`);

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
