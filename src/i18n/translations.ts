export type Language = 'en' | 'id'

export interface TranslationDictionary {
  // Navigation & Branding
  brandSubtitle: string
  roomLabel: string
  copyLink: string
  copied: string
  relayConnected: string
  relayConnecting: string
  returnToLobby: string
  newRoom: string

  // Lobby Onboarding & Pairing
  lobbyTagline: string
  scanTitle: string
  scanSubtitle: string
  p1SlotTitle: string
  p2SlotTitle: string
  waitingPilot: string
  waitingCopilot: string
  readyToFly: string
  pilotJoined: string
  copilotJoined: string
  shakeTestTitle: string
  shakeTestSubtitle: string
  steerLabel: string
  thrustLabel: string
  autoStartReady: string
  autoStartInstruction: string
  launchingCountdown: string

  // Controller Cockpit
  controllerWelcome: string
  connectingToHost: string
  connectedToHost: string
  gyroRequestTitle: string
  gyroRequestDesc: string
  enableMotionBtn: string
  gyroActive: string
  touchFallbackActive: string
  thrustSliderLabel: string
  tiltPhoneToSteer: string
  touchSliderToSteer: string
  reelTetherBtn: string
  reelTetherDesc: string
  syncDashBtn: string
  syncDashDesc: string
  hapticCollisionAlert: string

  // Arena HUD
  arenaActive: string
  tetherTension: string
  coupleSynergy: string
  coreDistance: string
  laserGate: string
  laserActive: string
  laserDeactivated: string
  overstretchWarning: string
  testHapticBtn: string

  // Game Over & Victory Card
  missionVictoryTitle: string
  missionDefeatTitle: string
  coupleScoreTitle: string
  flightPathTracking: string
  durationStat: string
  tetherFlowStat: string
  collisionStat: string
  instantRematchBtn: string
  returnToLobbyBtn: string

  // Relationship status titles & quotes
  harmonicDuoTitle: string
  harmonicDuoQuote: string
  tetherLoversTitle: string
  tetherLoversQuote: string
  tugOfWarTitle: string
  tugOfWarQuote: string
  chaosCoupleTitle: string
  chaosCoupleQuote: string
}

export const translations: Record<Language, TranslationDictionary> = {
  en: {
    // Navigation & Branding
    brandSubtitle: 'Co-Op Space Odyssey',
    roomLabel: 'ROOM',
    copyLink: 'Copy Link',
    copied: 'Copied!',
    relayConnected: 'ONLINE',
    relayConnecting: 'CONNECTING...',
    returnToLobby: 'Back to Lobby',
    newRoom: 'New Room',

    // Lobby Onboarding & Pairing
    lobbyTagline: 'Two phones. One rope. Zero gravity.',
    scanTitle: 'Scan to Hop In & Play Together!',
    scanSubtitle: 'Grab your phones and scan the code below. No downloads or apps needed — opens straight in your browser!',
    p1SlotTitle: 'ALPHA POD (PILOT 1)',
    p2SlotTitle: 'BETA POD (PILOT 2)',
    waitingPilot: 'Waiting for Player 1...',
    waitingCopilot: 'Waiting for Player 2...',
    readyToFly: 'Ready to Fly! ✨',
    pilotJoined: 'Player 1 Joined',
    copilotJoined: 'Player 2 Joined',
    shakeTestTitle: 'Pre-Flight Joy Check',
    shakeTestSubtitle: 'Tilt your phone and slide the gas bar to see live movement on the screen!',
    steerLabel: 'STEER',
    thrustLabel: 'THRUST',
    autoStartReady: 'Ready for Launch!',
    autoStartInstruction: 'Both players hold the REEL button together for 2 seconds to start!',
    launchingCountdown: 'Blasting off in',

    // Controller Cockpit
    controllerWelcome: 'AstroTether Mobile Cockpit',
    connectingToHost: 'Connecting to big screen...',
    connectedToHost: 'Connected! You are ready to pilot.',
    gyroRequestTitle: 'Motion Sensors Needed',
    gyroRequestDesc: 'Enable motion access so you can steer by tilting your phone naturally.',
    enableMotionBtn: 'Allow Motion Steering',
    gyroActive: 'Tilt your phone to steer!',
    touchFallbackActive: 'Slide thumb left/right to steer',
    thrustSliderLabel: 'PULL UP TO GAS',
    tiltPhoneToSteer: 'Tilt phone left & right to steer',
    touchSliderToSteer: 'Swipe left & right to turn',
    reelTetherBtn: 'REEL TETHER',
    reelTetherDesc: 'Hold to pull towards each other',
    syncDashBtn: 'SYNC BOOST',
    syncDashDesc: 'Dash forward together',
    hapticCollisionAlert: 'BUMP! Hit an asteroid!',

    // Arena HUD
    arenaActive: 'ORBITAL SECTOR ACTIVE',
    tetherTension: 'TETHER',
    coupleSynergy: 'COUPLE SYNERGY',
    coreDistance: 'CORE DISTANCE',
    laserGate: 'LASER GATE',
    laserActive: 'ACTIVE',
    laserDeactivated: 'OPEN',
    overstretchWarning: '⚠️ Careful! Rope is stretching too far — reel in or fly closer!',
    testHapticBtn: 'TEST VIBRATION',

    // Game Over & Victory Card
    missionVictoryTitle: 'MISSION ACCOMPLISHED!',
    missionDefeatTitle: 'TETHER SEVERED!',
    coupleScoreTitle: 'Couple Synergy Quotient',
    flightPathTracking: 'FLIGHT PATH REPLAY',
    durationStat: 'Flight Time',
    tetherFlowStat: 'Rhythm Sync',
    collisionStat: 'Bonks & Bumps',
    instantRematchBtn: 'INSTANT REMATCH',
    returnToLobbyBtn: 'Back to Lobby',

    // Relationship status titles & quotes
    harmonicDuoTitle: 'Harmonic Duo',
    harmonicDuoQuote: 'Pure telepathic connection! You two fly like you share the same cosmic brain.',
    tetherLoversTitle: 'Tether Lovers',
    tetherLoversQuote: 'Sweet rhythm and smooth coordination. The universe is definitely rooting for you two!',
    tugOfWarTitle: 'Tug-of-War Pair',
    tugOfWarQuote: 'A little chaotic and a few bumps along the way, but love pulled you both across the finish line.',
    chaosCoupleTitle: 'Chaos Couple',
    chaosCoupleQuote: 'Wild drifting and full throttle chaos! Who even needs steering when you have each other?'
  },

  id: {
    // Navigation & Branding
    brandSubtitle: 'Petualangan Luar Angkasa Berdua',
    roomLabel: 'KODE ROOM',
    copyLink: 'Salin Tautan',
    copied: 'Tersalin!',
    relayConnected: 'TERHUBUNG',
    relayConnecting: 'MENGHUBUNGKAN...',
    returnToLobby: 'Kembali ke Lobi',
    newRoom: 'Ganti Room',

    // Lobby Onboarding & Pairing
    lobbyTagline: 'Dua ponsel. Satu tali. Melayang bareng di luar angkasa.',
    scanTitle: 'Scan Barcode Buat Main Bareng!',
    scanSubtitle: 'Ambil ponsel kalian berdua, scan QR di bawah ini. Tanpa download aplikasi apa pun, langsung jalan di browser!',
    p1SlotTitle: 'ALPHA POD (PILOT 1)',
    p2SlotTitle: 'BETA POD (PILOT 2)',
    waitingPilot: 'Menunggu Pemain 1 bergabung...',
    waitingCopilot: 'Menunggu Pemain 2 bergabung...',
    readyToFly: 'Sudah Siap Meluncur! ✨',
    pilotJoined: 'Pemain 1 Terhubung',
    copilotJoined: 'Pemain 2 Terhubung',
    shakeTestTitle: 'Tes Cek Ombak (Coba Goyangkan HP-mu!)',
    shakeTestSubtitle: 'Miringkan ponsel dan geser tombol gas untuk memastikan kemudi kalian responsif di layar utama!',
    steerLabel: 'KEMUDI',
    thrustLabel: 'GAS',
    autoStartReady: 'Siap Meluncur!',
    autoStartInstruction: 'Tahan tombol REEL barengan selama 2 detik buat mulai meluncur!',
    launchingCountdown: 'Meluncur dalam',

    // Controller Cockpit
    controllerWelcome: 'Kokpit Ponsel AstroTether',
    connectingToHost: 'Menghubungkan ke layar laptop...',
    connectedToHost: 'Terhubung! Siap kendalikan pesawatmu.',
    gyroRequestTitle: 'Aktifkan Sensor Gerak',
    gyroRequestDesc: 'Izinkan sensor gerak supaya kamu bisa membelokkan kapal cukup dengan memiringkan HP.',
    enableMotionBtn: 'Izinkan Kemudi Gerak',
    gyroActive: 'Miringkan ponselmu buat belok!',
    touchFallbackActive: 'Geser jari ke kiri/kanan buat belok',
    thrustSliderLabel: 'DORONG KE ATAS BUAT GAS',
    tiltPhoneToSteer: 'Miringkan HP ke kiri & kanan buat belok',
    touchSliderToSteer: 'Geser slider buat belok',
    reelTetherBtn: 'TARIK TALI (REEL)',
    reelTetherDesc: 'Tahan buat saling mendekat',
    syncDashBtn: 'BOOST BARENG',
    syncDashDesc: 'Melesat maju serentak',
    hapticCollisionAlert: 'DOR! Pesawatmu nabrak asteroid!',

    // Arena HUD
    arenaActive: 'SEKTOR MISI AKTIF',
    tetherTension: 'TALI',
    coupleSynergy: 'SINERGI PASANGAN',
    coreDistance: 'JARAK INTI',
    laserGate: 'PINTU LASER',
    laserActive: 'TERKUNCI',
    laserDeactivated: 'TERBUKA',
    overstretchWarning: '⚠️ Awas! Talinya ketarik kencang banget — cepat tarik tali atau mendekat!',
    testHapticBtn: 'TES GETAR HP',

    // Game Over & Victory Card
    missionVictoryTitle: 'MISI BERHASIL! 🚀',
    missionDefeatTitle: 'TALI TERPUTUS! 💥',
    coupleScoreTitle: 'Skor Kecocokan Pasangan',
    flightPathTracking: 'REKAP JALUR TERBANG',
    durationStat: 'Waktu Misi',
    tetherFlowStat: 'Irama Kompak',
    collisionStat: 'Total Nabrak',
    instantRematchBtn: 'TANDING ULANG LANGSUNG',
    returnToLobbyBtn: 'Kembali ke Lobi',

    // Relationship status titles & quotes
    harmonicDuoTitle: 'Pasangan Seirama (Harmonic Duo)',
    harmonicDuoQuote: 'Kompak parah! Manuver kalian mulus banget kayak punya kontak batin di luar angkasa.',
    tetherLoversTitle: 'Kompak Romantis (Tether Lovers)',
    tetherLoversQuote: 'Iramanya pas dan saling melengkapi. Luar angkasa aja iri lihat kalian berdua!',
    tugOfWarTitle: 'Tarik Ulur Asik (Tug-of-War Pair)',
    tugOfWarQuote: 'Sempat saling tarik-tarikan dan sedikit heboh, tapi pada akhirnya kalian kompak sampai garis finish.',
    chaosCoupleTitle: 'Pasangan Bar-Bar (Chaos Couple)',
    chaosCoupleQuote: 'Suka-suka nyetir dan penuh tabrakan seru! Gak apa-apa oleng dikit yang penting ketawa bareng.'
  }
}
