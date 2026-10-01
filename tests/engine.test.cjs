const test = require('node:test');
const assert = require('node:assert/strict');
const D = require('../data.js');
const E = require('../engine.js');
const byId = (list, id) => { const result = list.find(x => x.id === id); assert.ok(result, id); return result; };
const sync = s => { s.year = 1 + Math.floor(s.elapsedMonths / 12); s.age = s.year + 15; s.world.year = s.year; s.world.auction.year = s.year; return s; };
const fresh = (seed = 42, overrides = {}) => {
  const s = Object.assign(E.create({ name: '试炼修士', path: overrides.path || 'sword', talents: [], seed }),
    { root: 'metal', rootGrade: 'legacy', rootElements: ['metal'] }, overrides);
  if (overrides.root && !overrides.rootElements) s.rootElements = [overrides.root];
  s.breakthroughs = s.realm;
  if (s.sect) { s.sectRank ||= 'outer'; s.sectMerit = Math.max(s.sectMerit, s.contribution, byId(D.sectRanks, s.sectRank).requireMerit); s.sectJoinedMonth ??= 0; }
  return sync(s);
};
const unchanged = (s, fn) => { const before = JSON.stringify(s); assert.throws(fn); assert.equal(JSON.stringify(s), before); };
const pending = (s, e) => { s.phase = 'event'; s.pendingEvent = e.id; return s; };
const roundtrip = s => assert.deepEqual(E.validate(JSON.parse(JSON.stringify(s))), s);
const neutral = s => {
  if (s.phase !== 'event') return;
  const e = { id: 'test-neutral', title: '清静片刻', choices: [{ text: '继续', result: '心神已定。', effects: {} }] };
  D.events.push(e); try { pending(s, e); return E.choose(s, 0); } finally { D.events.pop(); }
};
const act = (s, id) => { const result = E.performAction(s, id); neutral(s); return result; };
const resolve = s => {
  const e = byId(D.events, s.pendingEvent), options = e.choices.map((c, i) => ({ c, i })).filter(x => !E.choiceError(s, x.c));
  assert.ok(options.length, e.id + ' has no available choice');
  const noncheck = options.filter(x => !x.c.check && !x.c.startStory);
  const score = x => (x.c.effects?.health || 0) * 5 + (x.c.effects?.resolve || 0) + (x.c.effects?.stones || 0) / 10;
  const selected = (noncheck.length ? noncheck : options).sort((a, b) => score(b) - score(a))[0];
  return E.choose(s, selected.i);
};
const beginStory = (s, def) => {
  const e = D.events.find(x => x.choices.some(c => c.startStory === def.id));
  pending(s, e); E.choose(s, e.choices.findIndex(c => c.startStory === def.id)); return byId(D.events, def.followupEvent);
};
const legacy = (source, version = 3) => {
  const s = E.clone(source); s.version = version;
  for (const key of ['elapsedMonths', 'rootGrade', 'rootElements', 'sectRank', 'sectMerit', 'sectJoinedMonth', 'lastAction']) delete s[key];
  s.log.forEach(x => delete x.month);
  if (version < 3) { delete s.world; delete s.morality; }
  else { s.world.version = 1; s.world.used = 0; s.world.activityLog = []; }
  for (const st of Object.values(s.stories)) { delete st.startedMonth; delete st.dueMonth; }
  return s;
};

test('birth and talent draws are deterministic, independent and deep copied', () => {
  const a = E.create({ seed: 123 }), b = E.create({ seed: 123 }); assert.deepEqual(a, b); assert.equal(a.version, 4);
  assert.equal(a.elapsedMonths, 0); assert.equal(a.age, 16); assert.equal(a.phase, 'planning'); assert.deepEqual(a.plan, []);
  assert.deepEqual(E.drawRoot(123), { root: a.root, rootGrade: a.rootGrade, rootElements: a.rootElements });
  assert.deepEqual(E.drawTalents(9), E.drawTalents(9)); assert.equal(new Set(E.drawTalents(9)).size, 8); assert.notDeepEqual(E.drawTalents(9), E.drawTalents(19));
  a.inventory.herb = 1; assert.equal(b.inventory.herb, undefined); const c = E.clone(a); c.inventory.herb++; assert.equal(a.inventory.herb, 1); roundtrip(b);
});

test('a new life cannot select or reroll roots through character configuration', () => {
  for (let seed = 0; seed < 25; seed++) {
    const expected = E.drawRoot(seed), s = E.create({ seed, root: 'yang', rootGrade: 'heavenly', rootElements: ['yang'], path: 'soul', talents: ['family-savings'] });
    assert.equal(s.root, expected.root); assert.equal(s.rootGrade, expected.rootGrade); assert.deepEqual(s.rootElements, expected.rootElements);
    E.drawTalents(seed + 99); assert.deepEqual(E.drawRoot(seed), expected);
  }
  assert.throws(() => E.drawRoot(NaN)); assert.throws(() => E.drawRoot(1.2));
});

test('random root grades follow their weights and enforce distinct legal elements', () => {
  const counts = Object.fromEntries(D.rootGrades.map(g => [g.id, 0])), basic = new Set(['metal', 'wood', 'water', 'fire', 'earth']);
  for (let i = 0; i < 10000; i++) {
    const r = E.drawRoot(Math.imul(i, 2654435761) >>> 0), g = byId(D.rootGrades, r.rootGrade); counts[g.id]++;
    assert.equal(r.root, r.rootElements[0]); assert.equal(new Set(r.rootElements).size, r.rootElements.length);
    assert.ok(r.rootElements.length >= g.minElements && r.rootElements.length <= g.maxElements);
    assert.ok(r.rootElements.every(id => g.id === 'variant' ? !basic.has(id) : basic.has(id)));
  }
  assert.equal(counts.legacy, 0);
  for (const g of D.rootGrades.filter(x => x.weight)) assert.ok(Math.abs(counts[g.id] / 10000 - g.weight / 100) < .035, g.id + ' weighted distribution');
});

test('all root elements contribute to affinity and grade changes actual cultivation', () => {
  const s = fresh(1, { rootGrade: 'dual', rootElements: ['metal', 'water'], path: 'ice', insight: 20, resolve: 50 });
  assert.equal(E.pathStatus(s).matched, true); assert.ok(E.pathStatus(s).recommendedPaths.includes('ice'));
  const original = fresh(1, { root: 'metal', path: 'ice', insight: 20, resolve: 50 }); assert.equal(E.pathStatus(original).matched, false);
  assert.equal(E.actionPreview(s, 'meditate').cultivation, Math.round((E.actionPreview(original, 'meditate').cultivation + 4) * 1.1));
  assert.ok(Math.abs(E.breakthroughStatus(s).chance - E.breakthroughStatus(original).chance - .06) < 1e-9);
  for (const g of D.rootGrades) {
    const r = fresh(1, { rootGrade: g.id, rootElements: g.id === 'variant' ? ['ice'] : ['metal', 'wood', 'water', 'fire', 'earth'].slice(0, g.minElements), root: g.id === 'variant' ? 'ice' : 'metal' });
    const control = E.clone(r); control.rootGrade = 'legacy'; control.rootElements = [r.root];
    if (g.id !== 'variant') assert.equal(E.actionPreview(r, 'meditate').cultivation, Math.round(E.actionPreview(control, 'meditate').cultivation * g.cultivationMultiplier));
    roundtrip(r);
  }
});

test('single actions spend their advertised months and report actual growth without annual healing', () => {
  const s = fresh(10, { health: 70, resolve: 70, elapsedMonths: 10 }), preview = E.actionPreview(s, 'meditate'), before = E.clone(s);
  const receipt = E.performAction(s, 'meditate'); assert.equal(receipt.months, 3); assert.equal(s.elapsedMonths, 13); assert.equal(s.year, 2); assert.equal(s.age, 17);
  assert.equal(s.cultivation - before.cultivation, preview.cultivation); assert.equal(s.health, 70); assert.equal(s.resolve, 70 + preview.resolve);
  assert.equal(receipt.effects.cultivation, preview.cultivation); assert.deepEqual(s.lastAction, receipt); assert.deepEqual(s.plan, []);
  const time = E.timeStatus(s); assert.equal(time.month, 2); assert.equal(time.ageMonths, 1); assert.equal(time.remainingMonths, (100 - 16) * 12 - 13);
  neutral(s); roundtrip(s); assert.equal(E.formatDuration(25), '2年1个月');
});

test('all action durations are explicit and only marked cultivation scales with realm', () => {
  const factors = [1, 1, 2, 3, 4, 6, 8, 12, 18, 24, 36, 60, 100, 100];
  for (let realm = 0; realm < 14; realm++) for (const a of D.actions) {
    assert.ok(a.timeMonths > 0); const s = fresh(1, { realm }); assert.equal(E.actionTime(s, a.id).months, a.timeMonths * (a.realmTime ? factors[realm] : 1));
  }
  for (const st of D.stories) assert.equal(byId(D.actions, st.actionId).realmTime, false, 'story deadlines remain achievable at high realm');
});

test('old plan APIs and invalid immediate actions fail without changing state or random sequence', () => {
  const s = fresh(); unchanged(s, () => E.addPlan(s, 'rest')); unchanged(s, () => E.setPlan(s, ['rest'])); unchanged(s, () => E.removePlan(s, 0));
  unchanged(s, () => E.performAction(s, 'missing')); unchanged(s, () => E.advance(s)); unchanged(s, () => E.performAction(s, 'alchemy'));
  pending(s, D.events.find(e => !e.storyOnly)); unchanged(s, () => E.performAction(s, 'rest'));
  s.phase = 'ending'; s.pendingEvent = null; unchanged(s, () => E.performAction(s, 'rest'));
});

test('events are optional and resolving them does not consume time or expire buffs again', () => {
  let yes = 0, no = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const s = fresh(Math.imul(seed, 2654435761) >>> 0); s.buffs.ward = 10;
    const result = E.performAction(s, 'rest'); assert.equal(s.buffs.ward, 9);
    if (result.eventOccurred) { yes++; const before = s.elapsedMonths; neutral(s); assert.equal(s.elapsedMonths, before); assert.equal(s.buffs.ward, 9); unchanged(s, () => E.choose(s, 0)); }
    else { no++; assert.equal(s.pendingEvent, null); assert.equal(s.phase, 'planning'); }
  }
  assert.ok(yes > 10 && no > 10);
});

test('shops enforce prices, equipment uniqueness, item capacities and stage restrictions', () => {
  const s = fresh(1, { stones: 10000 }), before = s.stones, time = s.elapsedMonths;
  const r = E.buyItem(s, 'sword'); assert.equal(s.stones, before - 420); assert.equal(r.effects.stones, -420); assert.equal(s.elapsedMonths, time);
  unchanged(s, () => E.buyItem(s, 'sword')); unchanged(s, () => E.useItem(s, 'sword')); unchanged(s, () => E.buyItem(s, 'missing'));
  unchanged(s, () => E.buyItem(s, 'void-bell')); unchanged(s, () => E.buyItem(s, 'sect-armlet'));
  s.inventory['qi-pill'] = byId(D.items, 'qi-pill').max; unchanged(s, () => E.buyItem(s, 'qi-pill'));
  s.stones = 0; unchanged(s, () => E.buyItem(s, 'herb'));
  for (const phase of ['event', 'ending']) { s.phase = phase; unchanged(s, () => E.buyItem(s, 'herb')); unchanged(s, () => E.useItem(s, 'qi-pill')); }
});

test('gathering, crafting, consuming and resource shortages form real sequential actions', () => {
  const s = fresh(1, { stones: 100 }); unchanged(s, () => E.performAction(s, 'alchemy'));
  act(s, 'gather'); assert.equal(s.inventory.herb, 2); act(s, 'alchemy'); assert.equal(s.inventory['qi-pill'], 1); assert.equal(s.inventory.herb, undefined);
  assert.equal(s.stones, 70); unchanged(s, () => E.performAction(s, 'alchemy'));
  const c = s.cultivation, t = s.elapsedMonths; E.useItem(s, 'qi-pill'); assert.equal(s.cultivation, c + 35); assert.equal(s.elapsedMonths, t); assert.equal(s.inventory['qi-pill'], undefined);
  act(s, 'mine'); act(s, 'forge'); assert.equal(s.inventory.ward, 1); assert.equal(s.inventory.ore, undefined);
  s.inventory.herb = 1; unchanged(s, () => E.useItem(s, 'herb'));
  s.inventory.herb = 2; s.stones = 29; unchanged(s, () => E.performAction(s, 'alchemy'));
});

test('equipment and permanent perks affect growth and remain active across reloads', () => {
  const plain = fresh(1, { stones: 10000 }), equipped = E.clone(plain); E.buyItem(equipped, 'manual'); E.buyItem(equipped, 'sword');
  equipped.perks.push('ancient-method'); const loaded = E.validate(E.clone(equipped));
  assert.equal(E.power(equipped) - E.power(plain), 12);
  assert.equal(E.actionPreview(equipped, 'meditate').cultivation - E.actionPreview(plain, 'meditate').cultivation, 12);
  act(equipped, 'meditate'); act(loaded, 'meditate'); assert.deepEqual(loaded, equipped);
});

test('buffs decay by elapsed months, retain opening benefits and expire exactly once', () => {
  const s = fresh(1, { realm: 4, stones: 10000 }); E.buyItem(s, 'mountain-tea'); E.useItem(s, 'mountain-tea'); E.buyItem(s, 'mountain-tea');
  assert.equal(s.buffs['clear-mind'], 36); unchanged(s, () => E.useItem(s, 'mountain-tea'));
  s.buffs['clear-mind'] = 2; const expected = E.actionPreview(s, 'meditate').cultivation, before = s.cultivation;
  const result = act(s, 'meditate'); assert.equal(result.months, 12); assert.equal(s.cultivation - before, expected); assert.equal(s.buffs['clear-mind'], undefined);
  assert.equal(result.changes.filter(x => x.includes('消散')).length, 1); roundtrip(s);
  E.useItem(s, 'mountain-tea'); assert.equal(s.buffs['clear-mind'], 36);
  s.buffs.ward = 2; const power = E.power(s); act(s, 'rest'); assert.equal(s.buffs.ward, 1); act(s, 'rest'); assert.equal(s.buffs.ward, undefined); assert.equal(E.power(s), power - 15);
});

test('injury locks the listed physical activities and rest or salve clears it', () => {
  for (const path of ['sword', 'body', 'thunder']) for (const recovery of ['rest', 'salve']) {
    const s = fresh(1, { path, stones: 1000 }); s.conditions = ['injured'];
    for (const id of ['explore', 'train', ...(path === 'body' ? ['body-temper'] : path === 'thunder' ? ['thunder-temper'] : [])]) unchanged(s, () => E.performAction(s, id));
    if (recovery === 'rest') act(s, 'rest'); else { E.buyItem(s, 'healing-salve'); E.useItem(s, 'healing-salve'); assert.equal(s.elapsedMonths, 0); }
    assert.ok(!s.conditions.includes('injured')); assert.equal(E.actionError(s, 'train'), ''); roundtrip(s);
  }
});

test('all ten exclusive techniques keep their identity, materials and required path', () => {
  for (const p of D.paths) {
    const a = byId(D.actions, p.technique), s = fresh(1, { path: p.id, root: p.affinityRoots[0], stones: 10000, health: 100 });
    for (const [id, count] of Object.entries(a.costItems || {})) s.inventory[id] = count;
    const expected = E.actionPreview(s, a.id), before = E.clone(s); act(s, a.id);
    assert.equal(s.cultivation - before.cultivation, expected.cultivation || 0); assert.equal(s.elapsedMonths, E.actionTime(before, a.id).months);
    for (const [id, count] of Object.entries(a.gainItems || {})) assert.equal(s.inventory[id], count);
    for (const id of Object.keys(a.costItems || {})) assert.equal(s.inventory[id], undefined);
    const other = fresh(1, { path: D.paths.find(x => x.id !== p.id).id, stones: 10000 }); unchanged(other, () => E.performAction(other, a.id)); roundtrip(s);
  }
});

test('all legacy element and path combinations reload without replaying starting gifts', () => {
  for (const root of D.roots) for (const p of D.paths) {
    const s = fresh(1, { root: root.id, path: p.id, cultivation: 123, stones: 777 }); roundtrip(s);
    assert.equal(E.pathStatus(s).matched, p.affinityRoots.includes(root.id));
  }
  for (const path of ['sword', 'alchemy', 'wander']) {
    const s = fresh(1, { path }); s.inventory.sword = 1; assert.equal(E.actionError(s, 'sword-study'), ''); act(s, 'sword-study'); roundtrip(s);
  }
});

test('sect entry takes a month and transfers only upward while retaining possessions', () => {
  const s = fresh(1, { realm: 1, stones: 1000 }); const r = E.joinSect(s, 'green-mountain');
  assert.equal(r.months, 1); assert.equal(s.elapsedMonths, 1); assert.equal(s.sectRank, 'outer'); assert.equal(s.sectJoinedMonth, 1);
  unchanged(s, () => E.joinSect(s, 'green-mountain')); s.inventory.manual = 1; s.perks.push('ancient-method');
  act(s, 'mission'); const earned = s.contribution; assert.ok(earned > 0); assert.equal(s.sectMerit, earned);
  const before = s.elapsedMonths; E.joinSect(s, 'cloud-sword'); assert.equal(s.elapsedMonths, before + 1); assert.equal(s.contribution, 0); assert.equal(s.sectMerit, 0); assert.equal(s.sectRank, 'outer');
  assert.equal(s.inventory.manual, 1); assert.ok(s.perks.includes('ancient-method'));
  unchanged(s, () => E.joinSect(s, 'red-valley')); unchanged(s, () => E.joinSect(s, 'green-mountain')); unchanged(s, () => E.joinSect(s, 'star-observatory')); roundtrip(s);
});

test('promotion uses cumulative merit rather than remaining contribution and takes one month', () => {
  const s = fresh(1, { realm: 2, sect: 'cloud-sword', contribution: 0, sectMerit: 59 }); assert.equal(E.sectStatus(s).canPromote, false); unchanged(s, () => E.promoteSect(s));
  s.sectMerit = 60; const t = s.elapsedMonths; E.promoteSect(s); assert.equal(s.sectRank, 'inner'); assert.equal(s.elapsedMonths, t + 1); assert.equal(s.contribution, 0);
  assert.equal(E.actionError(s, 'sect-patrol'), ''); assert.ok(E.actionError(s, 'teach-disciples'));
  const outer = E.clone(s); outer.sectRank = 'outer'; assert.equal(E.actionPreview(s, 'mission').contribution - E.actionPreview(outer, 'mission').contribution, 5);
  s.sectMerit = 160; E.promoteSect(s); assert.equal(s.sectRank, 'core'); assert.equal(E.actionPreview(s, 'mission').contribution - E.actionPreview(outer, 'mission').contribution, 10);
  roundtrip(s);
});

test('all ranks advance in order, require their realm and reject another promotion at the top', () => {
  const s = fresh(1, { realm: 11, sect: 'golden-palace', sectMerit: 7000, contribution: 50 }), start = s.elapsedMonths;
  for (const rank of D.sectRanks.slice(1)) { assert.equal(E.sectStatus(s).nextRank.id, rank.id); E.promoteSect(s); assert.equal(s.sectRank, rank.id); assert.equal(s.contribution, 50); roundtrip(s); }
  assert.equal(s.elapsedMonths, start + 7); assert.equal(s.sectRank, 'lord'); unchanged(s, () => E.promoteSect(s));
  const low = fresh(1, { sect: 'green-mountain', sectMerit: 9000 }); unchanged(low, () => E.promoteSect(low));
  const bad = fresh(1, { realm: 1, sect: 'green-mountain', sectMerit: 100, morality: -60 }); unchanged(bad, () => E.promoteSect(bad));
});

test('contribution gains from actions and encounters build merit but spending never erases it', () => {
  const s = fresh(1, { realm: 1, sect: 'cloud-sword', stones: 0 }); act(s, 'mission');
  const earned = s.contribution; assert.equal(s.sectMerit, earned); act(s, 'lecture'); assert.equal(s.contribution, earned - 10); assert.equal(s.sectMerit, earned);
  const e = { id: 'test-merit-gift', title: '山门嘉奖', choices: [{ text: '接受', result: '功绩记入名册。', effects: { contribution: 23 } }] };
  D.events.push(e); try { pending(s, e); E.choose(s, 0); } finally { D.events.pop(); }
  assert.equal(s.sectMerit, earned + 23); const merit = s.sectMerit; E.exchangeFacility(s, 'pill-hall', 'healing-pair'); assert.equal(s.sectMerit, merit); roundtrip(s);
});

test('sect admission and promotion cannot consume the last available month', () => {
  const cap = (D.realms[0].lifespan - 16) * 12;
  const near = fresh(1, { elapsedMonths: cap - 1 }); unchanged(near, () => E.joinSect(near, 'green-mountain'));
  const elder = fresh(1, { realm: 1, sect: 'cloud-sword', sectMerit: 100, elapsedMonths: (200 - 16) * 12 - 1 }); unchanged(elder, () => E.promoteSect(elder));
});

test('breakthrough requires enough cultivation, health and resolve before any time passes', () => {
  const s = fresh(); unchanged(s, () => E.performAction(s, 'breakthrough')); s.cultivation = D.realms[0].threshold;
  s.health = 19; unchanged(s, () => E.performAction(s, 'breakthrough')); s.health = 100; s.resolve = 19; unchanged(s, () => E.performAction(s, 'breakthrough'));
  s.resolve = 100; assert.equal(E.actionError(s, 'breakthrough'), '');
});

test('both successful and failed breakthroughs consume time exactly once and preserve seeded outcomes', () => {
  let success = false, failure = false;
  for (let i = 1; i <= 100 && !(success && failure); i++) {
    const s = fresh(Math.imul(i, 2654435761) >>> 0, { cultivation: 90, health: 70, resolve: 50, insight: 0 }), other = E.clone(s);
    const r = E.performAction(s, 'breakthrough'); E.performAction(other, 'breakthrough'); assert.deepEqual(s, other); assert.equal(s.elapsedMonths, 6); assert.equal(r.months, 6);
    if (s.realm === 1) { success = true; assert.equal(s.cultivation, 0); assert.equal(s.health, 85); assert.equal(s.breakthroughs, 1); assert.equal(E.lifespanStatus(s).limit, 200); }
    else { failure = true; assert.equal(s.cultivation, 72); assert.equal(s.health, 60); assert.equal(s.resolve, 42); assert.equal(s.failures, 1); }
    assert.ok(r.changes.length); neutral(s); roundtrip(s);
  }
  assert.ok(success && failure);
});

test('a breakthrough aid is captured at departure even when it expires during a long retreat', () => {
  const s = fresh(1, { realm: 7, cultivation: D.realms[7].threshold, health: 100, resolve: 50, insight: 0, stones: 10000 });
  E.buyItem(s, 'breakthrough-pill'); E.useItem(s, 'breakthrough-pill'); const boosted = E.breakthroughStatus(s).chance;
  const noBuff = E.clone(s); delete noBuff.buffs.insight; assert.ok(boosted > E.breakthroughStatus(noBuff).chance);
  const duration = E.actionTime(s, 'breakthrough').months; assert.ok(duration > 36);
  const expectedSuccess = ((Math.imul(s.seed, 1664525) + 1013904223) >>> 0) / 4294967296 < boosted;
  E.performAction(s, 'breakthrough'); assert.equal(s.realm, expectedSuccess ? 8 : 7); assert.equal(s.buffs.insight, undefined); assert.equal(s.elapsedMonths, duration);
});

test('every finite realm enforces exact month boundaries and permits only an explicit final wait', () => {
  for (let realm = 0; realm < 13; realm++) {
    const cap = (D.realms[realm].lifespan - 16) * 12, s = fresh(1, { realm, elapsedMonths: cap - 1 });
    assert.equal(E.lifespanStatus(s).remainingMonths, 1); unchanged(s, () => E.performAction(s, 'rest'));
    E.waitToEnd(s); assert.equal(s.elapsedMonths, cap); assert.equal(s.age, D.realms[realm].lifespan); assert.equal(s.phase, 'ending'); assert.equal(s.ending.reason, 'lifespan'); roundtrip(s);
  }
  const young = fresh();
  unchanged(young, () => E.waitToEnd(young));
});

test('late-life breakthrough rejects equal duration atomically and succeeds with one spare month', () => {
  const cap = (100 - 16) * 12, blocked = fresh(1, { cultivation: 90, elapsedMonths: cap - 6 }); unchanged(blocked, () => E.performAction(blocked, 'breakthrough'));
  let found = false;
  for (let seed = 1; seed < 100 && !found; seed++) {
    const s = fresh(seed, { cultivation: 90, health: 100, resolve: 100, insight: 100, elapsedMonths: cap - 7 }); E.performAction(s, 'breakthrough');
    if (s.realm === 1) { found = true; assert.equal(s.elapsedMonths, cap - 1); assert.equal(s.age, 99); assert.equal(E.lifespanStatus(s).remainingMonths, 1201); neutral(s); roundtrip(s); }
  }
  assert.ok(found);
});

test('all fourteen realms extend lifespan and immortal ascension is not an ending', () => {
  assert.deepEqual(D.realms.map(x => x.lifespan), [100, 200, 500, 1000, 2000, 5000, 10000, 20000, 50000, 100000, 200000, 500000, 1000000, null]);
  for (const realm of [4, 5, 6, 7, 11, 12]) {
    const s = fresh(1, { realm, cultivation: D.realms[realm].threshold, health: 100, resolve: 100, insight: 100 }); s.inventory.manual = 1;
    E.performAction(s, 'breakthrough'); assert.equal(s.realm, realm + 1); assert.equal(s.inventory.manual, 1);
    if (realm === 12) { assert.equal(s.phase, 'ending'); assert.equal(s.pendingEvent, null); assert.equal(s.ending.id, 'emperor'); }
    else { assert.notEqual(s.phase, 'ending'); neutral(s); assert.equal(s.ending, null); }
    roundtrip(s);
  }
});

test('fatal action or event damage ends immediately without free annual recovery or extra event time', () => {
  const s = fresh(1, { health: 1 }); const result = E.performAction(s, 'train'); assert.equal(s.phase, 'ending'); assert.equal(s.health, 0); assert.equal(s.elapsedMonths, result.months); assert.equal(s.pendingEvent, null); roundtrip(s);
  const e = { id: 'test-fatal', title: '命灯暗去', choices: [{ text: '承受', result: '气血耗尽。', effects: { health: -100 } }] };
  D.events.push(e); try { const t = fresh(1, { elapsedMonths: 7 }); pending(t, e); E.choose(t, 0); assert.equal(t.elapsedMonths, 7); assert.equal(t.phase, 'ending'); roundtrip(t); } finally { D.events.pop(); }
});

test('stories use precise month deadlines, progress through dedicated actions and pay only once', () => {
  for (const def of D.stories) {
    const s = fresh(1, { realm: 2, elapsedMonths: 5, stones: 10000, health: 100 }), event = beginStory(s, def), st = s.stories[def.id];
    assert.equal(st.startedMonth, 5); assert.equal(st.dueMonth, 5 + def.duration * 12); assert.equal(s.elapsedMonths, 5);
    for (let i = 1; i <= def.target; i++) { E.performAction(s, def.actionId); assert.equal(s.stories[def.id].progress, i); if (i < def.target) neutral(s); }
    assert.equal(s.pendingEvent, event.id); const index = event.choices.findIndex(c => c.resolveStory?.outcome === 'completed'); const before = s.elapsedMonths;
    E.choose(s, index); assert.equal(s.stories[def.id].status, 'completed'); assert.equal(s.elapsedMonths, before); assert.ok(s.perks.includes(event.choices[index].grantPerk)); roundtrip(s);
    pending(s, event); unchanged(s, () => E.choose(s, index));
  }
});

test('owning a manual never blocks completion of the ancient formation story', () => {
  const def = byId(D.stories, 'secret'), s = fresh(1, { realm: 3 }); s.inventory.manual = 1; const e = beginStory(s, def);
  for (let i = 0; i < def.target; i++) { E.performAction(s, def.actionId); if (i < def.target - 1) neutral(s); }
  E.choose(s, e.choices.findIndex(c => c.resolveStory?.outcome === 'completed')); assert.equal(s.inventory.manual, 1); assert.ok(s.perks.includes('ancient-method')); roundtrip(s);
});

test('work that cannot finish by a story deadline is rejected and expiry still has a free ending', () => {
  for (const def of D.stories) {
    const s = fresh(1, { realm: 2 }), e = beginStory(s, def); s.elapsedMonths = s.stories[def.id].dueMonth - 1; sync(s);
    if (E.actionTime(s, def.actionId).months > 1) unchanged(s, () => E.performAction(s, def.actionId));
    E.performAction(s, 'rest'); assert.equal(s.pendingEvent, e.id); const complete = e.choices.find(c => c.resolveStory?.outcome === 'completed'); assert.ok(E.choiceError(s, complete));
    E.choose(s, e.choices.findIndex(c => c.resolveStory?.outcome === 'abandoned')); assert.equal(s.stories[def.id].status, 'abandoned'); assert.ok(E.actionError(s, def.actionId)); roundtrip(s);
  }
});

test('multiple ready stories settle earliest deadlines first and survive old year sixty', () => {
  const a = byId(D.stories, 'escort'), b = byId(D.stories, 'beast'), s = fresh(1, { realm: 1, elapsedMonths: 719 });
  beginStory(s, a); s.elapsedMonths += 5; sync(s); beginStory(s, b); s.stories[a.id].progress = a.target; s.stories[b.id].progress = b.target;
  E.performAction(s, 'rest'); assert.equal(s.pendingEvent, a.followupEvent); let e = byId(D.events, s.pendingEvent); E.choose(s, e.choices.findIndex(c => c.resolveStory?.outcome === 'completed'));
  E.performAction(s, 'rest'); assert.equal(s.pendingEvent, b.followupEvent); e = byId(D.events, s.pendingEvent); E.choose(s, e.choices.findIndex(c => c.resolveStory?.outcome === 'completed'));
  assert.ok(s.year > 60); roundtrip(s);
});

test('story invitations require enough lifetime and existing deadlines do not expand with realm', () => {
  const def = byId(D.stories, 'escort'), invite = D.events.find(e => e.choices.some(c => c.startStory === def.id)), s = fresh(1, { elapsedMonths: (100 - 16) * 12 - def.duration * 12 });
  pending(s, invite); unchanged(s, () => E.choose(s, invite.choices.findIndex(c => c.startStory === def.id)));
  s.realm = 1; s.breakthroughs = 1; E.choose(s, invite.choices.findIndex(c => c.startStory === def.id)); const due = s.stories[def.id].dueMonth;
  s.realm = 2; s.breakthroughs = 2; assert.equal(s.stories[def.id].dueMonth, due); roundtrip(s);
});

test('all encounters including negative events have a resource-free usable fallback', () => {
  for (const e of D.events) {
    const realm = Math.max(e.minRealm || 0, e.requireSect ? 1 : 0), s = fresh(1, { realm, path: e.requirePath || 'sword', elapsedMonths: (Math.max(2, e.minYear || 1) - 1) * 12, stones: 0, contribution: 0, health: 100, resolve: 100, morality: e.maxMorality ?? e.minMorality ?? 0, ...(e.requireSect ? { sect: 'cloud-sword' } : {}) });
    if (e.storyOnly) { const d = byId(D.stories, e.storyId); s.stories[d.id] = { status: 'active', progress: 0, startedYear: s.year, dueYear: s.year + d.duration, startedMonth: s.elapsedMonths, dueMonth: s.elapsedMonths + d.duration * 12, resolvedYear: null, ending: '' }; }
    pending(s, e); const index = e.choices.findIndex(c => !c.check && !c.require && !c.requireStoryComplete && !c.costItems && !c.gainItems && !c.startStory && !(c.effects?.stones < 0) && !(c.effects?.contribution < 0));
    assert.ok(index >= 0, e.id); assert.equal(E.choiceError(s, e.choices[index]), '', e.id); const time = s.elapsedMonths; E.choose(s, index); assert.equal(s.elapsedMonths, time); roundtrip(s);
  }
});

test('event gates, once-only choices, root identities and morality alter the actual pool', () => {
  const s = fresh(1, { elapsedMonths: 12 }), e = byId(D.events, 'path-sword-echo'); assert.ok(E.eventWeight(s, e) > 0); s.seen.push(e.id); assert.equal(E.eventWeight(s, e), 0);
  s.seen = []; s.path = 'alchemy'; assert.equal(E.eventWeight(s, e), 0);
  for (const sectEvent of D.events.filter(x => x.requireSect)) assert.equal(E.eventWeight(s, sectEvent), 0);
  const wickedEvent = D.events.find(x => x.maxMorality === -60); s.morality = 70; assert.equal(E.eventWeight(s, wickedEvent), 0); s.morality = -80; assert.ok(E.eventWeight(s, wickedEvent) > 0);
  const template = { id: 'test-root-gate', title: '水灵契机', requireRoot: 'water', choices: [{ text: '领悟', result: '水意入心。' }] };
  const action = { id: 'test-root-action', name: '试水', category: '修行', timeMonths: 1, realmTime: false, requireRoot: 'water', effects: {} };
  D.events.push(template); D.actions.push(action);
  try {
    const one = fresh(); assert.equal(E.eventWeight(one, template), 0); unchanged(one, () => E.performAction(one, action.id)); pending(one, template); unchanged(one, () => E.choose(one, 0)); assert.throws(() => E.validate(one));
    const two = fresh(1, { rootGrade: 'dual', rootElements: ['metal', 'water'] }); assert.ok(E.eventWeight(two, template) > 0); act(two, action.id); pending(two, template); E.choose(two, 0); roundtrip(two);
  } finally { D.events.pop(); D.actions.pop(); }
});

test('check probabilities use pre-choice stats and rejected rewards do not advance randomness', () => {
  const e = { id: 'test-precheck', title: '悟前悟后', choices: [{ text: '试一试', result: '开始', effects: { insight: 90 }, check: { stat: 'insight', difficulty: 80, success: { result: '成功', gainItems: { manual: 1 } }, failure: { result: '未成' } } }, { text: '稍后', result: '先休息。' }] };
  D.events.push(e);
  try {
    const s = fresh(1, { insight: 10 }); pending(s, e); const chance = E.checkChance(s, e.choices[0].check); E.choose(s, 0); assert.equal(s.lastEvent.chance, chance); assert.equal(chance, .1); assert.equal(s.insight, 100);
    const full = fresh(); full.inventory.manual = 1; pending(full, e); assert.ok(E.choiceError(full, e.choices[0])); unchanged(full, () => E.choose(full, 0)); E.choose(full, 1); assert.equal(full.elapsedMonths, 0);
  } finally { D.events.pop(); }
});

test('morality changes real prices and charity restores standing while consuming its month', () => {
  const s = fresh(1, { morality: -60, stones: 1000 }); assert.equal(E.itemStatus(s, 'manual').price, Math.ceil(280 * 1.15)); unchanged(s, () => E.joinSect(s, 'green-mountain'));
  act(s, 'charity'); assert.equal(s.morality, -52); assert.equal(s.stones, 940); assert.equal(s.elapsedMonths, 1); E.joinSect(s, 'green-mountain');
  s.morality = 20; assert.equal(E.itemStatus(s, 'manual').price, Math.ceil(280 * .95)); s.morality = 99; act(s, 'charity'); assert.equal(s.morality, 100); roundtrip(s);
});

test('base cultivation and income scale with realm before flat additions and grade multipliers', () => {
  const low = fresh(1, { realm: 0 }), high = fresh(1, { realm: 7 });
  assert.equal(E.actionPreview(high, 'meditate').cultivation - E.actionPreview(low, 'meditate').cultivation, Math.round(20 * 3.8) - 20);
  assert.equal(E.actionPreview(high, 'work').stones, 360);
  assert.equal(E.actionPreview(high, 'mission').contribution, 90);
  high.rootGrade = 'heavenly'; assert.equal(E.actionPreview(high, 'meditate').cultivation, Math.round((Math.round(20 * 3.8) + 4) * 1.4));
});

test('version-three saves migrate roots, months, buffs and unexecuted plans without charging resources', () => {
  const current = fresh(1, { realm: 2, elapsedMonths: 36, sect: 'cloud-sword', contribution: 93, stones: 777, cultivation: 222, root: 'water' });
  const old = legacy(current); old.plan = ['meditate', 'work', 'rest']; old.buffs = { ward: 2, insight: 1 }; const original = JSON.stringify(old), migrated = E.validate(old);
  assert.equal(JSON.stringify(old), original); assert.equal(migrated.version, 4); assert.equal(migrated.elapsedMonths, 36); assert.equal(migrated.rootGrade, 'legacy'); assert.deepEqual(migrated.rootElements, ['water']);
  assert.deepEqual(migrated.plan, []); assert.deepEqual(migrated.buffs, { ward: 24, insight: 12 }); assert.equal(migrated.stones, 777); assert.equal(migrated.cultivation, 222);
  assert.equal(migrated.sectRank, 'outer'); assert.equal(migrated.sectMerit, 93); assert.equal(migrated.world.version, 2); roundtrip(migrated);
});

test('migration retains pending old encounters and choices do not consume another year', () => {
  const current = fresh(1, { elapsedMonths: 120 }), event = byId(D.events, 'quiet-snow'); pending(current, event); const old = legacy(current), migrated = E.validate(old);
  assert.equal(migrated.pendingEvent, event.id); assert.equal(migrated.phase, 'event'); E.choose(migrated, 0); assert.equal(migrated.elapsedMonths, 120); assert.equal(migrated.year, 11); roundtrip(migrated);
});

test('old escort deadlines preserve the entire final calendar year after migration', () => {
  const s = fresh(1, { realm: 1, elapsedMonths: 84 }); s.stories.escort = { status: 'active', progress: 1, startedYear: 5, dueYear: 8, startedMonth: 48, dueMonth: 84, resolvedYear: null, ending: '' };
  const old = legacy(s), migrated = E.validate(old); assert.equal(migrated.stories.escort.dueMonth, 96); assert.equal(migrated.stories.escort.legacyDeadline, true);
  assert.equal(E.actionError(migrated, 'escort-work'), ''); E.performAction(migrated, 'escort-work'); assert.equal(migrated.pendingEvent, 'escort-finish');
  const e = byId(D.events, 'escort-finish'); E.choose(migrated, e.choices.findIndex(c => c.resolveStory?.outcome === 'completed')); assert.equal(migrated.stories.escort.status, 'completed'); roundtrip(migrated);
});

test('version-one sixty-year endings resume once, while actual old deaths remain finished', () => {
  const current = fresh(1, { realm: 1, elapsedMonths: 708, health: 80, phase: 'ending' }); current.ending = { id: 'elder', title: '旧卷', desc: '旧结局' }; current.inventory.manual = 1;
  const resumed = E.validate(legacy(current, 1)); assert.equal(resumed.age, 76); assert.equal(resumed.elapsedMonths, 720); assert.equal(resumed.phase, 'planning'); assert.equal(resumed.inventory.manual, 1); roundtrip(resumed);
  for (const version of [1, 2, 3]) {
    const dead = fresh(1, { realm: 2, elapsedMonths: 60, health: 0, phase: 'ending' }); const loaded = E.validate(legacy(dead, version)); assert.equal(loaded.phase, 'ending'); assert.equal(loaded.ending.reason, 'fallen'); assert.equal(loaded.elapsedMonths, 60); roundtrip(loaded);
  }
});

test('old ascension saves resume as true immortals with unchanged age and possessions', () => {
  for (const version of [1, 2]) {
    const s = fresh(1, { realm: 5, elapsedMonths: 120, phase: 'ending', cultivation: 333 }); s.inventory.manual = 1; s.perks = ['ancient-method'];
    const old = legacy(s, version), loaded = E.validate(old); assert.equal(loaded.realm, 7); assert.equal(loaded.breakthroughs, 7); assert.equal(loaded.phase, 'planning'); assert.equal(loaded.age, 26); assert.equal(loaded.elapsedMonths, 120);
    assert.equal(loaded.cultivation, 333); assert.equal(loaded.inventory.manual, 1); assert.deepEqual(loaded.perks, ['ancient-method']); roundtrip(loaded);
    old.health = 0; const dead = E.validate(old); assert.equal(dead.phase, 'ending'); assert.equal(dead.ending.reason, 'fallen');
  }
});

test('save validation rejects impossible time, roots, roles, resources and pending encounters', () => {
  const mutations = [
    s => { s.elapsedMonths = -1; }, s => { s.elapsedMonths = 1.5; }, s => { s.year++; }, s => { s.age++; },
    s => { s.rootGrade = 'missing'; }, s => { s.rootGrade = 'heavenly'; s.rootElements = ['metal', 'water']; },
    s => { s.rootGrade = 'dual'; s.rootElements = ['metal', 'metal']; }, s => { s.rootGrade = 'variant'; s.rootElements = ['metal']; },
    s => { s.rootElements = ['water']; }, s => { s.stones = -1; }, s => { s.inventory.manual = 2; }, s => { s.buffs.ward = 37; },
    s => { s.conditions = ['missing']; }, s => { s.perks = ['missing']; }, s => { s.plan = ['rest']; },
    s => { s.sectRank = 'inner'; }, s => { s.sectMerit = 1; }, s => { s.sect = 'cloud-sword'; s.sectRank = 'lord'; s.sectJoinedMonth = 0; },
    s => { s.phase = 'ending'; }, s => { s.phase = 'event'; s.pendingEvent = 'missing'; }, s => { s.phase = 'event'; s.pendingEvent = 'secret-finish'; },
    s => { s.realm = 2; s.breakthroughs = 1; }, s => { delete s.world; }, s => { s.world.version = 99; }
  ];
  for (const mutate of mutations) { const s = fresh(); mutate(s); assert.throws(() => E.validate(s)); }
  const s = fresh(); act(s, 'rest'); s.lastAction.months = s.elapsedMonths + 1; assert.throws(() => E.validate(s));
  const extra = fresh(); extra.notAStateField = { arbitrary: true }; assert.equal(E.validate(extra).notAStateField, undefined);
});

test('invalid legacy saves are rejected before migration and remaining buffs are not silently repaired', () => {
  for (const version of [1, 2, 3]) {
    const base = legacy(fresh(), version);
    for (const mutate of [s => { s.age = 5; }, s => { s.realm = 99; }, s => { s.buffs.ward = 4; }, s => { s.plan = ['missing']; }, s => { s.inventory.herb = -1; }]) {
      const s = E.clone(base); mutate(s); assert.throws(() => E.validate(s));
    }
  }
});

test('crossing a month and calendar-year boundary updates world state without recharging event time', () => {
  const s = fresh(1, { elapsedMonths: 11 }); s.buffs.ward = 5; const previous = E.clone(s.world.auction); E.performAction(s, 'rest');
  assert.equal(s.elapsedMonths, 12); assert.equal(s.year, 2); assert.equal(s.world.year, 2); assert.equal(s.world.auction.year, 2); assert.notEqual(s.world.auction.year, previous.year);
  assert.equal(s.buffs.ward, 4); neutral(s); assert.equal(s.elapsedMonths, 12); assert.equal(s.buffs.ward, 4); roundtrip(s);
});

test('many complete seeded mortal lives are deterministic, playable and reloadable', () => {
  function run(seed) {
    let s = E.create({ name: '山水一生', seed, path: 'wander', talents: ['good-sleeper', 'iron-will'] }), steps = 0;
    while (s.phase !== 'ending' && steps++ < 1200) {
      if (s.phase === 'event') { resolve(s); continue; }
      if (E.timeStatus(s).remainingMonths === 1) { E.waitToEnd(s); break; }
      let id = s.health < 55 || s.resolve < 45 ? 'rest' : steps % 3 ? 'meditate' : 'work';
      if (E.actionError(s, id)) id = 'rest'; E.performAction(s, id);
      if (steps % 29 === 0) s = E.validate(E.clone(s));
    }
    assert.equal(s.phase, 'ending'); assert.ok(['lifespan', 'fallen'].includes(s.ending.reason)); roundtrip(s); return s;
  }
  for (const seed of [1, 9, 32, 818, 9901, 22471]) assert.deepEqual(run(seed), run(seed));
});

test('all randomly drawn grade types can reach the immortal emperor with ordinary resources', () => {
  const seeds = {};
  for (let i = 1; Object.keys(seeds).length < 5 && i < 20000; i++) { const seed = Math.imul(i, 2654435761) >>> 0, grade = E.drawRoot(seed).rootGrade; seeds[grade] ??= seed; }
  assert.equal(Object.keys(seeds).length, 5);
  for (const [grade, seed] of Object.entries(seeds)) {
    let s = E.create({ name: '一步一境', seed, path: 'sword', talents: ['old-inheritance', 'night-reader'] }), steps = 0;
    E.buyItem(s, 'manual');
    while (s.phase !== 'ending' && steps++ < 1800) {
      if (s.phase === 'event') { resolve(s); continue; }
      if (!s.sect && s.realm >= 1) { E.joinSect(s, 'cloud-sword'); continue; }
      if (!s.inventory['spirit-flute'] && E.itemStatus(s, 'spirit-flute').canBuy) E.buyItem(s, 'spirit-flute');
      let id;
      if (s.health < 75 || s.resolve < 72) id = 'rest';
      else if (E.breakthroughStatus(s).ready) id = 'breakthrough';
      else if (s.insight < 70) id = 'comprehend';
      else id = 'meditate';
      assert.equal(E.actionError(s, id), '', grade + ' can continue'); E.performAction(s, id);
      if (steps % 23 === 0) s = E.validate(E.clone(s));
    }
    assert.equal(s.rootGrade, grade); assert.equal(s.phase, 'ending', grade + ' terminates'); assert.equal(s.ending.id, 'emperor', grade + ' ascends through actual play'); assert.equal(s.realm, 13); assert.ok(s.stones >= 0); roundtrip(s);
  }
});
