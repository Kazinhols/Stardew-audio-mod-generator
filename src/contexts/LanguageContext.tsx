import { createContext, useContext, useState, useCallback, useEffect, type ReactNode } from 'react';

type Language = 'pt' | 'en';

interface Translations {
  [key: string]: {
    pt: string;
    en: string;
  };
}

const translations: Translations = {
  // Header
  'app.title': { pt: 'Stardew Audio Mod Generator', en: 'Stardew Audio Mod Generator' },
  'app.subtitle': { pt: 'SDV 1.6+ | Content Patcher', en: 'SDV 1.6+ | Content Patcher' },
  
  // Tabs
  'tab.setup': { pt: 'Setup', en: 'Setup' },
  'tab.audio': { pt: 'Áudios', en: 'Audios' },
  'tab.export': { pt: 'Exportar', en: 'Export' },
  'tab.help': { pt: 'Ajuda', en: 'Help' },
  
  // Setup Tab
  'setup.title': { pt: 'Configuração do Mod', en: 'Mod Configuration' },
  'setup.description': { pt: 'Preencha as informações do seu mod. Esses dados vão no manifest.json', en: 'Fill in your mod information. This data goes in manifest.json' },
  'setup.uniqueId': { pt: 'Unique ID', en: 'Unique ID' },
  'setup.uniqueIdHint': { pt: 'Formato: Autor.NomeDoMod', en: 'Format: Author.ModName' },
  'setup.modName': { pt: 'Nome do Mod', en: 'Mod Name' },
  'setup.author': { pt: 'Autor', en: 'Author' },
  'setup.version': { pt: 'Versão', en: 'Version' },
  'setup.description_field': { pt: 'Descrição', en: 'Description' },
  'setup.next': { pt: 'Próximo: Adicionar Áudios', en: 'Next: Add Audios' },
  
  // Audio Tab
  'audio.addTitle': { pt: 'Adicionar Áudio', en: 'Add Audio' },
  'audio.id': { pt: 'ID do Áudio', en: 'Audio ID' },
  'audio.idHint': { pt: 'digite ou selecione da lista', en: 'type or select from list' },
  'audio.category': { pt: 'Categoria', en: 'Category' },
  'audio.loop': { pt: 'Loop', en: 'Loop' },
  'audio.loopYes': { pt: 'Sim - Repetir continuamente', en: 'Yes - Repeat continuously' },
  'audio.loopNo': { pt: 'Não - Tocar uma vez', en: 'No - Play once' },
  'audio.files': { pt: 'Arquivos de Áudio', en: 'Audio Files' },
  'audio.filesHint': { pt: 'pode adicionar vários para variação', en: 'can add multiple for variation' },
  'audio.addFile': { pt: 'Adicionar', en: 'Add' },
  'audio.noFiles': { pt: 'Nenhum arquivo adicionado', en: 'No files added' },
  'audio.jukebox': { pt: 'Adicionar à Jukebox', en: 'Add to Jukebox' },
  'audio.jukeboxName': { pt: 'Nome na Jukebox', en: 'Jukebox Name' },
  'audio.jukeboxVisible': { pt: 'Visível na Jukebox?', en: 'Visible in Jukebox?' },
  'audio.jukeboxVisibleYes': { pt: 'Sim - Sempre visível', en: 'Yes - Always visible' },
  'audio.jukeboxVisibleNo': { pt: 'Não - Oculto', en: 'No - Hidden' },
  'audio.addToList': { pt: 'Adicionar à Lista', en: 'Add to List' },
  'audio.listTitle': { pt: 'Lista de Áudios', en: 'Audio List' },
  'audio.emptyList': { pt: 'Nenhum áudio adicionado ainda.', en: 'No audio added yet.' },
  'audio.emptyListHint': { pt: 'Preencha o formulário acima para começar!', en: 'Fill out the form above to get started!' },
  'audio.clearAll': { pt: 'Limpar Tudo', en: 'Clear All' },
  'audio.replacing': { pt: 'Substituindo', en: 'Replacing' },
  'audio.newCustom': { pt: 'Novo áudio customizado', en: 'New custom audio' },
  'audio.replace': { pt: 'Substitui', en: 'Replace' },
  'audio.new': { pt: 'Novo', en: 'New' },
  'audio.hidden': { pt: 'Oculto', en: 'Hidden' },
  
  // Categories
  'category.Music': { pt: 'Music - Trilhas sonoras', en: 'Music - Soundtracks' },
  'category.Ambient': { pt: 'Ambient - Sons ambiente', en: 'Ambient - Ambient sounds' },
  'category.Sound': { pt: 'Sound - Efeitos sonoros', en: 'Sound - Sound effects' },
  'category.Footstep': { pt: 'Footstep - Passos', en: 'Footstep - Footsteps' },
  
  // Export Tab
  'export.title': { pt: 'Exportar Arquivos', en: 'Export Files' },
  'export.description': { pt: 'Baixe os arquivos JSON e organize na estrutura de pastas correta.', en: 'Download the JSON files and organize them in the correct folder structure.' },
  'export.downloadAll': { pt: 'Baixar Todos', en: 'Download All' },
  'export.downloadZip': { pt: 'Baixar ZIP (.zip)', en: 'Download ZIP (.zip)' },
  'export.copy': { pt: 'Copiar', en: 'Copy' },
  'export.copied': { pt: 'Copiado para a área de transferência!', en: 'Copied to clipboard!' },
  'export.noAudios': { pt: 'Adicione pelo menos um áudio!', en: 'Add at least one audio!' },
  'export.success': { pt: 'Arquivos baixados com sucesso!', en: 'Files downloaded successfully!' },
  'export.zipSuccess': { pt: 'ZIP baixado com sucesso!', en: 'ZIP downloaded successfully!' },
  
  // Help Tab
  'help.folderStructure': { pt: 'Estrutura de Pastas', en: 'Folder Structure' },
  'help.jsonFormats': { pt: 'Formatos JSON Corretos (SDV 1.6+)', en: 'Correct JSON Formats (SDV 1.6+)' },
  'help.requirements': { pt: 'Requisitos', en: 'Requirements' },
  'help.troubleshooting': { pt: 'Troubleshooting', en: 'Troubleshooting' },
  'help.about': { pt: 'Sobre esta Versão', en: 'About this Version' },
  
  // Toast messages
  'toast.audioAdded': { pt: 'Áudio adicionado com sucesso!', en: 'Audio added successfully!' },
  'toast.audioRemoved': { pt: 'Áudio removido!', en: 'Audio removed!' },
  'toast.listCleared': { pt: 'Lista limpa!', en: 'List cleared!' },
  'toast.copied': { pt: 'Copiado para a área de transferência!', en: 'Copied to clipboard!' },
  'toast.copyError': { pt: 'Erro ao copiar!', en: 'Error copying!' },
  'toast.fileAlreadyAdded': { pt: 'Arquivo já adicionado!', en: 'File already added!' },
  'toast.fillAudioId': { pt: 'Preencha o ID do áudio!', en: 'Fill in the audio ID!' },
  'toast.addAtLeastOneFile': { pt: 'Adicione pelo menos um arquivo!', en: 'Add at least one file!' },
  'toast.idAlreadyExists': { pt: 'Este ID já existe na lista!', en: 'This ID already exists in the list!' },
  'toast.fillJukeboxName': { pt: 'Preencha o nome para a Jukebox!', en: 'Fill in the Jukebox name!' },
  'toast.addAtLeastOneAudio': { pt: 'Adicione pelo menos um áudio!', en: 'Add at least one audio!' },
  'toast.noJukeboxAudio': { pt: 'Nenhum áudio com Jukebox ativado!', en: 'No audio with Jukebox enabled!' },
  'toast.manifestDownloaded': { pt: 'manifest.json baixado!', en: 'manifest.json downloaded!' },
  'toast.contentDownloaded': { pt: 'content.json baixado!', en: 'content.json downloaded!' },
  'toast.i18nDownloaded': { pt: 'default.json baixado!', en: 'default.json downloaded!' },
  'toast.zipSuccess': { pt: 'baixado com sucesso!', en: 'downloaded successfully!' },
  'toast.zipError': { pt: 'Erro ao gerar arquivo ZIP!', en: 'Error generating ZIP file!' },
  'toast.projectExported': { pt: 'Projeto exportado!', en: 'Project exported!' },
  'toast.projectImported': { pt: 'Projeto importado com sucesso!', en: 'Project imported successfully!' },
  'toast.projectImportError': { pt: 'Erro ao importar projeto!', en: 'Error importing project!' },
  'toast.dataSaved': { pt: 'Dados salvos automaticamente!', en: 'Data saved automatically!' },
  'toast.filesAdded': { pt: '{count} arquivo(s) adicionado(s)!', en: '{count} file(s) added!' },
  
  // Confirm dialogs
  'confirm.removeAudio': { pt: 'Remover este áudio da lista?', en: 'Remove this audio from the list?' },
  'confirm.clearAll': { pt: 'Remover TODOS os áudios da lista?', en: 'Remove ALL audios from the list?' },
  
  // Project management
  'project.save': { pt: 'Salvar Projeto', en: 'Save Project' },
  'project.load': { pt: 'Carregar Projeto', en: 'Load Project' },
  'project.export': { pt: 'Exportar Projeto', en: 'Export Project' },
  'project.import': { pt: 'Importar Projeto', en: 'Import Project' },
  'project.autoSave': { pt: 'Auto-save ativo', en: 'Auto-save enabled' },
  
  // Loading
  'loading.generatingZip': { pt: '📦 Gerando arquivo ZIP...', en: '📦 Generating ZIP file...' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguageState] = useState<Language>(() => {
    // Safe check for browser environment
    if (typeof window === 'undefined') return 'en';
    
    try {
      const saved = localStorage.getItem('sdv-audio-mod-language');
      if (saved === 'en' || saved === 'pt') return saved;
      
      // Detect browser language
      if (navigator && navigator.language) {
        const browserLang = navigator.language.toLowerCase();
        return browserLang.startsWith('pt') ? 'pt' : 'en';
      }
    } catch (e) {
      console.warn('Language detection error:', e);
    }
    
    return 'en';
  });

  const setLanguage = useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      if (typeof window !== 'undefined' && window.localStorage) {
        localStorage.setItem('sdv-audio-mod-language', lang);
      }
    } catch (e) {
      console.warn('Failed to save language:', e);
    }
  }, []);

  const t = useCallback((key: string): string => {
    const translation = translations[key];
    if (!translation) {
      console.warn(`Missing translation for key: ${key}`);
      return key;
    }
    return translation[language];
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
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
}
