// Main instant-play controller for 7 Days Cat-Sitting 3D (Roblox Remake)
// Floating-pill wordless UI, 3D raycast interaction, smartphone rules, litter scoop game, & 6 Roblox endings

import { ROOMS, NIGHTS, ENDINGS, CHORE_META, HOTBAR_ACTIONS } from "./data.js";
import {
  createInitialState,
  loadState,
  saveState,
  getNightDef,
  selectNight,
  getNightProgressRatio,
  getNextPendingChore,
  performChore,
  scoopOnePoop,
  triggerEnding,
  attemptSleep,
  reviveFromEnding,
  completeCurrentNightChores,
  getChoreRoom,
} from "./state.js";
import { CatSittingAudio } from "./audio.js";
import { CatSittingWorld } from "./world.js";

const canvas = document.getElementById("game-canvas");
const vfxOverlay = document.getElementById("vfx-overlay");
const btnPrev = document.getElementById("btn-prev");
const btnNext = document.getElementById("btn-next");
const btnProgress = document.getElementById("btn-progress");
const btnGallery = document.getElementById("btn-gallery");
const btnGalleryClose = document.getElementById("btn-gallery-close");
const btnSound = document.getElementById("btn-sound");
const iconSoundOn = document.getElementById("icon-sound-on");
const iconSoundOff = document.getElementById("icon-sound-off");
const btnReset = document.getElementById("btn-reset");
const resetModal = document.getElementById("reset-modal");
const btnResetNo = document.getElementById("btn-reset-no");
const btnResetYes = document.getElementById("btn-reset-yes");
const nightDot = document.getElementById("night-dot");
const nightCounter = document.getElementById("night-counter");
const progressFill = document.getElementById("progress-fill");
const toolPill = document.getElementById("tool-pill");

const phoneOverlay = document.getElementById("phone-overlay");
const phoneFeed = document.getElementById("phone-feed");
const btnPhoneClose = document.getElementById("btn-phone-close");
const btnPhoneSnap = document.getElementById("btn-phone-snap");

const cameraFrame = document.getElementById("camera-frame");
const btnShutter = document.getElementById("btn-shutter");

const litterOverlay = document.getElementById("litter-overlay");
const litterCount = document.getElementById("litter-count");
const litterTray = document.getElementById("litter-tray");
const btnLitterClose = document.getElementById("btn-litter-close");

const galleryOverlay = document.getElementById("gallery-overlay");
const galleryGrid = document.getElementById("gallery-grid");
const tabNights = document.getElementById("tab-nights");
const tabRooms = document.getElementById("tab-rooms");
const tabEndings = document.getElementById("tab-endings");

const endingOverlay = document.getElementById("ending-overlay");
const endingTag = document.getElementById("ending-tag");
const endingEmoji = document.getElementById("ending-emoji");
const endingTitle = document.getElementById("ending-title");
const endingSub = document.getElementById("ending-sub");
const btnEndingRestart = document.getElementById("btn-ending-restart");
const btnEndingRevive = document.getElementById("btn-ending-revive");

let state = loadState();
const audio = new CatSittingAudio();
audio.setEnabled(state.soundEnabled);
const world = new CatSittingWorld(canvas);
let galleryTab = "nights";
let ready = true;

const keys = new Set();
const drag = { active: false, moved: false, startX: 0, startY: 0, lastX: 0, lastY: 0 };

function flashVfx(cls, durationMs = 650) {
  vfxOverlay.className = `vfx-overlay ${cls}`;
  if (durationMs > 0) {
    setTimeout(() => {
      if (!state.activeEnding) vfxOverlay.className = "vfx-overlay";
    }, durationMs);
  }
}

function goRoom(roomId, instant = false) {
  state.currentRoom = roomId;
  world.focusRoom(roomId, instant);
}

function updateTopHUD() {
  const def = getNightDef(state.nightIndex);
  const ratio = getNightProgressRatio(state);
  btnPrev.disabled = state.nightIndex <= 0;
  btnNext.disabled = state.nightIndex >= NIGHTS.length - 1;
  nightCounter.textContent = `N${def.night}/7`;
  progressFill.style.width = `${Math.max(10, Math.round(ratio * 100))}%`;
  nightDot.className = `night-dot ${state.runtime.stalkerActive || state.runtime.fridgeOpen ? "danger" : ""}`;

  btnSound.setAttribute("aria-pressed", String(state.soundEnabled));
  iconSoundOn.classList.toggle("hidden", !state.soundEnabled);
  iconSoundOff.classList.toggle("hidden", state.soundEnabled);
}

function renderHotbar() {
  const nextChore = getNextPendingChore(state);
  const allDone = !nextChore;
  const rt = state.runtime;
  toolPill.innerHTML = "";

  for (const act of HOTBAR_ACTIONS) {
    const btn = document.createElement("button");
    btn.type = "button";
    btn.className = "tool-btn";
    btn.setAttribute("aria-label", act.label);
    btn.title = act.label;
    btn.textContent = act.icon;
    btn.dataset.action = act.id;

    if (act.id === "phone" && state.phoneOpen) btn.classList.add("active");
    if (act.id === "photo" && state.cameraMode) btn.classList.add("active");
    if (act.id === "feed" && rt.catFed) btn.classList.add("done");
    if (act.id === "litter" && rt.choresDone.litter) btn.classList.add("done");
    if (act.id === "play" && rt.catPlayed) btn.classList.add("done");
    if (act.id === "photo" && rt.photoTaken) btn.classList.add("done");
    if (act.id === "security" && rt.doorLocked && rt.curtainsClosed) btn.classList.add("done");

    if (
      (act.id === "feed" && nextChore === "feed") ||
      (act.id === "litter" && nextChore === "litter") ||
      (act.id === "play" && nextChore === "play") ||
      (act.id === "photo" && nextChore === "photo") ||
      (act.id === "security" && ["curtains", "door", "lights", "tv", "fridge", "mailbox", "microwave"].includes(nextChore))
    ) {
      btn.classList.add("recommended");
    }
    if (act.id === "security" && (rt.stalkerActive || rt.fridgeOpen)) {
      btn.classList.add("danger-alert");
    }
    if (act.id === "sleep" && allDone) {
      btn.classList.add("sleep-ready");
    }

    btn.addEventListener("click", () => handleHotbarAction(act.id));
    toolPill.appendChild(btn);
  }
}

function renderPhone() {
  phoneOverlay.classList.toggle("hidden", !state.phoneOpen);
  if (!state.phoneOpen) return;
  const def = getNightDef(state.nightIndex);
  phoneFeed.innerHTML = "";

  for (const choreId of def.chores) {
    const meta = CHORE_META[choreId];
    const done = Boolean(state.runtime.choresDone[choreId]);
    const item = document.createElement("button");
    item.type = "button";
    item.className = `phone-msg ${done ? "done" : ""}`;
    item.innerHTML = `<span>${meta.icon} ${meta.label}</span><span>${done ? "✓" : "→"}</span>`;
    item.addEventListener("click", () => {
      audio.playClick();
      goRoom(meta.room);
      if (choreId === "litter") openLitterGame();
      else if (choreId === "photo") openCameraMode();
      else {
        performChore(state, choreId);
        audio.playMeow();
        syncAllUI();
      }
    });
    phoneFeed.appendChild(item);
  }

  // Chaos rule-break shortcut inside phone (lets players test "Ignore the Rules" Blackhole gag!)
  const foilBtn = document.createElement("button");
  foilBtn.type = "button";
  foilBtn.className = "phone-msg rule";
  foilBtn.innerHTML = `<span>🌌 Ignore Rule: Foil</span><span>⚠️</span>`;
  foilBtn.addEventListener("click", () => {
    goRoom("kitchen");
    showEnding(triggerEnding(state, "blackhole"));
  });
  phoneFeed.appendChild(foilBtn);
}

function openCameraMode() {
  state.cameraMode = true;
  state.phoneOpen = false;
  phoneOverlay.classList.add("hidden");
  cameraFrame.classList.remove("hidden");
  goRoom("kitchen");
  renderHotbar();
}

function closeCameraMode() {
  state.cameraMode = false;
  cameraFrame.classList.add("hidden");
  renderHotbar();
}

function openLitterGame() {
  state.litterOpen = true;
  goRoom("laundry");
  litterOverlay.classList.remove("hidden");
  renderLitterTray();
}

function renderLitterTray() {
  const rt = state.runtime;
  litterCount.textContent = `${rt.litterScooped}/${rt.litterTotal}`;
  litterTray.innerHTML = "";
  const coords = [
    [16, 18], [58, 22], [38, 48], [18, 66], [68, 62],
  ];
  for (let i = 0; i < rt.litterTotal; i++) {
    const pile = document.createElement("button");
    pile.type = "button";
    pile.className = "poop-pile";
    if (i < rt.litterScooped) pile.classList.add("scooped");
    pile.style.left = `${coords[i][0]}%`;
    pile.style.top = `${coords[i][1]}%`;
    pile.textContent = "💩";
    pile.setAttribute("aria-label", `Scoop pile ${i + 1}`);
    pile.addEventListener("click", () => {
      audio.playScoop();
      const res = scoopOnePoop(state);
      pile.classList.add("scooped");
      litterCount.textContent = `${res.scooped}/${rt.litterTotal}`;
      if (res.done) {
        audio.playNightClear();
        setTimeout(() => {
          state.litterOpen = false;
          litterOverlay.classList.add("hidden");
          syncAllUI();
        }, 260);
      } else {
        syncAllUI();
      }
    });
    litterTray.appendChild(pile);
  }
}

function showEnding(ending) {
  if (!ending) return;
  audio[ending.victory ? "playNightClear" : "playSpookySting"]();
  if (ending.vfx) flashVfx(ending.vfx, 0);
  endingTag.textContent = ending.victory ? "VICTORY" : "FAILED";
  endingTag.className = `ending-tag ${ending.victory ? "victory" : ""}`;
  endingEmoji.textContent = ending.emoji;
  endingTitle.textContent = ending.title;
  endingSub.textContent = ending.sub;
  endingOverlay.classList.remove("hidden");
  saveState(state);
  updateTopHUD();
}

function hideEnding() {
  endingOverlay.classList.add("hidden");
  vfxOverlay.className = "vfx-overlay";
}

function handleHotbarAction(actionId) {
  if (actionId === "phone") {
    audio.playPhonePing();
    state.phoneOpen = !state.phoneOpen;
    if (state.phoneOpen) closeCameraMode();
    renderPhone();
    renderHotbar();
    return;
  }
  if (actionId === "photo") {
    audio.playClick();
    if (state.cameraMode) closeCameraMode();
    else openCameraMode();
    return;
  }
  if (actionId === "feed") {
    goRoom("kitchen");
    performChore(state, "feed");
    audio.playMeow();
    syncAllUI();
    return;
  }
  if (actionId === "litter") {
    audio.playClick();
    openLitterGame();
    return;
  }
  if (actionId === "play") {
    goRoom("living");
    performChore(state, "play");
    audio.playMeow();
    syncAllUI();
    return;
  }
  if (actionId === "security") {
    // Smart security/house chore button: handles next pending hazard/chore cleanly!
    const next = getNextPendingChore(state);
    const target = ["fridge", "curtains", "door", "tv", "lights", "mailbox", "microwave"].includes(next)
      ? next
      : (state.runtime.fridgeOpen ? "fridge" : (!state.runtime.curtainsClosed ? "curtains" : "door"));
    goRoom(getChoreRoom(target));
    performChore(state, target);
    audio.playClick();
    syncAllUI();
    return;
  }
  if (actionId === "sleep") {
    goRoom("bedroom");
    const res = attemptSleep(state);
    if (res.status === "failed" || res.status === "victory") {
      showEnding(res.ending);
    } else {
      audio.playNightClear();
      goRoom("kitchen");
      syncAllUI();
    }
  }
}

function handleWorldInteract(interactId) {
  if (!interactId) return;
  if (interactId === "cat") {
    audio.playMeow();
    if (state.cameraMode) {
      snapPhoto();
    }
    return;
  }
  if (interactId === "litter") {
    openLitterGame();
    return;
  }
  if (interactId === "sleep") {
    handleHotbarAction("sleep");
    return;
  }
  performChore(state, interactId);
  audio.playClick();
  syncAllUI();
}

function snapPhoto() {
  audio.playCameraShutter();
  flashVfx("flash", 220);
  performChore(state, "photo");
  setTimeout(() => {
    closeCameraMode();
    syncAllUI();
  }, 240);
}

function renderGallery() {
  tabNights.classList.toggle("active", galleryTab === "nights");
  tabRooms.classList.toggle("active", galleryTab === "rooms");
  tabEndings.classList.toggle("active", galleryTab === "endings");
  galleryGrid.innerHTML = "";

  if (galleryTab === "nights") {
    for (const n of NIGHTS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile-card";
      if (n.night - 1 === state.nightIndex) btn.classList.add("current");
      if (state.completedNights[n.night]) btn.classList.add("done");
      btn.innerHTML = `<span class="tile-emoji">${n.icon}</span><span class="tile-label">Night ${n.night}</span>`;
      btn.addEventListener("click", () => {
        audio.playClick();
        selectNight(state, n.night - 1);
        goRoom("kitchen", true);
        galleryOverlay.classList.add("hidden");
        syncAllUI();
      });
      galleryGrid.appendChild(btn);
    }
  } else if (galleryTab === "rooms") {
    for (const r of ROOMS) {
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile-card";
      if (state.currentRoom === r.id) btn.classList.add("current");
      btn.innerHTML = `<span class="tile-emoji">${r.icon}</span><span class="tile-label">${r.label}</span>`;
      btn.addEventListener("click", () => {
        audio.playClick();
        goRoom(r.id);
        galleryOverlay.classList.add("hidden");
      });
      galleryGrid.appendChild(btn);
    }
  } else {
    for (const key of ["cold_as_ice", "blackhole", "evicted", "stinky", "ancy", "fired"]) {
      const e = ENDINGS[key];
      const btn = document.createElement("button");
      btn.type = "button";
      btn.className = "tile-card";
      if (state.discoveredEndings[e.id]) btn.classList.add("done");
      btn.innerHTML = `<span class="tile-emoji">${e.emoji}</span><span class="tile-label">${e.title}</span>`;
      btn.addEventListener("click", () => {
        galleryOverlay.classList.add("hidden");
        showEnding(triggerEnding(state, e.id));
      });
      galleryGrid.appendChild(btn);
    }
  }
}

function syncAllUI() {
  saveState(state);
  updateTopHUD();
  renderHotbar();
  renderPhone();
}

const moveJoystick = document.getElementById("move-joystick");
const joystickKnob = document.getElementById("joystick-knob");
const joy = { active: false, pointerId: null, x: 0, y: 0, maxR: 34 };

function updateJoystickFromEvent(e) {
  const rect = moveJoystick.getBoundingClientRect();
  const cx = rect.left + rect.width / 2;
  const cy = rect.top + rect.height / 2;
  let dx = e.clientX - cx;
  let dy = e.clientY - cy;
  const dist = Math.hypot(dx, dy);
  if (dist > joy.maxR) {
    dx = (dx / dist) * joy.maxR;
    dy = (dy / dist) * joy.maxR;
  }
  joy.x = dx / joy.maxR;
  joy.y = dy / joy.maxR;
  joystickKnob.style.transform = `translate(${dx.toFixed(1)}px, ${dy.toFixed(1)}px)`;
}

function resetJoystick() {
  joy.active = false;
  joy.pointerId = null;
  joy.x = 0;
  joy.y = 0;
  moveJoystick.classList.remove("active");
  joystickKnob.style.transform = "translate(0px, 0px)";
}

moveJoystick.addEventListener("pointerdown", (e) => {
  e.preventDefault();
  e.stopPropagation();
  moveJoystick.setPointerCapture?.(e.pointerId);
  joy.active = true;
  joy.pointerId = e.pointerId;
  moveJoystick.classList.add("active");
  updateJoystickFromEvent(e);
});
moveJoystick.addEventListener("pointermove", (e) => {
  if (!joy.active || e.pointerId !== joy.pointerId) return;
  e.preventDefault();
  updateJoystickFromEvent(e);
});
moveJoystick.addEventListener("pointerup", (e) => {
  if (e.pointerId === joy.pointerId) resetJoystick();
});
moveJoystick.addEventListener("pointercancel", (e) => {
  if (e.pointerId === joy.pointerId) resetJoystick();
});

// 3D multi-touch drag look + tap-to-interact / tap-to-walk on floor
canvas.addEventListener("pointerdown", (e) => {
  if (drag.active && drag.pointerId !== e.pointerId) return;
  e.preventDefault();
  canvas.setPointerCapture?.(e.pointerId);
  drag.active = true;
  drag.pointerId = e.pointerId;
  drag.moved = false;
  drag.startX = e.clientX;
  drag.startY = e.clientY;
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
});

canvas.addEventListener("pointermove", (e) => {
  if (!drag.active || e.pointerId !== drag.pointerId) return;
  e.preventDefault();
  const dx = e.clientX - drag.lastX;
  const dy = e.clientY - drag.lastY;
  if (Math.hypot(e.clientX - drag.startX, e.clientY - drag.startY) > 6) {
    drag.moved = true;
  }
  world.rotateLook(-dx * 0.0055, -dy * 0.0045);
  drag.lastX = e.clientX;
  drag.lastY = e.clientY;
});

canvas.addEventListener("pointerup", (e) => {
  if (drag.active && e.pointerId === drag.pointerId) {
    if (!drag.moved) {
      const rect = canvas.getBoundingClientRect();
      const ndcX = ((e.clientX - rect.left) / rect.width) * 2 - 1;
      const ndcY = -((e.clientY - rect.top) / rect.height) * 2 + 1;
      const hit = world.raycastInteract(ndcX, ndcY);
      if (hit) {
        handleWorldInteract(hit);
      } else {
        world.walkToFloorTap(ndcX, ndcY);
      }
    }
    drag.active = false;
    drag.pointerId = null;
  }
});
canvas.addEventListener("pointercancel", (e) => {
  if (e.pointerId === drag.pointerId) {
    drag.active = false;
    drag.pointerId = null;
  }
});

// Keyboard walking (WASD / Arrow keys) + shortcuts
window.addEventListener("keydown", (e) => {
  const k = e.key.toLowerCase();
  if (["arrowup", "arrowdown", "arrowleft", "arrowright", " "].includes(k)) {
    e.preventDefault();
  }
  keys.add(k);
  if (e.key === "Escape") {
    galleryOverlay.classList.add("hidden");
    resetModal.classList.add("hidden");
    litterOverlay.classList.add("hidden");
    state.litterOpen = false;
    state.phoneOpen = false;
    phoneOverlay.classList.add("hidden");
    closeCameraMode();
  }
});
window.addEventListener("keyup", (e) => keys.delete(e.key.toLowerCase()));
window.addEventListener("blur", () => { keys.clear(); resetJoystick(); });
window.addEventListener("resize", () => world.resize());
window.addEventListener("beforeunload", () => world.dispose());

// Top pill & modal listeners
btnPrev.addEventListener("click", () => {
  if (state.nightIndex > 0) {
    audio.playClick();
    selectNight(state, state.nightIndex - 1);
    goRoom("kitchen", true);
    syncAllUI();
  }
});
btnNext.addEventListener("click", () => {
  if (state.nightIndex < NIGHTS.length - 1) {
    audio.playClick();
    selectNight(state, state.nightIndex + 1);
    goRoom("kitchen", true);
    syncAllUI();
  }
});

const openGallery = () => {
  audio.playClick();
  renderGallery();
  galleryOverlay.classList.remove("hidden");
};
btnGallery.addEventListener("click", openGallery);
btnProgress.addEventListener("click", openGallery);
btnGalleryClose.addEventListener("click", () => galleryOverlay.classList.add("hidden"));
galleryOverlay.addEventListener("click", (e) => { if (e.target === galleryOverlay) galleryOverlay.classList.add("hidden"); });

tabNights.addEventListener("click", () => { galleryTab = "nights"; renderGallery(); });
tabRooms.addEventListener("click", () => { galleryTab = "rooms"; renderGallery(); });
tabEndings.addEventListener("click", () => { galleryTab = "endings"; renderGallery(); });

btnPhoneClose.addEventListener("click", () => { state.phoneOpen = false; renderPhone(); renderHotbar(); });
btnPhoneSnap.addEventListener("click", openCameraMode);
btnShutter.addEventListener("click", snapPhoto);
btnLitterClose.addEventListener("click", () => { state.litterOpen = false; litterOverlay.classList.add("hidden"); });

btnEndingRestart.addEventListener("click", () => {
  hideEnding();
  selectNight(state, state.nightIndex);
  goRoom("kitchen", true);
  syncAllUI();
});
btnEndingRevive.addEventListener("click", () => {
  hideEnding();
  reviveFromEnding(state);
  goRoom("kitchen", true);
  syncAllUI();
});

btnSound.addEventListener("click", () => {
  state.soundEnabled = !state.soundEnabled;
  audio.setEnabled(state.soundEnabled);
  if (state.soundEnabled) audio.playMeow();
  syncAllUI();
});

// Centered dimmed-backdrop confirmation modal for destructive reset (Cancel safe default)
const closeResetModal = () => resetModal.classList.add("hidden");
btnReset.addEventListener("click", () => {
  resetModal.classList.remove("hidden");
  btnResetNo.focus();
});
btnResetNo.addEventListener("click", closeResetModal);
resetModal.addEventListener("click", (e) => { if (e.target === resetModal) closeResetModal(); });
btnResetYes.addEventListener("click", () => {
  hideEnding();
  state = createInitialState();
  goRoom("kitchen", true);
  closeResetModal();
  audio.playClick();
  syncAllUI();
});

// Main frame-rate independent render loop (combines WASD/Arrows + virtual thumbstick + live room detection)
let lastFrameTime = 0;
function animate(time) {
  const dt = lastFrameTime ? Math.min(0.06, Math.max(0.008, (time - lastFrameTime) / 1000)) : 0.016;
  lastFrameTime = time;
  const spd = dt * 5.6;
  let fwd = 0;
  let strafe = 0;
  if (keys.has("w") || keys.has("arrowup")) fwd += 1;
  if (keys.has("s") || keys.has("arrowdown")) fwd -= 1;
  if (keys.has("a") || keys.has("arrowleft")) strafe -= 1;
  if (keys.has("d") || keys.has("arrowright")) strafe += 1;
  if (Math.abs(joy.x) > 0.08 || Math.abs(joy.y) > 0.08) {
    fwd += -joy.y;
    strafe += joy.x;
  }
  if (fwd !== 0 || strafe !== 0) {
    const mag = Math.hypot(fwd, strafe);
    const scale = mag > 1 ? 1 / mag : 1;
    world.moveLocal(fwd * scale * spd, strafe * scale * spd);
    state.currentRoom = world.detectRoomFromPos();
  }
  world.syncState(state, time);
  requestAnimationFrame(animate);
}

// Deterministic Playwright verification hooks
window.__GAME__ = {
  isReady: () => ready,
  getState: () => state,
  getCameraPose: () => world.getCameraPose(),
  goRoom: (id) => goRoom(id, true),
  selectNight: (idx) => {
    selectNight(state, idx);
    goRoom("kitchen", true);
    syncAllUI();
  },
  openPhone: (open = true) => {
    state.phoneOpen = open;
    renderPhone();
    renderHotbar();
  },
  openLitter: () => openLitterGame(),
  triggerEnding: (id) => showEnding(triggerEnding(state, id)),
  hideEnding: () => hideEnding(),
  completeNight: () => {
    completeCurrentNightChores(state);
    syncAllUI();
  },
  dispose: () => world.dispose(),
};

syncAllUI();
requestAnimationFrame(animate);
