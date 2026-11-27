import test from "node:test";
import assert from "node:assert/strict";
import { NIGHTS, ENDINGS, ROOMS } from "../js/data.js";
import {
  STORAGE_KEY,
  createInitialState,
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
  countCompletedNights,
  saveState,
  loadState,
} from "../js/state.js";

test("initial state defines all 7 nights and 6 rooms cleanly", () => {
  assert.equal(NIGHTS.length, 7);
  assert.equal(ROOMS.length, 6);
  const s = createInitialState();
  assert.equal(s.nightIndex, 0);
  assert.equal(getNightDef(-1).night, 1);
  assert.equal(getNightDef(99).night, 7);
  assert.equal(getNightProgressRatio(s), 0);
  assert.equal(getNextPendingChore(s), "feed");
  assert.equal(getChoreRoom("litter"), "laundry");
  assert.equal(getChoreRoom("unknown"), "kitchen");
});

test("Night 1 chores, 5-scoop litter box mini-game, and sleeping advances cleanly to Night 2", () => {
  const s = createInitialState();

  assert.equal(performChore(s, "feed").changed, true);
  assert.equal(performChore(s, "feed").changed, false);

  for (let i = 1; i <= 5; i++) {
    const r = scoopOnePoop(s);
    assert.equal(r.scooped, i);
    assert.equal(r.done, i === 5);
  }
  assert.equal(scoopOnePoop(s).done, true);
  assert.equal(s.runtime.choresDone.litter, true);

  performChore(s, "play");
  performChore(s, "photo");
  const last = performChore(s, "mailbox");
  assert.equal(last.allDone, true);
  assert.equal(getNextPendingChore(s), null);

  const sleep = attemptSleep(s);
  assert.equal(sleep.status, "next_night");
  assert.equal(sleep.nextNight, 2);
  assert.equal(countCompletedNights(s), 1);
});

test("Ignoring Cat Rules triggers all 6 authentic Roblox fail endings + Revive restores cleanly", () => {
  // 1. Cold as Ice (fridge left open on Night 2)
  const s = createInitialState();
  selectNight(s, 1);
  assert.equal(s.runtime.fridgeOpen, true);
  const rIce = attemptSleep(s);
  assert.equal(rIce.status, "failed");
  assert.equal(rIce.ending.id, "cold_as_ice");
  assert.equal(s.discoveredEndings.cold_as_ice, true);
  reviveFromEnding(s);
  assert.equal(s.activeEnding, null);

  // 2. Uh oh Stinky (fridge closed, litter unscooped on Night 2)
  performChore(s, "fridge");
  assert.equal(s.runtime.fridgeOpen, false);
  const rStink = attemptSleep(s);
  assert.equal(rStink.ending.id, "stinky");
  reviveFromEnding(s);

  // 3. Evicted (door unlocked on Night 2 after litter done)
  performChore(s, "litter");
  const rEvict = attemptSleep(s);
  assert.equal(rEvict.ending.id, "evicted");
  reviveFromEnding(s);

  // 4. Fired (door locked, cat hungry on Night 2)
  performChore(s, "door");
  const rFired = attemptSleep(s);
  assert.equal(rFired.ending.id, "fired");
  reviveFromEnding(s);

  // 5. Ancy (curtains left open on Night 3 with Shadow Stalker)
  selectNight(s, 2);
  assert.equal(s.runtime.stalkerActive, true);
  const rAncy = attemptSleep(s);
  assert.equal(rAncy.ending.id, "ancy");
  reviveFromEnding(s);

  // Closing curtains + locking door banishes stalker
  performChore(s, "curtains");
  performChore(s, "door");
  assert.equal(s.runtime.stalkerActive, false);
  performChore(s, "tv");
  assert.equal(s.runtime.tvOn, false);
  performChore(s, "lights");
  assert.equal(s.runtime.lightsOn, false);
  performChore(s, "microwave");
  assert.equal(s.runtime.microwaveHeated, true);

  // 6. Blackhole chaos ending
  const bh = triggerEnding(s, "blackhole");
  assert.equal(bh.title, ENDINGS.blackhole.title);
  assert.equal(triggerEnding(s, "missing_id"), null);
});

test("Completing Night 7 unlocks Victory & localStorage round-trip handles persistence safely", () => {
  const s = createInitialState();
  selectNight(s, 6);
  completeCurrentNightChores(s);
  const res = attemptSleep(s);
  assert.equal(res.status, "victory");
  assert.equal(res.ending.id, "victory");
  assert.equal(s.completedNights[7], true);

  reviveFromEnding(s);
  assert.equal(s.nightIndex, 0);

  const map = new Map();
  const mock = {
    getItem: (k) => (map.has(k) ? map.get(k) : null),
    setItem: (k, v) => map.set(k, String(v)),
  };
  assert.equal(saveState(s, mock), true);
  const loaded = loadState(mock);
  assert.equal(loaded.completedNights[7], true);

  mock.setItem(STORAGE_KEY, "{broken json");
  assert.equal(loadState(mock).nightIndex, 0);
  assert.equal(saveState(s, null), false);
});
