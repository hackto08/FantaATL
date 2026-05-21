// 84 giocatori divisi in 3 fasce
// Prima fascia: 20 | Seconda fascia: 32 | Terza fascia: 32
// Ruoli: Portiere | Difensore | Attaccante

export const PLAYERS = [
  // ── Prima fascia (20) ─────────────────────────────────────
  { id: 1,  name: 'Marco Rossi',        tier: 1, role: 'Portiere'  },
  { id: 2,  name: 'Luca Bianchi',       tier: 1, role: 'Giocatore' },
  { id: 3,  name: 'Andrea Esposito',    tier: 1, role: 'Giocatore' },
  { id: 4,  name: 'Davide Conti',       tier: 1, role: 'Giocatore'  },
  { id: 5,  name: 'Matteo Ferrara',     tier: 1, role: 'Giocatore' },
  { id: 6,  name: 'Giorgio Ricci',      tier: 1, role: 'Giocatore'  },
  { id: 7,  name: 'Alessandro Moro',    tier: 1, role: 'Giocatore' },
  { id: 8,  name: 'Cristian Gallo',     tier: 1, role: 'Giocatore'  },
  { id: 9,  name: 'Simone Romano',      tier: 1, role: 'Giocatore' },
  { id: 10, name: 'Federico Greco',     tier: 1, role: 'Giocatore'  },
  { id: 11, name: 'Antonio De Luca',    tier: 1, role: 'Giocatore' },
  { id: 12, name: 'Roberto Martinelli', tier: 1, role: 'Portiere'   },
  { id: 13, name: 'Stefano Colombo',    tier: 1, role: 'Giocatore'  },
  { id: 14, name: 'Vincenzo Russo',     tier: 1, role: 'Giocatore' },
  { id: 15, name: 'Emanuele Ferrari',   tier: 1, role: 'Giocatore'  },
  { id: 16, name: 'Claudio Ricci',      tier: 1, role: 'Giocatore' },
  { id: 17, name: 'Massimo Galli',      tier: 1, role: 'Giocatore'  },
  { id: 18, name: 'Daniele Costa',      tier: 1, role: 'Giocatore' },
  { id: 19, name: 'Fabio Marini',       tier: 1, role: 'Giocatore'  },
  { id: 20, name: 'Gianluca Moretti',   tier: 1, role: 'Giocatore' },

  // ── Seconda fascia (32) ───────────────────────────────────
  { id: 21, name: 'Paolo Fontana',      tier: 2, role: 'Portiere'   },
  { id: 22, name: 'Lorenzo Villa',      tier: 2, role: 'Giocatore'  },
  { id: 23, name: 'Nicola Serra',       tier: 2, role: 'Giocatore' },
  { id: 24, name: 'Enrico Caruso',      tier: 2, role: 'Giocatore'  },
  { id: 25, name: 'Francesco Poli',     tier: 2, role: 'Giocatore' },
  { id: 26, name: 'Mattia Sala',        tier: 2, role: 'Giocatore'  },
  { id: 27, name: 'Dario Fabbri',       tier: 2, role: 'Giocatore' },
  { id: 28, name: 'Pietro Gatti',       tier: 2, role: 'Portiere'   },
  { id: 29, name: 'Enzo Mariani',       tier: 2, role: 'Giocatore'  },
  { id: 30, name: 'Alfredo Monti',      tier: 2, role: 'Giocatore' },
  { id: 31, name: 'Cesare Longo',       tier: 2, role: 'Giocatore'  },
  { id: 32, name: 'Bruno Ferretti',     tier: 2, role: 'Giocatore' },
  { id: 33, name: 'Pier Luigi Neri',    tier: 2, role: 'Giocatore'  },
  { id: 34, name: 'Marco Cattaneo',     tier: 2, role: 'Giocatore' },
  { id: 35, name: 'Andrea Ferri',       tier: 2, role: 'Giocatore'  },
  { id: 36, name: 'Simone D\'Angelo',   tier: 2, role: 'Giocatore' },
  { id: 37, name: 'Roberto Palumbo',    tier: 2, role: 'Giocatore'  },
  { id: 38, name: 'Luca Manfredi',      tier: 2, role: 'Giocatore' },
  { id: 39, name: 'Davide Mancini',     tier: 2, role: 'Giocatore'  },
  { id: 40, name: 'Antonio Vitale',     tier: 2, role: 'Giocatore' },
  { id: 41, name: 'Massimo Rizzo',      tier: 2, role: 'Giocatore'  },
  { id: 42, name: 'Stefano Bernardi',   tier: 2, role: 'Giocatore' },
  { id: 43, name: 'Vincenzo Palma',     tier: 2, role: 'Giocatore'  },
  { id: 44, name: 'Giorgio Bassi',      tier: 2, role: 'Giocatore' },
  { id: 45, name: 'Federico Caputo',    tier: 2, role: 'Giocatore'  },
  { id: 46, name: 'Alessandro Gentile', tier: 2, role: 'Giocatore' },
  { id: 47, name: 'Cristian Lombardi',  tier: 2, role: 'Giocatore'  },
  { id: 48, name: 'Nicola Bianco',      tier: 2, role: 'Giocatore' },
  { id: 49, name: 'Emanuele Riva',      tier: 2, role: 'Giocatore'  },
  { id: 50, name: 'Daniele Amato',      tier: 2, role: 'Giocatore' },
  { id: 51, name: 'Fabio Silvestri',    tier: 2, role: 'Giocatore'  },
  { id: 52, name: 'Lorenzo Testa',      tier: 2, role: 'Giocatore' },

  // ── Terza fascia (32) ─────────────────────────────────────
  { id: 53, name: 'Giuseppe Marini',    tier: 3, role: 'Portiere'   },
  { id: 54, name: 'Salvatore Bruno',    tier: 3, role: 'Giocatore'  },
  { id: 55, name: 'Carmelo Fiore',      tier: 3, role: 'Giocatore' },
  { id: 56, name: 'Pasquale Sorrentino',tier: 3, role: 'Giocatore'  },
  { id: 57, name: 'Filippo Barbieri',   tier: 3, role: 'Giocatore' },
  { id: 58, name: 'Michele Pagano',     tier: 3, role: 'Portiere'   },
  { id: 59, name: 'Angelo Pellegrini',  tier: 3, role: 'Giocatore'  },
  { id: 60, name: 'Gennaro Santoro',    tier: 3, role: 'Giocatore' },
  { id: 61, name: 'Renato Grasso',      tier: 3, role: 'Giocatore'  },
  { id: 62, name: 'Vito Ferraro',       tier: 3, role: 'Giocatore' },
  { id: 63, name: 'Aldo Monti',         tier: 3, role: 'Portiere'   },
  { id: 64, name: 'Sandro Parisi',      tier: 3, role: 'Giocatore'  },
  { id: 65, name: 'Ezio Donati',        tier: 3, role: 'Giocatore' },
  { id: 66, name: 'Rino Battaglia',     tier: 3, role: 'Giocatore'  },
  { id: 67, name: 'Bruno Leone',        tier: 3, role: 'Giocatore' },
  { id: 68, name: 'Carlo Mele',         tier: 3, role: 'Giocatore'  },
  { id: 69, name: 'Dino Martino',       tier: 3, role: 'Giocatore' },
  { id: 70, name: 'Franco Sanna',       tier: 3, role: 'Giocatore'  },
  { id: 71, name: 'Mario Nuzzo',        tier: 3, role: 'Giocatore' },
  { id: 72, name: 'Lucio Baldi',        tier: 3, role: 'Giocatore'  },
  { id: 73, name: 'Piero Fazio',        tier: 3, role: 'Giocatore' },
  { id: 74, name: 'Otello Greco',       tier: 3, role: 'Giocatore'  },
  { id: 75, name: 'Renato Landi',       tier: 3, role: 'Giocatore' },
  { id: 76, name: 'Valerio Capasso',    tier: 3, role: 'Giocatore'  },
  { id: 77, name: 'Diego Marotta',      tier: 3, role: 'Giocatore' },
  { id: 78, name: 'Biagio Piccolo',     tier: 3, role: 'Giocatore'  },
  { id: 79, name: 'Nando Serra',        tier: 3, role: 'Giocatore' },
  { id: 80, name: 'Nico Landi',         tier: 3, role: 'Giocatore'  },
  { id: 81, name: 'Rocco Basile',       tier: 3, role: 'Giocatore' },
  { id: 82, name: 'Gino Amendola',      tier: 3, role: 'Giocatore'  },
  { id: 83, name: 'Toto Milani',        tier: 3, role: 'Giocatore' },
  { id: 84, name: 'Ennio Palumbo',      tier: 3, role: 'Giocatore'  },
]

export const TIER_LABELS = {
  1: 'Prima fascia',
  2: 'Seconda fascia',
  3: 'Terza fascia',
}

export const ROLE_LABELS = {
  Portiere:  'Portiere',
  Giocatore: 'Giocatore',
}

export const TIER_LIMITS = { 1: 2, 2: 2, 3: 3 }

export const SQUAD_MAX   = 7
export const STARTER_MAX = 5
export const RESERVE_MAX = 2

export const DEADLINE = new Date('2026-06-21T09:29:00')
