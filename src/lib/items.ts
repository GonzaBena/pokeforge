import type { ItemCategory, ItemData, PokemonStats } from './types'
import type { Locale } from './i18n/translations'

export type { ItemCategory, ItemData }

export const ITEMS_DATABASE: ItemData[] = [
  // --- Modificadores de Estadísticas (Stat Boosters) ---
  {
    id: 'choice-band',
    name: 'Choice Band',
    nameEs: 'Cinta Elegida',
    nameEn: 'Choice Band',
    category: 'stat-boost',
    icon: 'award',
    effect: {
      statMultipliers: { attack: 1.5 },
      descriptionEs: 'Aumenta el Ataque un 50%, pero solo permite usar un movimiento.',
      descriptionEn: 'Boosts Attack by 50%, but only allows the use of one move.',
    },
    shortDescEs: '+50% Ataque (bloquea movimiento)',
    shortDescEn: '+50% Attack (locks move)',
  },
  {
    id: 'choice-specs',
    name: 'Choice Specs',
    nameEs: 'Gafas Elegidas',
    nameEn: 'Choice Specs',
    category: 'stat-boost',
    icon: 'glasses',
    effect: {
      statMultipliers: { specialAttack: 1.5 },
      descriptionEs: 'Aumenta el Ataque Especial un 50%, pero solo permite usar un movimiento.',
      descriptionEn: 'Boosts Sp. Atk by 50%, but only allows the use of one move.',
    },
    shortDescEs: '+50% At. Esp (bloquea movimiento)',
    shortDescEn: '+50% Sp. Atk (locks move)',
  },
  {
    id: 'choice-scarf',
    name: 'Choice Scarf',
    nameEs: 'Pañuelo Elegido',
    nameEn: 'Choice Scarf',
    category: 'stat-boost',
    icon: 'wind',
    effect: {
      statMultipliers: { speed: 1.5 },
      descriptionEs: 'Aumenta la Velocidad un 50%, pero solo permite usar un movimiento.',
      descriptionEn: 'Boosts Speed by 50%, but only allows the use of one move.',
    },
    shortDescEs: '+50% Velocidad (bloquea movimiento)',
    shortDescEn: '+50% Speed (locks move)',
  },
  {
    id: 'assault-vest',
    name: 'Assault Vest',
    nameEs: 'Chaleco Asalto',
    nameEn: 'Assault Vest',
    category: 'stat-boost',
    icon: 'shield',
    effect: {
      statMultipliers: { specialDefense: 1.5 },
      descriptionEs: 'Aumenta la Defensa Especial un 50%, pero impide usar movimientos de estado.',
      descriptionEn: 'Boosts Sp. Def by 50%, but prevents the use of status moves.',
    },
    shortDescEs: '+50% Def. Esp (solo ataques)',
    shortDescEn: '+50% Sp. Def (damaging moves only)',
  },
  {
    id: 'eviolite',
    name: 'Eviolite',
    nameEs: 'Mineral Evolutivo',
    nameEn: 'Eviolite',
    category: 'stat-boost',
    icon: 'gem',
    effect: {
      statMultipliers: { defense: 1.5, specialDefense: 1.5 },
      statCondition: { requiresUnevolved: true },
      descriptionEs:
        'Aumenta la Defensa y la Defensa Especial un 50% si el Pokémon aún puede evolucionar.',
      descriptionEn: 'Boosts Defense and Sp. Def by 50% if the Pokémon can still evolve.',
    },
    shortDescEs: '+50% Def y Def. Esp (si no ha evolucionado del todo)',
    shortDescEn: '+50% Def & Sp. Def (if unevolved)',
  },
  {
    id: 'thick-club',
    name: 'Thick Club',
    nameEs: 'Hueso Grueso',
    nameEn: 'Thick Club',
    category: 'species-specific',
    icon: 'hammer',
    effect: {
      statMultipliers: { attack: 2.0 },
      statCondition: { speciesIds: [104, 105] }, // Cubone, Marowak
      descriptionEs: 'Duplica el Ataque (x2) de Cubone y Marowak (incluido Marowak de Alola).',
      descriptionEn: 'Doubles the Attack (x2) of Cubone and Marowak (including Alolan Marowak).',
    },
    shortDescEs: 'x2 Ataque (Cubone / Marowak)',
    shortDescEn: 'x2 Attack (Cubone / Marowak)',
  },
  {
    id: 'light-ball',
    name: 'Light Ball',
    nameEs: 'Bola Luminosa',
    nameEn: 'Light Ball',
    category: 'species-specific',
    icon: 'sun',
    effect: {
      statMultipliers: { attack: 2.0, specialAttack: 2.0 },
      statCondition: { speciesIds: [25] }, // Pikachu
      descriptionEs: 'Duplica el Ataque y el Ataque Especial (x2) de Pikachu.',
      descriptionEn: 'Doubles the Attack and Sp. Atk (x2) of Pikachu.',
    },
    shortDescEs: 'x2 Ataque y At. Esp (Pikachu)',
    shortDescEn: 'x2 Attack & Sp. Atk (Pikachu)',
  },
  {
    id: 'deep-sea-tooth',
    name: 'Deep Sea Tooth',
    nameEs: 'Diente Marino',
    nameEn: 'Deep Sea Tooth',
    category: 'species-specific',
    icon: 'sparkles',
    effect: {
      statMultipliers: { specialAttack: 2.0 },
      statCondition: { speciesIds: [366] }, // Clamperl
      descriptionEs: 'Duplica el Ataque Especial (x2) de Clamperl.',
      descriptionEn: 'Doubles the Sp. Atk (x2) of Clamperl.',
    },
    shortDescEs: 'x2 At. Esp (Clamperl)',
    shortDescEn: 'x2 Sp. Atk (Clamperl)',
  },
  {
    id: 'deep-sea-scale',
    name: 'Deep Sea Scale',
    nameEs: 'Escama Marina',
    nameEn: 'Deep Sea Scale',
    category: 'species-specific',
    icon: 'shield-check',
    effect: {
      statMultipliers: { specialDefense: 2.0 },
      statCondition: { speciesIds: [366] }, // Clamperl
      descriptionEs: 'Duplica la Defensa Especial (x2) de Clamperl.',
      descriptionEn: 'Doubles the Sp. Def (x2) of Clamperl.',
    },
    shortDescEs: 'x2 Def. Esp (Clamperl)',
    shortDescEn: 'x2 Sp. Def (Clamperl)',
  },
  {
    id: 'metal-powder',
    name: 'Metal Powder',
    nameEs: 'Polvo Metálico',
    nameEn: 'Metal Powder',
    category: 'species-specific',
    icon: 'shield',
    effect: {
      statMultipliers: { defense: 2.0 },
      statCondition: { speciesIds: [132] }, // Ditto
      descriptionEs: 'Duplica la Defensa (x2) de Ditto mientras no esté transformado.',
      descriptionEn: 'Doubles the Defense (x2) of Ditto while not transformed.',
    },
    shortDescEs: 'x2 Defensa (Ditto)',
    shortDescEn: 'x2 Defense (Ditto)',
  },
  {
    id: 'quick-powder',
    name: 'Quick Powder',
    nameEs: 'Polvo Veloz',
    nameEn: 'Quick Powder',
    category: 'species-specific',
    icon: 'zap',
    effect: {
      statMultipliers: { speed: 2.0 },
      statCondition: { speciesIds: [132] }, // Ditto
      descriptionEs: 'Duplica la Velocidad (x2) de Ditto mientras no esté transformado.',
      descriptionEn: 'Doubles the Speed (x2) of Ditto while not transformed.',
    },
    shortDescEs: 'x2 Velocidad (Ditto)',
    shortDescEn: 'x2 Speed (Ditto)',
  },
  {
    id: 'soul-dew',
    name: 'Soul Dew',
    nameEs: 'Rocío Bondad',
    nameEn: 'Soul Dew',
    category: 'species-specific',
    icon: 'droplet',
    effect: {
      statCondition: { speciesIds: [380, 381] }, // Latias, Latios
      descriptionEs:
        'Aumenta la potencia de los movimientos de tipo Dragón y Psíquico de Latios y Latias un 20%.',
      descriptionEn:
        'Boosts the power of Dragon and Psychic moves used by Latios and Latias by 20%.',
    },
    shortDescEs: '+20% Dragón/Psíquico (Latios/Latias)',
    shortDescEn: '+20% Dragon/Psychic (Latios/Latias)',
  },

  // --- Inmunidades y Alteraciones de Tipo (Defensive / Immunities) ---
  {
    id: 'air-balloon',
    name: 'Air Balloon',
    nameEs: 'Globo Helio',
    nameEn: 'Air Balloon',
    category: 'defensive',
    icon: 'cloud',
    effect: {
      grantsImmunities: ['ground'],
      descriptionEs:
        'Otorga inmunidad total frente a movimientos de tipo Tierra y riesgos en el suelo. Explota al recibir un golpe.',
      descriptionEn:
        'Grants full immunity to Ground-type moves and ground hazards. Pops when hit by an attack.',
    },
    shortDescEs: 'Inmunidad a Tierra (Ground)',
    shortDescEn: 'Immunity to Ground',
  },
  {
    id: 'ring-target',
    name: 'Ring Target',
    nameEs: 'Blanco',
    nameEn: 'Ring Target',
    category: 'defensive',
    icon: 'target',
    effect: {
      revokesImmunities: true,
      descriptionEs:
        'Anula todas las inmunidades por tipo del portador, permitiendo que cualquier tipo le cause daño.',
      descriptionEn:
        'Removes all type immunities from the holder, allowing any move type to hit it.',
    },
    shortDescEs: 'Anula inmunidades elementales (recibe daño x1)',
    shortDescEn: 'Removes all type immunities',
  },
  {
    id: 'iron-ball',
    name: 'Iron Ball',
    nameEs: 'Bola Férrea',
    nameEn: 'Iron Ball',
    category: 'utility',
    icon: 'disc',
    effect: {
      statMultipliers: { speed: 0.5 },
      descriptionEs:
        'Reduce la Velocidad un 50% y anula la inmunidad a Tierra de los Pokémon de tipo Volador o con Levitación.',
      descriptionEn:
        'Cuts Speed by 50% and removes Ground immunity from Flying types or Pokémon with Levitate.',
    },
    shortDescEs: '-50% Vel y pierde inmunidad a Tierra',
    shortDescEn: '-50% Spe & grounds holder',
  },
  {
    id: 'heavy-duty-boots',
    name: 'Heavy-Duty Boots',
    nameEs: 'Botas Gruesas',
    nameEn: 'Heavy-Duty Boots',
    category: 'defensive',
    icon: 'footprints',
    effect: {
      descriptionEs:
        'Protege al portador de los efectos y daño de todas las trampas de entrada (Trampa Rocas, Púas, Púas Tóxicas, Red Viscosa).',
      descriptionEn:
        'Protects the holder from the effects and damage of entry hazards (Stealth Rock, Spikes, Toxic Spikes, Sticky Web).',
    },
    shortDescEs: 'Inmunidad a Trampas de Entrada',
    shortDescEn: 'Immunity to Entry Hazards',
  },
  {
    id: 'leftovers',
    name: 'Leftovers',
    nameEs: 'Restos',
    nameEn: 'Leftovers',
    category: 'competitive',
    icon: 'apple',
    effect: {
      descriptionEs: 'Restaura 1/16 de los PS máximos del portador al final de cada turno.',
      descriptionEn: "Restores 1/16 of the holder's maximum HP at the end of each turn.",
    },
    shortDescEs: 'Recupera 1/16 PS cada turno',
    shortDescEn: 'Restores 1/16 max HP each turn',
  },
  {
    id: 'focus-sash',
    name: 'Focus Sash',
    nameEs: 'Banda Focus',
    nameEn: 'Focus Sash',
    category: 'competitive',
    icon: 'shield-alert',
    effect: {
      descriptionEs:
        'Si el portador tiene los PS al máximo, sobrevive a cualquier ataque que causaría K.O. con 1 PS.',
      descriptionEn: 'If the holder has full HP, survives any hit that would KO it with 1 HP.',
    },
    shortDescEs: 'Sobrevive con 1 PS si estaba al 100%',
    shortDescEn: 'Survives lethal hit with 1 HP from full',
  },
  {
    id: 'rocky-helmet',
    name: 'Rocky Helmet',
    nameEs: 'Casco Dentado',
    nameEn: 'Rocky Helmet',
    category: 'competitive',
    icon: 'shield',
    effect: {
      descriptionEs:
        'Inflige un daño equivalente a 1/6 de los PS máximos al atacante cuando hace contacto.',
      descriptionEn: 'Deals damage equal to 1/6 of max HP to the attacker upon contact.',
    },
    shortDescEs: 'Daña 1/6 PS al atacante por contacto',
    shortDescEn: 'Deals 1/6 max HP on contact',
  },
  {
    id: 'black-sludge',
    name: 'Black Sludge',
    nameEs: 'Lodo Negro',
    nameEn: 'Black Sludge',
    category: 'competitive',
    icon: 'flask-conical',
    effect: {
      descriptionEs:
        'Restaura 1/16 de PS cada turno a Pokémon de tipo Veneno; inflige 1/8 de daño por turno a otros tipos.',
      descriptionEn:
        'Restores 1/16 HP each turn to Poison types; damages other types by 1/8 HP each turn.',
    },
    shortDescEs: 'Recupera PS a Veneno / Daña a otros',
    shortDescEn: 'Heals Poison types / damages others',
  },

  // --- Potenciadores de Tipo y Daño (Type Boosters & Damage) ---
  {
    id: 'life-orb',
    name: 'Life Orb',
    nameEs: 'Vidasfera',
    nameEn: 'Life Orb',
    category: 'competitive',
    icon: 'flame',
    effect: {
      boostMultiplier: 1.3,
      descriptionEs:
        'Aumenta la potencia de todos los ataques un 30%, a cambio del 10% de los PS máximos por golpe.',
      descriptionEn: 'Boosts damage of all attacks by 30%, but takes 10% max HP recoil per attack.',
    },
    shortDescEs: '+30% daño (10% retroceso de PS)',
    shortDescEn: '+30% damage (10% recoil HP)',
  },
  {
    id: 'expert-belt',
    name: 'Expert Belt',
    nameEs: 'Cinta Experto',
    nameEn: 'Expert Belt',
    category: 'competitive',
    icon: 'medal',
    effect: {
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos supereficaces un 20%.',
      descriptionEn: 'Boosts damage of super-effective moves by 20%.',
    },
    shortDescEs: '+20% daño supereficaz',
    shortDescEn: '+20% super-effective damage',
  },
  {
    id: 'charcoal',
    name: 'Charcoal',
    nameEs: 'Carbón',
    nameEn: 'Charcoal',
    category: 'type-boost',
    icon: 'flame',
    effect: {
      boostedType: 'fire',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Fuego un 20%.',
      descriptionEn: 'Boosts the power of Fire-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Fuego',
    shortDescEn: '+20% Fire moves',
  },
  {
    id: 'mystic-water',
    name: 'Mystic Water',
    nameEs: 'Agua Mística',
    nameEn: 'Mystic Water',
    category: 'type-boost',
    icon: 'droplet',
    effect: {
      boostedType: 'water',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Agua un 20%.',
      descriptionEn: 'Boosts the power of Water-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Agua',
    shortDescEn: '+20% Water moves',
  },
  {
    id: 'miracle-seed',
    name: 'Miracle Seed',
    nameEs: 'Semilla Milagro',
    nameEn: 'Miracle Seed',
    category: 'type-boost',
    icon: 'sprout',
    effect: {
      boostedType: 'grass',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Planta un 20%.',
      descriptionEn: 'Boosts the power of Grass-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Planta',
    shortDescEn: '+20% Grass moves',
  },
  {
    id: 'magnet',
    name: 'Magnet',
    nameEs: 'Imán',
    nameEn: 'Magnet',
    category: 'type-boost',
    icon: 'zap',
    effect: {
      boostedType: 'electric',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Eléctrico un 20%.',
      descriptionEn: 'Boosts the power of Electric-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Eléctrico',
    shortDescEn: '+20% Electric moves',
  },
  {
    id: 'silk-scarf',
    name: 'Silk Scarf',
    nameEs: 'Pañuelo Seda',
    nameEn: 'Silk Scarf',
    category: 'type-boost',
    icon: 'feather',
    effect: {
      boostedType: 'normal',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Normal un 20%.',
      descriptionEn: 'Boosts the power of Normal-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Normal',
    shortDescEn: '+20% Normal moves',
  },
  {
    id: 'black-belt',
    name: 'Black Belt',
    nameEs: 'Cinturón Negro',
    nameEn: 'Black Belt',
    category: 'type-boost',
    icon: 'swords',
    effect: {
      boostedType: 'fighting',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Lucha un 20%.',
      descriptionEn: 'Boosts the power of Fighting-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Lucha',
    shortDescEn: '+20% Fighting moves',
  },
  {
    id: 'sharp-beak',
    name: 'Sharp Beak',
    nameEs: 'Pico Afilado',
    nameEn: 'Sharp Beak',
    category: 'type-boost',
    icon: 'feather',
    effect: {
      boostedType: 'flying',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Volador un 20%.',
      descriptionEn: 'Boosts the power of Flying-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Volador',
    shortDescEn: '+20% Flying moves',
  },
  {
    id: 'poison-barb',
    name: 'Poison Barb',
    nameEs: 'Flecha Venenosa',
    nameEn: 'Poison Barb',
    category: 'type-boost',
    icon: 'skull',
    effect: {
      boostedType: 'poison',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Veneno un 20%.',
      descriptionEn: 'Boosts the power of Poison-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Veneno',
    shortDescEn: '+20% Poison moves',
  },
  {
    id: 'soft-sand',
    name: 'Soft Sand',
    nameEs: 'Arena Fina',
    nameEn: 'Soft Sand',
    category: 'type-boost',
    icon: 'mountain',
    effect: {
      boostedType: 'ground',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Tierra un 20%.',
      descriptionEn: 'Boosts the power of Ground-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Tierra',
    shortDescEn: '+20% Ground moves',
  },
  {
    id: 'hard-stone',
    name: 'Hard Stone',
    nameEs: 'Piedra Dura',
    nameEn: 'Hard Stone',
    category: 'type-boost',
    icon: 'gem',
    effect: {
      boostedType: 'rock',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Roca un 20%.',
      descriptionEn: 'Boosts the power of Rock-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Roca',
    shortDescEn: '+20% Rock moves',
  },
  {
    id: 'silver-powder',
    name: 'Silver Powder',
    nameEs: 'Polvo Plata',
    nameEn: 'Silver Powder',
    category: 'type-boost',
    icon: 'sparkles',
    effect: {
      boostedType: 'bug',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Bicho un 20%.',
      descriptionEn: 'Boosts the power of Bug-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Bicho',
    shortDescEn: '+20% Bug moves',
  },
  {
    id: 'spell-tag',
    name: 'Spell Tag',
    nameEs: 'Hechizo',
    nameEn: 'Spell Tag',
    category: 'type-boost',
    icon: 'ghost',
    effect: {
      boostedType: 'ghost',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Fantasma un 20%.',
      descriptionEn: 'Boosts the power of Ghost-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Fantasma',
    shortDescEn: '+20% Ghost moves',
  },
  {
    id: 'metal-coat',
    name: 'Metal Coat',
    nameEs: 'Revestimiento Metálico',
    nameEn: 'Metal Coat',
    category: 'type-boost',
    icon: 'shield',
    effect: {
      boostedType: 'steel',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Acero un 20%.',
      descriptionEn: 'Boosts the power of Steel-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Acero',
    shortDescEn: '+20% Steel moves',
  },
  {
    id: 'dragon-fang',
    name: 'Dragon Fang',
    nameEs: 'Colmillo Dragón',
    nameEn: 'Dragon Fang',
    category: 'type-boost',
    icon: 'shield-alert',
    effect: {
      boostedType: 'dragon',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Dragón un 20%.',
      descriptionEn: 'Boosts the power of Dragon-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Dragón',
    shortDescEn: '+20% Dragon moves',
  },
  {
    id: 'black-glasses',
    name: 'Black Glasses',
    nameEs: 'Gafas de Sol',
    nameEn: 'Black Glasses',
    category: 'type-boost',
    icon: 'glasses',
    effect: {
      boostedType: 'dark',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Siniestro un 20%.',
      descriptionEn: 'Boosts the power of Dark-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Siniestro',
    shortDescEn: '+20% Dark moves',
  },
  {
    id: 'twisted-spoon',
    name: 'Twisted Spoon',
    nameEs: 'Cuchara Torcida',
    nameEn: 'Twisted Spoon',
    category: 'type-boost',
    icon: 'sparkles',
    effect: {
      boostedType: 'psychic',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Psíquico un 20%.',
      descriptionEn: 'Boosts the power of Psychic-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Psíquico',
    shortDescEn: '+20% Psychic moves',
  },
  {
    id: 'never-melt-ice',
    name: 'Never-Melt Ice',
    nameEs: 'Antiderretir',
    nameEn: 'Never-Melt Ice',
    category: 'type-boost',
    icon: 'snowflake',
    effect: {
      boostedType: 'ice',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Hielo un 20%.',
      descriptionEn: 'Boosts the power of Ice-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Hielo',
    shortDescEn: '+20% Ice moves',
  },
  {
    id: 'fairy-feather',
    name: 'Fairy Feather',
    nameEs: 'Pluma Feérica',
    nameEn: 'Fairy Feather',
    category: 'type-boost',
    icon: 'sparkles',
    effect: {
      boostedType: 'fairy',
      boostMultiplier: 1.2,
      descriptionEs: 'Aumenta la potencia de los movimientos de tipo Hada un 20%.',
      descriptionEn: 'Boosts the power of Fairy-type moves by 20%.',
    },
    shortDescEs: '+20% movimientos Hada',
    shortDescEn: '+20% Fairy moves',
  },

  // --- Tablas de Tipo (Plates) ---
  {
    id: 'flame-plate',
    name: 'Flame Plate',
    nameEs: 'Tabla Llama',
    nameEn: 'Flame Plate',
    category: 'type-boost',
    icon: 'flame',
    effect: {
      changesPokemonType: 'fire',
      boostedType: 'fire',
      boostMultiplier: 1.2,
      descriptionEs:
        'Aumenta la potencia de los ataques Fuego un 20% y cambia el tipo de Arceus a Fuego.',
      descriptionEn: "Boosts Fire moves by 20% and changes Arceus's type to Fire.",
    },
    shortDescEs: '+20% Fuego (Tipo Fuego en Arceus)',
    shortDescEn: '+20% Fire (Fire type for Arceus)',
  },
  {
    id: 'splash-plate',
    name: 'Splash Plate',
    nameEs: 'Tabla Linfa',
    nameEn: 'Splash Plate',
    category: 'type-boost',
    icon: 'droplet',
    effect: {
      changesPokemonType: 'water',
      boostedType: 'water',
      boostMultiplier: 1.2,
      descriptionEs:
        'Aumenta la potencia de los ataques Agua un 20% y cambia el tipo de Arceus a Agua.',
      descriptionEn: "Boosts Water moves by 20% and changes Arceus's type to Water.",
    },
    shortDescEs: '+20% Agua (Tipo Agua en Arceus)',
    shortDescEn: '+20% Water (Water type for Arceus)',
  },
  {
    id: 'meadow-plate',
    name: 'Meadow Plate',
    nameEs: 'Tabla Pradal',
    nameEn: 'Meadow Plate',
    category: 'type-boost',
    icon: 'sprout',
    effect: {
      changesPokemonType: 'grass',
      boostedType: 'grass',
      boostMultiplier: 1.2,
      descriptionEs:
        'Aumenta la potencia de los ataques Planta un 20% y cambia el tipo de Arceus a Planta.',
      descriptionEn: "Boosts Grass moves by 20% and changes Arceus's type to Grass.",
    },
    shortDescEs: '+20% Planta (Tipo Planta en Arceus)',
    shortDescEn: '+20% Grass (Grass type for Arceus)',
  },
  {
    id: 'zap-plate',
    name: 'Zap Plate',
    nameEs: 'Tabla Trueno',
    nameEn: 'Zap Plate',
    category: 'type-boost',
    icon: 'zap',
    effect: {
      changesPokemonType: 'electric',
      boostedType: 'electric',
      boostMultiplier: 1.2,
      descriptionEs:
        'Aumenta la potencia de los ataques Eléctrico un 20% y cambia el tipo de Arceus a Eléctrico.',
      descriptionEn: "Boosts Electric moves by 20% and changes Arceus's type to Electric.",
    },
    shortDescEs: '+20% Eléctrico (Tipo Eléctrico en Arceus)',
    shortDescEn: '+20% Electric (Electric type for Arceus)',
  },
  {
    id: 'draco-plate',
    name: 'Draco Plate',
    nameEs: 'Tabla Draco',
    nameEn: 'Draco Plate',
    category: 'type-boost',
    icon: 'shield-alert',
    effect: {
      changesPokemonType: 'dragon',
      boostedType: 'dragon',
      boostMultiplier: 1.2,
      descriptionEs:
        'Aumenta la potencia de los ataques Dragón un 20% y cambia el tipo de Arceus a Dragón.',
      descriptionEn: "Boosts Dragon moves by 20% and changes Arceus's type to Dragon.",
    },
    shortDescEs: '+20% Dragón (Tipo Dragón en Arceus)',
    shortDescEn: '+20% Dragon (Dragon type for Arceus)',
  },
  {
    id: 'pixie-plate',
    name: 'Pixie Plate',
    nameEs: 'Tabla Duende',
    nameEn: 'Pixie Plate',
    category: 'type-boost',
    icon: 'sparkles',
    effect: {
      changesPokemonType: 'fairy',
      boostedType: 'fairy',
      boostMultiplier: 1.2,
      descriptionEs:
        'Aumenta la potencia de los ataques Hada un 20% y cambia el tipo de Arceus a Hada.',
      descriptionEn: "Boosts Fairy moves by 20% and changes Arceus's type to Fairy.",
    },
    shortDescEs: '+20% Hada (Tipo Hada en Arceus)',
    shortDescEn: '+20% Fairy (Fairy type for Arceus)',
  },

  // --- Bayas de Reducción de Daño Supereficaz (Type-Resist Berries) ---
  {
    id: 'yache-berry',
    name: 'Yache Berry',
    nameEs: 'Baya Pasio',
    nameEn: 'Yache Berry',
    category: 'berries',
    icon: 'snowflake',
    effect: {
      resistBerryType: 'ice',
      descriptionEs:
        'Reduce a la mitad (½×) el daño del primer ataque supereficaz de tipo Hielo recibido.',
      descriptionEn: 'Halves (½×) damage taken from a super-effective Ice-type attack.',
    },
    shortDescEs: '½ daño recibido por Hielo',
    shortDescEn: 'Halves super-effective Ice damage',
  },
  {
    id: 'occa-berry',
    name: 'Occa Berry',
    nameEs: 'Baya Caoba',
    nameEn: 'Occa Berry',
    category: 'berries',
    icon: 'flame',
    effect: {
      resistBerryType: 'fire',
      descriptionEs:
        'Reduce a la mitad (½×) el daño del primer ataque supereficaz de tipo Fuego recibido.',
      descriptionEn: 'Halves (½×) damage taken from a super-effective Fire-type attack.',
    },
    shortDescEs: '½ daño recibido por Fuego',
    shortDescEn: 'Halves super-effective Fire damage',
  },
  {
    id: 'passho-berry',
    name: 'Passho Berry',
    nameEs: 'Baya Pasio',
    nameEn: 'Passho Berry',
    category: 'berries',
    icon: 'droplet',
    effect: {
      resistBerryType: 'water',
      descriptionEs:
        'Reduce a la mitad (½×) el daño del primer ataque supereficaz de tipo Agua recibido.',
      descriptionEn: 'Halves (½×) damage taken from a super-effective Water-type attack.',
    },
    shortDescEs: '½ daño recibido por Agua',
    shortDescEn: 'Halves super-effective Water damage',
  },
  {
    id: 'rindo-berry',
    name: 'Rindo Berry',
    nameEs: 'Baya Pomar',
    nameEn: 'Rindo Berry',
    category: 'berries',
    icon: 'sprout',
    effect: {
      resistBerryType: 'grass',
      descriptionEs:
        'Reduce a la mitad (½×) el daño del primer ataque supereficaz de tipo Planta recibido.',
      descriptionEn: 'Halves (½×) damage taken from a super-effective Grass-type attack.',
    },
    shortDescEs: '½ daño recibido por Planta',
    shortDescEn: 'Halves super-effective Grass damage',
  },
  {
    id: 'wacan-berry',
    name: 'Wacan Berry',
    nameEs: 'Baya Gualda',
    nameEn: 'Wacan Berry',
    category: 'berries',
    icon: 'zap',
    effect: {
      resistBerryType: 'electric',
      descriptionEs:
        'Reduce a la mitad (½×) el daño del primer ataque supereficaz de tipo Eléctrico recibido.',
      descriptionEn: 'Halves (½×) damage taken from a super-effective Electric-type attack.',
    },
    shortDescEs: '½ daño recibido por Eléctrico',
    shortDescEn: 'Halves super-effective Electric damage',
  },
  {
    id: 'shuca-berry',
    name: 'Shuca Berry',
    nameEs: 'Baya Acardo',
    nameEn: 'Shuca Berry',
    category: 'berries',
    icon: 'mountain',
    effect: {
      resistBerryType: 'ground',
      descriptionEs:
        'Reduce a la mitad (½×) el daño del primer ataque supereficaz de tipo Tierra recibido.',
      descriptionEn: 'Halves (½×) damage taken from a super-effective Ground-type attack.',
    },
    shortDescEs: '½ daño recibido por Tierra',
    shortDescEn: 'Halves super-effective Ground damage',
  },
  {
    id: 'coba-berry',
    name: 'Coba Berry',
    nameEs: 'Baya Kouba',
    nameEn: 'Coba Berry',
    category: 'berries',
    icon: 'feather',
    effect: {
      resistBerryType: 'flying',
      descriptionEs:
        'Reduce a la mitad (½×) el daño del primer ataque supereficaz de tipo Volador recibido.',
      descriptionEn: 'Halves (½×) damage taken from a super-effective Flying-type attack.',
    },
    shortDescEs: '½ daño recibido por Volador',
    shortDescEn: 'Halves super-effective Flying damage',
  },
  {
    id: 'chople-berry',
    name: 'Chople Berry',
    nameEs: 'Baya Drob',
    nameEn: 'Chople Berry',
    category: 'berries',
    icon: 'swords',
    effect: {
      resistBerryType: 'fighting',
      descriptionEs:
        'Reduce a la mitad (½×) el daño del primer ataque supereficaz de tipo Lucha recibido.',
      descriptionEn: 'Halves (½×) damage taken from a super-effective Fighting-type attack.',
    },
    shortDescEs: '½ daño recibido por Lucha',
    shortDescEn: 'Halves super-effective Fighting damage',
  },
  {
    id: 'babiri-berry',
    name: 'Babiri Berry',
    nameEs: 'Baya Babiri',
    nameEn: 'Babiri Berry',
    category: 'berries',
    icon: 'shield',
    effect: {
      resistBerryType: 'steel',
      descriptionEs:
        'Reduce a la mitad (½×) el daño del primer ataque supereficaz de tipo Acero recibido.',
      descriptionEn: 'Halves (½×) damage taken from a super-effective Steel-type attack.',
    },
    shortDescEs: '½ daño recibido por Acero',
    shortDescEn: 'Halves super-effective Steel damage',
  },
  {
    id: 'roseli-berry',
    name: 'Roseli Berry',
    nameEs: 'Baya Roseli',
    nameEn: 'Roseli Berry',
    category: 'berries',
    icon: 'sparkles',
    effect: {
      resistBerryType: 'fairy',
      descriptionEs:
        'Reduce a la mitad (½×) el daño del primer ataque supereficaz de tipo Hada recibido.',
      descriptionEn: 'Halves (½×) damage taken from a super-effective Fairy-type attack.',
    },
    shortDescEs: '½ daño recibido por Hada',
    shortDescEn: 'Halves super-effective Fairy damage',
  },

  // --- Objetos Competitivos y de Utilidad Estratégica ---
  {
    id: 'booster-energy',
    name: 'Booster Energy',
    nameEs: 'Energía Potenciadora',
    nameEn: 'Booster Energy',
    category: 'competitive',
    icon: 'battery-charging',
    effect: {
      descriptionEs:
        'Activa Paleosíntesis o Carga Cuark para potenciar la estadística más alta (+30% en Atk/Def/SpA/SpD o +50% en Vel).',
      descriptionEn:
        'Activates Protosynthesis or Quark Drive to boost highest stat (+30% Atk/Def/SpA/SpD or +50% Spe).',
    },
    shortDescEs: 'Activa Paleosíntesis / Carga Cuark',
    shortDescEn: 'Activates Protosynthesis / Quark Drive',
  },
  {
    id: 'loaded-dice',
    name: 'Loaded Dice',
    nameEs: 'Dado Trucado',
    nameEn: 'Loaded Dice',
    category: 'competitive',
    icon: 'dices',
    effect: {
      descriptionEs:
        'Garantiza que los movimientos de golpes múltiples conecten al menos 4-5 veces.',
      descriptionEn: 'Guarantees multi-strike moves will hit at least 4-5 times.',
    },
    shortDescEs: '4-5 golpes en ataques múltiples',
    shortDescEn: '4-5 hits on multi-strike moves',
  },
  {
    id: 'covert-cloak',
    name: 'Covert Cloak',
    nameEs: 'Capa Furtiva',
    nameEn: 'Covert Cloak',
    category: 'defensive',
    icon: 'shield',
    effect: {
      descriptionEs:
        'Inmuniza al portador contra los efectos secundarios de los movimientos enemigos (retroceso, parálisis, etc.).',
      descriptionEn:
        'Protects the holder from secondary effects of enemy attacks (flinch, stat drops, status).',
    },
    shortDescEs: 'Inmune a efectos secundarios de ataques',
    shortDescEn: 'Immunity to secondary move effects',
  },
  {
    id: 'clear-amulet',
    name: 'Clear Amulet',
    nameEs: 'Amuleto Puro',
    nameEn: 'Clear Amulet',
    category: 'defensive',
    icon: 'gem',
    effect: {
      descriptionEs:
        'Evita que las habilidades o movimientos de los rivales bajen las estadísticas del portador.',
      descriptionEn:
        "Prevents other Pokémon's moves and abilities from lowering the holder's stats.",
    },
    shortDescEs: 'Evita reducción de estadísticas',
    shortDescEn: 'Prevents stat reduction',
  },
  {
    id: 'safety-goggles',
    name: 'Safety Goggles',
    nameEs: 'Gafas Protectoras',
    nameEn: 'Safety Goggles',
    category: 'defensive',
    icon: 'glasses',
    effect: {
      descriptionEs:
        'Inmuniza al portador contra movimientos de esporas y polvos, así como daño por clima (Tormenta de Arena/Granizo).',
      descriptionEn: 'Grants immunity to powder and spore moves and weather damage.',
    },
    shortDescEs: 'Inmune a polvos/esporas y daño climático',
    shortDescEn: 'Immunity to powder moves & weather',
  },
  {
    id: 'weakness-policy',
    name: 'Weakness Policy',
    nameEs: 'Seguro Debilidad',
    nameEn: 'Weakness Policy',
    category: 'competitive',
    icon: 'shield-alert',
    effect: {
      descriptionEs:
        'Aumenta el Ataque y el Ataque Especial en 2 niveles (+100%) al recibir un golpe supereficaz.',
      descriptionEn:
        'Sharply raises Attack and Sp. Atk (+2 stages) when hit by a super-effective move.',
    },
    shortDescEs: '+2 Atk y At. Esp tras golpe supereficaz',
    shortDescEn: '+2 stages Atk & Sp. Atk on super-effective hit',
  },
  {
    id: 'sitrus-berry',
    name: 'Sitrus Berry',
    nameEs: 'Baya Zidra',
    nameEn: 'Sitrus Berry',
    category: 'berries',
    icon: 'heart',
    effect: {
      descriptionEs: 'Restaura el 25% de los PS máximos cuando los PS caen por debajo del 50%.',
      descriptionEn: 'Restores 25% of max HP when HP drops below 50%.',
    },
    shortDescEs: 'Restaura 25% PS al estar bajo 50%',
    shortDescEn: 'Restores 25% HP when below half',
  },
  {
    id: 'lum-berry',
    name: 'Lum Berry',
    nameEs: 'Baya Ziuela',
    nameEn: 'Lum Berry',
    category: 'berries',
    icon: 'sparkles',
    effect: {
      descriptionEs: 'Cura instantáneamente cualquier problema de estado o confusión del portador.',
      descriptionEn: 'Instantly cures any major status condition or confusion.',
    },
    shortDescEs: 'Cura cualquier problema de estado',
    shortDescEn: 'Cures all status conditions',
  },
  {
    id: 'flame-orb',
    name: 'Flame Orb',
    nameEs: 'Llamasfera',
    nameEn: 'Flame Orb',
    category: 'utility',
    icon: 'flame',
    effect: {
      descriptionEs:
        'Quema al portador al final del primer turno (ideal para Agallas o Escama Especial).',
      descriptionEn:
        'Inflicts burn on the holder at the end of the turn (synergizes with Guts/Marvel Scale).',
    },
    shortDescEs: 'Auto-quema (activa Agallas/Escama Esp.)',
    shortDescEn: 'Inflicts burn (triggers Guts/Marvel Scale)',
  },
  {
    id: 'toxic-orb',
    name: 'Toxic Orb',
    nameEs: 'Toxisfera',
    nameEn: 'Toxic Orb',
    category: 'utility',
    icon: 'skull',
    effect: {
      descriptionEs:
        'Envenena gravemente al portador al final del primer turno (ideal para Antídoto o Ímpetu Tóxico).',
      descriptionEn:
        'Badly poisons the holder at the end of the turn (synergizes with Poison Heal/Toxic Boost).',
    },
    shortDescEs: 'Auto-envenenamiento grave',
    shortDescEn: 'Inflicts badly poisoned status',
  },
  {
    id: 'white-herb',
    name: 'White Herb',
    nameEs: 'Hierba Blanca',
    nameEn: 'White Herb',
    category: 'utility',
    icon: 'sprout',
    effect: {
      descriptionEs: 'Restaura instantáneamente cualquier estadística reducida a su nivel normal.',
      descriptionEn: 'Instantly restores any lowered stat stage to normal.',
    },
    shortDescEs: 'Restaura estadísticas reducidas',
    shortDescEn: 'Restores lowered stats',
  },
  {
    id: 'power-herb',
    name: 'Power Herb',
    nameEs: 'Hierba Única',
    nameEn: 'Power Herb',
    category: 'utility',
    icon: 'zap',
    effect: {
      descriptionEs:
        'Permite ejecutar movimientos de dos turnos (como Rayo Solar o Rayo Meteórico) en un solo turno.',
      descriptionEn:
        'Allows two-turn moves (like Solar Beam or Meteor Beam) to charge and attack in 1 turn.',
    },
    shortDescEs: 'Ataques de carga en 1 turno',
    shortDescEn: 'Two-turn moves execute in 1 turn',
  },
  {
    id: 'eject-button',
    name: 'Eject Button',
    nameEs: 'Botón Escape',
    nameEn: 'Eject Button',
    category: 'utility',
    icon: 'log-out',
    effect: {
      descriptionEs: 'El portador se retira inmediatamente del combate tras recibir un ataque.',
      descriptionEn: 'Holder immediately switches out after taking damage from an attack.',
    },
    shortDescEs: 'Cambia de Pokémon al recibir daño',
    shortDescEn: 'Switches out after taking a hit',
  },
  {
    id: 'red-card',
    name: 'Red Card',
    nameEs: 'Tarjeta Roja',
    nameEn: 'Red Card',
    category: 'utility',
    icon: 'credit-card',
    effect: {
      descriptionEs: 'Fuerza al rival a cambiar de Pokémon cuando inflige daño al portador.',
      descriptionEn: 'Forces the attacking Pokémon to switch out after damaging the holder.',
    },
    shortDescEs: 'Fuerza cambio del rival al ser atacado',
    shortDescEn: 'Forces opponent to switch on hit',
  },
  {
    id: 'quick-claw',
    name: 'Quick Claw',
    nameEs: 'Garra Rápida',
    nameEn: 'Quick Claw',
    category: 'utility',
    icon: 'zap',
    effect: {
      descriptionEs:
        'Otorga una probabilidad del 20% de atacar primero dentro de su misma prioridad.',
      descriptionEn: "Gives a 20% chance to move first within the holder's priority bracket.",
    },
    shortDescEs: '20% prob. de atacar primero',
    shortDescEn: '20% chance to move first',
  },
  {
    id: 'kings-rock',
    name: "King's Rock",
    nameEs: 'Roca del Rey',
    nameEn: "King's Rock",
    category: 'utility',
    icon: 'crown',
    effect: {
      descriptionEs:
        'Los movimientos que causan daño tienen un 10% de probabilidad de amedrentar al objetivo.',
      descriptionEn: 'Damaging moves have a 10% chance to make the target flinch.',
    },
    shortDescEs: '10% prob. de amedrentar al rival',
    shortDescEn: '10% chance to flinch target on hit',
  },
  {
    id: 'scope-lens',
    name: 'Scope Lens',
    nameEs: 'Periscopio',
    nameEn: 'Scope Lens',
    category: 'competitive',
    icon: 'crosshair',
    effect: {
      descriptionEs: 'Aumenta la probabilidad de asestar golpes críticos en 1 nivel.',
      descriptionEn: "Boosts the holder's critical hit ratio by 1 stage.",
    },
    shortDescEs: '+1 ratio de golpe crítico',
    shortDescEn: '+1 critical hit ratio',
  },
  {
    id: 'razor-claw',
    name: 'Razor Claw',
    nameEs: 'Garra Afilada',
    nameEn: 'Razor Claw',
    category: 'competitive',
    icon: 'crosshair',
    effect: {
      descriptionEs:
        'Aumenta la probabilidad de asestar golpes críticos en 1 nivel. Permite evolucionar a Sneasel.',
      descriptionEn: "Boosts the holder's critical hit ratio by 1 stage. Allows Sneasel to evolve.",
    },
    shortDescEs: '+1 ratio de golpe crítico',
    shortDescEn: '+1 critical hit ratio',
  },
  {
    id: 'focus-band',
    name: 'Focus Band',
    nameEs: 'Cinta Focus',
    nameEn: 'Focus Band',
    category: 'defensive',
    icon: 'shield',
    effect: {
      descriptionEs:
        'Otorga un 10% de probabilidad de resistir cualquier golpe fulminante con 1 PS.',
      descriptionEn: 'Grants a 10% chance to survive a hit that would otherwise KO with 1 HP.',
    },
    shortDescEs: '10% prob. de resistir K.O. con 1 PS',
    shortDescEn: '10% chance to endure lethal hits with 1 HP',
  },
  {
    id: 'muscle-band',
    name: 'Muscle Band',
    nameEs: 'Cinta Fuerte',
    nameEn: 'Muscle Band',
    category: 'stat-boost',
    icon: 'swords',
    effect: {
      descriptionEs: 'Aumenta la potencia de los movimientos físicos en un 10%.',
      descriptionEn: 'Boosts the power of physical moves by 10%.',
    },
    shortDescEs: '+10% potencia ataques físicos',
    shortDescEn: '+10% physical move power',
  },
  {
    id: 'wise-glasses',
    name: 'Wise Glasses',
    nameEs: 'Gafas Especiales',
    nameEn: 'Wise Glasses',
    category: 'stat-boost',
    icon: 'glasses',
    effect: {
      descriptionEs: 'Aumenta la potencia de los movimientos especiales en un 10%.',
      descriptionEn: 'Boosts the power of special moves by 10%.',
    },
    shortDescEs: '+10% potencia ataques especiales',
    shortDescEn: '+10% special move power',
  },
  {
    id: 'wide-lens',
    name: 'Wide Lens',
    nameEs: 'Lupa',
    nameEn: 'Wide Lens',
    category: 'utility',
    icon: 'search',
    effect: {
      descriptionEs: 'Aumenta la precisión de los movimientos del portador en un 10%.',
      descriptionEn: 'Increases the accuracy of moves by 10%.',
    },
    shortDescEs: '+10% precisión de movimientos',
    shortDescEn: '+10% move accuracy',
  },
  {
    id: 'zoom-lens',
    name: 'Zoom Lens',
    nameEs: 'Telescopio',
    nameEn: 'Zoom Lens',
    category: 'utility',
    icon: 'search',
    effect: {
      descriptionEs:
        'Aumenta la precisión de los movimientos en un 20% si el portador ataca después del rival.',
      descriptionEn: 'Increases accuracy by 20% if the holder moves after the target.',
    },
    shortDescEs: '+20% precisión tras el rival',
    shortDescEn: '+20% accuracy if moving after target',
  },
  {
    id: 'shell-bell',
    name: 'Shell Bell',
    nameEs: 'Campana Concha',
    nameEn: 'Shell Bell',
    category: 'defensive',
    icon: 'bell',
    effect: {
      descriptionEs: 'Restaura 1/8 del daño total infligido al rival con sus ataques.',
      descriptionEn: 'Restores 1/8 of the damage dealt to opponents.',
    },
    shortDescEs: 'Restaura 1/8 del daño infligido',
    shortDescEn: 'Restores 1/8 damage dealt',
  },
  {
    id: 'big-root',
    name: 'Big Root',
    nameEs: 'Raíz Grande',
    nameEn: 'Big Root',
    category: 'utility',
    icon: 'sprout',
    effect: {
      descriptionEs:
        'Aumenta en un 30% la cantidad de PS recuperados mediante movimientos de drenaje o absorción.',
      descriptionEn: 'Increases HP recovered by draining moves by 30%.',
    },
    shortDescEs: '+30% PS recuperados por drenaje',
    shortDescEn: '+30% HP recovered by draining moves',
  },
  {
    id: 'metronome',
    name: 'Metronome',
    nameEs: 'Metrónomo',
    nameEn: 'Metronome',
    category: 'competitive',
    icon: 'activity',
    effect: {
      descriptionEs:
        'Potencia un movimiento un 20% adicional cada vez que se usa consecutivamente (hasta un máximo de +100%).',
      descriptionEn: 'Boosts move power by 20% for each consecutive use (up to +100%).',
    },
    shortDescEs: '+20% daño por uso consecutivo',
    shortDescEn: '+20% power per consecutive use',
  },
  {
    id: 'mental-herb',
    name: 'Mental Herb',
    nameEs: 'Hierba Mental',
    nameEn: 'Mental Herb',
    category: 'utility',
    icon: 'sprout',
    effect: {
      descriptionEs:
        'Elimina efectos de provocación, atracción, anulación y bloqueo como Mofa o Tormento. De un solo uso.',
      descriptionEn:
        'Snaps the holder out of infatuation, Taunt, Encore, Torment, or Disable. Single-use.',
    },
    shortDescEs: 'Cura mofa, atracción y anulación',
    shortDescEn: 'Cures taunt, encore, disable',
  },
  {
    id: 'throat-spray',
    name: 'Throat Spray',
    nameEs: 'Spray Bucal',
    nameEn: 'Throat Spray',
    category: 'competitive',
    icon: 'mic',
    effect: {
      descriptionEs:
        'Aumenta el Ataque Especial en 1 nivel tras usar un movimiento de sonido. De un solo uso.',
      descriptionEn: 'Raises Sp. Atk by 1 stage after using a sound-based move. Single-use.',
    },
    shortDescEs: '+1 At. Esp tras ataque de sonido',
    shortDescEn: '+1 Sp. Atk on sound move',
  },
  {
    id: 'blunder-policy',
    name: 'Blunder Policy',
    nameEs: 'Seguro Fallo',
    nameEn: 'Blunder Policy',
    category: 'competitive',
    icon: 'shield-alert',
    effect: {
      descriptionEs:
        'Aumenta la Velocidad en 2 niveles si un movimiento falla por falta de precisión. De un solo uso.',
      descriptionEn:
        'Sharply raises Speed (+2 stages) if a move misses due to accuracy. Single-use.',
    },
    shortDescEs: '+2 Velocidad si falla por precisión',
    shortDescEn: '+2 Speed if move misses',
  },
  {
    id: 'protective-pads',
    name: 'Protective Pads',
    nameEs: 'Almohadilla Protectora',
    nameEn: 'Protective Pads',
    category: 'defensive',
    icon: 'shield',
    effect: {
      descriptionEs:
        'Inmuniza al portador contra efectos derivados del contacto físico (Casco Dentado, Punta Acero, etc.).',
      descriptionEn: 'Protects the holder from effects triggered by making contact with enemies.',
    },
    shortDescEs: 'Inmune a efectos de contacto rival',
    shortDescEn: 'Protects from contact move effects',
  },
  {
    id: 'room-service',
    name: 'Room Service',
    nameEs: 'Servicio Roto',
    nameEn: 'Room Service',
    category: 'utility',
    icon: 'clock',
    effect: {
      descriptionEs:
        'Reduce la Velocidad del portador en 1 nivel cuando se activa Espacio Raro. De un solo uso.',
      descriptionEn: 'Lowers Speed by 1 stage when Trick Room is active. Single-use.',
    },
    shortDescEs: '-1 Velocidad en Espacio Raro',
    shortDescEn: '-1 Speed under Trick Room',
  },
  {
    id: 'terrain-extender',
    name: 'Terrain Extender',
    nameEs: 'Cubreaterreno',
    nameEn: 'Terrain Extender',
    category: 'utility',
    icon: 'map',
    effect: {
      descriptionEs:
        'Extiende la duración de los terrenos creados por el portador de 5 a 8 turnos.',
      descriptionEn: 'Extends terrain created by the holder from 5 to 8 turns.',
    },
    shortDescEs: 'Extiende terrenos a 8 turnos',
    shortDescEn: 'Extends terrain to 8 turns',
  },
  {
    id: 'damp-rock',
    name: 'Damp Rock',
    nameEs: 'Roca Lluvia',
    nameEn: 'Damp Rock',
    category: 'utility',
    icon: 'cloud-rain',
    effect: {
      descriptionEs: 'Extiende la duración de la lluvia provocada por el usuario de 5 a 8 turnos.',
      descriptionEn: 'Extends the duration of rain summoned by the holder from 5 to 8 turns.',
    },
    shortDescEs: 'Extiende lluvia a 8 turnos',
    shortDescEn: 'Extends rain to 8 turns',
  },
  {
    id: 'heat-rock',
    name: 'Heat Rock',
    nameEs: 'Roca Calor',
    nameEn: 'Heat Rock',
    category: 'utility',
    icon: 'sun',
    effect: {
      descriptionEs: 'Extiende la duración del sol provocado por el usuario de 5 a 8 turnos.',
      descriptionEn: 'Extends the duration of sunshine summoned by the holder from 5 to 8 turns.',
    },
    shortDescEs: 'Extiende sol a 8 turnos',
    shortDescEn: 'Extends sunlight to 8 turns',
  },
  {
    id: 'smooth-rock',
    name: 'Smooth Rock',
    nameEs: 'Roca Suave',
    nameEn: 'Smooth Rock',
    category: 'utility',
    icon: 'wind',
    effect: {
      descriptionEs:
        'Extiende la duración de la tormenta de arena provocada por el usuario de 5 a 8 turnos.',
      descriptionEn: 'Extends the duration of sandstorms summoned by the holder from 5 to 8 turns.',
    },
    shortDescEs: 'Extiende tormenta de arena a 8 turnos',
    shortDescEn: 'Extends sandstorm to 8 turns',
  },
  {
    id: 'icy-rock',
    name: 'Icy Rock',
    nameEs: 'Roca Helada',
    nameEn: 'Icy Rock',
    category: 'utility',
    icon: 'snowflake',
    effect: {
      descriptionEs:
        'Extiende la duración de la nieve o granizo provocado por el usuario de 5 a 8 turnos.',
      descriptionEn: 'Extends the duration of hail/snow summoned by the holder from 5 to 8 turns.',
    },
    shortDescEs: 'Extiende nieve/granizo a 8 turnos',
    shortDescEn: 'Extends snow/hail to 8 turns',
  },
  {
    id: 'custap-berry',
    name: 'Custap Berry',
    nameEs: 'Baya Chiri',
    nameEn: 'Custap Berry',
    category: 'berries',
    icon: 'sparkles',
    effect: {
      descriptionEs:
        'Permite al portador moverse en primer lugar dentro de su prioridad cuando sus PS caen por debajo del 25%. De un solo uso.',
      descriptionEn:
        'Holder moves first in their priority bracket when HP drops below 25%. Single-use.',
    },
    shortDescEs: 'Prioridad al caer a <25% PS',
    shortDescEn: 'Move first when HP < 25%',
  },
]

const ITEM_MAP = new Map<string, ItemData>(ITEMS_DATABASE.map((item) => [item.id, item]))

export function getAllItems(): ItemData[] {
  return ITEMS_DATABASE
}

export function getItemById(id: string | null | undefined): ItemData | null {
  if (!id) return null
  return ITEM_MAP.get(id) ?? null
}

export function getItemDisplayName(id: string | null | undefined, locale: Locale): string {
  const item = getItemById(id)
  if (!item) return ''
  return locale === 'es' ? item.nameEs : item.nameEn
}

export function getItemSpriteUrl(id: string | null | undefined): string | null {
  if (!id) return null
  const item = getItemById(id)
  if (item && item.sprite !== undefined) return item.sprite
  // Standard PokeAPI item sprite URL
  return `https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/items/${id}.png`
}

export function renderItemIconHTML(
  id: string | null | undefined,
  options?: { className?: string; fallbackIcon?: string; size?: number },
): string {
  const item = getItemById(id)
  const iconName = item?.icon || options?.fallbackIcon || 'backpack'
  const size = options?.size ?? 14
  const className = options?.className ?? 'item-sprite'
  const spriteUrl = getItemSpriteUrl(id)

  if (spriteUrl) {
    return `<span class="item-icon-wrapper" style="display:inline-flex;align-items:center;justify-content:center;width:${size}px;height:${size}px;flex-shrink:0;">
      <img src="${spriteUrl}" alt="" class="${className}" width="${size}" height="${size}" loading="lazy" style="width:${size}px;height:${size}px;object-fit:contain;image-rendering:pixelated;" onerror="this.style.display='none';if(this.nextElementSibling)this.nextElementSibling.style.display='inline-flex';" />
      <i data-lucide="${iconName}" style="display:none;width:${size}px;height:${size}px;"></i>
    </span>`
  }

  return `<i data-lucide="${iconName}" style="width:${size}px;height:${size}px;"></i>`
}

export function filterItems(query: string, category: string, _locale?: Locale): ItemData[] {
  const q = query.trim().toLowerCase()
  return ITEMS_DATABASE.filter((item) => {
    if (category !== 'all' && item.category !== category) {
      return false
    }
    if (!q) return true
    const nameMatch =
      item.nameEs.toLowerCase().includes(q) ||
      item.nameEn.toLowerCase().includes(q) ||
      item.name.toLowerCase().includes(q) ||
      item.id.includes(q)
    const descMatch =
      item.shortDescEs.toLowerCase().includes(q) ||
      item.shortDescEn.toLowerCase().includes(q) ||
      item.effect?.descriptionEs.toLowerCase().includes(q) ||
      item.effect?.descriptionEn.toLowerCase().includes(q)
    return nameMatch || descMatch
  })
}

export interface ItemStatModifierResult {
  multiplier: number
  labelEs: string
  labelEn: string
  sourceItem: ItemData
}

/**
 * Calculates whether an item modifies stats for a given species / evolution status.
 */
export function getItemStatModifiers(
  item: ItemData | null,
  speciesId: number,
  hasEvolution: boolean,
): Partial<Record<keyof PokemonStats, ItemStatModifierResult>> {
  if (!item || !item.effect?.statMultipliers) return {}

  const effect = item.effect
  const condition = effect.statCondition

  if (condition) {
    if (condition.requiresUnevolved && !hasEvolution) {
      return {}
    }
    if (condition.speciesIds && !condition.speciesIds.includes(speciesId)) {
      return {}
    }
  }

  const multipliers = effect.statMultipliers
  if (!multipliers) return {}

  const result: Partial<Record<keyof PokemonStats, ItemStatModifierResult>> = {}
  for (const [key, mult] of Object.entries(multipliers)) {
    if (typeof mult === 'number' && mult !== 1) {
      const statKey = key as keyof PokemonStats
      const pct = Math.round((mult - 1) * 100)
      const sign = pct > 0 ? `+${pct}%` : `${pct}%`
      result[statKey] = {
        multiplier: mult,
        labelEs: `${sign} (${item.nameEs})`,
        labelEn: `${sign} (${item.nameEn})`,
        sourceItem: item,
      }
    }
  }

  return result
}

/**
 * Checks type/immunity modifications granted by an item.
 */
export function getItemTypeEffect(
  item: ItemData | null,
  speciesId: number,
): {
  grantsImmunities: string[]
  revokesImmunities: boolean
  overrideType?: string
  boostedType?: string
  boostMultiplier?: number
} {
  if (!item || !item.effect) {
    return { grantsImmunities: [], revokesImmunities: false }
  }

  const grantsImmunities = item.effect.grantsImmunities ?? []
  const revokesImmunities = Boolean(item.effect.revokesImmunities)
  let overrideType: string | undefined = undefined

  // Tablas en Arceus (ID 493) o Memorias en Silvally (ID 773)
  if (item.effect.changesPokemonType && (speciesId === 493 || speciesId === 773)) {
    overrideType = item.effect.changesPokemonType
  }

  return {
    grantsImmunities,
    revokesImmunities,
    overrideType,
    boostedType: item.effect.boostedType,
    boostMultiplier: item.effect.boostMultiplier,
  }
}
