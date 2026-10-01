const test = require('node:test');
const assert = require('node:assert/strict');
const E = require('../engine.js');
const D = require('../data.js');
const fresh = (overrides = {}) => {
  const s = E.create({ name: '天地试炼', root: 'metal', path: 'sword', talents: [], seed: 123 });
  Object.assign(s, { year: 3, age: 18, stones: 10000, morality: 30 }, overrides);
  s.breakthroughs = s.realm; s.world.year = s.year; s.world.auction.year = s.year; return s;
};
const unchanged = (s, operation) => { const before = JSON.stringify(s); assert.throws(operation); assert.equal(JSON.stringify(s), before); };
const reload = s => { const loaded = E.validate(JSON.parse(JSON.stringify(s))); assert.deepEqual(loaded, s); return loaded; };
const nextYear = s => {
  E.setPlan(s, ['rest', 'rest', 'rest']); E.advance(s); if (s.phase === 'ending') return;
  const event = { id: 'world-test-neutral', title: '平安一年', choices: [{ text: '继续', result: '山中无事。', effects: {} }] };
  D.events.push(event); try { s.pendingEvent = event.id; E.choose(s, 0); } finally { D.events.pop(); }
};
const readyPartner = (s, id = 'qinghe', affection = 60) => { Object.assign(s.world.relationships[id], { met: true, affection, lastInteractionYear: s.year - 1 }); return id; };
const seedAt = i => Math.imul(i, 2654435761) >>> 0;

test('world initialization is deterministic and never consumes the character random sequence', () => {
  const a = fresh(), b = fresh(); assert.deepEqual(a.world, b.world); assert.equal(a.seed, 123);
  assert.equal(E.worldStatus(a).remaining, 2); assert.equal(E.auctionStatus(a).length, 3); reload(a);
  const publicLots = E.auctionStatus(a); assert.ok(publicLots.every(lot => !Object.hasOwn(lot, 'rivalBid')));
  for (const lot of publicLots) assert.ok(lot.rivalRange[0] <= lot.rivalRange[1]);
});

test('all world actions honor the two-action budget and empty annual plan while invalid input is atomic', () => {
  const s = fresh(), npc = 'shenxing', opponent = D.opponents[0].id, dungeon = D.dungeons[0].id;
  const attempts = [() => E.interactCompanion(s, npc, 'talk'), () => E.bidAuction(s, E.auctionStatus(s)[0].id, 1000), () => E.enterDungeon(s, dungeon), () => E.fight(s, opponent, 'spar')];
  E.addPlan(s, 'rest'); for (const attempt of attempts) unchanged(s, attempt); assert.match(E.worldStatus(s).reason, /清空/); E.removePlan(s, 0);
  unchanged(s, () => E.interactCompanion(s, npc, 'missing')); unchanged(s, () => E.bidAuction(s, 'missing', 100)); unchanged(s, () => E.fight(s, opponent, 'missing'));
  E.interactCompanion(s, npc, 'talk'); E.fight(s, opponent, 'spar'); assert.equal(E.worldStatus(s).remaining, 0);
  for (const attempt of attempts) unchanged(s, attempt); const seed = s.seed; nextYear(s);
  assert.equal(E.worldStatus(s).remaining, 2); assert.notEqual(s.world.auction.year, 3); assert.ok(Number.isInteger(seed)); reload(s);
});

test('facilities spend contribution without using exploration actions and enforce ownership, realm and reputation', () => {
  const s = fresh({ realm: 1, contribution: 1000 });
  unchanged(s, () => E.exchangeFacility(s, 'pill-hall', 'qi-pair')); E.joinSect(s, D.sects[0].id);
  const contribution = s.contribution; const receipt = E.exchangeFacility(s, 'pill-hall', 'qi-pair');
  assert.equal(s.contribution, contribution - 30); assert.equal(s.inventory['qi-pill'], 2); assert.equal(receipt.effects.contribution, -30); assert.equal(s.world.used, 0);
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
    if (s.world.auction.lots[0].outcome === 'lost') { lost = true; assert.equal(s.stones, initial); assert.equal(s.world.used, 1); }
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
      const s = fresh({ realm: definition.requireRealm, physique: 100, spirit: 100, reputation: 100, seed: seedAt(attempt), health: 100 });
      E.enterDungeon(s, definition.id); assert.equal(s.stones, 10000 - definition.entryCost);
      while (s.world.dungeon.active && s.phase === 'planning') {
        if (!E.worldStatus(s).remaining) nextYear(s); s.health = 100;
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
  const health = s.health; E.leaveDungeon(s); assert.equal(s.health, health); assert.equal(s.world.used, 2); assert.equal(s.world.dungeon.active, null); reload(s);
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
    s => { s.world.activityLog = [{ kind: 'talk', target: 'qinghe' }]; }, s => { s.world.used = 1; s.world.activityLog = [{ kind: 'missing', target: 'qinghe' }]; },
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
