import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

type Language = 'pt' | 'en';

interface Translations {
  [key: string]: string;
}

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const translations: Record<Language, Translations> = {
  pt: {
    // Tabs
    'tab.setup': 'Configuração',
    'tab.audio': 'Áudios',
    'tab.export': 'Exportar',
    'tab.help': 'Ajuda',

    // App
    'app.unsaved': '🟡 Não salvo',
    'app.saved': '💾 Salvo',
    'app.open': 'Abrir',
    'app.save': 'Salvar',
    'app.new': 'Novo',
    'app.audios': 'áudios',
    'app.webEdition': 'Web Edition',
    'app.nativeDesktop': 'Native Desktop',
    'app.webShortcuts': 'Versão Web • Cross-save compatível',
    'app.desktopShortcuts': 'Ctrl+1-5: Abas | Ctrl+S: Salvar | Ctrl+O: Abrir',

    // Setup
    'setup.title': 'Configuração do Mod',
    'setup.description': 'Preencha as informações do seu mod de áudio para Stardew Valley.',
    'setup.uniqueId': 'ID Único do Mod',
    'setup.uniqueIdHint': 'Formato: SeuNome.NomeDoMod',
    'setup.uniqueIdPlaceholder': 'Ex: MeuNick.MusicasDaFazenda',
    'setup.modName': 'Nome do Mod',
    'setup.author': 'Autor',
    'setup.version': 'Versão',
    'setup.description_field': 'Descrição',
    'setup.next': 'Próximo: Áudios',

    // Audio
    'audio.addTitle': 'Adicionar Áudio',
    'audio.id': 'ID do Áudio',
    'audio.category': 'Categoria',
    'audio.loop': 'Loop',
    'audio.loopYes': '✅ Sim (loop contínuo)',
    'audio.loopNo': '❌ Não (toca uma vez)',
    'audio.files': 'Arquivos de Áudio',
    'audio.noFiles': 'Nenhum arquivo adicionado ainda',
    'audio.jukebox': 'Adicionar à Jukebox',
    'audio.jukeboxName': 'Nome na Jukebox',
    'audio.jukeboxVisible': 'Visível na Jukebox',
    'audio.jukeboxVisibleYes': '✅ Sim (visível)',
    'audio.jukeboxVisibleNo': '❌ Não (oculto)',
    'audio.addToList': 'Adicionar à Lista',
    'audio.replacing': 'Substituindo',
    'audio.newCustom': 'Novo áudio personalizado',
    'audio.replace': 'Substituir',
    'audio.new': 'Novo',
    'audio.hidden': 'Oculto',
    'audio.listTitle': 'Arquivos de Áudio',
    'audio.emptyList': 'Nenhum áudio adicionado ainda...',
    'audio.emptyListHint': 'Use o formulário acima para adicionar!',
    'audio.clearAll': 'Limpar Tudo',
    'audio.scannedFiles': 'Arquivos Escaneados',
    'audio.clickToUse': 'clique para usar',
    'audio.use': 'Usar',
    'audio.added': 'Adicionado',
    'audio.alreadyInList': 'Arquivo já na lista',
    'audio.fileAdded': 'adicionado',
    'audio.removed': 'Áudio removido',
    'audio.listCleared': 'Lista limpa',
    'audio.removeConfirm': 'Remover este áudio?',
    'audio.clearConfirm': 'Limpar toda a lista?',
    'audio.found': 'encontrados',
    'audio.available': 'disponíveis',
    'audio.allAdded': 'Todos os arquivos escaneados já foram adicionados!',
    'audio.addAll': 'Adicionar Todos',
    'audio.alreadyAllAdded': 'Todos já adicionados',
    'audio.addedCount': 'adicionado(s)',
    'audio.alreadyAddedWarn': 'Já adicionado',

    // Categories
    'category.Music': 'Música',
    'category.Ambient': 'Ambiente',
    'category.Sound': 'Efeito Sonoro',
    'category.Footstep': 'Passos',

    // Export
    'export.title': 'Exportar Mod',
    'export.titleNative': '📦 Exportar Mod (Nativo)',
    'export.titleWeb': '🌐 Exportar Mod (Web)',
    'export.descNative': 'Escrita direta no disco • Compressão ZIP nativa • Diálogos nativos do OS',
    'export.descWeb': 'Gerado no navegador (JSZip) • Download instantâneo • Sem acesso ao disco local',
    'export.audioCount': 'áudio(s)',
    'export.fileCount': 'arquivo(s)',
    'export.copyOgg': 'Copiar arquivos .ogg para a pasta do mod',
    'export.copyOggWarn': 'Configure a pasta de assets na aba Scanner',
    'export.exportFolder': 'Exportar para Pasta',
    'export.exportZip': 'Exportar como ZIP',
    'export.downloadZip': 'Baixar ZIP (.zip)',
    'export.techNative': '🦀 Rust: fs::write + zip::ZipWriter + native dialogs',
    'export.techWeb': '⚡ Web: React + JSZip (Client Side Generation)',
    'export.copied': '✅ Copiado',
    'export.copy': '📋 Copiar',
    'export.preview': 'Pré-visualização',

    // Scanner
    'scan.title': 'Scanner de Áudio',
    'scan.description': 'Escaneia pastas por arquivos de áudio (OGG, MP3, WAV, FLAC, etc). Reproduza, converta e adicione à lista do mod.',
    'scan.selectFolder': 'Selecionar Pasta',
    'scan.refresh': 'Atualizar',
    'scan.opening': 'Abrindo...',
    'scan.total': 'Total',
    'scan.valid': 'Válidos',
    'scan.invalid': 'Inválidos',
    'scan.size': 'Tamanho',
    'scan.files': 'Arquivos',
    'scan.selectAll': 'Selecionar Válidos',
    'scan.deselect': 'Desmarcar',
    'scan.addSelected': 'Adicionar à aba Áudio',
    'scan.addToAudio': 'Adicionar à aba Áudio',
    'scan.convert': 'Converter',
    'scan.emptyTitle': 'Selecione uma pasta de assets para escanear',
    'scan.emptyHint': 'Suporta: OGG, MP3, WAV, FLAC, M4A, AAC, WMA, OPUS',
    'scan.audioAdded': 'adicionado(s)',
    'scan.formats': 'Suporta: OGG, MP3, WAV, FLAC, M4A, AAC, WMA, OPUS',
    'scan.watch': 'Monitorar',
    'scan.watching': 'Monitorando',

    // Player
    'player.desktopOnly': 'Player disponível apenas no Desktop',
    'player.loading': 'Carregando áudio...',
    'player.error': 'Erro de reprodução',
    'player.errorLoad': 'Erro ao carregar',
    'player.errorPlay': 'Erro ao reproduzir',
    'player.loadFailed': 'Não foi possível carregar o áudio',
    'player.hintOpus': 'O arquivo pode ser OGG Opus (não suportado pelo SDV). Converta para OGG Vorbis.',
    'player.hintFormat': 'não é suportado pelo navegador. Converta para WAV ou OGG.',

    // Toast
    'toast.audioAdded': '✅ Áudio adicionado!',
    'toast.audioRemoved': '🗑️ Áudio removido',
    'toast.listCleared': '🗑️ Lista limpa',
    'toast.fillAudioId': '❌ Preencha o ID do áudio',
    'toast.addAtLeastOneFile': '❌ Adicione pelo menos um arquivo',
    'toast.idAlreadyExists': '❌ Este ID já existe na lista',
    'toast.fillJukeboxName': '❌ Preencha o nome da Jukebox',
    'toast.fileAlreadyAdded': '❌ Arquivo já adicionado',
    'toast.projectLoaded': '📂 Projeto carregado!',
    'toast.projectSaved': '💾 Projeto salvo!',
    'toast.projectRestored': '💾 Projeto anterior restaurado',
    'toast.projectRestoredBrowser': '💾 Projeto anterior restaurado do navegador',

    // Confirm
    'confirm.removeAudio': 'Remover este áudio?',
    'confirm.clearAll': 'Limpar toda a lista?',

    // Help
    'help.shortcuts': 'Atalhos de Teclado',
    'help.tabs': 'Abas',
    'help.saveProject': 'Salvar projeto',
    'help.openProject': 'Abrir projeto',
    'help.about': 'Sobre',
    'help.requirements': 'Requisitos',
    'help.structure': 'Estrutura do Mod Gerado',
    'help.format': 'Formato JSON (SDV 1.6+)',
  },
  en: {
    // Tabs
    'tab.setup': 'Setup',
    'tab.audio': 'Audio',
    'tab.export': 'Export',
    'tab.help': 'Help',

    // App
    'app.unsaved': '🟡 Unsaved',
    'app.saved': '💾 Saved',
    'app.open': 'Open',
    'app.save': 'Save',
    'app.new': 'New',
    'app.audios': 'audios',
    'app.webEdition': 'Web Edition',
    'app.nativeDesktop': 'Native Desktop',
    'app.webShortcuts': 'Web Version • Cross-save compatible',
    'app.desktopShortcuts': 'Ctrl+1-5: Tabs | Ctrl+S: Save | Ctrl+O: Open',

    // Setup
    'setup.title': 'Mod Configuration',
    'setup.description': 'Fill in your Stardew Valley audio mod information.',
    'setup.uniqueId': 'Unique Mod ID',
    'setup.uniqueIdHint': 'Format: YourName.ModName',
    'setup.uniqueIdPlaceholder': 'Ex: MyName.FarmMusic',
    'setup.modName': 'Mod Name',
    'setup.author': 'Author',
    'setup.version': 'Version',
    'setup.description_field': 'Description',
    'setup.next': 'Next: Audio',

    // Audio
    'audio.addTitle': 'Add Audio',
    'audio.id': 'Audio ID',
    'audio.category': 'Category',
    'audio.loop': 'Loop',
    'audio.loopYes': '✅ Yes (continuous loop)',
    'audio.loopNo': '❌ No (plays once)',
    'audio.files': 'Audio Files',
    'audio.noFiles': 'No files added yet',
    'audio.jukebox': 'Add to Jukebox',
    'audio.jukeboxName': 'Jukebox Name',
    'audio.jukeboxVisible': 'Visible in Jukebox',
    'audio.jukeboxVisibleYes': '✅ Yes (visible)',
    'audio.jukeboxVisibleNo': '❌ No (hidden)',
    'audio.addToList': 'Add to List',
    'audio.replacing': 'Replacing',
    'audio.newCustom': 'New custom audio',
    'audio.replace': 'Replace',
    'audio.new': 'New',
    'audio.hidden': 'Hidden',
    'audio.listTitle': 'Audio Files',
    'audio.emptyList': 'No audio added yet...',
    'audio.emptyListHint': 'Use the form above to add!',
    'audio.clearAll': 'Clear All',
    'audio.scannedFiles': 'Scanned Files',
    'audio.clickToUse': 'click to use',
    'audio.use': 'Use',
    'audio.added': 'Added',
    'audio.alreadyInList': 'File already in list',
    'audio.fileAdded': 'added',
    'audio.removed': 'Audio removed',
    'audio.listCleared': 'List cleared',
    'audio.removeConfirm': 'Remove this audio?',
    'audio.clearConfirm': 'Clear all?',
    'audio.found': 'found',
    'audio.available': 'available',
    'audio.allAdded': 'All scanned files have been added!',
    'audio.addAll': 'Add All',
    'audio.alreadyAllAdded': 'All already added',
    'audio.addedCount': 'added',
    'audio.alreadyAddedWarn': 'Already added',

    // Categories
    'category.Music': 'Music',
    'category.Ambient': 'Ambient',
    'category.Sound': 'Sound Effect',
    'category.Footstep': 'Footstep',

    // Export
    'export.title': 'Export Mod',
    'export.titleNative': '📦 Export Mod (Native)',
    'export.titleWeb': '🌐 Export Mod (Web)',
    'export.descNative': 'Direct disk writes • Native ZIP compression • OS native dialogs',
    'export.descWeb': 'Browser generated (JSZip) • Instant download • No local disk access',
    'export.audioCount': 'audio(s)',
    'export.fileCount': 'file(s)',
    'export.copyOgg': 'Copy .ogg files to mod folder',
    'export.copyOggWarn': 'Set up assets folder in Scanner tab',
    'export.exportFolder': 'Export to Folder',
    'export.exportZip': 'Export as ZIP',
    'export.downloadZip': 'Download ZIP (.zip)',
    'export.techNative': '🦀 Rust: fs::write + zip::ZipWriter + native dialogs',
    'export.techWeb': '⚡ Web: React + JSZip (Client Side Generation)',
    'export.copied': '✅ Copied',
    'export.copy': '📋 Copy',
    'export.preview': 'Preview',

    // Scanner
    'scan.title': 'Audio Scanner',
    'scan.description': 'Scan folders for audio files (OGG, MP3, WAV, FLAC, etc). Play, convert and add to mod list.',
    'scan.selectFolder': 'Select Folder',
    'scan.refresh': 'Refresh',
    'scan.opening': 'Opening...',
    'scan.total': 'Total',
    'scan.valid': 'Valid',
    'scan.invalid': 'Invalid',
    'scan.size': 'Size',
    'scan.files': 'Files',
    'scan.selectAll': 'Select Valid',
    'scan.deselect': 'Deselect',
    'scan.addSelected': 'Add to Audio tab',
    'scan.addToAudio': 'Add to Audio tab',
    'scan.convert': 'Convert',
    'scan.emptyTitle': 'Select an assets folder to scan',
    'scan.emptyHint': 'Supports: OGG, MP3, WAV, FLAC, M4A, AAC, WMA, OPUS',
    'scan.audioAdded': 'added',
    'scan.formats': 'Supports: OGG, MP3, WAV, FLAC, M4A, AAC, WMA, OPUS',
    'scan.watch': 'Watch',
    'scan.watching': 'Watching',

    // Player
    'player.desktopOnly': 'Player only available on Desktop',
    'player.loading': 'Loading audio...',
    'player.error': 'Playback error',
    'player.errorLoad': 'Failed to load',
    'player.errorPlay': 'Play error',
    'player.loadFailed': 'Could not load audio',
    'player.hintOpus': 'File may be OGG Opus (not supported by SDV). Convert to OGG Vorbis.',
    'player.hintFormat': 'is not supported by the browser. Convert to WAV or OGG.',

    // Toast
    'toast.audioAdded': '✅ Audio added!',
    'toast.audioRemoved': '🗑️ Audio removed',
    'toast.listCleared': '🗑️ List cleared',
    'toast.fillAudioId': '❌ Fill in the audio ID',
    'toast.addAtLeastOneFile': '❌ Add at least one file',
    'toast.idAlreadyExists': '❌ This ID already exists',
    'toast.fillJukeboxName': '❌ Fill in the Jukebox name',
    'toast.fileAlreadyAdded': '❌ File already added',
    'toast.projectLoaded': '📂 Project loaded!',
    'toast.projectSaved': '💾 Project saved!',
    'toast.projectRestored': '💾 Previous project restored',
    'toast.projectRestoredBrowser': '💾 Previous project restored from browser',

    // Confirm
    'confirm.removeAudio': 'Remove this audio?',
    'confirm.clearAll': 'Clear all?',

    // Help
    'help.shortcuts': 'Keyboard Shortcuts',
    'help.tabs': 'Tabs',
    'help.saveProject': 'Save project',
    'help.openProject': 'Open project',
    'help.about': 'About',
    'help.requirements': 'Requirements',
    'help.structure': 'Generated Mod Structure',
    'help.format': 'JSON Format (SDV 1.6+)',
  },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

function detectSystemLanguage(): Language {
  try {
    const langs = navigator.languages || [navigator.language];
    for (const lang of langs) {
      if (lang.toLowerCase().startsWith('pt')) return 'pt';
    }
  } catch (e) {
    console.warn('Language detection error:', e);
  }
  return 'en';
}

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    if (typeof window === 'undefined') return 'en';
    try {
      const saved = localStorage.getItem('sdv-audio-mod-language');
      if (saved === 'pt' || saved === 'en') return saved;
    } catch (e) {
      console.warn('localStorage error:', e);
    }
    const detected = detectSystemLanguage();
    console.log('🌐 Idioma detectado:', detected);
    return detected;
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('sdv-audio-mod-language', lang);
    } catch (e) {
      console.warn('Failed to save language:', e);
    }
  }, []);

  const t = useCallback((key: string): string => {
    return translations[language][key] || key;
  }, [language]);

  useEffect(() => {
    if (typeof document !== 'undefined') {
      document.documentElement.lang = language === 'pt' ? 'pt-BR' : 'en';
    }
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const context = useContext(LanguageContext);
  if (!context) throw new Error('useLanguage must be used within LanguageProvider');
  return context;
}