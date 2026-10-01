(function (global) {
  'use strict';
  function createXWorld(D, H) {
    const find = (list, id) => (list || []).find(value => value.id === id);
    const limits = { activities: 2, affection: 100 };
    const maxYear = () => Math.max(...D.realms.map(realm => realm.lifespan || 0)) - 15;
    const whole = (value, low, high) => Number.isInteger(value) && value >= low && value <= high;
    const object = value => value && typeof value === 'object' && !Array.isArray(value);
    const keys = (value, allowed) => object(value) && Object.keys(value).every(key => allowed.includes(key));
    const blankRelationship = () => ({ met: false, affection: 0, lastInteractionYear: 0, lastBondYear: 0 });
    const blankHistory = () => ({ completedYear: null, lastOutcome: null, lastYear: null, failedYear: null, attempts: 0 });

    function createAuction(s) {
      const rng = { seed: (Math.imul((s.seed ^ s.year) >>> 0, 2654435761) ^ 0xa511e9b3) >>> 0 };
      const pool = (D.auctionPool || []).filter(lot => s.realm >= (lot.requireRealm || 0));
      if (pool.length < 3) throw Error('当前境界的拍卖目录不足三件');
      const remaining = [...pool], lots = [];
      for (let i = 0; i < 3; i++) {
        const definition = remaining.splice(Math.floor(H.random(rng) * remaining.length), 1)[0];
        const rivalMin = Math.max(1, Math.ceil(definition.basePrice * .85)), rivalMax = Math.max(rivalMin, Math.ceil(definition.basePrice * 1.5));
        lots.push({ id: `slot-${i + 1}`, itemId: definition.itemId, quantity: definition.quantity, basePrice: definition.basePrice,
          rivalMin, rivalMax, rivalBid: rivalMin + Math.floor(H.random(rng) * (rivalMax - rivalMin + 1)), closed: false, outcome: null, winningBid: null, playerBid: null });
      }
      return { year: s.year, lots };
    }
    function initialize(s) {
      if (s.world !== undefined) return;
      s.world = { version: 1, year: s.year, used: 0, activityLog: [], relationships: Object.fromEntries(D.companions.map(person => [person.id, blankRelationship()])), partnerId: null,
        auction: createAuction(s), dungeon: { active: null, history: Object.fromEntries(D.dungeons.map(dungeon => [dungeon.id, blankHistory()])) },
        combat: Object.fromEntries(D.opponents.map(opponent => [opponent.id, { sparYear: 0, robYear: 0 }])) };
    }
    function afterYear(s) {
      if (s.phase !== 'planning' || s.health <= 0 || s.world.year === s.year) return;
      s.world.year = s.year; s.world.used = 0; s.world.activityLog = []; s.world.auction = createAuction(s);
    }
    function blocker(s, activity = true) {
      if (s.phase !== 'planning') return '先处理当前奇遇或查看此生结局';
      if (s.plan.length) return '请先清空今年的修行安排，再进行天地游历';
      if (activity && s.world.used >= limits.activities) return '今年的天地游历次数已用完';
      return '';
    }
    function worldStatus(s) { return { remaining: Math.max(0, limits.activities - s.world.used), limit: 2, reason: blocker(s) }; }
    function moralityStatus(s) {
      const value = s.morality || 0;
      const [title, desc] = value >= 60 ? ['功德真人', '善行已有回响，坊市购买减价 5%，同道更愿与你结缘。'] : value >= 20 ? ['侠义之名', '坊市购买减价 5%，部分正道因缘更愿向你敞开。'] : value > -20 ? ['未有定评', '善恶尚未成名，坊市按平价交易。'] : value > -60 ? ['行事乖张', '坊市购买加价 15%，正派同道可能疏远你。'] : ['恶名昭著', '坊市加价 15%，宗门拒绝新入门与堂口兑换；行善可以挽回。'];
      return { value, title, desc, shopModifier: value >= 20 ? -.05 : value <= -20 ? .15 : 0 };
    }
    function benefits(s) {
      const partner = find(D.companions, s.world?.partnerId);
      return partner && s.world.relationships[partner.id]?.affection > 0 ? [partner] : [];
    }
    function receipt(s, error, run) {
      const reason = error(s); if (reason) throw Error(reason);
      const next = H.clone(s), before = H.snap(next), result = run(next);
      if (next.health <= 0) { H.end(next); result.changes.push('气血耗尽，此生止于此处。'); }
      const answer = { title: result.title, text: result.text, effects: H.diff(before, H.snap(next)), changes: result.changes || [] };
      H.log(next, `${answer.title}：${answer.text}`, 'world');
      for (const change of answer.changes) H.log(next, change, 'world');
      Object.assign(s, next); return answer;
    }
    function useActivity(s, kind, target) { s.world.used++; s.world.activityLog.push({ kind, target }); }

    function facilityStatus(s, facilityId, offerId) {
      const facility = find(D.facilities, facilityId), offer = find(facility?.offers, offerId); let reason = blocker(s, false);
      if (!reason && (!facility || !offer)) reason = '没有这项堂口兑换';
      if (!reason && !s.sect) reason = '拜入宗门后才能使用堂口';
      if (!reason && (s.morality || 0) <= -60) reason = '恶名昭著，堂口暂不接待；先以善行挽回声名';
      if (!reason && s.realm < (offer.requireRealm || 0)) reason = `达到${D.realms[offer.requireRealm].name}后可兑换`;
      if (!reason && s.contribution < offer.cost) reason = `需要 ${offer.cost} 点宗门贡献`;
      if (!reason && offer.grantPerk && s.perks.includes(offer.grantPerk)) reason = '已经掌握这份传承，不必重复兑换';
      if (!reason) reason = H.consequenceError(s, offer);
      return { canExchange: !reason, reason, cost: offer?.cost || 0 };
    }
    function exchangeFacility(s, facilityId, offerId) {
      return receipt(s, state => facilityStatus(state, facilityId, offerId).reason, state => {
        const facility = find(D.facilities, facilityId), offer = find(facility.offers, offerId);
        H.apply(state, { contribution: -offer.cost }); H.apply(state, offer.effects);
        return { title: '堂口兑换完成', text: `以 ${offer.cost} 点贡献换得${offer.name}。`, changes: H.consequences(state, offer) };
      });
    }
    function companionReason(s, person, action) {
      let reason = blocker(s); if (reason) return reason;
      if (!person || !['talk', 'gift', 'bond', 'separate'].includes(action)) return '没有这位同道或这种相处方式';
      const relation = s.world.relationships[person.id];
      if (action === 'separate') return s.world.partnerId === person.id ? '' : '你们尚未结为道侣';
      if (s.realm < person.requireRealm) return `达到${D.realms[person.requireRealm].name}后才能结识`;
      if ((s.morality || 0) < person.minMorality) return `对方希望与你结交时善恶至少达到 ${person.minMorality}`;
      if (action === 'bond') {
        if (s.age < 18) return '成年后（18 岁）才能商议结为道侣';
        if (s.world.partnerId) return s.world.partnerId === person.id ? '已经互许同道之约' : '已有道侣，请先妥善结束原有关系';
        if (relation.lastBondYear === s.year) return '这一年已谈过此事，留些时间再作决定';
        if (!relation.met || relation.affection < 60) return '相知达到 60 后，双方才能互许同道之约';
      } else {
        if (relation.lastInteractionYear === s.year) return '今年已经与这位同道相处过，来年再叙';
        if (action === 'gift' && s.stones < 60) return '赠礼需要 60 灵石';
        if (relation.affection >= 100) return '已十分相知，来年再叙即可';
      }
      return '';
    }
    function companionStatus(s, id) {
      const person = find(D.companions, id), relation = s.world.relationships[id] || blankRelationship(), partner = find(D.companions, s.world.partnerId);
      const actions = [['talk', '问道闲谈', 0], ['gift', '赠一份心意', 60], ['bond', '互许同道之约', 0], ['separate', '平静告别', 0]].map(([action, label, cost]) => {
        const reason = companionReason(s, person, action); return { id: action, label, cost, canDo: !reason, reason };
      });
      return { id, name: person?.name || '未识同道', gender: person?.gender, desc: person?.desc || '', requireRealm: person?.requireRealm, minMorality: person?.minMorality,
        met: relation.met, affection: relation.affection, bonded: s.world.partnerId === id, isPartner: s.world.partnerId === id, partnerName: partner?.name || null,
        canBond: actions[2].canDo, reason: actions[2].reason, actions,
        benefitsText: person ? Object.entries(person.actions || {}).map(([action, effects]) => `${find(D.actions, action)?.name || action}：${effectText(effects)}`).concat(person.powerBonus ? [`战力 +${person.powerBonus}`] : []) : [] };
    }
    function interactCompanion(s, id, action) {
      return receipt(s, state => companionReason(state, find(D.companions, id), action), state => {
        const person = find(D.companions, id), relation = state.world.relationships[id]; useActivity(state, action, id); relation.met = true;
        let text; const changes = [];
        if (action === 'talk' || action === 'gift') {
          const before = relation.affection; relation.affection = Math.min(100, before + (action === 'gift' ? 20 : 12)); relation.lastInteractionYear = state.year;
          if (action === 'gift') H.apply(state, { stones: -60 });
          text = action === 'gift' ? `你将一份合意的修行小物送给${person.name}，对方欣然收下。` : `你与${person.name}聊起修行见闻，彼此多了一分了解。`;
          changes.push(`与${person.name}的相知 +${relation.affection - before}，现为 ${relation.affection} / 100`);
        } else if (action === 'bond') {
          state.world.partnerId = id; relation.lastBondYear = state.year; text = `你坦诚提出同行之约，${person.name}郑重应允。你们自愿结为道侣，各自保留修行与去留的意愿。`;
          changes.push('解锁「同心共修」，并获得道侣的常驻修行收益。');
        } else {
          state.world.partnerId = null; relation.lastBondYear = state.year; text = `你与${person.name}认真告别，决定各自继续修行。`;
          changes.push('同心共修与该同道的常驻收益已结束；相识的经历仍在。');
        }
        return { title: action === 'bond' ? '同道之约' : action === 'separate' ? '各自珍重' : '同道相处', text, changes };
      });
    }

    function lotReason(s, lot, bid) {
      let reason = blocker(s); if (reason) return reason;
      if (!lot) return '没有这件拍品'; if (lot.closed) return '这件拍品已经落槌，本年不能再次出价';
      const item = find(D.items, lot.itemId); if ((s.inventory[lot.itemId] || 0) + lot.quantity > item.max) return `行囊放不下${item.name} ×${lot.quantity}`;
      if (bid !== undefined && (!Number.isSafeInteger(bid) || bid < lot.basePrice)) return `报价须为不少于 ${lot.basePrice} 的整数灵石`;
      if (s.stones < (bid === undefined ? lot.basePrice : bid)) return '需要备足所报价格的灵石'; return '';
    }
    function auctionStatus(s) {
      return s.world.auction.lots.map(lot => ({ id: lot.id, itemId: lot.itemId, name: find(D.items, lot.itemId).name, quantity: lot.quantity, basePrice: lot.basePrice, minBid: lot.basePrice,
        rivalRange: [lot.rivalMin, lot.rivalMax], closed: lot.closed, outcome: lot.outcome, winningBid: lot.winningBid, playerBid: lot.playerBid, canBid: !lotReason(s, lot), reason: lotReason(s, lot) }));
    }
    function bidAuction(s, lotId, bid) {
      return receipt(s, state => !Number.isSafeInteger(bid) ? '请填写整数灵石报价' : lotReason(state, find(state.world.auction.lots, lotId), bid), state => {
        const lot = find(state.world.auction.lots, lotId), won = bid > lot.rivalBid; useActivity(state, 'auction', lotId); lot.closed = true; lot.playerBid = bid; lot.outcome = won ? 'won' : 'lost'; lot.winningBid = won ? bid : lot.rivalBid;
        const changes = won ? H.consequences(state, { gainItems: { [lot.itemId]: lot.quantity } }) : [];
        if (won) H.apply(state, { stones: -bid }); changes.push('本件拍品已落槌，本年不再开放出价。');
        return { title: won ? '拍得珍物' : '本轮未得', text: won ? `你的 ${bid} 灵石密封报价胜出，按自己的报价成交。` : `他人的 ${lot.rivalBid} 灵石报价胜出（同价由对方先落锤），你的灵石如数保留。`, changes };
      });
    }
    function effectText(effects) { return Object.entries(effects || {}).map(([id, amount]) => `${H.labels[id] || id} ${amount > 0 ? '+' : ''}${amount}`).join('、'); }
    function rewardText(reward) {
      return [effectText(reward.effects), ...Object.entries(reward.gainItems || {}).map(([id, count]) => `${find(D.items, id).name} ×${count}`), reward.grantPerk ? `长久收获「${find(D.perks, reward.grantPerk).name}」` : ''].filter(Boolean).join('；');
    }
    function dungeonEntryReason(s, definition) {
      let reason = blocker(s); if (reason) return reason; if (!definition) return '没有这处秘境';
      if (s.world.dungeon.active) return '先完成或离开正在探索的秘境';
      const history = s.world.dungeon.history[definition.id];
      if (history.completedYear !== null) return '这一生已经取得此地传承';
      if (history.failedYear === s.year) return '本年已在此地受挫，来年再试';
      if (s.realm < definition.requireRealm) return `达到${D.realms[definition.requireRealm].name}后才能进入`;
      if (s.stones < definition.entryCost) return `进入需要 ${definition.entryCost} 灵石`; return '';
    }
    function stageInfo(s) {
      const active = s.world.dungeon.active; if (!active) return null; const definition = find(D.dungeons, active.id);
      const difficulty = definition.difficulty * (1 + active.stage * .16), relative = (H.power(s) - difficulty) / Math.max(60, difficulty);
      return { active, definition, carefulChance: H.clamp(.78 + relative * .25, .3, .95), boldChance: H.clamp(.6 + relative * .28, .15, .9),
        carefulLoss: 3 + s.realm * 2, boldLoss: 6 + s.realm * 3, carefulFailure: 10 + s.realm * 5, boldFailure: 20 + s.realm * 7 };
    }
    function stageReason(s, approach) {
      let reason = blocker(s); if (reason) return reason;
      if (!['careful', 'bold'].includes(approach)) return '请选择谨慎探查或冒险深入';
      const info = stageInfo(s); if (!info) return '尚未进入秘境';
      if (info.active.stage === 2) { reason = H.consequenceError(s, info.definition.reward); if (reason) return `最后一关的奖励暂无法领取：${reason}；可先整理行囊或安全离开`; }
      return '';
    }
    function dungeonStatus(s) {
      const info = stageInfo(s); let active = null;
      if (info) {
        const reason = stageReason(s, 'careful'); active = { id: info.definition.id, name: info.definition.name, stage: info.active.stage + 1, total: 3,
          chance: info.carefulChance, carefulChance: info.carefulChance, boldChance: info.boldChance, canExplore: !reason, reason,
          risk: `谨慎：成功损失 ${info.carefulLoss} 气血，失败损失 ${info.carefulFailure}；冒险：成功损失 ${info.boldLoss}，失败损失 ${info.boldFailure}，并可能受伤。气血不足可能陨落。`,
          rewardText: `每关成功获得修为，冒险每关多得修为；第三关另获：${rewardText(info.definition.reward)}` };
      }
      return { active, entries: D.dungeons.map(definition => { const history = s.world.dungeon.history[definition.id], reason = dungeonEntryReason(s, definition); return { id: definition.id, name: definition.name, desc: definition.desc, entryCost: definition.entryCost, requireRealm: definition.requireRealm,
        canEnter: !reason, reason, completed: history.completedYear !== null, completedYear: history.completedYear, failedYear: history.failedYear, lastOutcome: history.lastOutcome, lastYear: history.lastYear, attempts: history.attempts }; }) };
    }
    function enterDungeon(s, id) {
      return receipt(s, state => dungeonEntryReason(state, find(D.dungeons, id)), state => {
        const definition = find(D.dungeons, id); useActivity(state, 'enter', id); H.apply(state, { stones: -definition.entryCost });
        state.world.dungeon.active = { id, stage: 0, enteredYear: state.year, boldStages: 0 }; state.world.dungeon.history[id].attempts++;
        return { title: '踏入秘境', text: `你支付 ${definition.entryCost} 灵石，进入${definition.name}。`, changes: ['探索共三关，可跨年继续；每关占一次天地游历，随时可以安全离开。'] };
      });
    }
    function concludeDungeon(s, outcome) {
      const id = s.world.dungeon.active.id, history = s.world.dungeon.history[id]; history.lastOutcome = outcome; history.lastYear = s.year;
      if (outcome === 'completed') history.completedYear = s.year;
      if (outcome === 'failed') history.failedYear = s.year;
      s.world.dungeon.active = null;
    }
    function exploreDungeon(s, approach) {
      return receipt(s, state => stageReason(state, approach), state => {
        const info = stageInfo(state), bold = approach === 'bold', chance = bold ? info.boldChance : info.carefulChance, success = H.random(state) < chance;
        useActivity(state, 'explore', info.definition.id); const stage = info.active.stage + 1; const changes = [];
        if (!success) {
          H.apply(state, { health: -(bold ? info.boldFailure : info.carefulFailure), resolve: bold ? -10 : -5 });
          if (bold) changes.push(...H.consequences(state, { addCondition: 'injured' })); concludeDungeon(state, 'failed');
          changes.push('本次探索失败，已撤出秘境；下一年可以重新尝试。');
          return { title: '秘境受挫', text: `${info.definition.name}第 ${stage} 关未能通过（成功率 ${Math.round(chance * 100)}%）。`, changes };
        }
        H.apply(state, { health: -(bold ? info.boldLoss : info.carefulLoss), cultivation: Math.round((12 + state.realm * 6) * (bold ? 1.5 : 1)) });
        info.active.stage++; if (bold) info.active.boldStages++;
        if (state.health <= 0) { concludeDungeon(state, 'failed'); changes.push('虽闯过机关，伤势仍耗尽气血，未能带回传承。'); }
        else if (info.active.stage === 3) { H.apply(state, info.definition.reward.effects); changes.push(...H.consequences(state, info.definition.reward)); concludeDungeon(state, 'completed'); changes.push('三关已尽，此处传承记入行卷，一生只领取一次。'); }
        else changes.push(`已通过 ${info.active.stage} / 3 关；剩余机关等待下一次探索。`);
        return { title: stage === 3 && state.health > 0 ? '秘境圆满' : '闯关成功', text: `${info.definition.name}第 ${stage} 关通过（成功率 ${Math.round(chance * 100)}%）。`, changes };
      });
    }
    function leaveDungeon(s) {
      return receipt(s, state => blocker(state, false) || (!state.world.dungeon.active ? '当前不在秘境中' : ''), state => {
        const name = find(D.dungeons, state.world.dungeon.active.id).name; concludeDungeon(state, 'abandoned');
        return { title: '平安离开', text: `你及时收步，安全离开${name}；已付的入境费用不退还。`, changes: ['离开不消耗天地游历次数，也不会受伤；下次进入从第一关开始。'] };
      });
    }
    function combatStatus(s, id, mode) {
      const opponent = find(D.opponents, id), opponentPower = Math.max(5, s.realm * 30 + s.realm * s.realm * 12 + 28 + (opponent?.powerOffset || 0));
      const chance = H.clamp(.6 + (H.power(s) - opponentPower) / Math.max(50, opponentPower) * .35, .1, .95);
      const loot = Math.round((opponent?.loot || 0) * (1 + s.realm * .5)), loss = mode === 'spar' ? 8 + s.realm * 2 : 22 + s.realm * 7;
      let reason = blocker(s);
      if (!reason && (!opponent || !['spar', 'rob'].includes(mode))) reason = '没有这位对手或这种对战方式';
      if (!reason && s.realm < opponent.requireRealm) reason = `达到${D.realms[opponent.requireRealm].name}后才能相遇`;
      if (!reason && s.world.combat[id][mode === 'spar' ? 'sparYear' : 'robYear'] === s.year) reason = '本年已与此人进行过这类对战';
      return { id, mode, chance, opponentPower, loot, healthLoss: loss, canFight: !reason, reason, moralityChange: mode === 'spar' ? 2 : -18,
        rewardText: mode === 'spar' ? `无论胜败善恶 +2；获胜修为 +${10 + s.realm * 5}，失败也有少量心得。` : `无论胜败善恶 -18；获胜夺得 ${loot} 灵石，正派道侣可能因此疏远。`,
        risk: mode === 'spar' ? `失败损失 ${loss} 气血，成功损失 ${Math.ceil(loss / 3)}；切磋最多伤至 1 气血，不会致命。` : `失败损失 ${loss} 气血并受伤，可能陨落；成功也损失 ${Math.ceil(loss / 3)} 气血。` };
    }
    function fight(s, id, mode) {
      return receipt(s, state => combatStatus(state, id, mode).reason, state => {
        const status = combatStatus(state, id, mode), opponent = find(D.opponents, id), won = H.random(state) < status.chance, changes = [];
        useActivity(state, mode, id); state.world.combat[id][mode === 'spar' ? 'sparYear' : 'robYear'] = state.year;
        const loss = won ? Math.ceil(status.healthLoss / 3) : status.healthLoss;
        H.apply(state, { morality: status.moralityChange, health: mode === 'spar' ? -Math.min(loss, Math.max(0, state.health - 1)) : -loss });
        if (mode === 'spar') H.apply(state, { cultivation: won ? 10 + state.realm * 5 : 3 + state.realm * 2 });
        else {
          if (won) H.apply(state, { stones: status.loot }); else changes.push(...H.consequences(state, { addCondition: 'injured' }));
          const partner = find(D.companions, state.world.partnerId);
          if (partner && partner.minMorality >= 0) {
            const relation = state.world.relationships[partner.id], before = relation.affection; relation.affection = Math.max(0, relation.affection - 25);
            changes.push(`${partner.name}不认同劫掠之举，相知 -${before - relation.affection}，现为 ${relation.affection} / 100。`);
            if (relation.affection === 0) { state.world.partnerId = null; relation.lastBondYear = state.year; changes.push(`${partner.name}主动结束同道之约，道侣收益与共修已停止。`); }
          }
        }
        return { title: mode === 'spar' ? won ? '切磋得胜' : '切磋受教' : won ? '劫掠得手' : '劫掠受挫', text: `你与${opponent.name}交锋，${won ? '占得上风' : '未能取胜'}（胜率 ${Math.round(status.chance * 100)}%）。`, changes };
      });
    }

    function validate(s) {
      const w = s.world, fail = text => { throw Error(`天地行卷无效：${text}`); }, date = n => whole(n, 0, s.year);
      if (!keys(w, ['version', 'year', 'used', 'activityLog', 'relationships', 'partnerId', 'auction', 'dungeon', 'combat']) || w.version !== 1 || !whole(w.year, 1, maxYear()) || (w.year !== s.year && !(s.phase === 'ending' && w.year === s.year - 1)) || !whole(w.used, 0, 2)) fail('年度记录');
      if (!Array.isArray(w.activityLog) || w.activityLog.length !== w.used || w.activityLog.some(entry => !keys(entry, ['kind', 'target']) || !['talk', 'gift', 'bond', 'separate', 'auction', 'enter', 'explore', 'spar', 'rob'].includes(entry.kind) || typeof entry.target !== 'string')) fail('游历次数');
      const activityCount = (kinds, target) => w.activityLog.filter(entry => kinds.includes(entry.kind) && entry.target === target).length;
      for (const entry of w.activityLog) {
        if (['talk', 'gift', 'bond', 'separate'].includes(entry.kind) && !find(D.companions, entry.target) || ['enter', 'explore'].includes(entry.kind) && !find(D.dungeons, entry.target) || ['spar', 'rob'].includes(entry.kind) && !find(D.opponents, entry.target) || entry.kind === 'auction' && !['slot-1', 'slot-2', 'slot-3'].includes(entry.target)) fail('游历对象');
      }
      if (!keys(w.relationships, D.companions.map(person => person.id)) || Object.keys(w.relationships).length !== D.companions.length) fail('同道名册');
      for (const person of D.companions) {
        const r = w.relationships[person.id];
        if (!keys(r, ['met', 'affection', 'lastInteractionYear', 'lastBondYear']) || typeof r.met !== 'boolean' || !whole(r.affection, 0, 100) || !date(r.lastInteractionYear) || !date(r.lastBondYear) || !r.met && (r.affection || r.lastInteractionYear || r.lastBondYear)) fail('相知记录');
        if (r.met && s.realm < person.requireRealm) fail('同道境界门槛');
        if (activityCount(['talk', 'gift'], person.id) !== (r.lastInteractionYear === w.year ? 1 : 0) || activityCount(['bond'], person.id) > 1 || activityCount(['separate'], person.id) > 1 || activityCount(['bond', 'separate'], person.id) > 0 && r.lastBondYear !== w.year) fail('年度相处记录');
        if (r.lastBondYear > 0 && r.lastBondYear + 15 < 18) fail('未成年结缘');
      }
      if (w.partnerId !== null && (!find(D.companions, w.partnerId) || !w.relationships[w.partnerId].met || w.relationships[w.partnerId].affection <= 0 || w.relationships[w.partnerId].lastBondYear === 0 || s.age < 18)) fail('道侣关系');
      if (!keys(w.auction, ['year', 'lots']) || w.auction.year !== w.year || !Array.isArray(w.auction.lots) || w.auction.lots.length !== 3) fail('拍卖年度');
      for (const [i, lot] of w.auction.lots.entries()) {
        if (!keys(lot, ['id', 'itemId', 'quantity', 'basePrice', 'rivalMin', 'rivalMax', 'rivalBid', 'closed', 'outcome', 'winningBid', 'playerBid'])) fail('拍品字段');
        const definition = D.auctionPool.find(entry => entry.itemId === lot.itemId && entry.quantity === lot.quantity && entry.basePrice === lot.basePrice && s.realm >= (entry.requireRealm || 0));
        if (!definition || lot.id !== `slot-${i + 1}` || lot.rivalMin !== Math.max(1, Math.ceil(lot.basePrice * .85)) || lot.rivalMax !== Math.max(lot.rivalMin, Math.ceil(lot.basePrice * 1.5)) || !whole(lot.rivalBid, lot.rivalMin, lot.rivalMax) || typeof lot.closed !== 'boolean') fail('拍品内容');
        if (!lot.closed && (lot.outcome !== null || lot.winningBid !== null || lot.playerBid !== null)) fail('未落槌拍品');
        if (lot.closed && (!whole(lot.playerBid, lot.basePrice, 1000000000) || lot.outcome !== (lot.playerBid > lot.rivalBid ? 'won' : 'lost') || lot.winningBid !== (lot.outcome === 'won' ? lot.playerBid : lot.rivalBid))) fail('拍卖结果');
        if (activityCount(['auction'], lot.id) !== (lot.closed ? 1 : 0)) fail('拍卖游历记录');
      }
      if (new Set(w.auction.lots.map(lot => `${lot.itemId}:${lot.quantity}:${lot.basePrice}`)).size !== 3 || w.auction.lots.filter(lot => lot.closed).length > w.used) fail('拍卖次数');
      if (!keys(w.dungeon, ['active', 'history']) || !keys(w.dungeon.history, D.dungeons.map(dungeon => dungeon.id)) || Object.keys(w.dungeon.history).length !== D.dungeons.length) fail('秘境名册');
      for (const definition of D.dungeons) {
        const h = w.dungeon.history[definition.id];
        if (!keys(h, ['completedYear', 'lastOutcome', 'lastYear', 'failedYear', 'attempts']) || !whole(h.attempts, 0, s.year * 2) || h.completedYear !== null && !whole(h.completedYear, 1, s.year) || h.failedYear !== null && !whole(h.failedYear, 1, s.year) || h.lastYear !== null && !whole(h.lastYear, 1, s.year) || ![null, 'completed', 'failed', 'abandoned'].includes(h.lastOutcome)) fail('秘境历史');
        if ((h.lastOutcome === null) !== (h.lastYear === null) || h.lastOutcome !== null && h.attempts === 0 || h.completedYear !== null && (h.lastOutcome !== 'completed' || h.completedYear !== h.lastYear) || h.lastOutcome === 'completed' && h.completedYear === null || h.lastOutcome === 'failed' && h.failedYear !== h.lastYear || h.failedYear !== null && (h.lastYear === null || h.failedYear > h.lastYear)) fail('秘境结局');
      }
      if (w.dungeon.active !== null) {
        const a = w.dungeon.active, definition = find(D.dungeons, a?.id);
        if (!keys(a, ['id', 'stage', 'enteredYear', 'boldStages']) || !definition || !whole(a.stage, 0, 2) || !whole(a.enteredYear, 1, s.year) || !whole(a.boldStages, 0, a.stage) || s.realm < definition.requireRealm || w.dungeon.history[a.id].completedYear !== null || w.dungeon.history[a.id].attempts < 1 || w.dungeon.history[a.id].failedYear === a.enteredYear) fail('正在探索的秘境');
      }
      if (!keys(w.combat, D.opponents.map(opponent => opponent.id)) || Object.keys(w.combat).length !== D.opponents.length) fail('对战名册');
      for (const opponent of D.opponents) { const record = w.combat[opponent.id]; if (!keys(record, ['sparYear', 'robYear']) || !date(record.sparYear) || !date(record.robYear)) fail('对战历史');
        if (activityCount(['spar'], opponent.id) !== (record.sparYear === w.year ? 1 : 0) || activityCount(['rob'], opponent.id) !== (record.robYear === w.year ? 1 : 0) || (record.sparYear > 0 || record.robYear > 0) && s.realm < opponent.requireRealm) fail('年度对战记录'); }
      return true;
    }
    return { initialize, validate, afterYear, benefits, worldStatus, moralityStatus, facilityStatus, exchangeFacility, companionStatus, interactCompanion,
      auctionStatus, bidAuction, dungeonStatus, enterDungeon, exploreDungeon, leaveDungeon, combatStatus, fight };
  }
  global.X_WORLD = createXWorld;
  if (typeof module !== 'undefined') module.exports = createXWorld;
})(typeof globalThis !== 'undefined' ? globalThis : window);
