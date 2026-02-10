import { createContext, useContext, useState, useCallback, type ReactNode } from 'react';

type Language = 'pt' | 'en';

const translations: Record<string, Record<Language, string>> = {
  // Tabs
  'tab.setup': { pt: 'Configuração', en: 'Setup' },
  'tab.audio': { pt: 'Áudios', en: 'Audios' },
  'tab.export': { pt: 'Exportar', en: 'Export' },
  'tab.help': { pt: 'Ajuda', en: 'Help' },

  // Setup
  'setup.title': { pt: 'Configuração do Mod', en: 'Mod Configuration' },
  'setup.description': { pt: 'Configure as informações básicas do seu mod de áudio para Stardew Valley.', en: 'Configure the basic information for your Stardew Valley audio mod.' },
  'setup.uniqueId': { pt: 'ID Único do Mod', en: 'Mod Unique ID' },
  'setup.uniqueIdHint': { pt: 'formato: Autor.NomeDoMod', en: 'format: Author.ModName' },
  'setup.modName': { pt: 'Nome do Mod', en: 'Mod Name' },
  'setup.author': { pt: 'Autor', en: 'Author' },
  'setup.version': { pt: 'Versão', en: 'Version' },
  'setup.description_field': { pt: 'Descrição', en: 'Description' },
  'setup.next': { pt: 'Próximo: Áudios', en: 'Next: Audios' },

  // Audio Form
  'audio.addTitle': { pt: 'Adicionar Áudio', en: 'Add Audio' },
  'audio.id': { pt: 'ID do Áudio', en: 'Audio ID' },
  'audio.category': { pt: 'Categoria', en: 'Category' },
  'audio.loop': { pt: 'Loop', en: 'Loop' },
  'audio.loopYes': { pt: '✅ Sim, repetir', en: '✅ Yes, loop' },
  'audio.loopNo': { pt: '❌ Não repetir', en: '❌ No loop' },
  'audio.files': { pt: 'Arquivos de Áudio', en: 'Audio Files' },
  'audio.noFiles': { pt: 'Nenhum arquivo adicionado', en: 'No files added' },
  'audio.jukebox': { pt: 'Adicionar à Jukebox', en: 'Add to Jukebox' },
  'audio.jukeboxName': { pt: 'Nome na Jukebox', en: 'Jukebox Name' },
  'audio.jukeboxVisible': { pt: 'Visibilidade', en: 'Visibility' },
  'audio.jukeboxVisibleYes': { pt: '✅ Visível', en: '✅ Visible' },
  'audio.jukeboxVisibleNo': { pt: '🔒 Oculto', en: '🔒 Hidden' },
  'audio.addToList': { pt: 'Adicionar à Lista', en: 'Add to List' },
  'audio.replacing': { pt: 'Substituindo', en: 'Replacing' },
  'audio.newCustom': { pt: 'Novo áudio personalizado', en: 'New custom audio' },

  // Audio List
  'audio.listTitle': { pt: 'Lista de Áudios', en: 'Audio List' },
  'audio.emptyList': { pt: 'Nenhum áudio adicionado ainda.', en: 'No audios added yet.' },
  'audio.emptyListHint': { pt: 'Use o formulário acima para adicionar.', en: 'Use the form above to add some.' },
  'audio.replace': { pt: 'Substituir', en: 'Replace' },
  'audio.new': { pt: 'Novo', en: 'New' },
  'audio.hidden': { pt: 'Oculto', en: 'Hidden' },
  'audio.clearAll': { pt: 'Limpar Tudo', en: 'Clear All' },

  // Categories
  'category.Music': { pt: 'Música', en: 'Music' },
  'category.Ambient': { pt: 'Ambiente', en: 'Ambient' },
  'category.Sound': { pt: 'Efeito Sonoro', en: 'Sound Effect' },
  'category.Footstep': { pt: 'Passos', en: 'Footstep' },

  // Toasts
  'toast.audioAdded': { pt: 'Áudio adicionado com sucesso!', en: 'Audio added successfully!' },
  'toast.audioRemoved': { pt: 'Áudio removido.', en: 'Audio removed.' },
  'toast.allCleared': { pt: 'Todos os áudios foram removidos.', en: 'All audios cleared.' },
  'toast.listCleared': { pt: 'Lista limpa!', en: 'List cleared!' },
  'toast.fileAlreadyAdded': { pt: 'Arquivo já adicionado!', en: 'File already added!' },
  'toast.fillAudioId': { pt: 'Preencha o ID do áudio!', en: 'Please fill the Audio ID!' },
  'toast.addAtLeastOneFile': { pt: 'Adicione pelo menos um arquivo!', en: 'Add at least one file!' },
  'toast.idAlreadyExists': { pt: 'Este ID já existe na lista!', en: 'This ID already exists!' },
  'toast.fillJukeboxName': { pt: 'Preencha o nome da Jukebox!', en: 'Please fill the Jukebox name!' },

  // Confirm dialogs
  'confirm.removeAudio': { pt: 'Remover este áudio da lista?', en: 'Remove this audio from the list?' },
  'confirm.clearAll': { pt: 'Remover todos os áudios? Esta ação não pode ser desfeita.', en: 'Remove all audios? This action cannot be undone.' },

  // Export
  'export.generate': { pt: 'Gerar Mod', en: 'Generate Mod' },
  'export.preview': { pt: 'Pré-visualizar', en: 'Preview' },
  'export.download': { pt: 'Baixar', en: 'Download' },
  'export.manifest': { pt: 'Manifesto', en: 'Manifest' },
  'export.content': { pt: 'Conteúdo', en: 'Content' },

  // Help
  'help.title': { pt: 'Central de Ajuda', en: 'Help Center' },
  'help.gettingStarted': { pt: 'Primeiros Passos', en: 'Getting Started' },
  'help.faq': { pt: 'Perguntas Frequentes', en: 'FAQ' },
};

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string) => string;
}

const LanguageContext = createContext<LanguageContextType | null>(null);

export function LanguageProvider({ children }: { children: ReactNode }) {
  const [language, setLanguage] = useState<Language>('en');

  const t = useCallback((key: string): string => {
    return translations[key]?.[language] ?? key;
  }, [language]);

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
}

export function useLanguage() {
  const ctx = useContext(LanguageContext);
  if (!ctx) throw new Error('useLanguage must be used within LanguageProvider');
  return ctx;
}
