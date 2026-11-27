// Deterministic Node-testable state machine for 7 Days Cat-Sitting 3D
import { NIGHTS, ENDINGS, CHORE_META } from "./data.js";

export const STORAGE_KEY = "roblox_7days_cat_sitting_v1";

export function createNightRuntime(nightIndex) {
  const def = NIGHTS[Math.max(0, Math.min(NIGHTS.length - 1, nightIndex))];
  return {
    choresDone: {},
    litterScooped: 0,
    litterTotal: 5,
    fridgeOpen: Boolean(def.hazards.fridgeOpen),
    curtainsClosed: false,
    doorLocked: false,
    tvOn: Boolean(def.hazards.tvStatic),
    lightsOn: true,
    stalkerActive: Boolean(def.hazards.stalkerWindow),
    catFed: false,
    catPlayed: false,
    photoTaken: false,
    mailboxChecked: false,
    microwaveHeated: false,
  };
}

export function createInitialState() {
  return {
    nightIndex: 0,
    currentRoom: "kitchen",
    soundEnabled: true,
    completedNights: {},
    discoveredEndings: {},
    activeEnding: null,
    phoneOpen: false,
    cameraMode: false,
    litterOpen: false,
    runtime: createNightRuntime(0),
  };
}

export function getNightDef(index) {
  const clamped = Math.max(0, Math.min(NIGHTS.length - 1, Number(index) || 0));
  return NIGHTS[clamped];
}

export function selectNight(state, index) {
  const def = getNightDef(index);
  state.nightIndex = def.night - 1;
  state.runtime = createNightRuntime(state.nightIndex);
  state.activeEnding = null;
  state.cameraMode = false;
  state.litterOpen = false;
  state.currentRoom = "kitchen";
  return def;
}

export function getNightProgressRatio(state) {
  const def = getNightDef(state.nightIndex);
  if (!def.chores.length) return 1;
  let done = 0;
  for (const c of def.chores) {
    if (state.runtime.choresDone[c]) done += 1;
  }
  return done / def.chores.length;
}

export function getNextPendingChore(state) {
  const def = getNightDef(state.nightIndex);
  for (const c of def.chores) {
    if (!state.runtime.choresDone[c]) return c;
  }
  return null;
}

export function performChore(state, choreId) {
  const rt = state.runtime;
  let changed = false;

  switch (choreId) {
    case "feed":
      if (!rt.catFed) {
        rt.catFed = true;
        rt.choresDone.feed = true;
        changed = true;
      }
      break;
    case "litter":
      if (rt.litterScooped < rt.litterTotal) {
        rt.litterScooped = rt.litterTotal;
        rt.choresDone.litter = true;
        changed = true;
      }
      break;
    case "play":
      if (!rt.catPlayed) {
        rt.catPlayed = true;
        rt.choresDone.play = true;
        changed = true;
      }
      break;
    case "photo":
      if (!rt.photoTaken) {
        rt.photoTaken = true;
        rt.choresDone.photo = true;
        changed = true;
      }
      break;
    case "mailbox":
      if (!rt.mailboxChecked) {
        rt.mailboxChecked = true;
        rt.choresDone.mailbox = true;
        changed = true;
      }
      break;
    case "microwave":
      if (!rt.microwaveHeated) {
        rt.microwaveHeated = true;
        rt.choresDone.microwave = true;
        changed = true;
      }
      break;
    case "fridge":
      rt.fridgeOpen = !rt.fridgeOpen;
      rt.choresDone.fridge = !rt.fridgeOpen;
      changed = true;
      break;
    case "tv":
      rt.tvOn = !rt.tvOn;
      rt.choresDone.tv = !rt.tvOn;
      changed = true;
      break;
    case "curtains":
      rt.curtainsClosed = !rt.curtainsClosed;
      rt.choresDone.curtains = rt.curtainsClosed;
      if (rt.curtainsClosed && rt.doorLocked) rt.stalkerActive = false;
      changed = true;
      break;
    case "door":
      rt.doorLocked = !rt.doorLocked;
      rt.choresDone.door = rt.doorLocked;
      if (rt.curtainsClosed && rt.doorLocked) rt.stalkerActive = false;
      changed = true;
      break;
    case "lights":
      rt.lightsOn = !rt.lightsOn;
      rt.choresDone.lights = !rt.lightsOn;
      changed = true;
      break;
    default:
      break;
  }
  return { changed, allDone: getNightProgressRatio(state) >= 1 };
}

export function scoopOnePoop(state) {
  const rt = state.runtime;
  if (rt.litterScooped >= rt.litterTotal) {
    return { scooped: rt.litterScooped, done: true };
  }
  rt.litterScooped += 1;
  const done = rt.litterScooped >= rt.litterTotal;
  if (done) rt.choresDone.litter = true;
  return { scooped: rt.litterScooped, done };
}

export function triggerEnding(state, endingId) {
  const ending = ENDINGS[endingId];
  if (!ending) return null;
  state.activeEnding = ending.id;
  state.discoveredEndings[ending.id] = true;
  state.phoneOpen = false;
  state.cameraMode = false;
  state.litterOpen = false;
  return ending;
}

// Sleep / End Night checks all Cat Rules! Ignoring rules triggers the authentic Roblox fail ending!
export function attemptSleep(state) {
  const def = getNightDef(state.nightIndex);
  const rt = state.runtime;

  if (rt.fridgeOpen) {
    return { status: "failed", ending: triggerEnding(state, "cold_as_ice") };
  }
  if (def.chores.includes("litter") && !rt.choresDone.litter) {
    return { status: "failed", ending: triggerEnding(state, "stinky") };
  }
  if (def.chores.includes("curtains") && !rt.curtainsClosed) {
    return { status: "failed", ending: triggerEnding(state, "ancy") };
  }
  if (def.chores.includes("door") && !rt.doorLocked) {
    return { status: "failed", ending: triggerEnding(state, "evicted") };
  }
  if (def.chores.includes("feed") && !rt.catFed) {
    return { status: "failed", ending: triggerEnding(state, "fired") };
  }

  // Night survived!
  state.completedNights[def.night] = true;
  if (state.nightIndex >= NIGHTS.length - 1) {
    return { status: "victory", ending: triggerEnding(state, "victory") };
  }
  const nextDef = selectNight(state, state.nightIndex + 1);
  return { status: "next_night", nextNight: nextDef.night };
}

export function reviveFromEnding(state) {
  const wasVictory = state.activeEnding === "victory";
  state.activeEnding = null;
  if (wasVictory) {
    selectNight(state, 0);
  }
  return state.nightIndex;
}

export function completeCurrentNightChores(state) {
  const def = getNightDef(state.nightIndex);
  const rt = state.runtime;
  for (const c of def.chores) {
    rt.choresDone[c] = true;
  }
  rt.litterScooped = rt.litterTotal;
  rt.fridgeOpen = false;
  rt.curtainsClosed = true;
  rt.doorLocked = true;
  rt.tvOn = false;
  rt.lightsOn = !def.chores.includes("lights");
  rt.stalkerActive = false;
  rt.catFed = true;
  rt.catPlayed = true;
  rt.photoTaken = true;
  rt.mailboxChecked = true;
  rt.microwaveHeated = true;
}

export function getChoreRoom(choreId) {
  return CHORE_META[choreId]?.room || "kitchen";
}

export function countCompletedNights(state) {
  return NIGHTS.reduce((acc, n) => acc + (state.completedNights[n.night] ? 1 : 0), 0);
}

export function saveState(state, storage = typeof localStorage !== "undefined" ? localStorage : null) {
  if (!storage) return false;
  try {
    storage.setItem(STORAGE_KEY, JSON.stringify({
      nightIndex: state.nightIndex,
      soundEnabled: state.soundEnabled,
      completedNights: state.completedNights,
      discoveredEndings: state.discoveredEndings,
    }));
    return true;
  } catch {
    return false;
  }
}

export function loadState(storage = typeof localStorage !== "undefined" ? localStorage : null) {
  const fresh = createInitialState();
  if (!storage) return fresh;
  try {
    const raw = storage.getItem(STORAGE_KEY);
    if (!raw) return fresh;
    const parsed = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return fresh;
    const idx = Math.max(0, Math.min(NIGHTS.length - 1, Number(parsed.nightIndex) || 0));
    fresh.nightIndex = idx;
    fresh.soundEnabled = parsed.soundEnabled !== false;
    fresh.completedNights = { ...(parsed.completedNights || {}) };
    fresh.discoveredEndings = { ...(parsed.discoveredEndings || {}) };
    fresh.runtime = createNightRuntime(idx);
    return fresh;
  } catch {
    return fresh;
  }
}
