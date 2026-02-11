import type { OriginalAudio } from '@/types/audio';

export const originalAudios: OriginalAudio[] = [
  // Estações - Ambient
  { id: "spring_day_ambient", name: "Primavera - Dia (Ambient)", category: "Estações" },
  { id: "spring_night_ambient", name: "Primavera - Noite (Ambient)", category: "Estações" },
  { id: "summer_day_ambient", name: "Verão - Dia (Ambient)", category: "Estações" },
  { id: "summer_night_ambient", name: "Verão - Noite (Ambient)", category: "Estações" },
  { id: "fall_day_ambient", name: "Outono - Dia (Ambient)", category: "Estações" },
  { id: "fall_night_ambient", name: "Outono - Noite (Ambient)", category: "Estações" },
  { id: "winter_day_ambient", name: "Inverno - Dia (Ambient)", category: "Estações" },
  { id: "winter_night_ambient", name: "Inverno - Noite (Ambient)", category: "Estações" },

  // Primavera
  { id: "spring1", name: "It's A Big World Outside", category: "Primavera" },
  { id: "spring2", name: "Cloud Country", category: "Primavera" },
  { id: "spring3", name: "Spring (The Valley Comes Alive)", category: "Primavera" },

  // Verão
  { id: "summer1", name: "Nature's Crescendo", category: "Verão" },
  { id: "summer2", name: "The Sun Can Bend An Orange Sky", category: "Verão" },
  { id: "summer3", name: "A Golden Star Was Born", category: "Verão" },

  // Outono
  { id: "fall1", name: "Fall (Ghost Synth)", category: "Outono" },
  { id: "fall2", name: "Raven's Descent", category: "Outono" },
  { id: "fall3", name: "The Smell of Mushroom", category: "Outono" },

  // Inverno
  { id: "winter1", name: "Nocturne of Ice", category: "Inverno" },
  { id: "winter2", name: "The Frozen World Outside", category: "Inverno" },
  { id: "winter3", name: "Winter (Ancient)", category: "Inverno" },

  // Locais
  { id: "Saloon1", name: "Saloon - Honky Tonk", category: "Locais" },
  { id: "SamBand", name: "Sam's Band", category: "Locais" },
  { id: "Hospital_Ambient", name: "Hospital/Clínica", category: "Locais" },
  { id: "MarlonsTheme", name: "Tema do Marlon (Guilda)", category: "Locais" },
  { id: "WizardSong", name: "Tema do Mago", category: "Locais" },
  { id: "EmilyTheme", name: "Tema da Emily", category: "Locais" },
  { id: "ElliottPiano", name: "Piano do Elliott", category: "Locais" },
  { id: "VolcanoMines", name: "Minas do Vulcão", category: "Locais" },
  { id: "caldera", name: "Caldera", category: "Locais" },

  // Minas
  { id: "Crystal_Caves", name: "Minas - Níveis Gelo", category: "Minas" },
  { id: "Cloth_Caves", name: "Minas - Níveis Lava", category: "Minas" },
  { id: "Mines1", name: "Minas - Níveis Iniciais", category: "Minas" },
  { id: "SkullCave", name: "Caverna da Caveira", category: "Minas" },
  { id: "tribal", name: "Tribal (Minas fundo)", category: "Minas" },

  // Menu
  { id: "MainTheme", name: "Tema Principal (Título)", category: "Menu" },
  { id: "Cloud_Country", name: "Cloud Country (Menu)", category: "Menu" },
  { id: "title_night", name: "Tema Noturno (Título)", category: "Menu" },
  { id: "movieTheater", name: "Cinema", category: "Menu" },
  { id: "movieTheaterAfter", name: "Cinema (Depois)", category: "Menu" },

  // Festivais
  { id: "FlowerDance", name: "Dança das Flores", category: "Festivais" },
  { id: "Luau", name: "Luau", category: "Festivais" },
  { id: "MoonlightJellies", name: "Dança das Águas-vivas", category: "Festivais" },
  { id: "FairyIceCastle", name: "Festival do Gelo", category: "Festivais" },
  { id: "WinterFestival", name: "Festival do Inverno", category: "Festivais" },
  { id: "FallFest", name: "Feira de Outono", category: "Festivais" },
  { id: "SpiritsEve", name: "Véspera dos Espíritos", category: "Festivais" },
  { id: "EggFestival", name: "Festival do Ovo", category: "Festivais" },

  // Eventos
  { id: "Grandpa", name: "Tema do Vovô", category: "Eventos" },
  { id: "wedding", name: "Casamento", category: "Eventos" },
  { id: "EarthMine", name: "Earth Mine (Evento)", category: "Eventos" },
  { id: "FrogCave", name: "Frog Cave", category: "Eventos" },

  // Minigames
  { id: "Cowboy_OVERWORLD", name: "Cowboy - Overworld", category: "Minigames" },
  { id: "Cowboy_boss", name: "Cowboy - Boss", category: "Minigames" },
  { id: "JunimoKart", name: "Junimo Kart", category: "Minigames" },
  { id: "crane_game", name: "Jogo da Garra", category: "Minigames" },

  // Ilha Gengibre
  { id: "IslandMusic", name: "Música da Ilha", category: "Ilha" },
  { id: "PIRATE_THEME", name: "Tema Pirata", category: "Ilha" },
  { id: "fieldofficeTentMusic", name: "Tenda Escritório", category: "Ilha" },

  // Outros
  { id: "communityCenter", name: "Centro Comunitário", category: "Outros" },
  { id: "woodsTheme", name: "Floresta Secreta", category: "Outros" },
  { id: "sewer", name: "Esgoto", category: "Outros" },
  { id: "nightTime", name: "Night Time", category: "Outros" },
  { id: "sweet", name: "Sweet", category: "Outros" },
  { id: "sad", name: "Sad", category: "Outros" },

  // Sons Ambiente
  { id: "croak", name: "Coaxar de Sapo", category: "Sons" },
  { id: "rainsound", name: "Som de Chuva", category: "Sons" },
  { id: "thunder", name: "Trovão", category: "Sons" },
  { id: "thunder_small", name: "Trovão Pequeno", category: "Sons" },
];
