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

export const NATURE_NAMES: Record<string, { en: string; es: string }> = {
  hardy: { en: "Hardy", es: "Fuerte" },
  lonely: { en: "Lonely", es: "Huraña" },
  brave: { en: "Brave", es: "Audaz" },
  adamant: { en: "Adamant", es: "Firme" },
  naughty: { en: "Naughty", es: "Pícara" },
  bold: { en: "Bold", es: "Osada" },
  docile: { en: "Docile", es: "Dócil" },
  relaxed: { en: "Relaxed", es: "Plácida" },
  impish: { en: "Impish", es: "Agitada" },
  lax: { en: "Lax", es: "Floja" },
  timid: { en: "Timid", es: "Miedosa" },
  hasty: { en: "Hasty", es: "Activa" },
  serious: { en: "Serious", es: "Seria" },
  jolly: { en: "Jolly", es: "Alegre" },
  naive: { en: "Naive", es: "Ingenua" },
  modest: { en: "Modest", es: "Modesta" },
  mild: { en: "Mild", es: "Afable" },
  quiet: { en: "Quiet", es: "Mansa" },
  bashful: { en: "Bashful", es: "Tímida" },
  rash: { en: "Rash", es: "Alocada" },
  calm: { en: "Calm", es: "Serena" },
  gentle: { en: "Gentle", es: "Amable" },
  sassy: { en: "Sassy", es: "Grosera" },
  careful: { en: "Careful", es: "Cauta" },
  quirky: { en: "Quirky", es: "Rara" },
};

export interface Translations {
  nav: {
    pokedex: string;
    team: string;
    blog: string;
    installApp: string;
    installAppTitle: string;
    sync: string;
    syncTitle: string;
    soundTitle: string;
    mobileNav: string;
    home: string;
    installedSuccess: string;
    pwaHint: string;
    cloudSynced: string;
    cloudSyncing: string;
    cloudOffline: string;
    cloudError: string;
    cloudTooltipSynced: string;
    cloudTooltipSyncing: string;
    cloudTooltipOffline: string;
    cloudTooltipError: string;
    cloudTooltipUnlinked: string;
    cloudRemoteUpdated: string;
    pwaPopoverTitle: string;
    pwaPopoverSubtitle: string;
    pwaFeatureOffline: string;
    pwaFeatureOfflineDesc: string;
    pwaFeatureFast: string;
    pwaFeatureFastDesc: string;
    pwaFeatureSafe: string;
    pwaFeatureSafeDesc: string;
    pwaInstallCta: string;
    pwaIosTitle: string;
    pwaIosStep1: string;
    pwaIosStep2: string;
    pwaClose: string;
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
    readBlog: string;
    blogDesc: string;
    typeAnalysis: string;
    typeAnalysisDesc: string;
    adFree: string;
    adFreeDesc: string;
    gameFilters: string;
    gameFiltersDesc: string;
  };
  notFound: {
    badge: string;
    title: string;
    desc: string;
    backHome: string;
    backBlog: string;
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
    regionalDex: string;
    obtainable: string;
    dexMode: string;
    exclusiveFilter: string;
    exclusiveAll: string;
    exclusiveBoth: string;
    exclusiveOnly: string;
    exclusiveBadge: string;
    filters: string;
    showFilters: string;
    hideFilters: string;
    clearFilters: string;
    filterByMoves: string;
    movesSearchPlaceholder: string;
    movesHelper: string;
    noMovesFound: string;
    removeMove: string;
    clearMoves: string;
    moveLearnedBy: string;
    popularMovesHint: string;
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
    item: string;
    selectItem: string;
    chooseItem: string;
    removeItem: string;
    filterByItem: string;
    searchItemPlaceholder: string;
    itemCategories: {
      all: string;
      competitive: string;
      statBoost: string;
      typeBoost: string;
      defensive: string;
      berries: string;
      speciesSpecific: string;
      utility: string;
    };
    typeMatrix: string;
    typeMatrixTitle: string;
    typeMatrixSubtitle: string;
    typeMatrixShort: string;
    typeMatrixEmpty: string;
    netBalance: string;
    legend: string;
    legend4x: string;
    legend2x: string;
    legend1x: string;
    legendHalf: string;
    legendQuarter: string;
    legendImmune: string;
  };
  strengthsWeaknesses: {
    title: string;
    weaknesses: string;
    resistances: string;
    immunities: string;
    coverage: string;
    noTeam: string;
    threatCritical: string;
    threatExposed: string;
    threatCovered: string;
    weakLabel: string;
    weakLabelPlural: string;
    resistLabel: string;
    resistLabelPlural: string;
    immuneLabel: string;
    immuneLabelPlural: string;
    vulnerableGroup: string;
    resistantGroup: string;
    immuneGroup: string;
    neutralGroup: string;
    noResistWarning: string;
    noWeaknesses: string;
    noResistances: string;
    noImmunities: string;
    tabDefense: string;
    tabOffense: string;
    coverageScore: string;
    superEffectiveTypes: string;
    blindSpots: string;
    attackerCount: string;
    attackerCountPlural: string;
    offenseModeStab: string;
    offenseModeMoves: string;
    noBlindSpots: string;
    noOffenseCovered: string;
    blindSpotHint: string;
    tabSynergy: string;
    synergyTitle: string;
    synergySubtitle: string;
    recommendedTypesTitle: string;
    suggestedPokemonTitle: string;
    addToTeam: string;
    teamFull: string;
    teamAddedSuccess: string;
    synergyNoSuggestions: string;
    whyRecommended: string;
    resistsVulnerability: string;
    immuneToVulnerability: string;
    coversBlindSpotBadge: string;
    bringsNewTypeBadge: string;
    synergyGameFilterLabel: string;
    synergyGameAllPrompt: string;
    synergyGameFilteredNotice: string;
    viewCompact: string;
    viewDetailed: string;
    kpiCritical: string;
    kpiResists: string;
    kpiImmunes: string;
    kpiCovered: string;
    kpiBlindSpots: string;
    kpiScore: string;
    guideButtonTitle: string;
    guideEmptyPrompt: string;
    guideModalTitle: string;
    guideModalSubtitle: string;
    guideTabDefense: string;
    guideTabOffense: string;
    guideTabModes: string;
    guideDefenseTitle: string;
    guideDefenseDesc: string;
    guideMultiplier4xTitle: string;
    guideMultiplier4xDesc: string;
    guideMultiplier2xTitle: string;
    guideMultiplier2xDesc: string;
    guideMultiplierHalfTitle: string;
    guideMultiplierHalfDesc: string;
    guideMultiplierQuarterTitle: string;
    guideMultiplierQuarterDesc: string;
    guideMultiplierZeroTitle: string;
    guideMultiplierZeroDesc: string;
    guideKpiCriticalDesc: string;
    guideOffenseTitle: string;
    guideOffenseDesc: string;
    guideOffenseMovesDesc: string;
    guideOffenseStabDesc: string;
    guideBlindSpotsTitle: string;
    guideBlindSpotsDesc: string;
    guideModesTitle: string;
    guideModesCompactDesc: string;
    guideModesDetailedDesc: string;
    guideSynergyTip: string;
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
    effectiveness: string;
    weaknesses: string;
    resistances: string;
    immunities: string;
    neutral: string;
    none: string;
    sectionIndex: string;
    top: string;
    collapsed: string;
    loading: string;
    loadError: string;
    teamSlotBadge: string;
    linkPokedex: string;
    copyFromPokedex: string;
    copyToPokedex: string;
    copiedFromPokedex: string;
    savedToPokedex: string;
    noPokedexData: string;
    teamNatureNotice: string;
    abilities: string;
    ability: string;
    hiddenAbility: string;
    hiddenBadge: string;
    activeAbility: string;
    probability: string;
    noAbilities: string;
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
    cloudLinkConfirmBtn: string;
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
    cloudAutosaveInfo: string;
    cloudCheckUpdates: string;
    cloudUnlink: string;
    cloudDeleteVault: string;
    cloudDeleteConfirmTitle: string;
    cloudDeleteConfirmDesc: string;
    cloudDeleteConfirmBtn: string;
    cloudStatusReadOnly: string;
    cloudStatusReadWrite: string;
    cloudSecretKeyLabel: string;
    cloudCopySecret: string;
    cloudSecretCopied: string;
    cloudPasteFromClipboard: string;
    cloudToggleSecretVisibility: string;
    cloudReadOnlyBadge: string;
    cloudReadOnlyTip: string;
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
  blog: {
    titlePrefix: string;
    titleAccent: string;
    titleSuffix: string;
    subtitle: string;
    badge: string;
    searchPlaceholder: string;
    allCategories: string;
    categories: {
      guias: string;
      curiosidades: string;
      competitivo: string;
      novedades: string;
      recursos: string;
    };
    featuredBadge: string;
    readArticle: string;
    readingTimeSuffix: string;
    noPosts: string;
    noPostsDesc: string;
    backToBlog: string;
    publishedOn: string;
    writtenBy: string;
    shareArticle: string;
    moreArticles: string;
    tocTitle: string;
    tocMobileTitle: string;
    backToTop: string;
    filteringByTag: string;
    clearTagFilter: string;
    guideHubBadge: string;
    guideChapter: string;
    guideChapterProgress: string;
    guideIndexTitle: string;
    guideIndexSubtitle: string;
    guidePrevChapter: string;
    guideNextChapter: string;
    guideBackToHub: string;
    guideAllChapters: string;
    guideQuickNav: string;
    guideIndexShort: string;
    inProgressBadge: string;
    inProgressNoticeTitle: string;
    inProgressNoticeDesc: string;
    guideNextChapterPending: string;
    guideNextChapterPendingDesc: string;
    guideChapterPlanned: string;
    guideChapterPlannedDesc: string;
    downloadsTitle: string;
    downloadsSubtitle: string;
    downloadAction: string;
    paginationPrev: string;
    paginationNext: string;
    paginationPage: string;
    paginationOf: string;
  };
}

export const UI_TRANSLATIONS: Record<Locale, Translations> = {
  en: {
    nav: {
      pokedex: "Pokédex",
      team: "Team",
      blog: "Blog",
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
      cloudSynced: "Synced",
      cloudSyncing: "Saving...",
      cloudOffline: "Offline",
      cloudError: "Save error",
      cloudTooltipSynced: "All changes saved to cloud",
      cloudTooltipSyncing: "Saving changes to database...",
      cloudTooltipOffline: "Offline mode. Changes will sync when reconnected.",
      cloudTooltipError: "Error syncing with cloud. Click to retry.",
      cloudTooltipUnlinked: "Sync with cloud and other devices",
      cloudRemoteUpdated: "Data updated from cloud",
      pwaPopoverTitle: "Install PokeForge",
      pwaPopoverSubtitle: "Install PokeForge on your device for instant offline access and a faster experience.",
      pwaFeatureOffline: "Works 100% Offline",
      pwaFeatureOfflineDesc: "Access the Pokédex and your saved teams without internet connection.",
      pwaFeatureFast: "Fullscreen & Fast",
      pwaFeatureFastDesc: "No browser clutter, instant launch, and maximum screen space.",
      pwaFeatureSafe: "Device Sync & Cloud",
      pwaFeatureSafeDesc: "Seamlessly save your teams and sync across all your devices.",
      pwaInstallCta: "Install PokeForge",
      pwaIosTitle: "How to install on iOS / Safari:",
      pwaIosStep1: "Tap the Share button in Safari toolbar",
      pwaIosStep2: "Scroll down and select 'Add to Home Screen'",
      pwaClose: "Maybe later",
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
      readBlog: "Blog & Guides",
      blogDesc: "Guides, trivia, and competitive analysis",
      typeAnalysis: "Type Analysis",
      typeAnalysisDesc: "Calculate resistances and immunities instantly.",
      adFree: "100% Ad-Free",
      adFreeDesc: "Clean, fast experience with zero ads or interruptions.",
      gameFilters: "Game Filters",
      gameFiltersDesc: "Official data by version and location.",
    },
    notFound: {
      badge: "404 Error",
      title: "Lost in the Tall Grass?",
      desc: "The page you're looking for was moved, doesn't exist, or has fled the battle.",
      backHome: "Return Home",
      backBlog: "Back to Blog",
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
      regionalDex: "Regional Dex",
      obtainable: "Obtainable",
      dexMode: "Pokédex Mode",
      exclusiveFilter: "Exclusives",
      exclusiveAll: "All",
      exclusiveBoth: "Both games",
      exclusiveOnly: "Only {version}",
      exclusiveBadge: "Exclusive to {version}",
      filters: "Filters",
      showFilters: "Show filters",
      hideFilters: "Hide filters",
      clearFilters: "Clear filters",
      filterByMoves: "Filter by moves",
      movesSearchPlaceholder: "Type a move (e.g. Ember, Surf)...",
      movesHelper: "Pokémon must learn all selected moves",
      noMovesFound: "No moves found",
      removeMove: "Remove {move}",
      clearMoves: "Clear all moves",
      moveLearnedBy: "{count} Pokémon",
      popularMovesHint: "Suggested moves:",
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
      item: "Item",
      selectItem: "Select Item",
      chooseItem: "Equip Item",
      removeItem: "Remove item",
      filterByItem: "Filter by item...",
      searchItemPlaceholder: "Search item by name or effect...",
      itemCategories: {
        all: "All",
        competitive: "Competitive",
        statBoost: "Stats",
        typeBoost: "Type Boost",
        defensive: "Defensive",
        berries: "Berries",
        speciesSpecific: "Species",
        utility: "Utility",
      },
      typeMatrix: "Type Matrix",
      typeMatrixTitle: "Team Type Matrix",
      typeMatrixSubtitle:
        "Cross-table of weaknesses, resistances, and balances for all 18 elemental types",
      typeMatrixShort: "Matrix",
      typeMatrixEmpty:
        "Add at least one Pokémon to your team to view the type matrix.",
      netBalance: "Net Balance",
      legend: "Legend",
      legend4x: "4× Double weakness",
      legend2x: "2× Weakness",
      legend1x: "- Neutral damage",
      legendHalf: "½× Resistance",
      legendQuarter: "¼× Double resistance",
      legendImmune: "0× Immunity",
    },
    strengthsWeaknesses: {
      title: "Team Defense Analysis",
      weaknesses: "Weaknesses",
      resistances: "Resistances",
      immunities: "Immunities",
      coverage: "Defensive Coverage",
      noTeam: "Add Pokémon to see weaknesses and resistances",
      threatCritical: "Critical",
      threatExposed: "Unprotected",
      threatCovered: "Covered",
      weakLabel: "{n} weak",
      weakLabelPlural: "{n} weak",
      resistLabel: "{n} resist",
      resistLabelPlural: "{n} resist",
      immuneLabel: "{n} immune",
      immuneLabelPlural: "{n} immune",
      vulnerableGroup: "Vulnerable",
      resistantGroup: "Resistances",
      immuneGroup: "Immunities",
      neutralGroup: "Neutral",
      noResistWarning: "No Pokémon on the team resists this type.",
      noWeaknesses: "No shared weaknesses in the team.",
      noResistances: "No pure resistances.",
      noImmunities: "No immunities.",
      tabDefense: "Defense",
      tabOffense: "Offense",
      coverageScore: "{count} of {total} types covered",
      superEffectiveTypes: "Super Effective Coverage",
      blindSpots: "Blind Spots",
      attackerCount: "{n} attacker",
      attackerCountPlural: "{n} attackers",
      offenseModeStab: "Base Types (STAB)",
      offenseModeMoves: "Equipped Moves",
      noBlindSpots: "Excellent! The team covers all 18 elemental types.",
      noOffenseCovered: "No super-effective coverage against any type.",
      blindSpotHint:
        "No team member can hit this type with super-effective damage.",
      tabSynergy: "Synergy",
      synergyTitle: "Synergy Suggestions",
      synergySubtitle:
        "Smart suggestions to cover weaknesses and complete your team",
      recommendedTypesTitle: "Key Recommended Types",
      suggestedPokemonTitle: "Suggested Pokémon",
      addToTeam: "Add to team",
      teamFull: "Team full ({max}/{max})",
      teamAddedSuccess: "{name} added to your team!",
      synergyNoSuggestions:
        "Your team is well-balanced or no candidates were found.",
      whyRecommended: "Why recommended?",
      resistsVulnerability: "Resists {types}",
      immuneToVulnerability: "Immune to {types}",
      coversBlindSpotBadge: "Covers {types}",
      bringsNewTypeBadge: "New: {types}",
      synergyGameFilterLabel: "Game:",
      synergyGameAllPrompt:
        "Select a game to see Pokémon available specifically in that version's Pokédex.",
      synergyGameFilteredNotice:
        "Suggestions filtered for {game} ({count} Pokémon in {dex}).",
      viewCompact: "Compact",
      viewDetailed: "Detailed",
      kpiCritical: "Critical",
      kpiResists: "Resisted",
      kpiImmunes: "Immune",
      kpiCovered: "Covered",
      kpiBlindSpots: "Blind Spots",
      kpiScore: "Coverage",
      guideButtonTitle: "Team Analysis Guide & Legend",
      guideEmptyPrompt: "How do team stats and coverage work?",
      guideModalTitle: "Team Analysis Guide",
      guideModalSubtitle:
        "Learn how to read defensive multipliers, offense coverage, and KPIs.",
      guideTabDefense: "Defense & Multipliers",
      guideTabOffense: "Offense & Coverage",
      guideTabModes: "Views & Tips",
      guideDefenseTitle: "Defensive Matchups & Multipliers",
      guideDefenseDesc:
        "Evaluates incoming damage from enemy attacks against your team's Pokémon.",
      guideMultiplier4xTitle: "4× Critical Weakness",
      guideMultiplier4xDesc:
        "Double weakness (e.g. Grass/Bug vs Fire). Takes quadruple damage.",
      guideMultiplier2xTitle: "2× Weakness",
      guideMultiplier2xDesc:
        "Takes super-effective damage (double incoming damage).",
      guideMultiplierHalfTitle: "½× Resistance",
      guideMultiplierHalfDesc:
        "Resistant to this type. Takes half incoming damage.",
      guideMultiplierQuarterTitle: "¼× S-Resistance",
      guideMultiplierQuarterDesc:
        "Double resistance. Takes only 25% incoming damage.",
      guideMultiplierZeroTitle: "0× Immunity",
      guideMultiplierZeroDesc:
        "Completely immune. Takes zero damage from this type.",
      guideKpiCriticalDesc:
        "Counts elemental types that hit 2 or more members of your team with super-effective damage (potential team risks).",
      guideOffenseTitle: "Offensive Coverage",
      guideOffenseDesc:
        "Measures how many of the 18 elemental types your team can hit with super-effective (2×) damage.",
      guideOffenseMovesDesc:
        "Calculates coverage based on the actual 4 moves assigned to each Pokémon.",
      guideOffenseStabDesc:
        "Calculates coverage based on your team's innate Pokémon types (STAB bonus).",
      guideBlindSpotsTitle: "Blind Spots",
      guideBlindSpotsDesc:
        "Elemental types that none of your current attacks can hit super-effectively.",
      guideModesTitle: "Display Modes & Tips",
      guideModesCompactDesc:
        "Mini Grid (18 types): Quick color-coded overview of all type interactions.",
      guideModesDetailedDesc:
        "Detailed Breakdown: Pokémon-by-Pokémon list of weaknesses, resistances, and moves.",
      guideSynergyTip:
        "Use the 'Synergy' button in the header for smart recommendations to balance weaknesses and patch blind spots.",
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
      effectiveness: "Type Effectiveness",
      weaknesses: "Weaknesses",
      resistances: "Resistances",
      immunities: "Immunities",
      neutral: "Neutral",
      none: "None",
      sectionIndex: "Section Index",
      top: "Top",
      collapsed: "Collapsed",
      loading: "Loading Pokémon data...",
      loadError: "Could not load Pokémon details.",
      teamSlotBadge: "Team · Slot {n}",
      linkPokedex: "Sync with Pokédex",
      copyFromPokedex: "Copy from Pokédex",
      copyToPokedex: "Save to Pokédex",
      copiedFromPokedex: "Pokédex data copied to team slot.",
      savedToPokedex: "Team slot data saved to Pokédex.",
      noPokedexData: "No custom stats or nature in Pokédex.",
      teamNatureNotice: "Customizing stats and nature for this team member.",
      abilities: "Abilities",
      ability: "Ability",
      hiddenAbility: "Hidden Ability",
      hiddenBadge: "Hidden",
      activeAbility: "Active",
      probability: "Probability",
      noAbilities: "No ability data available.",
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
      cloudLinkSubtitleRW:
        "Cloud vault {code} detected. This device will be linked with full sync permissions (read & write).",
      cloudLinkSubtitleRO:
        "Cloud vault {code} detected. This device will be linked in read-only mode.",
      cloudLinkSuccessToast:
        "Device linked successfully with read & write permissions!",
      cloudLinkConfirmBtn: "Link & Sync Now",
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
      cloudSyncNow: "Save to cloud now",
      cloudAutosaveInfo:
        "Autosave active · Web Worker checks for updates every ~5 mins.",
      cloudCheckUpdates: "Check for updates",
      cloudUnlink: "Unlink",
      cloudDeleteVault: "Delete vault from cloud",
      cloudDeleteConfirmTitle: "Delete vault from DB?",
      cloudDeleteConfirmDesc:
        "The cloud copy of your data will be permanently deleted. Your local data on this device will remain intact.",
      cloudDeleteConfirmBtn: "Yes, delete from cloud",
      cloudStatusReadOnly: "Connected (Read Only)",
      cloudStatusReadWrite: "Connected (Read & Write)",
      cloudSecretKeyLabel: "Secret Key (Write Access):",
      cloudCopySecret: "Copy secret key",
      cloudSecretCopied: "Secret key copied to clipboard!",
      cloudPasteFromClipboard: "Paste from clipboard",
      cloudToggleSecretVisibility: "Toggle visibility",
      cloudReadOnlyBadge: "Read-Only Mode Active",
      cloudReadOnlyTip: "Tip: You can find or copy your secret key from the sync modal on the device where you created the vault.",
      cloudQrTitle: "Link Mobile Phone via QR Code",
      cloudQrDesc:
        "Scan this code with your phone camera to link it automatically with full sync permissions (read & write).",
      cloudCopyPairingLink: "Copy full pairing link",
      cloudPairingLinkCopied: "Full pairing link copied to clipboard!",
      cloudReadOnlyWarning:
        "This device is in Read-Only mode and cannot upload changes. Enter your secret key below or scan the pairing QR code from your main device to unlock full write permissions.",
      cloudUpgradeKeyPlaceholder: "Paste secret key (e.g. 550e8400-e29b-41d4-a716-446655440000)...",
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
    blog: {
      titlePrefix: "Master strategy & ",
      titleAccent: "discover",
      titleSuffix: " secrets",
      subtitle:
        "Guides, teambuilding strategies, competitive breakdowns, and curiosities from the Pokémon universe.",
      badge: "PokeForge Blog · Lore & Tactics",
      searchPlaceholder: "Search articles by title, tag, or topic...",
      allCategories: "All",
      categories: {
        guias: "Guides",
        curiosidades: "Curiosities",
        competitivo: "Competitive",
        novedades: "News",
        recursos: "Resources",
      },
      featuredBadge: "Featured",
      readArticle: "Read article",
      readingTimeSuffix: "min read",
      noPosts: "No articles found",
      noPostsDesc: "Try adjusting your search query or filter category.",
      backToBlog: "Back to Blog",
      publishedOn: "Published on",
      writtenBy: "By",
      shareArticle: "Share article",
      moreArticles: "More recommended articles",
      tocTitle: "On this page",
      tocMobileTitle: "Table of Contents",
      backToTop: "Back to top",
      filteringByTag: "Filtering by tag:",
      clearTagFilter: "Clear tag filter",
      guideHubBadge: "Multi-part Guide",
      guideChapter: "Chapter",
      guideChapterProgress: "Chapter {current} of {total}",
      guideIndexTitle: "Guide Chapters & Sections",
      guideIndexSubtitle:
        "Explore all sections and stops of this comprehensive guide.",
      guidePrevChapter: "Previous chapter",
      guideNextChapter: "Next chapter",
      guideBackToHub: "Guide Overview",
      guideAllChapters: "All chapters",
      guideQuickNav: "Chapters",
      guideIndexShort: "Index",
      inProgressBadge: "In Progress",
      inProgressNoticeTitle: "Guide in Active Development",
      inProgressNoticeDesc:
        "This guide is actively being written and updated. New chapters and sections will be published periodically.",
      guideNextChapterPending: "Next chapter in preparation",
      guideNextChapterPendingDesc:
        "The next chapter will be published soon. Stay tuned!",
      guideChapterPlanned: "Coming Soon",
      guideChapterPlannedDesc: "Chapter currently in preparation",
      downloadsTitle: "Downloads & Resources",
      downloadsSubtitle:
        "Downloadable files, guides, and companion material for this article.",
      downloadAction: "Download",
      paginationPrev: "Previous",
      paginationNext: "Next",
      paginationPage: "Page",
      paginationOf: "of",
    },
  },
  es: {
    nav: {
      pokedex: "Pokédex",
      team: "Equipo",
      blog: "Blog",
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
      cloudSynced: "Sincronizado",
      cloudSyncing: "Guardando...",
      cloudOffline: "Sin conexión",
      cloudError: "Error al guardar",
      cloudTooltipSynced: "Todos los cambios están guardados en la nube",
      cloudTooltipSyncing: "Guardando cambios en la base de datos...",
      cloudTooltipOffline: "Modo sin conexión. Se sincronizará al reconectar.",
      cloudTooltipError:
        "Error al sincronizar con la nube. Clic para reintentar.",
      cloudTooltipUnlinked: "Sincronizar con la nube y otros dispositivos",
      cloudRemoteUpdated: "Datos actualizados desde la nube",
      pwaPopoverTitle: "Instalar PokeForge",
      pwaPopoverSubtitle: "Instalá PokeForge en tu dispositivo para acceder al instante sin conexión y con mayor fluidez.",
      pwaFeatureOffline: "100% Sin Conexión",
      pwaFeatureOfflineDesc: "Consultá la Pokédex y tus equipos guardados sin necesidad de internet.",
      pwaFeatureFast: "Pantalla Completa y Rápida",
      pwaFeatureFastDesc: "Sin barras del navegador, inicio instantáneo y mayor espacio visual.",
      pwaFeatureSafe: "Sincronización en la Nube",
      pwaFeatureSafeDesc: "Guardá y sincronizá tus equipos fácilmente entre todos tus dispositivos.",
      pwaInstallCta: "Instalar PokeForge",
      pwaIosTitle: "Cómo instalar en iOS / Safari:",
      pwaIosStep1: "Tocá el botón Compartir en la barra de Safari",
      pwaIosStep2: "Deslizá hacia abajo y elegí 'Agregar a pantalla de inicio'",
      pwaClose: "Quizás más tarde",
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
      readBlog: "Blog y Guías",
      blogDesc: "Estrategias, novedades y curiosidades",
      typeAnalysis: "Análisis de Tipos",
      typeAnalysisDesc: "Calculá resistencias e inmunidades al instante.",
      adFree: "100% Ad-Free",
      adFreeDesc: "Experiencia limpia y rápida, totalmente libre de anuncios.",
      gameFilters: "Filtros por Juego",
      gameFiltersDesc: "Datos oficiales por versión y ubicación.",
    },
    notFound: {
      badge: "Error 404",
      title: "¿Te perdiste en la hierba alta?",
      desc: "La página que buscas fue movida, no existe o huyó del combate.",
      backHome: "Volver al Inicio",
      backBlog: "Ir al Blog",
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
      regionalDex: "Pokédex Regional",
      obtainable: "Obtenibles",
      dexMode: "Modo de Pokédex",
      exclusiveFilter: "Exclusividad",
      exclusiveAll: "Todos",
      exclusiveBoth: "En ambos",
      exclusiveOnly: "Solo {version}",
      exclusiveBadge: "Exclusivo de {version}",
      filters: "Filtros",
      showFilters: "Mostrar filtros",
      hideFilters: "Ocultar filtros",
      clearFilters: "Limpiar filtros",
      filterByMoves: "Filtrar por movimientos",
      movesSearchPlaceholder: "Escribe un movimiento (ej. Ascuas, Surf)...",
      movesHelper:
        "Los Pokémon deben aprender todos los movimientos seleccionados",
      noMovesFound: "No se encontraron movimientos",
      removeMove: "Quitar {move}",
      clearMoves: "Quitar todos",
      moveLearnedBy: "{count} Pokémon",
      popularMovesHint: "Movimientos sugeridos:",
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
      item: "Objeto",
      selectItem: "Seleccionar objeto",
      chooseItem: "Equipar objeto",
      removeItem: "Quitar objeto",
      filterByItem: "Filtrar por objeto...",
      searchItemPlaceholder: "Buscar objeto por nombre o efecto...",
      itemCategories: {
        all: "Todos",
        competitive: "Competitivo",
        statBoost: "Estadísticas",
        typeBoost: "Potenciadores",
        defensive: "Defensivos",
        berries: "Bayas",
        speciesSpecific: "Específicos",
        utility: "Utilidad",
      },
      typeMatrix: "Matriz de Tipos",
      typeMatrixTitle: "Matriz de Tipos del Equipo",
      typeMatrixSubtitle:
        "Tabla cruzada de debilidades, resistencias y balances para los 18 tipos elementales",
      typeMatrixShort: "Matriz",
      typeMatrixEmpty:
        "Agregá al menos un Pokémon a tu equipo para ver la matriz de tipos.",
      netBalance: "Balance Neto",
      legend: "Leyenda",
      legend4x: "4× Doble debilidad",
      legend2x: "2× Debilidad",
      legend1x: "- Daño neutro",
      legendHalf: "½× Resistencia",
      legendQuarter: "¼× Doble resistencia",
      legendImmune: "0× Inmunidad",
    },
    strengthsWeaknesses: {
      title: "Análisis del Equipo",
      weaknesses: "Debilidades",
      resistances: "Resistencias",
      immunities: "Inmunidades",
      coverage: "Cobertura Defensiva",
      noTeam: "Agregá Pokémon para ver debilidades y resistencias",
      threatCritical: "Crítica",
      threatExposed: "Desprotegido",
      threatCovered: "Cubierto",
      weakLabel: "{n} débil",
      weakLabelPlural: "{n} débiles",
      resistLabel: "{n} resiste",
      resistLabelPlural: "{n} resisten",
      immuneLabel: "{n} inmune",
      immuneLabelPlural: "{n} inmunes",
      vulnerableGroup: "Vulnerables",
      resistantGroup: "Resistencias",
      immuneGroup: "Inmunidades",
      neutralGroup: "Neutros",
      noResistWarning: "Ningún Pokémon del equipo resiste este tipo.",
      noWeaknesses: "Sin debilidades destacadas en el equipo.",
      noResistances: "Sin resistencias puras.",
      noImmunities: "Sin inmunidades.",
      tabDefense: "Defensa",
      tabOffense: "Ataque",
      coverageScore: "{count} de {total} tipos cubiertos",
      superEffectiveTypes: "Cobertura Súper Eficaz",
      blindSpots: "Puntos Ciegos",
      attackerCount: "{n} atacante",
      attackerCountPlural: "{n} atacantes",
      offenseModeStab: "Tipos Base (STAB)",
      offenseModeMoves: "Ataques Equipados",
      noBlindSpots: "¡Excelente! El equipo cubre los 18 tipos elementales.",
      noOffenseCovered: "Sin tipos cubiertos con daño súper eficaz.",
      blindSpotHint:
        "Ningún miembro del equipo puede golpear este tipo con súper eficacia.",
      tabSynergy: "Sinergia",
      synergyTitle: "Sugerencias de Sinergia",
      synergySubtitle:
        "Recomendaciones inteligentes para completar o balancear tu equipo",
      recommendedTypesTitle: "Tipos Clave Recomendados",
      suggestedPokemonTitle: "Pokémon Sugeridos",
      addToTeam: "Agregar al equipo",
      teamFull: "Equipo lleno ({max}/{max})",
      teamAddedSuccess: "¡{name} fue agregado a tu equipo!",
      synergyNoSuggestions:
        "Tu equipo está bien balanceado o no se encontraron candidatos.",
      whyRecommended: "¿Por qué se recomienda?",
      resistsVulnerability: "Resiste {types}",
      immuneToVulnerability: "Inmune a {types}",
      coversBlindSpotBadge: "Cubre {types}",
      bringsNewTypeBadge: "Nuevo: {types}",
      synergyGameFilterLabel: "Juego:",
      synergyGameAllPrompt:
        "Seleccioná un juego para ver Pokémon disponibles específicamente en la Pokédex de esa versión.",
      synergyGameFilteredNotice:
        "Sugerencias filtradas para {game} ({count} Pokémon en {dex}).",
      viewCompact: "Compacto",
      viewDetailed: "Detallado",
      kpiCritical: "Críticas",
      kpiResists: "Resistidas",
      kpiImmunes: "Inmunes",
      kpiCovered: "Cubiertos",
      kpiBlindSpots: "Puntos Ciegos",
      kpiScore: "Cobertura",
      guideButtonTitle: "Guía de análisis y leyenda",
      guideEmptyPrompt: "¿Cómo funciona el análisis de equipo?",
      guideModalTitle: "Guía de Análisis de Equipo",
      guideModalSubtitle:
        "Aprende a interpretar multiplicadores defensivos, cobertura de ataque y KPIs.",
      guideTabDefense: "Defensa y Multiplicadores",
      guideTabOffense: "Ofensiva y Cobertura",
      guideTabModes: "Vistas y Consejos",
      guideDefenseTitle: "Balance Defensivo y Multiplicadores",
      guideDefenseDesc:
        "Evalúa el daño que recibe tu equipo ante los ataques enemigos según sus tipos elementales.",
      guideMultiplier4xTitle: "4× Debilidad Crítica",
      guideMultiplier4xDesc:
        "Doble debilidad (ej. Planta/Bicho contra Fuego). Recibe daño cuádruple.",
      guideMultiplier2xTitle: "2× Debilidad",
      guideMultiplier2xDesc:
        "Daño súper eficaz recibido (el doble de daño normal).",
      guideMultiplierHalfTitle: "½× Resistencia",
      guideMultiplierHalfDesc:
        "El Pokémon aguanta bien este tipo y recibe la mitad del daño.",
      guideMultiplierQuarterTitle: "¼× Súper Resistencia",
      guideMultiplierQuarterDesc:
        "Doble resistencia. Recibe únicamente el 25% del daño.",
      guideMultiplierZeroTitle: "0× Inmunidad",
      guideMultiplierZeroDesc:
        "Inmunidad total. No recibe daño de movimientos de este tipo.",
      guideKpiCriticalDesc:
        "Indica cuántos tipos elementales golpean a 2 o más miembros de tu equipo con súper eficacia (posibles amenazas colectivas).",
      guideOffenseTitle: "Cobertura Ofensiva",
      guideOffenseDesc:
        "Mide cuántos de los 18 tipos elementales puede golpear tu equipo con ventaja (súper eficaz 2×).",
      guideOffenseMovesDesc:
        "Calcula la cobertura según los 4 ataques asignados a cada Pokémon.",
      guideOffenseStabDesc:
        "Calcula la cobertura según los tipos naturales de tus Pokémon (bonus de daño STAB).",
      guideBlindSpotsTitle: "Puntos Ciegos",
      guideBlindSpotsDesc:
        "Tipos contra los que ningún miembro de tu equipo tiene un ataque con ventaja súper eficaz.",
      guideModesTitle: "Modos de Vista y Recomendaciones",
      guideModesCompactDesc:
        "Mini Grid (18 tipos): Cuadrícula compacta para ver el balance global de un vistazo rápido.",
      guideModesDetailedDesc:
        "Desglose Detallado: Lista agrupada Pokémon por Pokémon con sus multiplicadores exactos.",
      guideSynergyTip:
        "Usa el botón 'Sinergia' en la barra superior para recibir sugerencias inteligentes de Pokémon que cubran tus debilidades y puntos ciegos.",
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
      effectiveness: "Efectividad de Tipos",
      weaknesses: "Debilidades",
      resistances: "Resistencias",
      immunities: "Inmunidades",
      neutral: "Neutral",
      none: "Ninguna",
      sectionIndex: "Índice de secciones",
      top: "Inicio (Datos)",
      collapsed: "Colapsada",
      loading: "Cargando datos del Pokémon...",
      loadError: "No se pudieron cargar los detalles del Pokémon.",
      teamSlotBadge: "Equipo · Slot {n}",
      linkPokedex: "Sincronizar con Pokédex",
      copyFromPokedex: "Copiar de Pokédex",
      copyToPokedex: "Guardar en Pokédex",
      copiedFromPokedex: "Datos de la Pokédex copiados al slot del equipo.",
      savedToPokedex: "Datos del equipo guardados en la Pokédex.",
      noPokedexData:
        "No hay estadísticas ni naturaleza personalizadas en la Pokédex.",
      teamNatureNotice:
        "Personalizando stats y naturaleza para este miembro del equipo.",
      abilities: "Habilidades",
      ability: "Habilidad",
      hiddenAbility: "Habilidad Oculta",
      hiddenBadge: "Oculta",
      activeAbility: "Activa",
      probability: "Probabilidad",
      noAbilities: "Sin datos de habilidades.",
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
      cloudLinkSubtitleRW:
        "Bóveda {code} detectada. Se vinculará este dispositivo con permisos completos (lectura y escritura).",
      cloudLinkSubtitleRO:
        "Bóveda {code} detectada. Se vinculará este dispositivo en modo solo lectura.",
      cloudLinkSuccessToast:
        "¡Dispositivo vinculado con éxito con permisos de lectura y escritura!",
      cloudLinkConfirmBtn: "Vincular y Sincronizar",
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
      cloudSyncNow: "Guardar en la nube ahora",
      cloudAutosaveInfo:
        "Guardado automático activo · El Web Worker revisa cambios cada ~5 min.",
      cloudCheckUpdates: "Comprobar actualizaciones",
      cloudUnlink: "Desvincular",
      cloudDeleteVault: "Eliminar bóveda de la nube",
      cloudDeleteConfirmTitle: "¿Eliminar bóveda de la DB?",
      cloudDeleteConfirmDesc:
        "Se borrará permanentemente la copia de tus datos en la nube. Tus datos locales en este dispositivo se mantendrán intactos.",
      cloudDeleteConfirmBtn: "Sí, borrar de la nube",
      cloudStatusReadOnly: "Conectado (Solo Lectura)",
      cloudStatusReadWrite: "Conectado (Lectura y Escritura)",
      cloudSecretKeyLabel: "Clave secreta (Acceso de escritura):",
      cloudCopySecret: "Copiar clave secreta",
      cloudSecretCopied: "¡Clave secreta copiada al portapapeles!",
      cloudPasteFromClipboard: "Pegar clave",
      cloudToggleSecretVisibility: "Mostrar u ocultar clave",
      cloudReadOnlyBadge: "Modo Solo Lectura Activo",
      cloudReadOnlyTip: "Tip: Podés copiar tu clave secreta desde el modal de sincronización en el dispositivo donde creaste la bóveda.",
      cloudQrTitle: "Vincular Celular con Código QR",
      cloudQrDesc:
        "Escaneá este código con la cámara de tu celular para vincularlo automáticamente con permisos completos de sincronización (lectura y escritura).",
      cloudCopyPairingLink: "Copiar enlace de vinculación completa",
      cloudPairingLinkCopied: "¡Enlace de vinculación copiado al portapapeles!",
      cloudReadOnlyWarning:
        "Este dispositivo está en modo Solo Lectura (no puede subir cambios a la nube). Ingresá tu clave secreta a continuación o escaneá el QR desde tu dispositivo principal para activar permisos de escritura.",
      cloudUpgradeKeyPlaceholder: "Pegá tu clave secreta (ej. 550e8400-e29b-41d4-a716-446655440000)...",
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
    blog: {
      titlePrefix: "Estrategia, guías y ",
      titleAccent: "curiosidades",
      titleSuffix: " Pokémon",
      subtitle:
        "Aprende teambuilding, coberturas de tipos, curiosidades de la franquicia y análisis competitivos.",
      badge: "PokeForge Blog · Lore y Estrategia",
      searchPlaceholder: "Buscar artículos por título, tag o temática...",
      allCategories: "Todos",
      categories: {
        guias: "Guías",
        curiosidades: "Curiosidades",
        competitivo: "Competitivo",
        novedades: "Novedades",
        recursos: "Recursos",
      },
      featuredBadge: "Destacado",
      readArticle: "Leer artículo",
      readingTimeSuffix: "min de lectura",
      noPosts: "No se encontraron artículos",
      noPostsDesc:
        "Prueba ajustando el término de búsqueda o la categoría seleccionada.",
      backToBlog: "Volver al Blog",
      publishedOn: "Publicado el",
      writtenBy: "Por",
      shareArticle: "Compartir artículo",
      moreArticles: "Más artículos recomendados",
      tocTitle: "En este artículo",
      tocMobileTitle: "Índice de contenidos",
      backToTop: "Volver arriba",
      filteringByTag: "Filtrando por etiqueta:",
      clearTagFilter: "Quitar filtro de etiqueta",
      guideHubBadge: "Guía",
      guideChapter: "Capítulo",
      guideChapterProgress: "Capítulo {current} de {total}",
      guideIndexTitle: "Capítulos e Índice de la Guía",
      guideIndexSubtitle:
        "Explora todas las secciones y paradas de esta guía detallada.",
      guidePrevChapter: "Capítulo anterior",
      guideNextChapter: "Siguiente capítulo",
      guideBackToHub: "Volver al índice general",
      guideAllChapters: "Capítulos",
      guideQuickNav: "Capítulos",
      guideIndexShort: "Índice",
      inProgressBadge: "En progreso",
      inProgressNoticeTitle: "Guía en Desarrollo Activo",
      inProgressNoticeDesc:
        "Esta guía se encuentra en redacción continua. Iremos publicando nuevos capítulos, rutas y estrategias periódicamente.",
      guideNextChapterPending: "Próximo capítulo en preparación",
      guideNextChapterPendingDesc:
        "El siguiente capítulo se publicará próximamente. ¡Vuelve a consultar pronto!",
      guideChapterPlanned: "Próximamente",
      guideChapterPlannedDesc: "Capítulo en preparación",
      downloadsTitle: "Descargas y Recursos",
      downloadsSubtitle:
        "Archivos, guías y material descargable complementario para este artículo.",
      downloadAction: "Descargar",
      paginationPrev: "Anterior",
      paginationNext: "Siguiente",
      paginationPage: "Página",
      paginationOf: "de",
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

export const GAME_NAMES: Record<string, { es: string; en: string }> = {
  "red-blue": { es: "Rojo - Azul", en: "Red - Blue" },
  yellow: { es: "Amarillo", en: "Yellow" },
  "red-green-japan": { es: "Rojo - Verde (Japón)", en: "Red - Green (Japan)" },
  "blue-japan": { es: "Azul (Japón)", en: "Blue (Japan)" },
  "gold-silver": { es: "Oro - Plata", en: "Gold - Silver" },
  crystal: { es: "Cristal", en: "Crystal" },
  "ruby-sapphire": { es: "Rubí - Zafiro", en: "Ruby - Sapphire" },
  emerald: { es: "Esmeralda", en: "Emerald" },
  "firered-leafgreen": {
    es: "Rojo Fuego - Verde Hoja",
    en: "FireRed - LeafGreen",
  },
  colosseum: { es: "Colosseum", en: "Colosseum" },
  xd: { es: "XD: Tempestad Oscura", en: "XD: Gale of Darkness" },
  "diamond-pearl": { es: "Diamante - Perla", en: "Diamond - Pearl" },
  platinum: { es: "Platino", en: "Platinum" },
  "heartgold-soulsilver": {
    es: "HeartGold - SoulSilver",
    en: "HeartGold - SoulSilver",
  },
  "black-white": { es: "Negro - Blanco", en: "Black - White" },
  "black-2-white-2": { es: "Negro 2 - Blanco 2", en: "Black 2 - White 2" },
  "x-y": { es: "X - Y", en: "X - Y" },
  "omega-ruby-alpha-sapphire": {
    es: "Rubí Omega - Zafiro Alfa",
    en: "Omega Ruby - Alpha Sapphire",
  },
  "sun-moon": { es: "Sol - Luna", en: "Sun - Moon" },
  "ultra-sun-ultra-moon": {
    es: "Ultra Sol - Ultra Luna",
    en: "Ultra Sun - Ultra Moon",
  },
  "lets-go-pikachu-lets-go-eevee": {
    es: "Let's Go, Pikachu! - Let's Go, Eevee!",
    en: "Let's Go, Pikachu! - Let's Go, Eevee!",
  },
  "sword-shield": { es: "Espada - Escudo", en: "Sword - Shield" },
  "the-isle-of-armor": {
    es: "La Isla de la Armadura",
    en: "The Isle of Armor",
  },
  "the-crown-tundra": { es: "Las Nieves de la Corona", en: "The Crown Tundra" },
  "brilliant-diamond-shining-pearl": {
    es: "Diamante Brillante - Perla Reluciente",
    en: "Brilliant Diamond - Shining Pearl",
  },
  "legends-arceus": { es: "Leyendas: Arceus", en: "Legends: Arceus" },
  "scarlet-violet": { es: "Escarlata - Púrpura", en: "Scarlet - Violet" },
  "the-teal-mask": { es: "La Máscara Turquesa", en: "The Teal Mask" },
  "the-indigo-disk": { es: "El Disco Índigo", en: "The Indigo Disk" },
  "legends-za": { es: "Leyendas: Z-A", en: "Legends: Z-A" },
  "mega-dimension": { es: "Mega Dimensión", en: "Mega Dimension" },
  champions: { es: "Champions", en: "Champions" },
};

export const GAME_NAMES_BY_DISPLAY: Record<string, string> = {
  "Red - Blue": "red-blue",
  Yellow: "yellow",
  "Red Japan - Green Japan": "red-green-japan",
  "Blue Japan": "blue-japan",
  "Gold - Silver": "gold-silver",
  Crystal: "crystal",
  "Ruby - Sapphire": "ruby-sapphire",
  Emerald: "emerald",
  "Firered - Leafgreen": "firered-leafgreen",
  Colosseum: "colosseum",
  Xd: "xd",
  "Diamond - Pearl": "diamond-pearl",
  Platinum: "platinum",
  "Heartgold - Soulsilver": "heartgold-soulsilver",
  "Black - White": "black-white",
  "Black 2 - White 2": "black-2-white-2",
  "X - Y": "x-y",
  "Omega Ruby - Alpha Sapphire": "omega-ruby-alpha-sapphire",
  "Sun - Moon": "sun-moon",
  "Ultra Sun - Ultra Moon": "ultra-sun-ultra-moon",
  "Lets Go Pikachu - Lets Go Eevee": "lets-go-pikachu-lets-go-eevee",
  "Sword - Shield": "sword-shield",
  "The Isle Of Armor Sword - The Isle Of Armor Shield": "the-isle-of-armor",
  "The Crown Tundra Sword - The Crown Tundra Shield": "the-crown-tundra",
  "Brilliant Diamond - Shining Pearl": "brilliant-diamond-shining-pearl",
  "Legends Arceus": "legends-arceus",
  "Scarlet - Violet": "scarlet-violet",
  "The Teal Mask Scarlet - The Teal Mask Violet": "the-teal-mask",
  "The Indigo Disk Scarlet - The Indigo Disk Violet": "the-indigo-disk",
  "Legends Za": "legends-za",
  "Mega Dimension": "mega-dimension",
  Champions: "champions",
};

export function getGameTitle(
  gameKey: string,
  locale: Locale = "es",
  fallback?: string,
): string {
  const match =
    GAME_NAMES[gameKey] ??
    (GAME_NAMES_BY_DISPLAY[gameKey]
      ? GAME_NAMES[GAME_NAMES_BY_DISPLAY[gameKey]]
      : undefined);
  if (match) {
    return locale === "es" ? match.es : match.en;
  }
  return fallback ?? gameKey;
}

export function getRegionName(region: string, locale: Locale = "es"): string {
  if (!region) return "";
  const lower = region.toLowerCase();
  if (locale === "es" && lower === "unova") return "Teselia";
  return region.charAt(0).toUpperCase() + region.slice(1);
}

export function getMoveName(
  moveKey: string,
  locale: Locale = "es",
  meta?: { nameEs?: string; nameEn?: string },
): string {
  if (meta) {
    if (locale === "es" && meta.nameEs) return meta.nameEs;
    if (locale === "en" && meta.nameEn) return meta.nameEn;
  }
  return moveKey.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export function getNatureName(
  natureKey: string | null | undefined,
  locale: Locale = "es",
): string {
  if (!natureKey) return "";
  const key = natureKey.toLowerCase();
  const match = NATURE_NAMES[key];
  if (match) {
    return locale === "es" ? match.es : match.en;
  }
  return natureKey.charAt(0).toUpperCase() + natureKey.slice(1);
}

