export type ThemeId =
  | "tiny-toy-sprint"
  | "lofi-chill"
  | "hyperpop-kawaii"
  | "techno-industrial"
  | "jazz-night-lounge"
  | "rock-garage"
  | "dnb-neon-city"
  | "tropical-house-beach"
  | "japanese-festival"
  | "fantasy-wonderland"
  | "retro-8bit";

export type ThemeConfig = {
  id: ThemeId;
  name: string;
  genre: string;
  bpmRange?: string;
  colors: {
    background: string;
    surface: string;
    primary: string;
    secondary: string;
    accent: string;
    leftLane: string;
    centerLane: string;
    rightLane: string;
    text: string;
    track: string;
    trackAlt: string;
    line: string;
    obstacle: string;
    obstacleAccent: string;
    shadow: string;
  };
  world: {
    description: string;
    backgroundElements: string[];
    obstacleTypes: string[];
    itemTypes: string[];
    seStyle: string;
    particleStyle: string;
    feverStyle: string;
  };
};

const fixedLaneColors = {
  leftLane: "#FF6B6B",
  centerLane: "#FFD166",
  rightLane: "#4D96FF"
};

export const THEMES: Record<ThemeId, ThemeConfig> = {
  "tiny-toy-sprint": {
    id: "tiny-toy-sprint",
    name: "Tiny Toy Sprint",
    genre: "Toy Race",
    bpmRange: "100-120",
    colors: {
      background: "#FFF3D8",
      surface: "#F4DDB3",
      primary: "#FF6B6B",
      secondary: "#6BCB77",
      accent: "#FF9F1C",
      ...fixedLaneColors,
      text: "#3A2A1A",
      track: "#7FD7FF",
      trackAlt: "#C9F1FF",
      line: "#FFFFFF",
      obstacle: "#FF6FC7",
      obstacleAccent: "#FFF3D8",
      shadow: "#3A2A1A"
    },
    world: {
      description: "A miniature toy race track on a sunny kid's desk.",
      backgroundElements: ["desk", "toy_blocks", "mini_cars", "paper_flags", "soft_shadows"],
      obstacleTypes: ["toy_block", "mini_car", "traffic_cone", "cardboard_box", "robot_toy"],
      itemTypes: ["star", "music_note", "drum", "bell", "toy_keyboard"],
      seStyle: "bright toy percussion and plastic pops",
      particleStyle: "paper confetti and small star stickers",
      feverStyle: "toy parade colors with racing stripes"
    }
  },
  "lofi-chill": {
    id: "lofi-chill",
    name: "Desk Lo-fi",
    genre: "Lo-fi / Chill",
    bpmRange: "70-90",
    colors: {
      background: "#F7E7C6",
      surface: "#D9B98F",
      primary: "#E89A5E",
      secondary: "#9DBB8D",
      accent: "#C7765A",
      ...fixedLaneColors,
      text: "#3B2F26",
      track: "#CFAF82",
      trackAlt: "#E8D4AD",
      line: "#FFF8E8",
      obstacle: "#B7825F",
      obstacleAccent: "#FFF4D7",
      shadow: "#3B2F26"
    },
    world: {
      description: "A calm sunset desk world made of paper, wood and stationery.",
      backgroundElements: ["paper", "wood_blocks", "pencils", "soft_sunset"],
      obstacleTypes: ["eraser", "pencil", "book", "building_block"],
      itemTypes: ["paper_star", "music_note", "pencil_chip"],
      seStyle: "soft mallets, paper taps and warm pops",
      particleStyle: "paper dust and tiny leaf flecks",
      feverStyle: "warm sunset bloom"
    }
  },
  "hyperpop-kawaii": {
    id: "hyperpop-kawaii",
    name: "Candy Pop Rush",
    genre: "Hyperpop / Kawaii",
    bpmRange: "140-180",
    colors: {
      background: "#FFE3F5",
      surface: "#E8D8FF",
      primary: "#FF6FC7",
      secondary: "#7EF6D4",
      accent: "#FFE66D",
      ...fixedLaneColors,
      text: "#3A2352",
      track: "#C9F1FF",
      trackAlt: "#FFF0A8",
      line: "#FFFFFF",
      obstacle: "#FF8AD8",
      obstacleAccent: "#7EF6D4",
      shadow: "#3A2352"
    },
    world: {
      description: "A pastel candy table with sweet chaos and bouncy toy props.",
      backgroundElements: ["candy", "donuts", "jelly", "pastel_stars"],
      obstacleTypes: ["candy", "donut", "star_block", "jelly"],
      itemTypes: ["sparkle", "candy_note", "sugar_star"],
      seStyle: "sparkles, cute synth blips and pop sounds",
      particleStyle: "pastel stars and sugar confetti",
      feverStyle: "kawaii sticker burst"
    }
  },
  "techno-industrial": {
    id: "techno-industrial",
    name: "Toy Factory",
    genre: "Techno / Industrial",
    bpmRange: "125-150",
    colors: {
      background: "#D9D9D2",
      surface: "#9C9A90",
      primary: "#F6C945",
      secondary: "#2C2D2F",
      accent: "#FF7A1A",
      ...fixedLaneColors,
      text: "#1E1F22",
      track: "#B8BCC2",
      trackAlt: "#E2E3DF",
      line: "#FFF4B8",
      obstacle: "#FF7A1A",
      obstacleAccent: "#2C2D2F",
      shadow: "#1E1F22"
    },
    world: {
      description: "A rhythmic toy factory with gears, tools and conveyor parts.",
      backgroundElements: ["gears", "toy_cranes", "conveyors", "warning_stripes"],
      obstacleTypes: ["gear", "toolbox", "robot_arm", "container"],
      itemTypes: ["bolt_star", "metal_note", "factory_bell"],
      seStyle: "metal clicks, machine ticks and low pops",
      particleStyle: "tiny bolts and sparks",
      feverStyle: "warning light chase"
    }
  },
  "jazz-night-lounge": {
    id: "jazz-night-lounge",
    name: "Tiny Night Lounge",
    genre: "Jazz / Night Lounge",
    bpmRange: "90-120",
    colors: {
      background: "#101B33",
      surface: "#4B3326",
      primary: "#D6A84F",
      secondary: "#293B63",
      accent: "#B87545",
      ...fixedLaneColors,
      text: "#F8E7B9",
      track: "#26395F",
      trackAlt: "#38527E",
      line: "#EBCB77",
      obstacle: "#B87545",
      obstacleAccent: "#F8E7B9",
      shadow: "#080D17"
    },
    world: {
      description: "A rainy miniature night street beside a tiny jazz lounge.",
      backgroundElements: ["street_lamps", "bar_signs", "rain_puddles", "windows"],
      obstacleTypes: ["chair", "street_lamp", "signboard", "gramophone"],
      itemTypes: ["gold_note", "bell", "record"],
      seStyle: "upright bass plucks, brushes and light bells",
      particleStyle: "gold motes and rain glints",
      feverStyle: "warm lounge spotlight"
    }
  },
  "rock-garage": {
    id: "rock-garage",
    name: "Garage Toy Jam",
    genre: "Rock / Garage",
    bpmRange: "130-160",
    colors: {
      background: "#F6E4C8",
      surface: "#6A5B4A",
      primary: "#D72638",
      secondary: "#1F1F1F",
      accent: "#FF8C2A",
      ...fixedLaneColors,
      text: "#241B16",
      track: "#B64F3B",
      trackAlt: "#F2BE83",
      line: "#FFF1D0",
      obstacle: "#1F1F1F",
      obstacleAccent: "#FF8C2A",
      shadow: "#241B16"
    },
    world: {
      description: "A rough toy garage with amps, cables and tiny road cones.",
      backgroundElements: ["amps", "tool_racks", "cables", "garage_floor"],
      obstacleTypes: ["amp", "guitar_case", "cone", "toolbox"],
      itemTypes: ["pick", "snare_note", "badge"],
      seStyle: "guitar cuts, snare snaps and crash hits",
      particleStyle: "pick shards and dust",
      feverStyle: "garage stage flash"
    }
  },
  "dnb-neon-city": {
    id: "dnb-neon-city",
    name: "Mini Neon Sprint",
    genre: "Drum & Bass / Neon City",
    bpmRange: "160-180",
    colors: {
      background: "#111323",
      surface: "#20243D",
      primary: "#7A5CFF",
      secondary: "#22D3EE",
      accent: "#FF4FD8",
      ...fixedLaneColors,
      text: "#EFF6FF",
      track: "#24345A",
      trackAlt: "#31446D",
      line: "#7DD3FC",
      obstacle: "#FF4FD8",
      obstacleAccent: "#22D3EE",
      shadow: "#05070F"
    },
    world: {
      description: "A fast miniature night city with clean neon accents.",
      backgroundElements: ["signs", "tiny_cars", "city_blocks", "light_panels"],
      obstacleTypes: ["light_block", "car", "sign", "display_board"],
      itemTypes: ["laser_note", "speed_star", "data_chip"],
      seStyle: "fast electronic blips, lasers and noise ticks",
      particleStyle: "thin light streaks",
      feverStyle: "speedline neon chase"
    }
  },
  "tropical-house-beach": {
    id: "tropical-house-beach",
    name: "Toy Beach Cruise",
    genre: "Tropical House / Beach",
    bpmRange: "110-130",
    colors: {
      background: "#D9F7FF",
      surface: "#F2D99A",
      primary: "#2EC4B6",
      secondary: "#C7F464",
      accent: "#FF7F6E",
      ...fixedLaneColors,
      text: "#264653",
      track: "#78DCE8",
      trackAlt: "#F7E6A3",
      line: "#FFFFFF",
      obstacle: "#FF7F6E",
      obstacleAccent: "#FFF2A6",
      shadow: "#264653"
    },
    world: {
      description: "A bright miniature beach with surfboards and tiny resort props.",
      backgroundElements: ["sand", "surfboards", "palm_toys", "waves"],
      obstacleTypes: ["shell", "beach_ball", "palm_tree", "float_ring"],
      itemTypes: ["shell_note", "sun_star", "steelpan"],
      seStyle: "steelpan notes, wave taps and light percussion",
      particleStyle: "sand sparkles and water drops",
      feverStyle: "sunny beach parade"
    }
  },
  "japanese-festival": {
    id: "japanese-festival",
    name: "Tiny Matsuri",
    genre: "Japanese Festival",
    bpmRange: "120-150",
    colors: {
      background: "#171B35",
      surface: "#7A2E2E",
      primary: "#E63946",
      secondary: "#1D3557",
      accent: "#F6C85F",
      ...fixedLaneColors,
      text: "#FFF0C2",
      track: "#2B3A67",
      trackAlt: "#C4473D",
      line: "#F6C85F",
      obstacle: "#E63946",
      obstacleAccent: "#FFF0C2",
      shadow: "#090B18"
    },
    world: {
      description: "A summer festival diorama with lanterns, stalls and fireworks.",
      backgroundElements: ["lanterns", "stalls", "fireworks", "paper_fans"],
      obstacleTypes: ["lantern", "stall_box", "daruma", "taiko"],
      itemTypes: ["festival_note", "fan_star", "gold_bell"],
      seStyle: "taiko, flute and festive shout-like FX",
      particleStyle: "paper confetti and sparks",
      feverStyle: "firework toy burst"
    }
  },
  "fantasy-wonderland": {
    id: "fantasy-wonderland",
    name: "Toy Wonderland",
    genre: "Fantasy / Wonderland",
    bpmRange: "100-130",
    colors: {
      background: "#F1E3FF",
      surface: "#BFEBD8",
      primary: "#9B5DE5",
      secondary: "#00D2A8",
      accent: "#FF70A6",
      ...fixedLaneColors,
      text: "#39245A",
      track: "#C8B6FF",
      trackAlt: "#BDE0FE",
      line: "#FFFFFF",
      obstacle: "#9B5DE5",
      obstacleAccent: "#FFDF6E",
      shadow: "#39245A"
    },
    world: {
      description: "A dreamy toy fairytale world with mushrooms, castles and magic props.",
      backgroundElements: ["mushrooms", "clouds", "toy_castle", "crystals"],
      obstacleTypes: ["mushroom", "magic_book", "crystal", "cloud"],
      itemTypes: ["magic_note", "harp_star", "potion"],
      seStyle: "magic chimes, harp notes and sparkles",
      particleStyle: "magic dust and tiny stars",
      feverStyle: "storybook shimmer"
    }
  },
  "retro-8bit": {
    id: "retro-8bit",
    name: "Blocky Toy Arcade",
    genre: "Retro / 8bit",
    bpmRange: "120-140",
    colors: {
      background: "#DFF7FF",
      surface: "#C9E87A",
      primary: "#2F80ED",
      secondary: "#27AE60",
      accent: "#F2C94C",
      ...fixedLaneColors,
      text: "#1B2440",
      track: "#79B8FF",
      trackAlt: "#F5D547",
      line: "#FFFFFF",
      obstacle: "#EB5757",
      obstacleAccent: "#F2C94C",
      shadow: "#1B2440"
    },
    world: {
      description: "A blocky retro-game toy board with pixel props and bright colors.",
      backgroundElements: ["pixel_blocks", "rainbow_tiles", "toy_arcade", "coins"],
      obstacleTypes: ["block", "coin_box", "pixel_enemy", "question_box"],
      itemTypes: ["coin", "8bit_note", "pixel_star"],
      seStyle: "8bit jumps, coin pings and square blips",
      particleStyle: "square pixels and coin pops",
      feverStyle: "rainbow pixel rush"
    }
  }
};

export const DEFAULT_THEME = THEMES["tiny-toy-sprint"];
