import { produce } from 'immer';
import type { AppState, AppAction, ModConfig } from '@/types/audio';

export const defaultConfig: ModConfig = {
  modId: 'SeuNome.AudioMod',
  modName: 'Meu Mod de Áudio',
  modAuthor: 'Seu Nome',
  modVersion: '1.0.0',
  modDescription: 'Adiciona e substitui áudios do jogo',
};

export const initialState: AppState = {
  modConfig: defaultConfig,
  audios: [],
  activeTab: 'setup',
  assetsFolder: null,
  loading: false,
  loadingMessage: '',
  scanResult: null,
  watching: false,
  dirty: false,
};

export function appReducer(state: AppState, action: AppAction): AppState {
  return produce(state, (draft) => {
    switch (action.type) {
      case 'SET_CONFIG':
        Object.assign(draft.modConfig, action.payload);
        draft.dirty = true;
        break;

      case 'SET_CONFIG_FULL':
        draft.modConfig = action.payload;
        draft.dirty = true;
        break;

      case 'ADD_AUDIO':
        draft.audios.push(action.payload);
        draft.dirty = true;
        break;

      case 'REMOVE_AUDIO':
        draft.audios.splice(action.payload, 1);
        draft.dirty = true;
        break;

      case 'UPDATE_AUDIO':
        draft.audios[action.payload.index] = action.payload.audio;
        draft.dirty = true;
        break;

      case 'REORDER_AUDIO': {
        const { from, to } = action.payload;
        const [item] = draft.audios.splice(from, 1);
        draft.audios.splice(to, 0, item);
        draft.dirty = true;
        break;
      }

      case 'CLEAR_AUDIOS':
        draft.audios = [];
        draft.dirty = true;
        break;

      case 'SET_TAB':
        draft.activeTab = action.payload;
        break;

      case 'SET_ASSETS_FOLDER':
        draft.assetsFolder = action.payload;
        break;

      case 'SET_LOADING':
        draft.loading = action.payload.loading;
        draft.loadingMessage = action.payload.message || '';
        break;

      case 'SET_SCAN_RESULT':
        draft.scanResult = action.payload;
        break;

      case 'SET_WATCHING':
        draft.watching = action.payload;
        break;

      case 'LOAD_PROJECT':
        draft.modConfig = action.payload.config;
        draft.audios = action.payload.audios;
        draft.dirty = false;
        break;

      case 'RESET':
        Object.assign(draft, initialState);
        break;

      case 'MARK_SAVED':
        draft.dirty = false;
        break;
    }
  });
}
