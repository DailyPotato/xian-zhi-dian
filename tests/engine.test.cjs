const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../data.js');
const E = require('../engine.js');

const fresh = (seed = 42, overrides = {}) => Object.assign(E.create({ name: '试炼修士', root: D.roots[0].id, path: D.paths[0].id, talents: [], seed }), { breakthroughs: overrides.realm || 0 }, overrides);
const unchangedOnError = (s, operation) => { const before = JSON.stringify(s); assert.throws(operation); assert.equal(JSON.stringify(s), before); };
const plan = (s, ids) => E.setPlan(s, ids);
const byId = (catalog, id) => { const value = catalog.find(entry => entry.id === id); assert.ok(value, id); return value; };
const setPending = (s, event) => { s.phase = 'event'; s.pendingEvent = event.id; return s; };
const resolve = s => {
  const event = byId(D.events, s.pendingEvent);
  const available = event.choices.map((choice, index) => ({ choice, index })).filter(({ choice }) => !E.choiceError(s, choice));
  assert.ok(available.length, `${event.id} has no available choice`);
  const safe = available.find(({ choice }) => !choice.check && !choice.startStory && !Object.values(choice.effects || {}).some(n => n < 0));
  return E.choose(s, (safe || available.find(({ choice }) => !choice.check) || available[0]).index);
};
const neutralYearEnd = s => {
  const event = { id: 'test-neutral', title: '山中无事', choices: [{ text: '继续修行', result: '安然度过这一年。', effects: {} }] };
  D.events.push(event);
  try { setPending(s, event); return E.choose(s, 0); } finally { D.events.pop(); }
};
const startStory = (s, def) => {
  const invite = D.events.find(event => event.choices.some(choice => choice.startStory === def.id));
  assert.ok(invite, `${def.id} invitation`);
  setPending(s, invite);
  E.choose(s, invite.choices.findIndex(choice => choice.startStory === def.id));
  return byId(D.events, def.followupEvent);
};

test('the starting character and talent draw are deterministic and independent', () => {
  const a = fresh(123), b = fresh(123);
  assert.deepEqual(a, b); assert.equal(a.year, 1); assert.equal(a.age, 16); assert.equal(a.realm, 0); assert.equal(a.phase, 'planning');
  assert.equal(a.version, 2);
  assert.ok(D.talents.length >= 24); assert.equal(E.drawTalents(9).length, 8); assert.equal(new Set(E.drawTalents(9)).size, 8);
  assert.deepEqual(E.drawTalents(9), E.drawTalents(9)); assert.notDeepEqual(E.drawTalents(9), E.drawTalents(19));
  a.inventory.herb = 1; assert.equal(b.inventory.herb, undefined);
  const copy = E.clone(a); copy.inventory.herb = 2; assert.equal(a.inventory.herb, 1);
});

test('plans reserve three annual actions and invalid edits never mutate the save', () => {
  const s = fresh(); unchangedOnError(s, () => E.addPlan(s, 'missing'));
  plan(s, ['meditate', 'work', 'rest']); assert.equal(s.plan.length, 3);
  unchangedOnError(s, () => E.addPlan(s, 'rest')); unchangedOnError(s, () => E.setPlan(s, ['rest', 'missing']));
  unchangedOnError(s, () => E.setPlan(s, ['rest', 'rest', 'rest', 'rest']));
  unchangedOnError(s, () => E.removePlan(s, -1)); unchangedOnError(s, () => E.removePlan(s, 3));
  E.removePlan(s, 1); assert.deepEqual(s.plan, ['meditate', 'rest']);
  unchangedOnError(s, () => E.advance(s)); E.addPlan(s, 'rest'); E.advance(s);
  assert.equal(s.phase, 'event'); assert.ok(s.pendingEvent); assert.deepEqual(s.plan, []);
  unchangedOnError(s, () => E.addPlan(s, 'rest')); unchangedOnError(s, () => E.advance(s));
  unchangedOnError(s, () => E.setPlan(s, []));
});

test('annual settlement reports actual growth and events advance the calendar once', () => {
  const s = fresh(), initial = E.clone(s), expected = E.actionPreview(s, 'meditate');
  plan(s, ['meditate', 'work', 'rest']); const result = E.advance(s);
  assert.equal(s.cultivation - initial.cultivation, expected.cultivation || 0); assert.ok(s.stones > initial.stones);
  assert.equal(result.effects.cultivation, s.cultivation - initial.cultivation); assert.equal(s.lastYear.year, 1);
  assert.equal(s.year, 1); const event = resolve(s); assert.equal(s.year, 2); assert.equal(s.age, 17); assert.equal(s.phase, 'planning');
  assert.deepEqual(s.lastEvent, event); unchangedOnError(s, () => E.choose(s, 0));
  assert.ok(s.log.length >= 1); assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s);
});

test('purchases consume spirit stones, enforce capacities and cannot mutate outside planning', () => {
  const s = fresh(42, { stones: 10000 }), item = byId(D.items, 'sword'), initial = s.stones;
  const bought = E.buyItem(s, item.id); assert.equal(s.stones, initial - item.price); assert.equal(s.inventory.sword, 1);
  assert.equal(bought.effects.stones, -item.price); assert.ok(bought.changes.length);
  unchangedOnError(s, () => E.buyItem(s, 'sword')); unchangedOnError(s, () => E.useItem(s, 'sword'));
  unchangedOnError(s, () => E.buyItem(s, 'missing')); unchangedOnError(s, () => E.useItem(s, 'qi-pill'));
  s.stones = 0; unchangedOnError(s, () => E.buyItem(s, 'qi-pill'));
  s.stones = 10000; const pill = byId(D.items, 'qi-pill'); s.inventory[pill.id] = pill.max;
  unchangedOnError(s, () => E.buyItem(s, pill.id));
  for (const phase of ['event', 'ending']) { s.phase = phase; unchangedOnError(s, () => E.buyItem(s, 'herb')); unchangedOnError(s, () => E.useItem(s, 'qi-pill')); }
});

test('materials are spent by crafting and sequential gathering can fund later work', () => {
  const s = fresh(42, { stones: 200 }); unchangedOnError(s, () => E.setPlan(s, ['alchemy', 'rest', 'rest']));
  plan(s, ['gather', 'alchemy', 'rest']); E.advance(s);
  assert.equal(s.inventory['qi-pill'], 1); assert.equal(s.inventory.herb || 0, 0);
  neutralYearEnd(s); const before = s.cultivation; const receipt = E.useItem(s, 'qi-pill');
  assert.equal(s.cultivation - before, byId(D.items, 'qi-pill').useEffects.cultivation); assert.equal(s.inventory['qi-pill'], undefined);
  assert.equal(receipt.effects.cultivation, s.cultivation - before);
  plan(s, ['mine', 'forge', 'rest']); E.advance(s); assert.equal(s.inventory.ward, 1); assert.equal(s.inventory.ore || 0, 0);
  neutralYearEnd(s); s.inventory.herb = 1; unchangedOnError(s, () => E.useItem(s, 'herb'));
});

test('planned money and materials cannot be spent twice', () => {
  const s = fresh(42, { stones: 30 }); s.inventory.herb = 2;
  plan(s, ['alchemy', 'rest', 'rest']); unchangedOnError(s, () => E.addPlan(s, 'alchemy'));
  const cheap = D.items.find(item => item.price > 0 && item.price <= 30);
  if (cheap) unchangedOnError(s, () => E.buyItem(s, cheap.id));
  unchangedOnError(s, () => E.setPlan(s, ['alchemy', 'alchemy', 'rest']));
  plan(s, ['work', 'alchemy', 'rest']); E.advance(s); assert.equal(s.inventory['qi-pill'], 1); assert.ok(s.stones >= 0);
});

test('using an item cannot steal a consumable reserved by an annual activity', () => {
  const action = { id: 'test-pill-reservation', name: '护持同伴', category: '游历', effects: {}, costItems: { 'qi-pill': 1 } };
  D.actions.push(action);
  try {
    const s = fresh(); s.inventory['qi-pill'] = 1; plan(s, [action.id, 'rest', 'rest']);
    assert.equal(E.itemStatus(s, 'qi-pill').canUse, false); unchangedOnError(s, () => E.useItem(s, 'qi-pill'));
    E.advance(s); assert.equal(s.inventory['qi-pill'], undefined);
  } finally { D.actions.pop(); }
});

test('equipment improves actual cultivation and combat power after saving and loading', () => {
  const plain = fresh(77, { stones: 10000 }), equipped = E.clone(plain);
  E.buyItem(equipped, 'manual'); E.buyItem(equipped, 'sword'); const loaded = E.validate(JSON.parse(JSON.stringify(equipped)));
  const manual = byId(D.items, 'manual'), sword = byId(D.items, 'sword');
  assert.equal(E.power(equipped) - E.power(plain), sword.powerBonus);
  for (const s of [plain, equipped, loaded]) { plan(s, ['meditate', 'rest', 'rest']); E.advance(s); }
  assert.equal(equipped.cultivation - plain.cultivation, manual.actions.meditate.cultivation); assert.deepEqual(loaded, equipped);
});

test('temporary protection benefits three complete years including each encounter', () => {
  const s = fresh(42, { stones: 10000 }), normalPower = E.power(s), ward = byId(D.buffs, 'ward');
  E.buyItem(s, 'ward'); E.buyItem(s, 'ward'); E.useItem(s, 'ward'); assert.equal(s.buffs.ward, ward.duration);
  unchangedOnError(s, () => E.useItem(s, 'ward'));
  for (let year = 0; year < ward.duration; year++) {
    assert.equal(E.power(s), normalPower + ward.powerBonus);
    plan(s, ['rest', 'rest', 'rest']); E.advance(s);
    assert.equal(s.buffs.ward, ward.duration - year); assert.equal(E.power(s), normalPower + ward.powerBonus);
    assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s); neutralYearEnd(s);
  }
  assert.equal(s.buffs.ward, undefined); assert.equal(E.power(s), normalPower); E.useItem(s, 'ward'); assert.equal(s.buffs.ward, ward.duration);
});

test('injury has a real action lock and two distinct recovery methods', () => {
  for (const recovery of ['rest', 'salve']) {
    const s = fresh(42, { stones: 10000 }); s.conditions.push('injured');
    assert.ok(E.actionError(s, 'explore')); assert.ok(E.actionError(s, 'train'));
    unchangedOnError(s, () => E.setPlan(s, ['explore', 'rest', 'rest']));
    if (recovery === 'rest') { plan(s, ['rest', 'rest', 'rest']); E.advance(s); neutralYearEnd(s); }
    else { const item = D.items.find(item => item.clearCondition === 'injured'); assert.ok(item); E.buyItem(s, item.id); E.useItem(s, item.id); assert.equal(s.inventory[item.id], undefined); }
    assert.ok(!s.conditions.includes('injured')); assert.equal(E.actionError(s, 'train'), '');
  }
});

test('sect joining is permanent, requires the realm and preserves a prepared plan', () => {
  const s = fresh(), sect = D.sects[0]; unchangedOnError(s, () => E.joinSect(s, sect.id));
  s.realm = sect.requireRealm; s.breakthroughs = s.realm; E.addPlan(s, 'rest'); unchangedOnError(s, () => E.joinSect(s, sect.id));
  E.removePlan(s, 0); const stones = s.stones; E.joinSect(s, sect.id);
  assert.equal(s.sect, sect.id); assert.equal(s.stones, stones); assert.equal(E.actionError(s, 'mission'), '');
  unchangedOnError(s, () => E.joinSect(s, D.sects[1].id));
  const before = s.contribution; plan(s, ['mission', 'rest', 'rest']); E.advance(s); assert.ok(s.contribution > before);
  assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s);
});

test('lectures spend contribution and stones while respecting each planned action in order', () => {
  const s = fresh(42, { realm: 1, stones: 0 }); E.joinSect(s, D.sects[0].id);
  unchangedOnError(s, () => plan(s, ['lecture', 'mission', 'rest']));
  plan(s, ['mission', 'lecture', 'lecture']); const before = E.clone(s); E.advance(s);
  assert.equal(s.contribution, 0); assert.equal(s.stones, 0); assert.equal(s.insight - before.insight, 16);
  assert.ok(!s.lastYear.notes.some(note => note.includes('未进行')));
  neutralYearEnd(s); s.contribution = 10; s.stones = 100;
  unchangedOnError(s, () => plan(s, ['lecture', 'lecture', 'rest']));
  s.stones = 30; plan(s, ['lecture', 'rest', 'rest']);
  assert.equal(E.itemStatus(s, 'herb').canBuy, false); unchangedOnError(s, () => E.buyItem(s, 'herb'));
  E.advance(s); assert.equal(s.contribution, 0); assert.equal(s.stones, 0);
});

test('breakthrough planning rejects missing cultivation and duplicate attempts', () => {
  const s = fresh(); assert.equal(E.breakthroughStatus(s).ready, false); unchangedOnError(s, () => E.addPlan(s, 'breakthrough'));
  const threshold = E.breakthroughStatus(s).threshold; s.cultivation = threshold;
  assert.equal(E.breakthroughStatus(s).ready, true); E.addPlan(s, 'breakthrough');
  unchangedOnError(s, () => E.addPlan(s, 'breakthrough'));
  s.plan = []; s.health = 19; unchangedOnError(s, () => E.addPlan(s, 'breakthrough'));
  s.health = 100; s.resolve = 19; unchangedOnError(s, () => E.addPlan(s, 'breakthrough'));
});

test('deterministic breakthroughs include both success and costly failure', () => {
  let success = false, failure = false;
  for (let seed = 1; seed <= 100 && !(success && failure); seed++) {
    const s = fresh(Math.imul(seed, 2654435761) >>> 0, { insight: 0, resolve: 50, health: 70 }), threshold = E.breakthroughStatus(s).threshold;
    s.cultivation = threshold; const copy = E.clone(s); plan(s, ['rest', 'rest', 'breakthrough']); plan(copy, ['rest', 'rest', 'breakthrough']);
    E.advance(s); E.advance(copy); assert.deepEqual(s, copy);
    if (s.realm === 1) { success = true; assert.equal(s.cultivation, 0); assert.equal(s.breakthroughs, 1); assert.equal(s.failures, 0); assert.equal(E.lifespanStatus(s).limit, 200); }
    else { failure = true; assert.equal(s.cultivation, threshold * 0.8); assert.equal(s.failures, 1); assert.equal(s.breakthroughs, 0); assert.equal(E.lifespanStatus(s).limit, 100); }
    assert.ok(s.lastYear.notes.length, 'breakthrough outcome must be visible');
  }
  assert.ok(success && failure, 'seed range must contain both possible outcomes');
});

test('breakthrough aids affect probability and stay active after an unsuccessful attempt', () => {
  const s = fresh(1, { stones: 10000, insight: 0, resolve: 50 }), before = E.breakthroughStatus(s).chance;
  E.buyItem(s, 'breakthrough-pill'); E.useItem(s, 'breakthrough-pill');
  assert.ok(E.breakthroughStatus(s).chance > before); assert.ok(E.breakthroughStatus(s).chance <= .95);
  let failed = false;
  for (let seed = 1; seed <= 100 && !failed; seed++) {
    const t = E.clone(s); t.seed = Math.imul(seed, 2654435761) >>> 0; t.cultivation = E.breakthroughStatus(t).threshold; plan(t, ['rest', 'rest', 'breakthrough']); E.advance(t);
    if (t.realm === 0) { failed = true; assert.equal(t.buffs.insight, byId(D.buffs, 'insight').duration); neutralYearEnd(t); assert.equal(t.buffs.insight, byId(D.buffs, 'insight').duration - 1); }
  }
  assert.ok(failed);
});

test('ascending completes the life immediately without another encounter', () => {
  let ascended = false;
  for (let seed = 1; seed <= 100 && !ascended; seed++) {
    const s = fresh(seed, { realm: 4, cultivation: D.realms[4].threshold, insight: 100, resolve: 100, health: 100 });
    plan(s, ['breakthrough', 'rest', 'rest']); E.advance(s);
    if (s.realm === 5) { ascended = true; assert.equal(s.phase, 'ending'); assert.equal(s.pendingEvent, null); assert.ok(s.ending); assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s); unchangedOnError(s, () => E.advance(s)); }
  }
  assert.ok(ascended);
});

test('lifespan derives from realm and ascension has no finite limit', () => {
  const limits = [100, 200, 500, 1000, 2000, null]; assert.deepEqual(D.realms.map(realm => realm.lifespan), limits);
  for (let realm = 0; realm < limits.length; realm++) {
    const s = fresh(42, { realm }), status = E.lifespanStatus(s); assert.equal(status.limit, limits[realm]);
    assert.equal(status.immortal, realm === 5); assert.equal(status.remaining, realm === 5 ? null : limits[realm] - s.age);
    assert.equal(status.nextLimit, limits[realm + 1] ?? null); assert.equal(status.gain, realm < 4 ? limits[realm + 1] - limits[realm] : null);
  }
});

test('every mortal realm expires precisely when its final yearly encounter advances the age to its limit', () => {
  for (let realm = 0; realm < 5; realm++) {
    const limit = D.realms[realm].lifespan, s = fresh(42, { realm, age: limit - 1, year: limit - 16 });
    assert.equal(E.lifespanStatus(s).remaining, 1); plan(s, ['rest', 'rest', 'rest']); E.advance(s);
    assert.equal(s.phase, 'event'); assert.equal(s.age, limit - 1); assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s);
    neutralYearEnd(s); assert.equal(s.phase, 'ending'); assert.equal(s.age, limit); assert.equal(s.year, limit - 15);
    assert.equal(E.lifespanStatus(s).remaining, 0); assert.equal(s.ending.reason, 'lifespan'); assert.ok(s.health > 0);
    assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s); unchangedOnError(s, () => E.addPlan(s, 'rest'));
  }
});

test('a successful breakthrough in the last year extends life while a failed attempt does not', () => {
  let success = false, failure = false;
  for (let seed = 1; seed <= 100 && !(success && failure); seed++) {
    const s = fresh(Math.imul(seed, 2654435761) >>> 0, { age: 99, year: 84, cultivation: D.realms[0].threshold, insight: 0, resolve: 50, health: 80 });
    plan(s, ['breakthrough', 'rest', 'rest']); E.advance(s); assert.equal(s.age, 99); assert.equal(s.phase, 'event'); neutralYearEnd(s);
    assert.equal(s.age, 100); assert.equal(s.year, 85);
    if (s.realm === 1) { success = true; assert.equal(s.phase, 'planning'); assert.equal(E.lifespanStatus(s).limit, 200); assert.equal(s.ending, null); }
    else { failure = true; assert.equal(s.phase, 'ending'); assert.equal(E.lifespanStatus(s).limit, 100); assert.equal(s.ending.reason, 'lifespan'); }
    assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s);
  }
  assert.ok(success && failure);
});

test('fatal encounter damage ends life without adding another year of age', () => {
  const event = { id: 'test-fatal-encounter', title: '命灯熄灭', choices: [{ text: '撑至最后', result: '伤势耗尽了气血。', effects: { health: -100 } }] };
  D.events.push(event);
  try {
    const s = fresh(42, { age: 99, year: 84, health: 1 }); setPending(s, event); E.choose(s, 0);
    assert.equal(s.phase, 'ending'); assert.equal(s.age, 99); assert.equal(s.year, 84); assert.equal(s.ending.reason, 'fallen');
    assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s);
  } finally { D.events.pop(); }
});

test('all three stories unlock work, visibly progress and reward exactly once', () => {
  assert.equal(D.stories.length, 3);
  for (const def of D.stories) {
    const s = fresh(42, { stones: 10000, realm: 2 }), start = s.year, followup = startStory(s, def);
    assert.equal(s.stories[def.id].startedYear, start); assert.equal(s.stories[def.id].dueYear, start + def.duration);
    assert.equal(E.actionError(s, def.actionId), ''); const completeIndex = followup.choices.findIndex(choice => choice.resolveStory?.outcome === 'completed');
    assert.ok(completeIndex >= 0); assert.ok(E.choiceError(s, followup.choices[completeIndex]));
    const actions = Array(def.target).fill(def.actionId); while (actions.length < 3) actions.push('rest');
    plan(s, actions); E.advance(s); assert.equal(s.stories[def.id].progress, def.target); assert.equal(s.pendingEvent, followup.id);
    assert.equal(E.storyStatus(s, def.id).ready, true); assert.ok(s.lastYear.notes.length);
    const result = E.choose(s, completeIndex); assert.equal(s.stories[def.id].status, 'completed'); assert.ok(result.changes.length);
    assert.ok(s.stories[def.id].ending); assert.ok(!E.eventPool(s).some(event => event.id === followup.id));
    assert.ok(E.choiceError(s, followup.choices[completeIndex])); unchangedOnError(s, () => E.choose(s, completeIndex));
    assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s);
  }
});

test('the ancient formation can be completed even when its cultivator already owns a manual', () => {
  const s = fresh(42, { realm: 1, stones: 10000 }), def = byId(D.stories, 'secret'); E.buyItem(s, 'manual');
  const followup = startStory(s, def); plan(s, Array(def.target).fill(def.actionId)); E.advance(s);
  assert.equal(s.pendingEvent, followup.id); const index = followup.choices.findIndex(choice => choice.resolveStory?.outcome === 'completed');
  assert.equal(E.choiceError(s, followup.choices[index]), ''); const cultivation = s.cultivation; E.choose(s, index);
  assert.equal(s.inventory.manual, 1); assert.equal(s.stories.secret.status, 'completed'); assert.ok(s.perks.includes('ancient-method'));
  assert.equal(s.cultivation - cultivation, 45); assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s);
});

test('unfinished stories reach a safe deadline ending and cannot restart', () => {
  for (const def of D.stories) {
    const s = fresh(42, { stones: 10000, realm: 2 }), followup = startStory(s, def);
    while (s.year < s.stories[def.id].dueYear) { plan(s, ['rest', 'rest', 'rest']); E.advance(s); neutralYearEnd(s); }
    plan(s, ['rest', 'rest', 'rest']); E.advance(s); assert.equal(s.pendingEvent, followup.id);
    const incomplete = followup.choices.find(choice => choice.requireStoryComplete); if (incomplete) assert.ok(E.choiceError(s, incomplete));
    const abandon = followup.choices.findIndex(choice => choice.resolveStory?.outcome === 'abandoned'); assert.ok(abandon >= 0); assert.equal(E.choiceError(s, followup.choices[abandon]), '');
    E.choose(s, abandon); assert.equal(s.stories[def.id].status, 'abandoned'); assert.ok(E.actionError(s, def.actionId));
    const invite = D.events.find(event => event.choices.some(choice => choice.startStory === def.id));
    assert.equal(E.eventWeight(s, invite), 0); assert.ok(E.choiceError(s, invite.choices.find(choice => choice.startStory === def.id)));
  }
});

test('simultaneous story followups settle earliest deadline first', () => {
  const s = fresh(42, { year: 12, age: 27, realm: 2, stones: 10000 });
  for (const [i, def] of D.stories.entries()) s.stories[def.id] = { status: 'active', progress: def.target, startedYear: 8 - i, dueYear: 11 - i, resolvedYear: null, ending: '' };
  const earliest = D.stories[D.stories.length - 1]; assert.equal(E.eventPool(s)[0].id, earliest.followupEvent);
  setPending(s, byId(D.events, earliest.followupEvent)); resolve(s);
  assert.notEqual(s.stories[earliest.id].status, 'active'); assert.notEqual(E.eventPool(s)[0].id, earliest.followupEvent);
});

test('stories and ordinary encounters continue across the former sixtieth-year boundary', () => {
  for (const def of D.stories) {
    const s = fresh(42, { realm: 1, year: 60, age: 75, stones: 10000 }); assert.ok(E.eventPool(s).length);
    const followup = startStory(s, def); assert.equal(s.year, 61); assert.equal(s.phase, 'planning');
    assert.equal(s.stories[def.id].dueYear, 60 + def.duration); assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s);
    const actions = Array(def.target).fill(def.actionId); while (actions.length < 3) actions.push('rest'); plan(s, actions); E.advance(s);
    assert.equal(s.pendingEvent, followup.id); E.choose(s, followup.choices.findIndex(choice => choice.resolveStory?.outcome === 'completed'));
    assert.equal(s.year, 62); assert.equal(s.stories[def.id].status, 'completed'); assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s);
  }
});

test('new stories require enough remaining lifespan and breakthrough does not extend existing deadlines', () => {
  for (const def of D.stories) {
    const invite = D.events.find(event => event.choices.some(choice => choice.startStory === def.id));
    const choice = invite.choices.find(choice => choice.startStory === def.id), limit = D.realms[1].lifespan;
    const lastEligible = fresh(42, { realm: 1, age: limit - def.duration - 1, year: limit - def.duration - 16, stones: 10000 });
    setPending(lastEligible, invite); assert.equal(E.choiceError(lastEligible, choice), ''); E.choose(lastEligible, invite.choices.indexOf(choice));
    assert.equal(lastEligible.stories[def.id].dueYear, limit - 16); assert.deepEqual(E.validate(JSON.parse(JSON.stringify(lastEligible))), lastEligible);
    const tooLate = fresh(42, { realm: 1, age: limit - def.duration, year: limit - def.duration - 15, stones: 10000 });
    setPending(tooLate, invite); assert.ok(E.choiceError(tooLate, choice)); assert.equal(E.eventWeight(tooLate, invite), 0);
    tooLate.realm = 2; tooLate.breakthroughs = 2; assert.equal(E.choiceError(tooLate, choice), ''); assert.ok(E.eventWeight(tooLate, invite) > 0);
  }
  const def = D.stories[0]; let extended = false;
  for (let seed = 1; seed <= 100 && !extended; seed++) {
    const s = fresh(Math.imul(seed, 2654435761) >>> 0, { realm: 1, cultivation: D.realms[1].threshold, year: 61, age: 76, stones: 10000 }); startStory(s, def);
    const due = s.stories[def.id].dueYear; plan(s, ['breakthrough', 'rest', 'rest']); E.advance(s);
    if (s.realm === 2) { extended = true; assert.equal(E.lifespanStatus(s).limit, 500); assert.equal(s.stories[def.id].dueYear, due); }
  }
  assert.ok(extended);
});

test('every encounter has a safe usable choice in its valid context', () => {
  assert.ok(D.events.length >= 40); assert.equal(new Set(D.events.map(event => event.id)).size, D.events.length);
  for (const event of D.events) {
    const s = fresh(4, { year: Math.max(1, event.minYear || 1), realm: event.minRealm || 0, health: 1, resolve: 1, stones: 0 }); s.age = 15 + s.year;
    if (event.requireSect) s.sect = D.sects[0].id;
    if (event.storyOnly) { const story = byId(D.stories, event.storyId); s.stories[story.id] = { status: 'active', progress: 0, startedYear: 1, dueYear: 1 + story.duration, resolvedYear: null, ending: '' }; }
    setPending(s, event); const safe = event.choices.find(choice => !choice.check && !choice.startStory && !E.choiceError(s, choice));
    assert.ok(safe, `${event.id}: no usable guaranteed choice at zero stones`);
    unchangedOnError(s, () => E.choose(s, -1)); unchangedOnError(s, () => E.choose(s, event.choices.length));
  }
});

test('once-only encounters, story gates and attribute checks use current character state', () => {
  const s = fresh(42, { realm: 3, year: 20, age: 35 });
  for (const event of D.events.filter(event => event.once && !event.storyOnly)) { s.seen = []; if (E.eventWeight(s, event) > 0) { s.seen.push(event.id); assert.equal(E.eventWeight(s, event), 0, event.id); } }
  const check = { stat: 'power', difficulty: 50 }; const low = E.checkChance(s, check); s.physique = 100; s.spirit = 100; assert.ok(E.checkChance(s, check) > low);
  assert.ok(E.checkChance(s, check) > 0 && E.checkChance(s, check) < 1);
  for (const event of D.events.filter(event => event.storyOnly)) assert.equal(E.eventWeight(s, event), 0);
});

test('sect contribution encounters stay out of a wandering cultivator’s event pool', () => {
  const events = D.events.filter(event => event.requireSect); assert.ok(events.length >= 2);
  const s = fresh(42, { realm: 2, year: 20, age: 35, contribution: 100 });
  for (const event of events) { assert.equal(E.eventWeight(s, event), 0); assert.ok(!E.eventPool(s).some(candidate => candidate.id === event.id)); }
  E.joinSect(s, D.sects[0].id);
  for (const event of events) { assert.ok(E.eventWeight(s, event) > 0); assert.ok(E.eventPool(s).some(candidate => candidate.id === event.id)); }
});

test('a choice cannot borrow its own attribute reward to improve the same check', () => {
  const baseChoice = { text: '请教', result: '准备领悟', check: { stat: 'insight', difficulty: 50, success: { result: '成功领悟', effects: { spirit: 1 } }, failure: { result: '尚未参透', effects: { reputation: 1 } } } };
  const event = { id: 'test-check-order', title: '前辈考验', choices: [baseChoice, { ...baseChoice, effects: { insight: 100 } }] };
  D.events.push(event);
  try {
    for (let seed = 1; seed <= 30; seed++) {
      const a = fresh(seed, { insight: 0 }), b = E.clone(a); setPending(a, event); setPending(b, event);
      E.choose(a, 0); E.choose(b, 1); assert.equal(a.spirit, b.spirit); assert.equal(a.reputation, b.reputation);
      assert.equal(b.insight, 100); assert.equal(a.insight, 0);
    }
  } finally { D.events.pop(); }
});

test('a rejected random reward leaves resources and the saved random sequence unchanged', () => {
  const reward = { result: '获得灵剑', gainItems: { sword: 1 } }, empty = { result: '静观片刻', effects: {} };
  const event = { id: 'test-full-random-reward', title: '剑冢赠礼', choices: [
    { text: '问剑', effects: { stones: -20 }, check: { stat: 'insight', difficulty: 50, success: reward, failure: empty } },
    { text: '赠剑', effects: { stones: -20 }, check: { stat: 'insight', difficulty: 50, success: empty, failure: reward } }
  ] };
  D.events.push(event);
  try {
    const s = fresh(); s.inventory.sword = 1; setPending(s, event);
    assert.match(E.choiceError(s, event.choices[0]), /成功后/); assert.match(E.choiceError(s, event.choices[1]), /未达成时/);
    unchangedOnError(s, () => E.choose(s, 0)); unchangedOnError(s, () => E.choose(s, 1));
  }
  finally { D.events.pop(); }
});

test('ordinary lives reach age one hundred after eighty-four annual turns and preserve story history', () => {
  const s = fresh(123), finalActionYear = D.realms[0].lifespan - 16;
  for (let year = 1; year <= finalActionYear; year++) {
    assert.equal(s.year, year); assert.equal(s.age, 15 + year); assert.equal(s.phase, 'planning');
    plan(s, ['rest', 'work', 'rest']); E.advance(s);
    if (year === finalActionYear) { const def = D.stories[0]; s.stories[def.id] = { status: 'active', progress: 0, startedYear: finalActionYear - def.duration, dueYear: finalActionYear, resolvedYear: null, ending: '' }; }
    neutralYearEnd(s);
  }
  assert.equal(s.phase, 'ending'); assert.equal(s.year, 85); assert.equal(s.age, 100); assert.equal(s.ending.reason, 'lifespan'); assert.equal(s.stories[D.stories[0].id].status, 'abandoned');
  assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s); unchangedOnError(s, () => E.setPlan(s, ['rest'])); unchangedOnError(s, () => E.buyItem(s, 'herb'));
});

test('fatal damage ends the life before scheduled rest or yearly recovery can revive it', () => {
  const s = fresh(42, { health: 1 });
  const action = D.actions.find(candidate => !E.actionError(s, candidate.id) && (E.actionPreview(s, candidate.id).health || 0) < 0);
  assert.ok(action, 'at least one available action risks health'); plan(s, [action.id, 'rest', 'rest']); E.advance(s);
  assert.equal(s.health, 0); assert.equal(s.phase, 'ending'); assert.equal(s.pendingEvent, null); assert.equal(s.ending.id, 'fallen');
  assert.equal(s.year, 1); assert.equal(s.age, 16);
  assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s);
});

test('optional save fields migrate to independent empty collections and unknown keys are removed', () => {
  const s = fresh(); for (const key of ['inventory', 'buffs', 'perks', 'conditions', 'stories']) delete s[key]; s.unknownField = 'untrusted';
  const loaded = E.validate(s); assert.deepEqual(loaded.inventory, {}); assert.deepEqual(loaded.buffs, {}); assert.deepEqual(loaded.perks, []);
  assert.deepEqual(loaded.conditions, []); assert.deepEqual(loaded.stories, {}); assert.equal(loaded.unknownField, undefined);
  const other = E.validate(s); loaded.inventory.herb = 1; assert.equal(other.inventory.herb, undefined);
});

test('healthy version-one sixty-year endings resume once without replaying prior rewards', () => {
  const legacy = fresh(77, { version: 1, year: 60, age: 75, realm: 1, phase: 'ending', ending: { id: 'companions', title: '旧结局', desc: '六十年旧卷' }, stones: 789 });
  const completed = D.stories[0], abandoned = D.stories[1];
  legacy.stories[completed.id] = { status: 'completed', progress: completed.target, startedYear: 50, dueYear: 50 + completed.duration, resolvedYear: 52, ending: '奖励已结算' };
  legacy.stories[abandoned.id] = { status: 'abandoned', progress: 1, startedYear: 55, dueYear: 55 + abandoned.duration, resolvedYear: 59, ending: '旧故事已结束' };
  legacy.perks = ['road-guide']; legacy.inventory = { manual: 1, herb: 2 }; legacy.seen = [completed.followupEvent, abandoned.followupEvent];
  legacy.log.push({ year: 60, text: '旧卷最后一笔，已经领过酬劳。', type: 'milestone' });
  const original = JSON.stringify(legacy), loaded = E.validate(legacy);
  assert.equal(JSON.stringify(legacy), original); assert.equal(loaded.version, 2); assert.equal(loaded.phase, 'planning'); assert.equal(loaded.year, 61); assert.equal(loaded.age, 76);
  assert.equal(loaded.ending, null); assert.deepEqual(loaded.plan, []); assert.equal(loaded.stones, legacy.stones); assert.equal(loaded.seed, legacy.seed);
  assert.deepEqual(loaded.stories, legacy.stories); assert.deepEqual(loaded.perks, legacy.perks); assert.deepEqual(loaded.inventory, legacy.inventory);
  assert.ok(loaded.log.some(entry => entry.text === legacy.log.at(-1).text)); assert.deepEqual(E.validate(loaded), loaded);
  assert.ok(!E.eventPool(loaded).some(event => event.storyOnly)); neutralYearEnd(loaded);
  assert.equal(loaded.year, 62); assert.equal(loaded.stones, legacy.stones); assert.deepEqual(loaded.stories, legacy.stories);
});

test('version-one deaths and ascensions remain finished while ongoing lives simply upgrade', () => {
  for (const kind of ['ongoing', 'pending-encounter', 'fallen', 'ascended']) {
    const legacy = fresh(42, { version: 1, year: 20, age: 35 });
    if (kind === 'pending-encounter') setPending(legacy, byId(D.events, 'quiet-snow'));
    if (kind === 'fallen') Object.assign(legacy, { phase: 'ending', health: 0, ending: { id: 'fallen', title: '旧陨落', desc: '旧卷' } });
    if (kind === 'ascended') Object.assign(legacy, { phase: 'ending', realm: 5, breakthroughs: 5, ending: { id: 'ascended', title: '旧飞升', desc: '旧卷' } });
    const loaded = E.validate(legacy); assert.equal(loaded.version, 2); assert.equal(loaded.age, 35); assert.equal(loaded.year, 20);
    const ongoing = kind === 'ongoing' || kind === 'pending-encounter'; assert.equal(loaded.phase, ongoing ? legacy.phase : 'ending');
    if (ongoing) assert.deepEqual(loaded, { ...legacy, version: 2 }); else assert.equal(loaded.ending.reason, kind);
    assert.deepEqual(E.validate(loaded), loaded);
  }
});

test('late-life saves accept centuries of valid history and reject impossible age or premature endings', () => {
  const veteran = fresh(42, { realm: 4, year: 1885, age: 1900, failures: 100, contribution: 110000, stones: 500000 });
  assert.deepEqual(E.validate(JSON.parse(JSON.stringify(veteran))), veteran);
  const invalid = [
    s => { s.year = 60; s.age = 75; s.phase = 'ending'; s.ending = { id: 'wanderer', title: '提前结局', desc: '' }; },
    s => { s.year = 85; s.age = 100; }, s => { s.year = 86; s.age = 101; },
    s => { s.age++; }, s => { s.version = 3; },
    s => { s.version = 1; s.year = 61; s.age = 76; },
    s => { s.version = 1; s.year = 59; s.age = 74; s.phase = 'ending'; s.ending = { id: 'wanderer', title: '假结局', desc: '' }; }
  ];
  for (const mutate of invalid) { const s = fresh(); mutate(s); assert.throws(() => E.validate(s), mutate.toString()); }
});

test('save validation rejects malformed resources, catalog references and impossible pending encounters', () => {
  const bad = [
    s => { s.year = 0; }, s => { s.realm = 6; }, s => { s.stones = -1; }, s => { s.health = Infinity; },
    s => { s.inventory.herb = -1; }, s => { s.inventory.herb = 1.5; }, s => { s.inventory.unknown = 1; },
    s => { s.inventory.sword = 2; }, s => { s.buffs.ward = 99; }, s => { s.buffs.unknown = 1; },
    s => { s.conditions = ['unknown']; }, s => { s.perks = ['unknown']; }, s => { s.sect = 'unknown'; },
    s => { s.plan = ['unknown']; }, s => { s.phase = 'event'; s.pendingEvent = 'unknown'; },
    s => { s.phase = 'event'; s.pendingEvent = D.stories[0].followupEvent; },
    s => { s.stories[D.stories[0].id] = { status: 'active', progress: -1, startedYear: 1, dueYear: 4, resolvedYear: null, ending: '' }; }
  ];
  for (const mutate of bad) { const s = fresh(); mutate(s); assert.throws(() => E.validate(s), mutate.toString()); }
  const s = fresh(), validated = E.validate(s); validated.inventory.herb = 1; assert.equal(s.inventory.herb, undefined);
});

test('many complete seeded lives remain deterministic, playable and reloadable', () => {
  for (let seed = 1; seed <= 30; seed++) {
    let s = fresh(seed); let turns = 0;
    while (s.phase !== 'ending') {
      assert.ok(++turns <= D.realms[0].lifespan - 16); plan(s, ['meditate', 'work', 'rest']); E.advance(s); if (s.phase === 'event') resolve(s);
      assert.ok(Number.isFinite(s.stones) && s.stones >= 0); assert.ok(s.health >= 0 && s.health <= 100); s = E.validate(JSON.parse(JSON.stringify(s)));
    }
    assert.equal(s.ending.reason, 'lifespan'); assert.equal(s.year, 85); assert.equal(s.age, 100);
  }
});

test('ascension is achievable through ordinary play without edited stats or unlimited money', () => {
  const completedYears = [];
  for (let seed = 1; seed <= 10; seed++) {
    let s = E.create({ name: '踏实修行', root: D.roots[0].id, path: D.paths[0].id, talents: E.drawTalents(seed).slice(0, 2), seed });
    while (s.phase !== 'ending') {
      if (!s.inventory.manual && E.itemStatus(s, 'manual').canBuy) E.buyItem(s, 'manual');
      if (!s.sect) { const sect = D.sects.find(candidate => !E.sectError(s, candidate.id)); if (sect) E.joinSect(s, sect.id); }
      const actions = [];
      if (E.breakthroughStatus(s).ready) actions.push('breakthrough');
      while (actions.length < 2) actions.push(s.insight < 75 ? 'comprehend' : 'meditate');
      actions.push('rest'); plan(s, actions); E.advance(s); if (s.phase === 'event') resolve(s);
      s = E.validate(JSON.parse(JSON.stringify(s)));
    }
    assert.equal(s.realm, 5, `seed ${seed} did not ascend: year=${s.year}, cultivation=${s.cultivation}, insight=${s.insight}, failures=${s.failures}`);
    assert.equal(s.ending.id, 'ascended'); completedYears.push(s.year);
  }
  assert.ok(Math.max(...completedYears) < D.realms[0].lifespan - 15, `ascension years: ${completedYears.join(', ')}`);
});
