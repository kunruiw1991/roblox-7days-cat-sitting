// Chronological 7-Night Cat-Sitting data, 6 House Rooms, and 6 Iconic Fail Endings
// Faithfully mapped from YouTube VSQXM4IS8VE ("WE IGNORED the CAT RULES IN 7 DAYS CAT-SITTING in roblox!")

export const ROOMS = [
  {
    id: "kitchen",
    icon: "🍳",
    label: "Kitchen",
    camPos: [0.4, 2.25, 3.6],
    lookAt: [-2.2, 1.15, -3.2],
  },
  {
    id: "laundry",
    icon: "🧺",
    label: "Laundry",
    camPos: [-6.4, 2.2, 1.9],
    lookAt: [-7.8, 1.0, -3.2],
  },
  {
    id: "living",
    icon: "🛋️",
    label: "Living",
    camPos: [6.4, 2.2, 2.4],
    lookAt: [7.6, 1.85, -4.9],
  },
  {
    id: "hallway",
    icon: "🚪",
    label: "Front Door",
    camPos: [0.0, 2.25, 2.2],
    lookAt: [0.0, 1.75, 7.2],
  },
  {
    id: "outside",
    icon: "📬",
    label: "Mailbox",
    camPos: [0.0, 2.25, 9.8],
    lookAt: [1.8, 1.5, 14.5],
  },
  {
    id: "bedroom",
    icon: "🛏️",
    label: "Bedroom",
    camPos: [-5.6, 2.25, 5.0],
    lookAt: [-7.8, 1.2, 8.2],
  },
];

// All 6 iconic fail endings seen across sb0_01..sb0_04 + 7-Night Victory
export const ENDINGS = {
  cold_as_ice: {
    id: "cold_as_ice",
    title: "Cold as Ice",
    emoji: "🧊",
    vfx: "ice",
    sub: "Rule Broken: Left the fridge open!",
    timestamp: "04:15",
  },
  blackhole: {
    id: "blackhole",
    title: "Blackhole",
    emoji: "🌌",
    vfx: "blackhole",
    sub: "Rule Broken: Microwaved foil & spawned a void!",
    timestamp: "05:45",
  },
  evicted: {
    id: "evicted",
    title: "Evicted",
    emoji: "🚪",
    vfx: "",
    sub: "Rule Broken: Forgot to lock the front door!",
    timestamp: "10:25",
  },
  stinky: {
    id: "stinky",
    title: "Uh oh Stinky",
    emoji: "🤢",
    vfx: "stinky",
    sub: "Rule Broken: Ignored the overflowing litter box!",
    timestamp: "12:05",
  },
  ancy: {
    id: "ancy",
    title: "Ancy",
    emoji: "👁️",
    vfx: "",
    sub: "Rule Broken: Left curtains open for the Shadow Visitor!",
    timestamp: "16:10",
  },
  fired: {
    id: "fired",
    title: "Fired",
    emoji: "😿",
    vfx: "",
    sub: "Rule Broken: Let the Top-Hat Cat go hungry!",
    timestamp: "19:50",
  },
  victory: {
    id: "victory",
    title: "7 Nights Survived!",
    emoji: "🏆",
    vfx: "",
    sub: "Master Cat-Sitter Badge Unlocked!",
    victory: true,
    timestamp: "20:55",
  },
};

export const CHORE_META = {
  feed:      { id: "feed",      icon: "🥫", room: "kitchen", label: "Feed Cat" },
  litter:    { id: "litter",    icon: "🧹", room: "laundry", label: "Scoop Litter" },
  play:      { id: "play",      icon: "🧶", room: "living",  label: "Play String Toy" },
  photo:     { id: "photo",     icon: "📷", room: "kitchen", label: "Snap Cat Photo" },
  mailbox:   { id: "mailbox",   icon: "📬", room: "outside", label: "Check Mailbox" },
  microwave: { id: "microwave", icon: "🍲", room: "kitchen", label: "Warm Dinner" },
  fridge:    { id: "fridge",    icon: "🧊", room: "kitchen", label: "Close Fridge" },
  tv:        { id: "tv",        icon: "📺", room: "living",  label: "Turn Off TV" },
  curtains:  { id: "curtains",  icon: "🪟", room: "living",  label: "Close Curtains" },
  door:      { id: "door",      icon: "🔒", room: "hallway", label: "Lock Door" },
  lights:    { id: "lights",    icon: "💡", room: "hallway", label: "Lights Off" },
};

export const NIGHTS = [
  {
    night: 1,
    icon: "🐱",
    chores: ["feed", "litter", "play", "photo", "mailbox"],
    hazards: { stalkerWindow: false, fridgeOpen: false, tvStatic: false, lightsHazard: false },
  },
  {
    night: 2,
    icon: "🧊",
    chores: ["feed", "fridge", "microwave", "litter", "door"],
    hazards: { stalkerWindow: false, fridgeOpen: true, tvStatic: false, lightsHazard: false },
  },
  {
    night: 3,
    icon: "📺",
    chores: ["feed", "tv", "curtains", "door", "photo"],
    hazards: { stalkerWindow: true, fridgeOpen: false, tvStatic: true, lightsHazard: false },
  },
  {
    night: 4,
    icon: "🤢",
    chores: ["litter", "microwave", "play", "door"],
    hazards: { stalkerWindow: false, fridgeOpen: false, tvStatic: false, lightsHazard: false },
  },
  {
    night: 5,
    icon: "👁️",
    chores: ["feed", "curtains", "lights", "door", "litter"],
    hazards: { stalkerWindow: true, fridgeOpen: false, tvStatic: true, lightsHazard: true },
  },
  {
    night: 6,
    icon: "📬",
    chores: ["mailbox", "fridge", "curtains", "litter", "photo", "door"],
    hazards: { stalkerWindow: true, fridgeOpen: true, tvStatic: false, lightsHazard: false },
  },
  {
    night: 7,
    icon: "👑",
    chores: ["feed", "fridge", "litter", "play", "tv", "curtains", "door", "photo"],
    hazards: { stalkerWindow: true, fridgeOpen: true, tvStatic: true, lightsHazard: true },
  },
];

// Compact bottom hotbar icons (wordless floating pill)
export const HOTBAR_ACTIONS = [
  { id: "phone",    icon: "📱", label: "Phone Rules" },
  { id: "photo",    icon: "📷", label: "Cat Camera" },
  { id: "feed",     icon: "🥫", label: "Feed Cat" },
  { id: "litter",   icon: "🧹", label: "Litter Box" },
  { id: "play",     icon: "🧶", label: "Cat Toy" },
  { id: "security", icon: "🔒", label: "Lock & Curtains" },
  { id: "sleep",    icon: "🛏️", label: "Sleep / End Night" },
];
