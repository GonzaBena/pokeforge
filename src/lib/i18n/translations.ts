export type Locale = "en" | "es";

export const LOCALES: Locale[] = ["en", "es"];
export const DEFAULT_LOCALE: Locale = "en";

export const TYPE_NAMES: Record<string, { en: string; es: string }> = {
  normal: { en: "Normal", es: "Normal" },
  fighting: { en: "Fighting", es: "Lucha" },
  flying: { en: "Flying", es: "Volador" },
  poison: { en: "Poison", es: "Veneno" },
  ground: { en: "Ground", es: "Tierra" },
  rock: { en: "Rock", es: "Roca" },
  bug: { en: "Bug", es: "Bicho" },
  ghost: { en: "Ghost", es: "Fantasma" },
  steel: { en: "Steel", es: "Acero" },
  fire: { en: "Fire", es: "Fuego" },
  water: { en: "Water", es: "Agua" },
  grass: { en: "Grass", es: "Planta" },
  electric: { en: "Electric", es: "Eléctrico" },
  psychic: { en: "Psychic", es: "Psíquico" },
  ice: { en: "Ice", es: "Hielo" },
  dragon: { en: "Dragon", es: "Dragón" },
  dark: { en: "Dark", es: "Siniestro" },
  fairy: { en: "Fairy", es: "Hada" },
};

export const EVOLUTION_TRIGGER_NAMES: Record<
  string,
  { en: string; es: string }
> = {
  "level-up": { en: "Level up", es: "Nivel" },
  trade: { en: "Trade", es: "Intercambio" },
  "use-item": { en: "Use item", es: "Usar objeto" },
  shed: { en: "Shed", es: "Muda" },
  "agile-style-move": { en: "Agile style move", es: "Movimiento estilo ágil" },
  "strong-style-move": {
    en: "Strong style move",
    es: "Movimiento estilo fuerte",
  },
  "three-critical-hits": { en: "3 critical hits", es: "3 golpes críticos" },
  "take-damage": { en: "Take damage", es: "Recibir daño" },
  other: { en: "Special", es: "Especial" },
};

export interface Translations {
  nav: {
    pokedex: string;
    team: string;
    installApp: string;
    installAppTitle: string;
    sync: string;
    syncTitle: string;
    soundTitle: string;
    mobileNav: string;
    home: string;
    installedSuccess: string;
    pwaHint: string;
  };
  home: {
    badge: string;
    titlePrefix: string;
    titleAccent: string;
    titleSuffix: string;
    subtitle: string;
    explorePokedex: string;
    pokedexDesc: string;
    buildTeam: string;
    teamDesc: string;
    typeAnalysis: string;
    typeAnalysisDesc: string;
    offlineMode: string;
    offlineModeDesc: string;
    gameFilters: string;
    gameFiltersDesc: string;
  };
  pokedex: {
    title: string;
    subtitle: string;
    capturedCount: string;
    all: string;
    captured: string;
    searchPlaceholder: string;
    allGames: string;
    filterByType: string;
    filterByGen: string;
    empty: string;
    loadMore: string;
    catch: string;
    caught: string;
  };
  team: {
    title: string;
    subtitle: string;
    teamCard: string;
    teamCardTitle: string;
    downloadPng: string;
    copyShowdown: string;
    choosePokemon: string;
    selectMove: string;
    searchByNameOrNum: string;
    filterByMove: string;
    category: string;
    allCategories: string;
    physical: string;
    special: string;
    status: string;
    learnMethod: string;
    allMethods: string;
    levelUp: string;
    machine: string;
    tutor: string;
    egg: string;
    attackType: string;
    clearTeam: string;
    teamSizeLabel: string;
    typesSection: string;
    gensSection: string;
    gameSection: string;
  };
  strengthsWeaknesses: {
    title: string;
    weaknesses: string;
    resistances: string;
    immunities: string;
    coverage: string;
    noTeam: string;
  };
  modal: {
    stats: string;
    moves: string;
    evolutions: string;
    acquisition: string;
    chartToggle: string;
    nature: string;
    neutralNature: string;
    increases: string;
    decreases: string;
    captureHint: string;
    specialCondition: string;
    noEvolutions: string;
    level: string;
    method: string;
    move: string;
    game: string;
    location: string;
    generation: string;
    close: string;
    wildEncounter: string;
  };
  sync: {
    title: string;
    loading: string;
    heroTitle: string;
    heroDesc: string;
    step1: string;
    step2: string;
    step3: string;
    goToPokedex: string;
    generateQrHere: string;
    readyTitle: string;
    readySubtitle: string;
    incomingTeam: string;
    incomingCaptures: string;
    currentCaptures: string;
    mergeTitle: string;
    mergeDesc: string;
    replaceTitle: string;
    replaceDesc: string;
    confirmSave: string;
    cancel: string;
    successToast: string;
    cloudLinkTitle: string;
    cloudLinkSubtitleRW: string;
    cloudLinkSubtitleRO: string;
    cloudLinkSuccessToast: string;
  };
  syncModal: {
    modalTitle: string;
    close: string;
    tabCloud: string;
    tabQr: string;
    cloudTitle: string;
    cloudDesc: string;
    cloudCreate: string;
    cloudOrJoin: string;
    cloudCodePlaceholder: string;
    cloudJoin: string;
    cloudConnected: string;
    cloudSynced: string;
    cloudCodeLabel: string;
    cloudCopyTitle: string;
    cloudHelp: string;
    cloudSyncNow: string;
    cloudUnlink: string;
    cloudDeleteVault: string;
    cloudDeleteConfirmTitle: string;
    cloudDeleteConfirmDesc: string;
    cloudDeleteConfirmBtn: string;
    cloudStatusReadOnly: string;
    cloudStatusReadWrite: string;
    cloudQrTitle: string;
    cloudQrDesc: string;
    cloudCopyPairingLink: string;
    cloudPairingLinkCopied: string;
    cloudReadOnlyWarning: string;
    cloudUpgradeKeyPlaceholder: string;
    cloudUpgradeKeyBtn: string;
    cloudUpgradeSuccess: string;
    cancel: string;
    qrInstructions: string;
    qrGenerating: string;
    qrCopyLink: string;
    qrOrManual: string;
    qrExportJson: string;
    qrImportJson: string;
    dangerLocalData: string;
    dangerResetBtn: string;
    dangerResetTitle: string;
    dangerResetDesc: string;
    dangerResetConfirm: string;
  };
}

export const UI_TRANSLATIONS: Record<Locale, Translations> = {
  en: {
    nav: {
      pokedex: "Pokédex",
      team: "Team",
      installApp: "Install App",
      installAppTitle: "Install PokeForge application",
      sync: "Sync",
      syncTitle: "Sync devices",
      soundTitle: "Toggle sound",
      mobileNav: "Mobile navigation",
      home: "Home",
      installedSuccess: "PokeForge was installed successfully!",
      pwaHint:
        "To install PokeForge, use 'Add to Home Screen' in your browser menu.",
    },
    home: {
      badge: "PokeForge PWA v1.0 · Gen I to IX",
      titlePrefix: "Forge your ",
      titleAccent: "ultimate",
      titleSuffix: " Pokémon team",
      subtitle:
        "Explore the complete Pokédex, track your catches, and craft the perfect strategy by analyzing your team weaknesses and moves.",
      explorePokedex: "Explore Pokédex",
      pokedexDesc: "1025+ Pokémon with game and gen filters",
      buildTeam: "Build Team",
      teamDesc: "Tactical type and weakness analysis",
      typeAnalysis: "Type Analysis",
      typeAnalysisDesc: "Calculate resistances and immunities instantly.",
      offlineMode: "Offline PWA Mode",
      offlineModeDesc: "Install and use the app without internet connection.",
      gameFilters: "Game Filters",
      gameFiltersDesc: "Official data by version and location.",
    },
    pokedex: {
      title: "Pokédex",
      subtitle: "Explore all Pokémon and mark the ones you caught.",
      capturedCount: "Caught",
      all: "All",
      captured: "Captured",
      searchPlaceholder: "Search by name or number...",
      allGames: "All games",
      filterByType: "Filter by type",
      filterByGen: "Filter by generation",
      empty: "No Pokémon found matching those filters.",
      loadMore: "Load more Pokémon",
      catch: "Catch",
      caught: "Caught",
    },
    team: {
      title: "Team Builder",
      subtitle: "Complete your team filtering by generation, type, and moves.",
      teamCard: "Team Card",
      teamCardTitle: "Generate and download visual team card",
      downloadPng: "Download PNG Image",
      copyShowdown: "Copy Showdown Format",
      choosePokemon: "Choose Pokémon",
      selectMove: "Select Move",
      searchByNameOrNum: "Search by name or #...",
      filterByMove: "Filter by move...",
      category: "Category",
      allCategories: "All",
      physical: "Physical",
      special: "Special",
      status: "Status",
      learnMethod: "Learn method",
      allMethods: "All",
      levelUp: "Level up",
      machine: "TM/HM",
      tutor: "Tutor",
      egg: "Egg",
      attackType: "Move Type",
      clearTeam: "Clear team",
      teamSizeLabel: "Team size:",
      typesSection: "Types",
      gensSection: "Generations",
      gameSection: "Game",
    },
    strengthsWeaknesses: {
      title: "Team Analysis",
      weaknesses: "Weaknesses",
      resistances: "Resistances",
      immunities: "Immunities",
      coverage: "Defensive Coverage",
      noTeam: "Add Pokémon to see weaknesses and resistances",
    },
    modal: {
      stats: "Stats",
      moves: "Moves",
      evolutions: "Evolutions",
      acquisition: "Acquisition",
      chartToggle: "Toggle between stat list and judge hexagon chart",
      nature: "Nature",
      neutralNature: "Neutral: does not modify any stat.",
      increases: "Increases",
      decreases: "Decreases",
      captureHint: "Catch this Pokémon to customize its stats and nature.",
      specialCondition: "Special condition",
      noEvolutions: "This Pokémon does not evolve.",
      level: "Level",
      method: "Method",
      move: "Move",
      game: "Game",
      location: "Location",
      generation: "Generation",
      close: "Close modal",
      wildEncounter: "Wild encounter",
    },
    sync: {
      title: "Sync Devices",
      loading: "Reading sync data...",
      heroTitle: "Sync your PC with your phone",
      heroDesc: "To transfer your catches and team between devices instantly:",
      step1: "On your computer, click the Sync button in the navigation bar.",
      step2: "Open your phone camera and point it at the QR code on screen.",
      step3: "Tap the link and your data will be transferred instantly.",
      goToPokedex: "Go to Pokédex",
      generateQrHere: "Generate QR code here",
      readyTitle: "Data ready to sync!",
      readySubtitle:
        "You received a team and capture log from your other device.",
      incomingTeam: "Received Team",
      incomingCaptures: "Incoming captures",
      currentCaptures: "Captures on this device",
      mergeTitle: "Merge data (Recommended)",
      mergeDesc:
        "Adds incoming captures to current ones and sets the received team.",
      replaceTitle: "Replace all",
      replaceDesc:
        "Completely replaces captures and team on this device with incoming data.",
      confirmSave: "Confirm and Save",
      cancel: "Cancel",
      successToast: "Sync successful! ({total} caught in total)",
      cloudLinkTitle: "Link Cloud Vault",
      cloudLinkSubtitleRW: "Cloud vault {code} detected. This device will be linked with full sync permissions (read & write).",
      cloudLinkSubtitleRO: "Cloud vault {code} detected. This device will be linked in read-only mode.",
      cloudLinkSuccessToast: "Device linked successfully with read & write permissions!",
    },
    syncModal: {
      modalTitle: "Data & Synchronization",
      close: "Close",
      tabCloud: "Cloud",
      tabQr: "QR Code",
      cloudTitle: "Automatic Cloud Synchronization",
      cloudDesc:
        "Connect your devices so your team and captures sync automatically without accounts or passwords.",
      cloudCreate: "Create Cloud Vault",
      cloudOrJoin: "or join with existing code",
      cloudCodePlaceholder: "Code (e.g. PK-8492)",
      cloudJoin: "Link",
      cloudConnected: "Connected to DB",
      cloudSynced: "Synced",
      cloudCodeLabel: "Linking code:",
      cloudCopyTitle: "Copy code",
      cloudHelp:
        "Enter this code on your phone or another PC to keep them synced in real time.",
      cloudSyncNow: "Sync now",
      cloudUnlink: "Unlink",
      cloudDeleteVault: "Delete vault from cloud",
      cloudDeleteConfirmTitle: "Delete vault from DB?",
      cloudDeleteConfirmDesc:
        "The cloud copy of your data will be permanently deleted. Your local data on this device will remain intact.",
      cloudDeleteConfirmBtn: "Yes, delete from cloud",
      cloudStatusReadOnly: "Connected (Read Only)",
      cloudStatusReadWrite: "Connected (Read & Write)",
      cloudQrTitle: "Link Mobile Phone via QR Code",
      cloudQrDesc:
        "Scan this code with your phone camera to link it automatically with full sync permissions (read & write).",
      cloudCopyPairingLink: "Copy full pairing link",
      cloudPairingLinkCopied: "Full pairing link copied to clipboard!",
      cloudReadOnlyWarning:
        "This device is currently in Read-Only mode. To enable write permissions, scan the pairing QR code shown on your PC, or enter your secret key below.",
      cloudUpgradeKeyPlaceholder: "Paste secret key (UUID)...",
      cloudUpgradeKeyBtn: "Enable write permissions",
      cloudUpgradeSuccess: "Write permissions enabled successfully!",
      cancel: "Cancel",
      qrInstructions:
        "Scan this code with your phone camera to transfer your team and captures in 1 second:",
      qrGenerating: "Generating QR code...",
      qrCopyLink: "Copy sync link",
      qrOrManual: "or via backup file",
      qrExportJson: "Export JSON",
      qrImportJson: "Import JSON",
      dangerLocalData: "local data management",
      dangerResetBtn: "Reset all my local data",
      dangerResetTitle: "Reset and delete everything?",
      dangerResetDesc:
        "Your captured Pokémon and current team will be deleted. This action is permanent.",
      dangerResetConfirm: "Yes, delete everything",
    },
  },
  es: {
    nav: {
      pokedex: "Pokédex",
      team: "Equipo",
      installApp: "Instalar App",
      installAppTitle: "Instalar aplicación PokeForge",
      sync: "Sincronizar",
      syncTitle: "Sincronizar dispositivos",
      soundTitle: "Activar/desactivar sonido",
      mobileNav: "Navegación móvil",
      home: "Inicio",
      installedSuccess: "¡PokeForge se ha instalado correctamente!",
      pwaHint:
        "Para instalar PokeForge, usá la opción 'Agregar a pantalla de inicio' en el menú de tu navegador.",
    },
    home: {
      badge: "PokeForge PWA v1.0 · Gen I a IX",
      titlePrefix: "Forjá tu equipo Pokémon ",
      titleAccent: "definitivo",
      titleSuffix: "",
      subtitle:
        "Explorá la Pokédex completa, registrá tus capturas y diseñá la estrategia perfecta analizando las fortalezas, debilidades y movimientos de tu equipo.",
      explorePokedex: "Explorar Pokédex",
      pokedexDesc: "1025+ Pokémon con filtros por juego y gen",
      buildTeam: "Armar Equipo",
      teamDesc: "Análisis táctico de tipos y debilidades",
      typeAnalysis: "Análisis de Tipos",
      typeAnalysisDesc: "Calculá resistencias e inmunidades al instante.",
      offlineMode: "Modo PWA Offline",
      offlineModeDesc: "Instalá y usá la app sin conexión.",
      gameFilters: "Filtros por Juego",
      gameFiltersDesc: "Datos oficiales por versión y ubicación.",
    },
    pokedex: {
      title: "Pokédex",
      subtitle: "Explorá todos los Pokémon y marcá los que ya capturaste.",
      capturedCount: "Capturados",
      all: "Todos",
      captured: "Capturados",
      searchPlaceholder: "Buscar por nombre o número...",
      allGames: "Todos los juegos",
      filterByType: "Filtrar por tipo",
      filterByGen: "Filtrar por generación",
      empty: "No se encontraron Pokémon con esos filtros.",
      loadMore: "Cargar más Pokémon",
      catch: "Capturar",
      caught: "Capturado",
    },
    team: {
      title: "Armar equipo",
      subtitle:
        "Completa tu equipo filtrando por generación, tipo y movimientos.",
      teamCard: "Tarjeta del Equipo",
      teamCardTitle: "Generar y descargar tarjeta visual del equipo",
      downloadPng: "Descargar Imagen PNG",
      copyShowdown: "Copiar Formato Showdown",
      choosePokemon: "Elegir Pokémon",
      selectMove: "Seleccionar ataque",
      searchByNameOrNum: "Buscar por nombre o #...",
      filterByMove: "Filtrar por movimiento...",
      category: "Categoría",
      allCategories: "Todas",
      physical: "Físico",
      special: "Especial",
      status: "Estado",
      learnMethod: "Método de aprendizaje",
      allMethods: "Todos",
      levelUp: "Nivel",
      machine: "MT/MO",
      tutor: "Tutor",
      egg: "Huevo",
      attackType: "Tipo de Ataque",
      clearTeam: "Limpiar equipo",
      teamSizeLabel: "Tamaño:",
      typesSection: "Tipos",
      gensSection: "Generaciones",
      gameSection: "Juego",
    },
    strengthsWeaknesses: {
      title: "Análisis del Equipo",
      weaknesses: "Debilidades",
      resistances: "Resistencias",
      immunities: "Inmunidades",
      coverage: "Cobertura Defensiva",
      noTeam: "Agregá Pokémon para ver debilidades y resistencias",
    },
    modal: {
      stats: "Estadísticas",
      moves: "Movimientos",
      evolutions: "Evoluciones",
      acquisition: "Obtención",
      chartToggle:
        "Alternar entre lista de estadísticas y gráfico hexágono estilo Juez Pokémon",
      nature: "Naturaleza",
      neutralNature: "Neutral: no modifica ninguna estadística.",
      increases: "Aumenta",
      decreases: "Disminuye",
      captureHint:
        "Capturá este Pokémon para personalizar sus stats y naturaleza.",
      specialCondition: "Condición especial",
      noEvolutions: "Este Pokémon no evoluciona.",
      level: "Nivel",
      method: "Método",
      move: "Movimiento",
      game: "Juego",
      location: "Lugar",
      generation: "Generación",
      close: "Cerrar modal",
      wildEncounter: "Encuentro salvaje",
    },
    sync: {
      title: "Sincronizar Dispositivos",
      loading: "Leyendo datos de sincronización...",
      heroTitle: "Sincronizá tu PC con tu celular",
      heroDesc:
        "Para transferir tus capturas y tu equipo entre dispositivos de forma instantánea:",
      step1:
        "En tu computadora, hacé clic en el botón Sincronizar en la barra de navegación.",
      step2:
        "Abrí la cámara de tu celular y apuntá al código QR que aparece en pantalla.",
      step3: "Tocá el enlace y tus datos se transferirán al instante.",
      goToPokedex: "Ir a la Pokédex",
      generateQrHere: "Generar código QR aquí",
      readyTitle: "¡Datos listos para sincronizar!",
      readySubtitle:
        "Recibiste un equipo y registro de capturas de tu otro dispositivo.",
      incomingTeam: "Equipo Recibido",
      incomingCaptures: "Capturas en paquete",
      currentCaptures: "Capturas en este celular",
      mergeTitle: "Combinar datos (Recomendado)",
      mergeDesc:
        "Suma las capturas recibidas a las que ya tengas en este celular y activa el equipo recibido.",
      replaceTitle: "Reemplazar todo",
      replaceDesc:
        "Sustituye por completo las capturas y el equipo de este celular por los datos recibidos.",
      confirmSave: "Confirmar y Guardar",
      cancel: "Cancelar",
      successToast: "¡Sincronización exitosa! ({total} capturados en total)",
      cloudLinkTitle: "Vincular Bóveda en la Nube",
      cloudLinkSubtitleRW: "Bóveda {code} detectada. Se vinculará este dispositivo con permisos completos (lectura y escritura).",
      cloudLinkSubtitleRO: "Bóveda {code} detectada. Se vinculará este dispositivo en modo solo lectura.",
      cloudLinkSuccessToast: "¡Dispositivo vinculado con éxito con permisos de lectura y escritura!",
    },
    syncModal: {
      modalTitle: "Sincronización y Datos",
      close: "Cerrar",
      tabCloud: "Nube",
      tabQr: "Código QR",
      cloudTitle: "Sincronización Automática en la Nube",
      cloudDesc:
        "Conecta tus dispositivos para que tu equipo y capturas se sincronicen automáticamente sin necesidad de cuentas ni contraseñas.",
      cloudCreate: "Crear Bóveda en la Nube",
      cloudOrJoin: "o unirse con código existente",
      cloudCodePlaceholder: "Código (ej. PK-8492)",
      cloudJoin: "Vincular",
      cloudConnected: "Conectado a la DB",
      cloudSynced: "Sincronizado",
      cloudCodeLabel: "Código de vinculación:",
      cloudCopyTitle: "Copiar código",
      cloudHelp:
        "Ingresá este código en tu celular o en otra PC para mantenerlos sincronizados en tiempo real.",
      cloudSyncNow: "Sincronizar ahora",
      cloudUnlink: "Desvincular",
      cloudDeleteVault: "Eliminar bóveda de la nube",
      cloudDeleteConfirmTitle: "¿Eliminar bóveda de la DB?",
      cloudDeleteConfirmDesc:
        "Se borrará permanentemente la copia de tus datos en la nube. Tus datos locales en este dispositivo se mantendrán intactos.",
      cloudDeleteConfirmBtn: "Sí, borrar de la nube",
      cloudStatusReadOnly: "Conectado (Solo Lectura)",
      cloudStatusReadWrite: "Conectado (Lectura y Escritura)",
      cloudQrTitle: "Vincular Celular con Código QR",
      cloudQrDesc:
        "Escaneá este código con la cámara de tu celular para vincularlo automáticamente con permisos completos de sincronización (lectura y escritura).",
      cloudCopyPairingLink: "Copiar enlace de vinculación completa",
      cloudPairingLinkCopied: "¡Enlace de vinculación copiado al portapapeles!",
      cloudReadOnlyWarning:
        "Este celular está en modo Solo Lectura (no puede subir cambios a la nube). Escaneá el código QR que se muestra en tu PC para habilitar permisos de escritura o ingresá tu clave secreta.",
      cloudUpgradeKeyPlaceholder: "Pegar clave secreta (UUID)...",
      cloudUpgradeKeyBtn: "Activar permisos de escritura",
      cloudUpgradeSuccess: "¡Permisos de escritura activados con éxito!",
      cancel: "Cancelar",
      qrInstructions:
        "Escaneá este código con la cámara de tu celular para transferir tu equipo y capturas en 1 segundo:",
      qrGenerating: "Generando código QR...",
      qrCopyLink: "Copiar enlace de sincronización",
      qrOrManual: "o mediante archivo de respaldo",
      qrExportJson: "Exportar JSON",
      qrImportJson: "Importar JSON",
      dangerLocalData: "gestión de datos locales",
      dangerResetBtn: "Reiniciar todos mis datos locales",
      dangerResetTitle: "¿Reiniciar y borrar todo?",
      dangerResetDesc:
        "Se borrarán tus Pokémon capturados y tu equipo actual. Esta acción es permanente.",
      dangerResetConfirm: "Sí, borrar todo",
    },
  },
};

export function getTranslations(locale?: string | null): Translations {
  if (locale === "es") return UI_TRANSLATIONS.es;
  return UI_TRANSLATIONS.en;
}

export function getCurrentLocale(): Locale {
  if (typeof document !== "undefined") {
    const htmlLang = document.documentElement.lang;
    if (htmlLang === "es") return "es";
    if (
      window.location.pathname.startsWith("/es/") ||
      window.location.pathname === "/es"
    )
      return "es";
  }
  return "en";
}

export function getTypeName(type: string, locale: Locale): string {
  const normalized = type.toLowerCase();
  return TYPE_NAMES[normalized]?.[locale] ?? type;
}

export function getEvolutionTriggerName(
  trigger: string,
  locale: Locale,
): string {
  return EVOLUTION_TRIGGER_NAMES[trigger]?.[locale] ?? trigger;
}

/**
 * Transforma una ruta al idioma objetivo para la Opción A:
 * - 'en' (default): sin prefijo (/pokedex/, /equipo/, /)
 * - 'es': con prefijo /es (/es/pokedex/, /es/equipo/, /es/)
 */
export function getLocalizedPath(
  pathname: string,
  targetLocale: Locale,
): string {
  let cleanPath = pathname;
  if (cleanPath === "/es" || cleanPath === "/es/") {
    cleanPath = "/";
  } else if (cleanPath.startsWith("/es/")) {
    cleanPath = cleanPath.slice(3);
  }

  if (!cleanPath.startsWith("/")) cleanPath = "/" + cleanPath;

  if (targetLocale === "en") {
    return cleanPath;
  }

  if (cleanPath === "/") return "/es/";
  return `/es${cleanPath}`;
}
