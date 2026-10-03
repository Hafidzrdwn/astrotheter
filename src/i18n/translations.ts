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

  // Solo Dev & LAN IP Settings
  hostAddressLabel: string
  hostAddressHint: string
  simulateP2Btn: string
  simulatedP2Ready: string
  quickSandboxBtn: string
  soloDevActive: string
  p2AutoAssist: string

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

  // Mission Tracker & Objectives
  missionTrackerTitle: string
  howToWinBtn: string
  howToWinTitle: string
  howToWinSubtitle: string
  howToWinStep1Title: string
  howToWinStep1Desc: string
  howToWinStep2Title: string
  howToWinStep2Desc: string
  howToWinStep3Title: string
  howToWinStep3Desc: string
  howToWinClose: string

  task1Title: string
  task1StatusCaptured: string
  task1StatusSearching: string
  task2Title: string
  task2StatusOpen: string
  task2StatusLocked: string
  task3Title: string
  task3StatusDelivered: string
  task3StatusDistance: string

  // Tactical Radar / Mini-map
  radarTitle: string
  radarLegendCore: string
  radarLegendWarp: string
  radarLegendP1: string
  radarLegendP2: string

  // Dynamic In-Game Banners
  bannerCoreTrapped: string
  bannerLaserOpen: string
  bannerNearWarp: string
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

    // Solo Dev & LAN IP Settings
    hostAddressLabel: 'Phone Access IP / Hostname',
    hostAddressHint: 'Change this if your phone cannot reach localhost (e.g. your Wi-Fi IP: 192.168.100.4:5173)',
    simulateP2Btn: 'Simulate Co-Pilot (Solo Test)',
    simulatedP2Ready: 'Simulated Co-Pilot (Ready)',
    quickSandboxBtn: 'Quick Desktop Sandbox (Keyboard Only)',
    soloDevActive: 'Solo Test Active (P2 Assisted)',
    p2AutoAssist: 'Co-Pilot Auto-Assist Active',

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
    chaosCoupleQuote: 'Wild drifting and full throttle chaos! Who even needs steering when you have each other?',

    // Mission Tracker & Objectives
    missionTrackerTitle: 'MISSION OBJECTIVES',
    howToWinBtn: 'HOW TO WIN?',
    howToWinTitle: 'MISSION BRIEFING: HOW TO WIN',
    howToWinSubtitle: 'Master the tether rope and complete all 3 orbital tasks with your co-pilot!',
    howToWinStep1Title: '1. Trap Starlight Core',
    howToWinStep1Desc: 'Fly on either side of the glowing golden Star Core. Your neon tether rope will physically wrap and push it!',
    howToWinStep2Title: '2. Disable Laser Barrier',
    howToWinStep2Desc: 'Hit both round pads (Pad 1 & Pad 2) simultaneously (within 1.2s) to open the red laser wall!',
    howToWinStep3Title: '3. Escort into Warp Gate',
    howToWinStep3Desc: 'Shepherd the Star Core safely into the swirling purple Warp Gate portal to achieve victory!',
    howToWinClose: 'GOT IT, LET’S FLY!',

    task1Title: 'Secure Starlight Core',
    task1StatusCaptured: 'Core Caught in Tether! Escort forward',
    task1StatusSearching: 'Trap the golden star between your ships',
    task2Title: 'Deactivate Laser Gate',
    task2StatusOpen: 'Laser barrier open! Safe to pass',
    task2StatusLocked: 'Hit both pads together to disable barrier',
    task3Title: 'Deliver to Warp Gate',
    task3StatusDelivered: 'Core warping away! Mission complete!',
    task3StatusDistance: 'm to Warp Gate',

    // Tactical Radar / Mini-map
    radarTitle: 'TACTICAL RADAR',
    radarLegendCore: 'Core',
    radarLegendWarp: 'Warp Gate',
    radarLegendP1: 'Alpha (P1)',
    radarLegendP2: 'Beta (P2)',

    // Dynamic In-Game Banners
    bannerCoreTrapped: '✨ CORE SECURED! Escort it towards the Warp Gate!',
    bannerLaserOpen: '⚡ LASER BARRIER DISABLED! Path is clear!',
    bannerNearWarp: '🌀 WARP GATE IN SIGHT! Push the Core into the portal!'
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

    // Solo Dev & LAN IP Settings
    hostAddressLabel: 'Alamat IP Akses HP (Jaringan Wi-Fi)',
    hostAddressHint: 'Ubah ke IP Wi-Fi laptop jika HP tidak bisa buka localhost (misal: 192.168.100.4:5173)',
    simulateP2Btn: 'Simulasikan Co-Pilot (Tes Solo)',
    simulatedP2Ready: 'Co-Pilot Simulasi (Siap)',
    quickSandboxBtn: 'Tes Cepat di Laptop (Hanya Keyboard)',
    soloDevActive: 'Mode Uji Solo Aktif (P2 Otomatis)',
    p2AutoAssist: 'Bantuan Co-Pilot Otomatis Aktif',

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
    tugOfWarTitle: 'Tug-of-War Pair',
    tugOfWarQuote: 'Sempat saling tarik-tarikan dan sedikit heboh, tapi pada akhirnya kalian kompak sampai garis finish.',
    chaosCoupleTitle: 'Pasangan Bar-Bar (Chaos Couple)',
    chaosCoupleQuote: 'Suka-suka nyetir dan penuh tabrakan seru! Gak apa-apa oleng dikit yang penting ketawa bareng.',

    // Mission Tracker & Objectives
    missionTrackerTitle: 'TARGET & TUGAS MISI',
    howToWinBtn: 'CARA MENANG?',
    howToWinTitle: 'PANDUAN MISI: CARA MENANG',
    howToWinSubtitle: 'Kuasai tali tether dan selesaikan 3 langkah misi ini bersama pasanganmu!',
    howToWinStep1Title: '1. Kurung Inti Bintang (Star Core)',
    howToWinStep1Desc: 'Terbangkan pesawat kalian di sisi kiri dan kanan bintang emas. Tali energi kalian akan mengurung dan mendorongnya!',
    howToWinStep2Title: '2. Matikan Pintu Laser Merah',
    howToWinStep2Desc: 'Tabrak kedua tombol bulat (PAD 1 & PAD 2) secara bersamaan (toleransi 1.2 detik) untuk membuka jalan!',
    howToWinStep3Title: '3. Masukkan ke Portal Pusaran Ungu',
    howToWinStep3Desc: 'Giring Inti Bintang masuk ke dalam pusaran Warp Gate ungu untuk menyelesaikan misi dan menang!',
    howToWinClose: 'SIAP, PAHAM! MELUNCUR 🚀',

    task1Title: 'Amankan Inti Bintang',
    task1StatusCaptured: 'Inti Berhasil Terjepit Tali! Bawa maju',
    task1StatusSearching: 'Kepung bintang emas agar terjerat tali',
    task2Title: 'Buka Gerbang Laser',
    task2StatusOpen: 'Laser terbuka! Jalur aman dilewati',
    task2StatusLocked: 'Tabrak 2 tombol sakelar bersamaan',
    task3Title: 'Kawal ke Portal Warp Gate',
    task3StatusDelivered: 'Inti berhasil masuk portal! Menang!',
    task3StatusDistance: 'm lagi ke Portal',

    // Tactical Radar / Mini-map
    radarTitle: 'RADAR TAKTIS',
    radarLegendCore: 'Inti Bintang',
    radarLegendWarp: 'Portal Warp',
    radarLegendP1: 'Alpha (P1)',
    radarLegendP2: 'Beta (P2)',

    // Dynamic In-Game Banners
    bannerCoreTrapped: '✨ INTI TERTANGKAP! Kawal menuju Portal Warp Gate!',
    bannerLaserOpen: '⚡ PINTU LASER TERBUKA! Lanjutkan dorong inti ke portal!',
    bannerNearWarp: '🌀 PORTAL SUDAH DEKAT! Dorong inti masuk ke pusaran!'
  }
}
