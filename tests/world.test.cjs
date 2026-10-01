const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');
const D = require('../data.js');
const fresh = (overrides = {}) => {
  const s = E.create({ name: '天地试炼', root: 'metal', path: 'sword', talents: [], seed: 123 });
  Object.assign(s, { year: 3, age: 18, stones: 10000, morality: 30 }, overrides);
  s.elapsedMonths = overrides.elapsedMonths ?? (s.year - 1) * 12; s.year = 1 + Math.floor(s.elapsedMonths / 12); s.age = 16 + Math.floor(s.elapsedMonths / 12);
  s.rootGrade = 'legacy'; s.rootElements = [s.root];
  s.breakthroughs = s.realm; s.world.year = s.year; s.world.auction.year = s.year; return s;
};
const unchanged = (s, operation) => { const before = JSON.stringify(s); assert.throws(operation); assert.equal(JSON.stringify(s), before); };
const reload = s => { const loaded = E.validate(JSON.parse(JSON.stringify(s))); assert.deepEqual(loaded, s); return loaded; };
const nextYear = s => {
  const event = { id: 'world-test-neutral', title: '平安一年', choices: [{ text: '继续', result: '山中无事。', effects: {} }] };
  const year = s.year; D.events.push(event); try {
    while (s.year === year && s.phase !== 'ending') { E.performAction(s, 'rest'); if (s.phase === 'event') { s.pendingEvent = event.id; E.choose(s, 0); } }
  } finally { D.events.pop(); }
};
const readyPartner = (s, id = 'qinghe', affection = 60) => { Object.assign(s.world.relationships[id], { met: true, affection, lastInteractionYear: s.year - 1 }); return id; };
const seedAt = i => Math.imul(i, 2654435761) >>> 0;

test('world initialization is deterministic and never consumes the character random sequence', () => {
  const a = fresh(), b = fresh(); assert.deepEqual(a.world, b.world); assert.equal(a.seed, 123);
  assert.equal(E.worldStatus(a).timeBased, true); assert.equal(a.world.version, 2); assert.equal(E.auctionStatus(a).length, 3); reload(a);
  const publicLots = E.auctionStatus(a); assert.ok(publicLots.every(lot => !Object.hasOwn(lot, 'rivalBid')));
  for (const lot of publicLots) assert.ok(lot.rivalRange[0] <= lot.rivalRange[1]);
});

test('world actions spend real months without an annual quota and invalid input never spends time', () => {
  const s = fresh(), npc = 'shenxing', opponent = D.opponents[0].id, dungeon = D.dungeons[0].id;
  const attempts = [() => E.interactCompanion(s, npc, 'talk'), () => E.bidAuction(s, E.auctionStatus(s)[0].id, 1000), () => E.enterDungeon(s, dungeon), () => E.fight(s, opponent, 'spar')];
  s.phase = 'event'; s.pendingEvent = 'quiet-snow'; for (const attempt of attempts) unchanged(s, attempt); assert.ok(E.worldStatus(s).reason); s.phase = 'planning'; s.pendingEvent = null;
  unchanged(s, () => E.interactCompanion(s, npc, 'missing')); unchanged(s, () => E.bidAuction(s, 'missing', 100)); unchanged(s, () => E.fight(s, opponent, 'missing'));
  const before = s.elapsedMonths; E.interactCompanion(s, npc, 'talk'); E.fight(s, opponent, 'spar'); E.interactCompanion(s, 'qinghe', 'talk');
  assert.equal(s.elapsedMonths - before, 3); assert.equal(s.year, 3); assert.equal(Object.hasOwn(E.worldStatus(s), 'remaining'), false); assert.equal(E.worldStatus(s).reason, '');
  nextYear(s); assert.equal(s.world.auction.year, 4); reload(s);
});

test('facilities exchange instantly and enforce ownership, realm and reputation', () => {
  const s = fresh({ realm: 1, contribution: 1000 });
  unchanged(s, () => E.exchangeFacility(s, 'pill-hall', 'qi-pair')); E.joinSect(s, D.sects[0].id); s.contribution = 1000; s.sectMerit = 1000; s.sectRank = 'inner';
  const contribution = s.contribution; const receipt = E.exchangeFacility(s, 'pill-hall', 'qi-pair');
  assert.equal(s.contribution, contribution - 30); assert.equal(s.inventory['qi-pill'], 2); assert.equal(receipt.effects.contribution, -30); assert.equal(receipt.months, 0);
  const cultivation = E.actionPreview(s, 'meditate').cultivation; E.exchangeFacility(s, 'library', 'breathing-book');
  assert.equal(E.actionPreview(s, 'meditate').cultivation, cultivation + 8); unchanged(s, () => E.exchangeFacility(s, 'library', 'breathing-book'));
  E.exchangeFacility(s, 'forge-hall', 'sect-sword'); unchanged(s, () => E.exchangeFacility(s, 'forge-hall', 'sect-sword'));
  unchanged(s, () => E.exchangeFacility(s, 'library', 'immortal-book')); s.morality = -60; unchanged(s, () => E.exchangeFacility(s, 'pill-hall', 'qi-pair'));
  s.morality = 0; s.contribution = 0; unchanged(s, () => E.exchangeFacility(s, 'pill-hall', 'qi-pair')); reload(s);
});

test('morality changes prices and extreme infamy blocks admission', () => {
  const s = fresh({ realm: 1, morality: 0 }), normal = E.itemStatus(s, 'herb').price;
  s.morality = 20; assert.equal(E.moralityStatus(s).shopModifier, -.05); assert.ok(E.itemStatus(s, 'herb').price <= normal);
  s.morality = -20; assert.equal(E.moralityStatus(s).shopModifier, .15); assert.ok(E.itemStatus(s, 'herb').price > normal);
  s.morality = -60; unchanged(s, () => E.joinSect(s, D.sects[0].id)); s.morality = 60; assert.equal(E.moralityStatus(s).title, '功德真人');
});

test('companionship requires repeated mutual acquaintance, adult consent and a single current partner', () => {
  const s = fresh({ year: 1, age: 16 }), id = 'shenxing';
  E.interactCompanion(s, id, 'gift'); assert.equal(s.world.relationships[id].affection, 20); assert.equal(s.stones, 9940); unchanged(s, () => E.interactCompanion(s, id, 'talk'));
  readyPartner(s, id); unchanged(s, () => E.interactCompanion(s, id, 'bond')); nextYear(s); nextYear(s);
  assert.equal(s.age, 18); E.interactCompanion(s, id, 'bond'); assert.equal(s.world.partnerId, id); assert.equal(E.actionError(s, 'partner-cultivate'), '');
  assert.equal(E.companionStatus(s, id).partnerName, D.companions.find(person => person.id === id).name); readyPartner(s, 'qinghe');
  unchanged(s, () => E.interactCompanion(s, 'qinghe', 'bond')); E.interactCompanion(s, id, 'separate'); assert.equal(s.world.partnerId, null);
  assert.ok(E.actionError(s, 'partner-cultivate')); unchanged(s, () => E.interactCompanion(s, id, 'bond')); reload(s);
});

test('bonded companions provide real passive benefits and one interaction per person per year', () => {
  const s = fresh({ realm: 1 }), id = 'moling'; readyPartner(s, id);
  const power = E.power(s), physique = E.actionPreview(s, 'train').physique; E.interactCompanion(s, id, 'bond');
  assert.equal(E.power(s), power + 6); assert.equal(E.actionPreview(s, 'train').physique, physique + 1);
  E.interactCompanion(s, id, 'talk'); assert.equal(s.world.relationships[id].affection, 72); unchanged(s, () => E.interactCompanion(s, id, 'gift'));
  nextYear(s); assert.equal(s.world.partnerId, id); E.interactCompanion(s, id, 'separate'); assert.equal(E.power(s), power); reload(s);
});

test('sealed bids charge only winners, never reveal unopened rival bids and survive reload without rerolls', () => {
  const winning = fresh(), lot = E.auctionStatus(winning).find(lot => !winning.inventory[lot.itemId]), before = winning.stones, price = lot.rivalRange[1] + 1;
  E.bidAuction(winning, lot.id, price); assert.equal(winning.stones, before - price); assert.equal(winning.inventory[lot.itemId], lot.quantity);
  assert.equal(E.auctionStatus(winning).find(candidate => candidate.id === lot.id).outcome, 'won'); unchanged(winning, () => E.bidAuction(winning, lot.id, price + 1)); reload(winning);
  let lost = false;
  for (let seed = 1; seed <= 50 && !lost; seed++) {
    const s = E.create({ seed: seedAt(seed) }); s.stones = 10000; const candidate = E.auctionStatus(s)[0], initial = s.stones, stored = reload(s);
    E.bidAuction(s, candidate.id, candidate.minBid); E.bidAuction(stored, candidate.id, candidate.minBid); assert.deepEqual(stored, s);
    if (s.world.auction.lots[0].outcome === 'lost') { lost = true; assert.equal(s.stones, initial); assert.equal(s.elapsedMonths, 1); }
  }
  assert.ok(lost);
});

test('auction capacity and invalid bids fail before changing currency, counters or hidden random state', () => {
  const s = fresh(), lot = E.auctionStatus(s)[0], item = D.items.find(item => item.id === lot.itemId);
  for (const bid of [undefined, null, NaN, Infinity, -1, 0, lot.minBid - 1, 1.5, '100', 1000000001]) unchanged(s, () => E.bidAuction(s, lot.id, bid));
  s.inventory[item.id] = item.max; assert.equal(E.auctionStatus(s)[0].canBid, false); unchanged(s, () => E.bidAuction(s, lot.id, lot.rivalRange[1] + 1));
  nextYear(s); assert.ok(E.auctionStatus(s).every(entry => !entry.closed)); reload(s);
});

test('three-stage dungeons can span years, grant actual rewards once and keep complete history', () => {
  for (const definition of D.dungeons) {
    let completed = false;
    for (let attempt = 1; attempt <= 50 && !completed; attempt++) {
      const s = fresh({ realm: definition.requireRealm, physique: 100, spirit: 100, reputation: 100, seed: seedAt(attempt), health: 100, elapsedMonths: 35 });
      E.enterDungeon(s, definition.id); assert.equal(s.stones, 10000 - definition.entryCost);
      while (s.world.dungeon.active && s.phase === 'planning') {
        const beforeStage = E.dungeonStatus(s).active.stage; E.exploreDungeon(s, 'careful');
        if (s.world.dungeon.active) assert.equal(E.dungeonStatus(s).active.stage, beforeStage + 1); reload(s);
      }
      if (s.world.dungeon.history[definition.id].completedYear !== null) {
        completed = true; for (const [id, count] of Object.entries(definition.reward.gainItems || {})) assert.equal(s.inventory[id], count);
        if (definition.reward.grantPerk) assert.ok(s.perks.includes(definition.reward.grantPerk));
        assert.equal(s.world.dungeon.history[definition.id].lastOutcome, 'completed'); unchanged(s, () => E.enterDungeon(s, definition.id));
        nextYear(s); unchanged(s, () => E.enterDungeon(s, definition.id)); reload(s);
      }
    }
    assert.ok(completed, definition.id);
  }
});

test('dungeon failures cannot be retried until next year, while leaving is free and always safe', () => {
  let failed = false;
  for (let seed = 1; seed <= 80 && !failed; seed++) {
    const s = fresh({ seed: seedAt(seed), physique: 0, spirit: 0, reputation: 0 }); E.enterDungeon(s, 'mist-gorge'); E.exploreDungeon(s, 'bold');
    if (s.world.dungeon.history['mist-gorge'].lastOutcome === 'failed') {
      failed = true; assert.equal(s.world.dungeon.history['mist-gorge'].failedYear, s.year); unchanged(s, () => E.enterDungeon(s, 'mist-gorge'));
      nextYear(s); assert.equal(E.dungeonStatus(s).entries.find(entry => entry.id === 'mist-gorge').canEnter, true); reload(s);
    }
  }
  assert.ok(failed); const s = fresh(); E.enterDungeon(s, 'mist-gorge'); E.interactCompanion(s, 'shenxing', 'talk');
  const health = s.health, months = s.elapsedMonths; const left = E.leaveDungeon(s); assert.equal(s.health, health); assert.equal(s.elapsedMonths, months); assert.equal(left.months, 0); assert.equal(s.world.dungeon.active, null); reload(s);
});

test('a full final-stage reward bag blocks safely and can be resolved by using items', () => {
  const s = fresh({ physique: 100, spirit: 100 }); E.enterDungeon(s, 'mist-gorge');
  s.world.dungeon.active.stage = 2;
  const pill = D.items.find(item => item.id === 'qi-pill'); s.inventory['qi-pill'] = pill.max;
  const status = E.dungeonStatus(s).active; assert.equal(status.canExplore, false); assert.match(status.reason, /最后一关/);
  unchanged(s, () => E.exploreDungeon(s, 'careful')); E.useItem(s, 'qi-pill'); assert.equal(E.dungeonStatus(s).active.canExplore, true);
  E.leaveDungeon(s); assert.equal(s.world.dungeon.active, null); reload(s);
});

test('careful and bold exploration expose different odds, rewards and credible lethal risk', () => {
  const s = fresh({ health: 1 }); E.enterDungeon(s, 'mist-gorge'); const status = E.dungeonStatus(s).active;
  assert.ok(status.carefulChance > status.boldChance); assert.match(status.risk, /陨落/); E.exploreDungeon(s, 'bold');
  assert.equal(s.health, 0); assert.equal(s.phase, 'ending'); assert.equal(s.world.dungeon.active, null); reload(s);
});

test('sparring is nonlethal and limited per opponent, while robbery changes morality and can be fatal', () => {
  const s = fresh({ health: 1 }); E.fight(s, 'ferry-guard', 'spar'); assert.equal(s.health, 1); assert.equal(s.phase, 'planning'); assert.equal(s.morality, 32);
  unchanged(s, () => E.fight(s, 'ferry-guard', 'spar')); E.fight(s, 'ferry-guard', 'rob'); assert.equal(s.health, 0); assert.equal(s.morality, 14); assert.equal(s.phase, 'ending'); reload(s);
  const poor = fresh({ realm: 0 }); unchanged(poor, () => E.fight(poor, 'immortal-sentinel', 'spar'));
});

test('robbery alienates a righteous partner and zero affection dissolves the bond and its bonuses', () => {
  const s = fresh({ realm: 1, health: 100 }); readyPartner(s, 'moling'); E.interactCompanion(s, 'moling', 'bond');
  s.world.relationships.moling.affection = 20; const before = E.power(s); E.fight(s, 'ferry-guard', 'rob');
  assert.equal(s.world.partnerId, null); assert.equal(s.world.relationships.moling.affection, 0); assert.equal(E.power(s), before - 6); assert.ok(E.actionError(s, 'partner-cultivate')); reload(s);
});

test('every nested persisted world structure rejects malformed or inconsistent imported records', () => {
  const mutations = [
    s => { s.world = null; }, s => { s.world.year++; }, s => { s.world.used = 3; }, s => { s.world.used = -1; }, s => { s.world.unknown = 1; },
    s => { s.world.activityLog = [{ kind: 'talk', target: 'qinghe' }]; },
    s => { delete s.world.relationships.qinghe; }, s => { s.world.relationships.qinghe.affection = 101; }, s => { s.world.relationships.qinghe.affection = 1; },
    s => { s.world.partnerId = 'missing'; }, s => { s.world.partnerId = 'qinghe'; }, s => { s.world.relationships.qinghe.lastInteractionYear = s.year + 1; },
    s => { s.world.relationships.zhuyin.met = true; },
    s => { s.world.auction.year++; }, s => { s.world.auction.lots.pop(); }, s => { s.world.auction.lots[0].rivalBid = 0; }, s => { s.world.auction.lots[0].itemId = 'missing'; },
    s => { s.world.auction.lots[0].closed = true; }, s => { s.world.auction.lots[0].outcome = 'won'; }, s => { s.world.auction.lots[1] = E.clone(s.world.auction.lots[0]); },
    s => { s.world.dungeon.active = { id: 'mist-gorge', stage: 3, enteredYear: s.year, boldStages: 0 }; },
    s => { s.world.dungeon.history['mist-gorge'].completedYear = s.year; }, s => { s.world.dungeon.history['mist-gorge'].attempts = -1; },
    s => { s.world.combat['ferry-guard'].sparYear = s.year + 1; }, s => { delete s.world.combat['ferry-guard']; }
  ];
  for (const mutate of mutations) { const s = fresh(); mutate(s); assert.throws(() => E.validate(s), mutate.toString()); }
  const s = fresh(), copy = reload(s); copy.world.relationships.qinghe.met = true; assert.equal(s.world.relationships.qinghe.met, false);
});

test('every timed world status publishes the same duration its action actually consumes', () => {
  const s = fresh(), start = s.elapsedMonths;
  const talk = E.companionStatus(s, 'shenxing').actions.find(action => action.id === 'talk'); assert.equal(talk.months, D.worldTimes.talk); assert.equal(talk.durationText, E.formatDuration(talk.months));
  const conversation = E.interactCompanion(s, 'shenxing', 'talk'); assert.equal(conversation.months, talk.months); assert.equal(s.elapsedMonths, start + talk.months); assert.equal(conversation.elapsedText, talk.durationText);
  const entry = E.dungeonStatus(s).entries.find(entry => entry.id === 'mist-gorge'), entered = E.enterDungeon(s, entry.id);
  assert.equal(entered.months, entry.months); const active = E.dungeonStatus(s).active;
  assert.equal(active.carefulMonths, 3); assert.equal(active.boldMonths, 2); assert.equal(active.carefulDurationText, E.formatDuration(3));
  const previous = s.elapsedMonths; const explored = E.exploreDungeon(s, 'careful'); assert.equal(explored.months, 3); assert.equal(s.elapsedMonths - previous, 3);
  const combat = E.combatStatus(s, 'ferry-guard', 'spar'), beforeCombat = s.elapsedMonths; const fought = E.fight(s, 'ferry-guard', 'spar');
  assert.equal(fought.months, combat.months); assert.equal(s.elapsedMonths - beforeCombat, combat.months); reload(s);
});

test('a year-crossing sealed bid preserves its receipt while the new annual auction refreshes', () => {
  const s = fresh({ elapsedMonths: 35 }), lot = E.auctionStatus(s)[0], bid = lot.rivalRange[1] + 1, initial = s.stones;
  const result = E.bidAuction(s, lot.id, bid); assert.equal(result.title, '拍得珍物'); assert.match(result.text, new RegExp(String(bid)));
  assert.equal(s.stones, initial - bid); assert.equal(s.inventory[lot.itemId], lot.quantity); assert.equal(s.elapsedMonths, 36); assert.equal(s.year, 4);
  assert.equal(s.world.auction.year, 4); assert.ok(E.auctionStatus(s).every(candidate => !candidate.closed)); assert.ok(result.notes.some(note => note.includes('拍品已更新'))); reload(s);
});

test('cross-year relationship and combat cooldowns use the completion year without accidental healing', () => {
  const s = fresh({ elapsedMonths: 35, health: 40 }); E.interactCompanion(s, 'shenxing', 'talk');
  assert.equal(s.year, 4); assert.equal(s.world.relationships.shenxing.lastInteractionYear, 4); assert.equal(s.health, 40);
  unchanged(s, () => E.interactCompanion(s, 'shenxing', 'talk')); nextYear(s); assert.equal(s.year, 5); E.interactCompanion(s, 'shenxing', 'talk');
  const t = fresh({ elapsedMonths: 35 }); E.fight(t, 'ferry-guard', 'spar'); assert.equal(t.world.combat['ferry-guard'].sparYear, 4);
  unchanged(t, () => E.fight(t, 'ferry-guard', 'spar')); reload(t);
});

test('cross-year dungeon failures are recorded in the completion year and remain on cooldown', () => {
  let found = false;
  for (let i = 1; i < 60 && !found; i++) {
    const s = fresh({ elapsedMonths: 34, seed: seedAt(i), physique: 0, spirit: 0, reputation: 0 }); E.enterDungeon(s, 'mist-gorge'); E.exploreDungeon(s, 'bold');
    if (s.world.dungeon.history['mist-gorge'].lastOutcome === 'failed') {
      found = true; assert.equal(s.elapsedMonths, 37); assert.equal(s.year, 4); assert.equal(s.world.dungeon.history['mist-gorge'].failedYear, 4);
      unchanged(s, () => E.enterDungeon(s, 'mist-gorge')); nextYear(s); assert.equal(E.dungeonStatus(s).entries.find(entry => entry.id === 'mist-gorge').canEnter, true); reload(s);
    }
  }
  assert.ok(found);
});

test('remaining lifespan blocks unfinished activities while immediate escape and exchanges remain available', () => {
  const end = (D.realms[0].lifespan - 16) * 12, s = fresh({ elapsedMonths: end - 1 });
  unchanged(s, () => E.interactCompanion(s, 'shenxing', 'talk')); unchanged(s, () => E.fight(s, 'ferry-guard', 'spar'));
  unchanged(s, () => E.enterDungeon(s, 'mist-gorge')); const lot = E.auctionStatus(s)[0]; unchanged(s, () => E.bidAuction(s, lot.id, lot.rivalRange[1] + 1));
  const starter = D.sects.find(sect => sect.requireRealm === 0); Object.assign(s, { sect: starter.id, sectRank: 'outer', sectMerit: 100, sectJoinedMonth: 0, contribution: 100 });
  const elapsed = s.elapsedMonths; E.exchangeFacility(s, 'pill-hall', 'qi-pair'); E.useItem(s, 'qi-pill'); assert.equal(s.elapsedMonths, elapsed);
  const t = fresh({ elapsedMonths: end - 4 }); E.enterDungeon(t, 'mist-gorge'); const active = E.dungeonStatus(t).active;
  assert.ok(active.carefulReason); assert.equal(active.boldReason, ''); assert.equal(active.canExplore, true); unchanged(t, () => E.exploreDungeon(t, 'careful'));
  const before = t.elapsedMonths; E.leaveDungeon(t); assert.equal(t.elapsedMonths, before); reload(t); reload(s);
});

test('world elapsed months expire buffs once and immediate operations never consume their duration', () => {
  const s = fresh({ elapsedMonths: 35 }); E.buyItem(s, 'ward'); const started = s.elapsedMonths; E.useItem(s, 'ward');
  assert.equal(s.elapsedMonths, started); assert.equal(s.buffs.ward, D.buffs.find(buff => buff.id === 'ward').duration);
  s.buffs.ward = 1; const result = E.interactCompanion(s, 'shenxing', 'talk'); assert.equal(s.elapsedMonths, 36); assert.equal(s.buffs.ward, undefined);
  assert.ok(result.changes.some(change => change.includes('消散'))); reload(s);
});

test('facility roles and sect hierarchy are independent gates and transfers retain learned rewards', () => {
  const s = fresh({ realm: 8 }), starter = D.sects.find(sect => sect.requireRealm === 0); E.joinSect(s, starter.id);
  s.contribution = 1000; s.sectMerit = 3000;
  assert.match(E.facilityStatus(s, 'library', 'breathing-book').reason, /内门/); E.promoteSect(s);
  const instant = s.elapsedMonths; E.exchangeFacility(s, 'library', 'breathing-book'); assert.equal(s.elapsedMonths, instant);
  E.promoteSect(s); assert.equal(s.sectRank, 'core'); assert.match(E.facilityStatus(s, 'library', 'insight-book').reason, /上级宗门/);
  const immortal = D.sects.find(sect => sect.requireRealm === 7); E.joinSect(s, immortal.id); assert.equal(s.sectRank, 'outer'); assert.equal(s.contribution, 0); assert.ok(s.perks.includes('sect-meditation'));
  s.sectMerit = 3000; s.contribution = 1000; while (E.rankIndex(s.sectRank) < E.rankIndex('immortal-elder')) E.promoteSect(s);
  const before = s.elapsedMonths; E.exchangeFacility(s, 'library', 'immortal-book'); assert.equal(s.elapsedMonths, before); assert.ok(s.perks.includes('immortal-sutra')); reload(s);
});

test('version-one world records migrate without changing relationships, auction results or the random sequence', () => {
  const s = fresh(); E.interactCompanion(s, 'shenxing', 'talk'); const lot = E.auctionStatus(s)[0]; E.bidAuction(s, lot.id, lot.rivalRange[1] + 1);
  const legacy = E.clone(s); legacy.world.version = 1; legacy.world.used = 2; legacy.world.activityLog = [{ kind: 'talk', target: 'shenxing' }, { kind: 'auction', target: lot.id }];
  const seed = legacy.seed, lots = E.clone(legacy.world.auction), relations = E.clone(legacy.world.relationships); const upgraded = E.validate(legacy);
  assert.equal(upgraded.world.version, 2); assert.equal(upgraded.seed, seed); assert.deepEqual(upgraded.world.auction, lots); assert.deepEqual(upgraded.world.relationships, relations);
  assert.equal(Object.hasOwn(upgraded.world, 'used'), false); assert.equal(Object.hasOwn(upgraded.world, 'activityLog'), false); reload(upgraded);
  assert.equal(legacy.world.version, 1); legacy.world.used = 0; assert.throws(() => E.validate(legacy));
});
