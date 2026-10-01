(function (global) {
  'use strict';

  const D = {
    version: 2,
    realms: [
      { id: 'qi', name: '炼气', threshold: 90, lifespan: 100, subtitle: '引气入体 · 初闻大道' },
      { id: 'foundation', name: '筑基', threshold: 180, lifespan: 200, subtitle: '道基初成 · 择山而栖' },
      { id: 'core', name: '金丹', threshold: 280, lifespan: 500, subtitle: '一粒金丹 · 山河入眼' },
      { id: 'soul', name: '元婴', threshold: 420, lifespan: 1000, subtitle: '婴神离窍 · 问心问道' },
      { id: 'divinity', name: '化神', threshold: 560, lifespan: 2000, subtitle: '神游太虚 · 叩问天门' },
      { id: 'ascended', name: '飞升', threshold: 0, lifespan: null, subtitle: '此身越青冥 · 旧事留人间' }
    ],
    roots: [
      { id: 'metal', name: '金灵根', desc: '金气锐利，炼体与锻器时更容易有所收获。', start: { physique: 6 }, actions: { train: { physique: 2 }, forge: { cultivation: 3 } } },
      { id: 'wood', name: '木灵根', desc: '亲近草木，采药能养神，炼丹时灵息更顺。', start: { health: 10 }, actions: { gather: { spirit: 2 }, alchemy: { cultivation: 4 } } },
      { id: 'water', name: '水灵根', desc: '心神澄澈，静坐与参悟如细水长流。', start: { spirit: 5 }, actions: { meditate: { cultivation: 3 }, comprehend: { insight: 1 } } },
      { id: 'fire', name: '火灵根', desc: '灵力旺盛，修行进境快，炼丹也更有灵性。', start: { cultivation: 15 }, actions: { meditate: { cultivation: 4 }, alchemy: { spirit: 1 } } },
      { id: 'earth', name: '土灵根', desc: '厚重安稳，身体强健，采矿与休整更有效。', start: { physique: 4, health: 6 }, actions: { mine: { physique: 2 }, rest: { health: 4 } } }
    ],
    paths: [
      { id: 'sword', name: '剑修', desc: '以剑破局。炼体、斗法与江湖行走更得心应手。', start: { physique: 6, reputation: 2 }, actions: { train: { physique: 2 }, explore: { cultivation: 3 } } },
      { id: 'alchemy', name: '丹修', desc: '以丹养道。采药、开炉与经营灵材是修行的一部分。', start: { insight: 4, stones: 60 }, actions: { alchemy: { cultivation: 5 }, gather: { insight: 1 } } },
      { id: 'wander', name: '逍遥', desc: '山海皆道场。游历所得更丰厚，也更懂凡间生计。', start: { spirit: 4, resolve: 6 }, actions: { explore: { stones: 15 }, work: { stones: 15 } } }
    ],
    talents: [
      { id: 'early-awakening', name: '早开灵窍', rarity: 'rare', desc: '带着一缕先天灵息入道：初始修为 +30。', start: { cultivation: 30 } },
      { id: 'sword-heart', name: '剑心通明', rarity: 'rare', desc: '初始体魄 +8，炼体额外体魄 +2。', start: { physique: 8 }, actions: { train: { physique: 2 } } },
      { id: 'pill-sense', name: '丹香识药', rarity: 'rare', desc: '开炉炼丹额外修为 +6、神识 +1。', actions: { alchemy: { cultivation: 6, spirit: 1 } } },
      { id: 'quiet-mind', name: '太上忘忧', rarity: 'rare', desc: '初始心境 +12，静坐时额外心境 +2。', start: { resolve: 12 }, actions: { meditate: { resolve: 2 } } },
      { id: 'heaven-favor', name: '天道留隙', rarity: 'rare', desc: '每次破境的成功率提高 8 个百分点。', breakthroughBonus: 0.08 },
      { id: 'old-inheritance', name: '故人遗泽', rarity: 'rare', desc: '继承一袋灵石：初始灵石 +300。', start: { stones: 300 } },
      { id: 'night-reader', name: '过目不忘', rarity: 'rare', desc: '初始悟性 +6，参悟经典额外悟性 +2。', start: { insight: 6 }, actions: { comprehend: { insight: 2 } } },
      { id: 'stone-body', name: '玄石之躯', rarity: 'rare', desc: '初始体魄 +10、气血 +10，挖矿额外体魄 +1。', start: { physique: 10, health: 10 }, actions: { mine: { physique: 1 } } },
      { id: 'spirit-ear', name: '听见山河', rarity: 'rare', desc: '初始神识 +10，游历额外神识 +2。', start: { spirit: 10 }, actions: { explore: { spirit: 2 } } },
      { id: 'warm-furnace', name: '炉火常青', rarity: 'rare', desc: '炼丹与锻器各少消耗 15 灵石。', actions: { alchemy: { stones: 15 }, forge: { stones: 15 } } },
      { id: 'tireless', name: '百折不回', rarity: 'rare', desc: '初始心境 +8，破境成功率提高 4 个百分点。', start: { resolve: 8 }, breakthroughBonus: 0.04 },
      { id: 'small-universe', name: '壶中天地', rarity: 'rare', desc: '静坐额外修为 +5，歇息额外心境 +3。', actions: { meditate: { cultivation: 5 }, rest: { resolve: 3 } } },
      { id: 'village-child', name: '山村长大', rarity: 'common', desc: '初始气血 +8，采药额外气血 +2。', start: { health: 8 }, actions: { gather: { health: 2 } } },
      { id: 'family-savings', name: '薄有家资', rarity: 'common', desc: '初始灵石 +150。', start: { stones: 150 } },
      { id: 'patient', name: '坐得住', rarity: 'common', desc: '静坐额外修为 +3。', actions: { meditate: { cultivation: 3 } } },
      { id: 'curious', name: '爱问缘由', rarity: 'common', desc: '初始悟性 +6，参悟时额外修为 +2。', start: { insight: 6 }, actions: { comprehend: { cultivation: 2 } } },
      { id: 'steady-breath', name: '气息绵长', rarity: 'common', desc: '初始气血 +10，炼体的气血消耗减少 2。', start: { health: 10 }, actions: { train: { health: 2 } } },
      { id: 'night-walk', name: '夜路熟客', rarity: 'common', desc: '游历额外灵石 +15、神识 +1。', actions: { explore: { stones: 15, spirit: 1 } } },
      { id: 'nimble-hands', name: '手巧心细', rarity: 'common', desc: '锻器额外修为 +4、神识 +1。', actions: { forge: { cultivation: 4, spirit: 1 } } },
      { id: 'herbal-memory', name: '识百草', rarity: 'common', desc: '采药额外悟性 +2。', actions: { gather: { insight: 2 } } },
      { id: 'merchant-smile', name: '会做买卖', rarity: 'common', desc: '凡间营生额外灵石 +25。', actions: { work: { stones: 25 } } },
      { id: 'good-sleeper', name: '倒头就睡', rarity: 'common', desc: '歇息额外气血 +6、心境 +3。', actions: { rest: { health: 6, resolve: 3 } } },
      { id: 'kind-face', name: '一眼投缘', rarity: 'common', desc: '初始声望 +8，山门差事额外声望 +1。', start: { reputation: 8 }, actions: { mission: { reputation: 1 } } },
      { id: 'iron-will', name: '认准一条路', rarity: 'common', desc: '初始心境 +10。', start: { resolve: 10 } },
      { id: 'old-scroll', name: '残卷启蒙', rarity: 'common', desc: '初始修为 +15、悟性 +3。', start: { cultivation: 15, insight: 3 } },
      { id: 'river-swimmer', name: '江上少年', rarity: 'common', desc: '初始体魄 +6，炼体额外气血 +1。', start: { physique: 6 }, actions: { train: { health: 1 } } },
      { id: 'quiet-listener', name: '善听弦外音', rarity: 'common', desc: '初始神识 +6，听山门讲经额外悟性 +1。', start: { spirit: 6 }, actions: { lecture: { insight: 1 } } },
      { id: 'trustworthy', name: '一诺千金', rarity: 'common', desc: '山门差事额外贡献 +5，护送额外声望 +1。', actions: { mission: { contribution: 5 }, 'escort-work': { reputation: 1 } } },
      { id: 'beast-friend', name: '鸟兽不惊', rarity: 'common', desc: '照料灵兽额外神识 +2、心境 +2。', actions: { 'beast-care': { spirit: 2, resolve: 2 } } },
      { id: 'ruin-reader', name: '喜好金石', rarity: 'common', desc: '参悟石碑额外悟性 +2，秘境考据额外修为 +4。', actions: { inscription: { insight: 2 }, 'secret-study': { cultivation: 4 } } },
      { id: 'small-lantern', name: '心有归处', rarity: 'common', desc: '初始心境 +6，凡间营生额外心境 +3。', start: { resolve: 6 }, actions: { work: { resolve: 3 } } },
      { id: 'frugal', name: '精打细算', rarity: 'common', desc: '初始灵石 +80，讲经与石碑参悟各少花 10 灵石。', start: { stones: 80 }, actions: { lecture: { stones: 10 }, inscription: { stones: 10 } } },
      { id: 'stargazer', name: '观星入梦', rarity: 'common', desc: '初始神识 +4，静坐额外神识 +1。', start: { spirit: 4 }, actions: { meditate: { spirit: 1 } } },
      { id: 'road-notes', name: '随手记事', rarity: 'common', desc: '游历额外悟性 +1，秘境考据额外神识 +1。', actions: { explore: { insight: 1 }, 'secret-study': { spirit: 1 } } },
      { id: 'mining-family', name: '矿户出身', rarity: 'common', desc: '挖矿额外灵石 +20，初始体魄 +3。', start: { physique: 3 }, actions: { mine: { stones: 20 } } },
      { id: 'tea-friend', name: '一盏清茶', rarity: 'common', desc: '参悟与讲经各额外心境 +3。', actions: { comprehend: { resolve: 3 }, lecture: { resolve: 3 } } }
    ],
    sects: [
      { id: 'cloud-sword', name: '云岚剑宗', desc: '云海之上练剑，重根骨与实战。炼体额外体魄 +2，差事额外修为 +5；破境成功率 +4 个百分点。', requireRealm: 1, actions: { train: { physique: 2 }, mission: { cultivation: 5 } }, breakthroughBonus: 0.04 },
      { id: 'red-valley', name: '丹霞谷', desc: '以药理入道，门中丹火不熄。炼丹额外修为 +6，采药额外神识 +1；坊市购买享九折。', requireRealm: 1, actions: { alchemy: { cultivation: 6 }, gather: { spirit: 1 } }, shopDiscount: 0.10 },
      { id: 'rain-pavilion', name: '听雨阁', desc: '典籍万卷，亦问人间冷暖。参悟额外悟性 +2，讲经额外修为 +4；破境成功率 +3 个百分点。', requireRealm: 1, actions: { comprehend: { insight: 2 }, lecture: { cultivation: 4 } }, breakthroughBonus: 0.03 }
    ],
    actions: [
      { id: 'meditate', name: '静室修炼', category: '修行', icon: '◉', desc: '收摄心神，运转一个大周天。修为到达门槛后，需要另排一次破境。', effects: { cultivation: 20, resolve: -4 } },
      { id: 'comprehend', name: '参悟经典', category: '修行', icon: '卷', desc: '把不懂的经文读懂。悟性会提高破境与相关奇遇检定的成功率。', effects: { insight: 5, cultivation: 6, resolve: -2 } },
      { id: 'train', name: '瀑下炼体', category: '修行', icon: '劲', desc: '以水压磨炼筋骨。体魄是战力的重要来源。', effects: { physique: 6, cultivation: 5, health: -7 } },
      { id: 'spirit-practice', name: '凝神观想', category: '修行', icon: '神', desc: '借一盏灯守住识海。神识有助于战力和探查类奇遇。', effects: { spirit: 6, cultivation: 5, resolve: -3 } },
      { id: 'breakthrough', name: '闭关破境', category: '修行', icon: '劫', desc: '修为足够且气血、心境至少 20 时可安排。成功进入下一境；失败损失部分修为。', effects: {}, hint: '每年最多一次；悟性、心境与破境丹影响成功率。' },
      { id: 'explore', name: '山海游历', category: '游历', icon: '山', desc: '走出静室，访山寻水。挣些盘缠，也让修行有了见闻。', effects: { cultivation: 8, spirit: 2, reputation: 2, stones: 30, health: -5 } },
      { id: 'inscription', name: '参悟古碑', category: '游历', icon: '碑', desc: '付给守碑人一些香火钱，研读前辈留下的道痕。', effects: { insight: 4, cultivation: 16, stones: -40, resolve: -3 }, requireRealm: 1 },
      { id: 'gather', name: '入山采药', category: '生活', icon: '草', desc: '沿山阴寻找灵草。所得药草可用于炼丹，也可应对奇遇。', effects: { cultivation: 3, health: -3 }, gainItems: { herb: 2 }, hint: '获得药草 ×2。' },
      { id: 'mine', name: '灵脉采矿', category: '生活', icon: '石', desc: '在旧矿洞凿取灵矿，顺便赚一点工钱。矿石可用于锻器。', effects: { physique: 2, health: -5, stones: 20 }, gainItems: { ore: 2 }, hint: '获得灵矿 ×2。' },
      { id: 'alchemy', name: '开炉炼丹', category: '生活', icon: '丹', desc: '用两份药草炼一枚聚气丹。丹药可随时在背囊中服用。', effects: { cultivation: 12, spirit: 2, stones: -30 }, costItems: { herb: 2 }, gainItems: { 'qi-pill': 1 }, hint: '消耗药草 ×2；获得聚气丹 ×1。' },
      { id: 'forge', name: '绘符锻器', category: '生活', icon: '符', desc: '把灵矿中的金气封入护身符，留给下一次险地之行。', effects: { cultivation: 8, physique: 2, stones: -40 }, costItems: { ore: 2 }, gainItems: { ward: 1 }, hint: '消耗灵矿 ×2；获得护身符 ×1。' },
      { id: 'work', name: '凡间营生', category: '生活', icon: '市', desc: '替镇上看铺、运货，修行人也要挣自己的盘缠。', effects: { stones: 80, reputation: 1, resolve: -2 } },
      { id: 'rest', name: '归舍休整', category: '生活', icon: '茶', desc: '好好吃饭睡觉。恢复气血与心境，并养好受伤状态。', effects: { health: 20, resolve: 15 }, clearCondition: 'injured', hint: '解除「经脉受伤」。' },
      { id: 'mission', name: '山门差事', category: '山门', icon: '令', desc: '巡山、送信、护阵。积累山门贡献，并领取灵石酬劳。', effects: { contribution: 20, stones: 60, reputation: 2, cultivation: 6, health: -5 }, requireSect: true },
      { id: 'lecture', name: '听长老讲经', category: '山门', icon: '经', desc: '用 10 点山门贡献预约讲经，再备 30 灵石束脩，请长老拆解修行关隘。', effects: { insight: 8, cultivation: 25, stones: -30, contribution: -10 }, requireSect: true, hint: '消耗 10 山门贡献、30 灵石；可先安排山门差事积累贡献。' },
      { id: 'sword-study', name: '练习御剑', category: '修行', icon: '剑', desc: '持一柄真正的法剑磨炼剑势。法剑的常驻战力仍会保留。', effects: { physique: 5, spirit: 3, cultivation: 13, health: -5 }, requireItem: 'sword', hint: '需要青锋法剑；法剑不会消耗。' },
      { id: 'escort-work', name: '护送商队', category: '游历', icon: '辙', desc: '沿约定路线押运货车。每完成一次，商队护送进度增加一格。', effects: { stones: 40, reputation: 2, physique: 2, health: -4 }, requireStory: 'escort' },
      { id: 'secret-study', name: '秘境考据', category: '游历', icon: '阵', desc: '逐段校对古阵的缺口。每完成一次，古阵研究进度增加一格。', effects: { insight: 3, cultivation: 13, resolve: -4 }, requireStory: 'secret' },
      { id: 'beast-care', name: '照料幼兽', category: '生活', icon: '灵', desc: '喂食、换药，等它终于愿意靠近。每完成一次，照料进度增加一格。', effects: { spirit: 3, resolve: 5, health: -2 }, requireStory: 'beast' }
    ],
    items: [
      { id: 'manual', name: '小周天注疏', icon: '卷', kind: 'equipment', price: 280, max: 1, desc: '随身研读的修炼手册。每次静室修炼额外修为 +6，购入后长期生效。', actions: { meditate: { cultivation: 6 } } },
      { id: 'sword', name: '青锋法剑', icon: '剑', kind: 'equipment', price: 420, max: 1, desc: '常驻战力 +12，并解锁「练习御剑」行动。', powerBonus: 12 },
      { id: 'cloud-boots', name: '踏云履', icon: '履', kind: 'equipment', price: 260, max: 1, desc: '游历额外神识 +2，气血消耗减少 3；采矿额外体魄 +1。', actions: { explore: { spirit: 2, health: 3 }, mine: { physique: 1 } } },
      { id: 'spirit-flute', name: '清心竹笛', icon: '笛', kind: 'equipment', price: 240, max: 1, desc: '静室修炼额外心境 +3；凝神观想额外神识 +2。', actions: { meditate: { resolve: 3 }, 'spirit-practice': { spirit: 2 } } },
      { id: 'herb', name: '药草', icon: '草', kind: 'consumable', price: 25, max: 40, desc: '炼丹材料。两份药草可安排一次开炉炼丹；不能直接服用。' },
      { id: 'ore', name: '灵矿', icon: '矿', kind: 'consumable', price: 30, max: 40, desc: '锻器材料。两份灵矿可安排一次绘符锻器；不能直接使用。' },
      { id: 'qi-pill', name: '聚气丹', icon: '丹', kind: 'consumable', price: 150, max: 12, desc: '服用后立即修为 +35。不会自动破境，也不能代替悟性与心境。', useEffects: { cultivation: 35 } },
      { id: 'ward', name: '护身符', icon: '符', kind: 'consumable', price: 130, max: 6, desc: '使用后连续 3 年战力 +15，每年奇遇结束后扣除一年。同类状态未结束前不能叠加。', buff: 'ward' },
      { id: 'breakthrough-pill', name: '明心破境丹', icon: '明', kind: 'consumable', price: 220, max: 6, desc: '服用后连续 3 年，破境成功率提高 15 个百分点；每年奇遇结束后扣除一年。同类效果不能叠加。', buff: 'insight' },
      { id: 'healing-salve', name: '续脉膏', icon: '药', kind: 'consumable', price: 90, max: 8, desc: '立即恢复气血 25，并解除「经脉受伤」。没有伤势时也可用于补充气血。', useEffects: { health: 25 }, clearCondition: 'injured' },
      { id: 'mountain-tea', name: '云雾灵茶', icon: '茶', kind: 'consumable', price: 100, max: 6, desc: '立即心境 +10，接下来 3 年参悟额外悟性 +3、静坐额外修为 +4；每年奇遇结束后扣除一年。', useEffects: { resolve: 10 }, buff: 'clear-mind' },
      { id: 'spirit-fruit', name: '赤玉灵果', icon: '果', kind: 'consumable', price: 120, max: 8, desc: '温和滋补，立即气血 +15、心境 +10、体魄 +2。', useEffects: { health: 15, resolve: 10, physique: 2 } }
    ],
    buffs: [
      { id: 'ward', name: '符光护身', desc: '护身符仍有灵光，战力 +15。', duration: 3, powerBonus: 15 },
      { id: 'insight', name: '明心定神', desc: '破境成功率提高 15 个百分点。', duration: 3, breakthroughBonus: 0.15 },
      { id: 'clear-mind', name: '灵台清明', desc: '参悟经典额外悟性 +3；静室修炼额外修为 +4。', duration: 3, actions: { comprehend: { insight: 3 }, meditate: { cultivation: 4 } } }
    ],
    conditions: [
      { id: 'injured', name: '经脉受伤', desc: '暂时不能山海游历或瀑下炼体。安排归舍休整，或使用续脉膏即可恢复。', blocks: ['explore', 'train'] }
    ],
    perks: [
      { id: 'road-guide', name: '商路故交', desc: '商队记住了你的信义。山海游历额外灵石 +20，战力 +6。', actions: { explore: { stones: 20 } }, powerBonus: 6 },
      { id: 'ancient-method', name: '古阵传承', desc: '从残阵中复原一门心法。静室修炼额外修为 +6，破境成功率 +4 个百分点。', actions: { meditate: { cultivation: 6 } }, breakthroughBonus: 0.04 },
      { id: 'beast-companion', name: '灵兽相伴', desc: '一只云纹小兽跟随你走南闯北。战力 +8，山海游历的气血消耗减少 3。', powerBonus: 8, actions: { explore: { health: 3 } } },
      { id: 'village-contact', name: '小镇灯火', desc: '镇上的人把你当作自己人。凡间营生额外灵石 +25、心境 +2。', actions: { work: { stones: 25, resolve: 2 } } },
      { id: 'library-pass', name: '藏书楼常客', desc: '获得旧藏书楼的长期借阅资格。参悟经典额外悟性 +2。', actions: { comprehend: { insight: 2 } } }
    ],
    stories: [
      { id: 'escort', name: '一程风雪', desc: '商队等着你护送两段山路。订金已经收下，尾款要等交付后领取。', actionId: 'escort-work', target: 2, duration: 3, followupEvent: 'escort-finish', rewardDesc: '交付获得灵石 260，并留下长期收获「商路故交」。' },
      { id: 'secret', name: '无名洞府', desc: '石壁上的古阵不是一眼能懂的，需要分三次整理与推演。', actionId: 'secret-study', target: 3, duration: 4, followupEvent: 'secret-finish', rewardDesc: '复原古阵，获得修为 45、悟性 5 与长期收获「古阵传承」。' },
      { id: 'beast', name: '山雨里的小兽', desc: '受伤的幼兽住进了你的院子。两次耐心照料之后，再决定它的去处。', actionId: 'beast-care', target: 2, duration: 3, followupEvent: 'beast-finish', rewardDesc: '照料完成后可结为伙伴，获得长期收获「灵兽相伴」。' }
    ],
    events: [
      { id: 'escort-invite', title: '雪线上的商队', icon: '辙', body: '掌柜把一袋订金推到你面前：今年北山封雪，商队缺一个能走完两段险路的护送人。接下后，需要在期限内安排两次「护送商队」。', minYear: 2, maxRealm: 3, once: true, weight: 3, choices: [
        { text: '接下护送，收取订金', result: '你在名册上留下名字。两段山路已经记进日程，掌柜等着在终点与你结清。', effects: { stones: 80 }, startStory: 'escort' },
        { text: '这几年另有安排', result: '你给商队指了附近镖局的位置，双方互道平安。' }
      ] },
      { id: 'escort-finish', title: '商路的终点', icon: '灯', body: '掌柜在驿站点亮了灯。按约走完两段路，便能交付货单、领取尾款；若未能完成，也可以在此告别。', storyOnly: true, storyId: 'escort', choices: [
        { text: '递交完整货单，领取尾款', result: '最后一车药材平安到站。掌柜付清尾款，也把你的名字写进了沿途商号的名册。', requireStoryComplete: 'escort', effects: { stones: 260, reputation: 6 }, grantPerk: 'road-guide', resolveStory: { id: 'escort', outcome: 'completed' } },
        { text: '结束这份差事', result: '你把后面的路交给另一位护送人。这次没有尾款，也没有新的商路人情。', resolveStory: { id: 'escort', outcome: 'abandoned' } }
      ] },
      { id: 'secret-invite', title: '石门后的空屋', icon: '阵', body: '一座坍塌洞府里没有金银，只有满墙残缺的阵图。要看懂它，需要在四年内安排三次「秘境考据」。', minRealm: 1, once: true, weight: 3, bias: [{ stat: 'insight', direction: 'high', factor: 1.2 }], choices: [
        { text: '记下位置，开始整理古阵', result: '你把第一幅阵图拓在纸上。接下来需要用真正的时间，换一份不确定的传承。', startStory: 'secret' },
        { text: '先回熟悉的道场', result: '你重新掩好石门，把这处宁静留在山中。' }
      ] },
      { id: 'secret-finish', title: '古阵最后一笔', icon: '卷', body: '洞府中的灵光沿着阵纹游走。三次考据已经完成，便可补全最后一笔；否则，最好让残阵继续沉睡。', storyOnly: true, storyId: 'secret', choices: [
        { text: '补全阵图，承接心法', result: '石壁浮现出前人的修行笔记。你终于读懂其中的注疏，也真正理解了灵力在经脉间运行的道路。', requireStoryComplete: 'secret', effects: { cultivation: 45, insight: 5 }, grantPerk: 'ancient-method', resolveStory: { id: 'secret', outcome: 'completed' } },
        { text: '封存拓片，离开洞府', result: '你把未完的推演留在了卷末。这一次，故事停在石门前。', resolveStory: { id: 'secret', outcome: 'abandoned' } }
      ] },
      { id: 'beast-invite', title: '山雨里的小兽', icon: '灵', body: '雨水淋湿一团云纹绒毛。幼兽的后腿受了伤，正缩在树根下。带回去以后，需要在三年内安排两次「照料幼兽」。', once: true, weight: 3, bias: [{ stat: 'spirit', direction: 'high', factor: 0.8 }], choices: [
        { text: '带回院子，慢慢照料', result: '你用外衣裹好它。它还不信任人，但终于不再发抖。', startStory: 'beast' },
        { text: '送到附近兽医那里', result: '兽医接过小兽，点亮了药房的灯。你放心地继续赶路。' }
      ] },
      { id: 'beast-finish', title: '院门前的脚步', icon: '伴', body: '院门一直开着。若你完成了照料，小兽会自己选择是否留下；你也可以把它送回山野。', storyOnly: true, storyId: 'beast', choices: [
        { text: '伸出手，结为伙伴', result: '它绕着你走了一圈，最后把额头贴在掌心。从此漫长的山路多了一串脚印。', requireStoryComplete: 'beast', effects: { spirit: 5, resolve: 8 }, grantPerk: 'beast-companion', resolveStory: { id: 'beast', outcome: 'completed' } },
        { text: '请兽医接手，送它归山', result: '你托兽医继续照料，等它完全康复后送回山中。缘分在这里停下，也算有个安稳归处。', resolveStory: { id: 'beast', outcome: 'abandoned' } }
      ] },
      { id: 'used-book', title: '坊市旧书摊', icon: '卷', body: '摊主翻出一本有批注的小周天注疏。书页虽旧，行气图却完整，标价比铺子里便宜不少。', once: true, weight: 2, choices: [
        { text: '花 160 灵石买下注疏', result: '你拂去书页上的灰。下一次静坐，可以照着这些批注试试。', effects: { stones: -160 }, gainItems: { manual: 1 } },
        { text: '记住书名，以后再找', result: '你谢过摊主，把钱留给眼下更需要的事情。' }
      ] },
      { id: 'old-sword', title: '渡口的旧剑', icon: '剑', body: '船家从河底打捞起一柄青锋法剑，想换修船的钱。剑鞘开裂，剑身却仍有灵光。', minYear: 3, once: true, choices: [
        { text: '出 260 灵石买剑', result: '船家给你找来新布裹剑。青锋入手，你也能开始练习御剑了。', effects: { stones: -260 }, gainItems: { sword: 1 } },
        { text: '替他指去坊市的路', result: '船家道了一声谢，把剑仔细收了起来。' }
      ] },
      { id: 'rockslide', title: '山道落石', icon: '险', body: '脚下突然传来碎裂声，一段山路正在塌陷。绕路很稳妥；穿过落石区，可能找到刚露出的灵矿。', weight: 2, bias: [{ stat: 'physique', direction: 'high', factor: 0.7 }], choices: [
        { text: '护住周身，进入落石区', result: '你看准两次落石之间的间隙。', check: { stat: 'power', difficulty: 35, success: { result: '你带着三块灵矿跃上安全山坡。', gainItems: { ore: 3 }, effects: { reputation: 2 } }, failure: { result: '一块碎石擦过侧身，经脉受了震伤。需要休整或续脉膏。', effects: { health: -12 }, addCondition: 'injured' } } },
        { text: '绕到另一条山路', result: '路远了一些，但你平安看到了傍晚的炊烟。' }
      ] },
      { id: 'herbalist', title: '药篓里的春天', icon: '草', body: '老药师请你分辨两株极为相似的灵草。答对便送你药材；拿不准，也可以陪他慢慢学。', weight: 2, bias: [{ stat: 'insight', direction: 'high', factor: 1 }], choices: [
        { text: '根据叶脉辨认灵草', result: '你摊开两株草的叶片。', check: { stat: 'insight', difficulty: 30, success: { result: '老药师笑着点头，把四份药草装进你的袋子。', gainItems: { herb: 4 }, effects: { insight: 2 } }, failure: { result: '你认反了。老药师耐心讲完辨认的方法，没让你乱吃。', effects: { insight: 1 } } } },
        { text: '请他从头讲一遍', result: '你听完了一个下午的药理课。', effects: { insight: 2 } }
      ] },
      { id: 'village-bridge', title: '断桥两岸', icon: '桥', body: '小镇的桥被水冲断，菜担和药箱都过不了河。镇民凑不齐修桥的材料钱。', once: true, weight: 2, choices: [
        { text: '拿出 120 灵石助修桥', result: '新桥落成那天，镇民在桥头给你留了一碗热汤。从此这里有人记得你的名字。', effects: { stones: -120, reputation: 8 }, grantPerk: 'village-contact' },
        { text: '留下修桥图纸和建议', result: '你帮忙找到一段更浅的河道，镇民决定先搭一座便桥。', effects: { reputation: 1 } }
      ] },
      { id: 'library-dust', title: '无人整理的藏书楼', icon: '书', body: '旧城藏书楼的卷宗堆满灰尘。守楼人说，若有人能理清这些经卷的次序，愿意长期借书给他。', once: true, bias: [{ stat: 'insight', direction: 'high', factor: 1.4 }], choices: [
        { text: '尝试整理经卷次序', result: '你从最旧的一卷开始核对。', check: { stat: 'insight', difficulty: 40, success: { result: '卷与卷之间终于接上了。守楼人递给你一枚借书木牌。', grantPerk: 'library-pass', effects: { insight: 4 } }, failure: { result: '你整理好半架杂书，剩下的疑处仍需后人慢慢考证。', effects: { insight: 2, resolve: -2 } } } },
        { text: '借一本浅显游记', result: '游记里写着许多未曾见过的山川。', effects: { spirit: 1 } }
      ] },
      { id: 'traveling-doctor', title: '行医人的药箱', icon: '药', body: '路边的行医人正在为村民换药。他带来的续脉膏不多，但愿意用一个公道价卖给你。', choices: [
        { text: '花 60 灵石买续脉膏', result: '药瓶包得严实，可以留在背囊里，等气血不足或受伤时再用。', effects: { stones: -60 }, gainItems: { 'healing-salve': 1 } },
        { text: '替他搬好药箱', result: '行医人请你喝了一碗热水，又嘱咐你别硬撑伤势。', effects: { resolve: 2 } }
      ] },
      { id: 'pill-fair', title: '丹会余香', icon: '丹', body: '丹会散场，药铺还剩几枚聚气丹。掌柜愿意把最后一枚按进货价给你。', choices: [
        { text: '花 90 灵石买一枚聚气丹', result: '丹药装入小瓷瓶。你可以自行决定何时服用。', effects: { stones: -90 }, gainItems: { 'qi-pill': 1 } },
        { text: '只闻丹香，不动盘缠', result: '你辨认出其中两味熟悉的草药。', effects: { insight: 1 } }
      ] },
      { id: 'ward-scribe', title: '雨棚下的符师', icon: '符', body: '大雨困住了赶路人。符师铺开纸笔，愿意教你画一张简单的护身符。', choices: [
        { text: '用一份灵矿换制符材料', result: '符师把金气引入纸面，一张护身符在掌心亮起。', costItems: { ore: 1 }, gainItems: { ward: 1 } },
        { text: '在旁边看完一整遍', result: '你记住了下笔与呼吸之间的节奏。', effects: { spirit: 2 } }
      ] },
      { id: 'moon-pool', title: '月照寒潭', icon: '月', body: '满月落在潭心，水底似乎另有一轮月亮。神识足够沉静的人，也许能看清灵气的去向。', bias: [{ stat: 'spirit', direction: 'high', factor: 1.1 }], choices: [
        { text: '把神识探入水面', result: '你闭目听见水纹扩散。', check: { stat: 'spirit', difficulty: 35, success: { result: '两轮月亮重合，你领悟了一段更顺畅的行气路线。', effects: { cultivation: 28, spirit: 3 } }, failure: { result: '水中幻影纷乱，你及时收回神识。', effects: { resolve: -6 } } } },
        { text: '沿着潭边赏月', result: '不必每一次驻足都有所获得。今夜很静。', effects: { resolve: 4 } }
      ] },
      { id: 'duel-invite', title: '茶馆外的切磋', icon: '剑', body: '一位过路修士看出你也是同道，邀你在空地上比试三招，赌注是两枚灵果。', bias: [{ stat: 'physique', direction: 'high', factor: 1.1 }], choices: [
        { text: '点到即止，接下三招', result: '两人退开几步，各自行礼。', check: { stat: 'power', difficulty: 45, success: { result: '你在第三招时占了上风。对方爽快交出灵果，约定来日再见。', gainItems: { 'spirit-fruit': 2 }, effects: { reputation: 4 } }, failure: { result: '对方剑势略胜一筹。你按约停手，记住了这一招。', effects: { health: -8, physique: 2 } } } },
        { text: '以茶代剑，聊聊见闻', result: '话说开以后，你们都多认识了一个赶路人。', effects: { reputation: 1, resolve: 2 } }
      ] },
      { id: 'merchant-cache', title: '遗落的货箱', icon: '箱', body: '一只刻着商号标记的货箱被卡在河岸。你可以把它送回驿站，也可以沿河找找失主。', choices: [
        { text: '把整只货箱送回驿站', result: '驿卒核对完封条，按规矩给了你一份答谢。', effects: { stones: 45, reputation: 2 } },
        { text: '写下地点，请驿卒来取', result: '你留下记号，很快看见驿卒带人赶来。', effects: { reputation: 1 } }
      ] },
      { id: 'dry-well', title: '枯井下的微光', icon: '井', body: '荒村古井里有灵气飘出。井壁狭窄，探下去可能找到矿石，也可能被陈年浊气伤到。', minRealm: 1, choices: [
        { text: '撑起灵力，入井查看', result: '你沿井壁缓缓下降。', check: { stat: 'power', difficulty: 55, success: { result: '井底有一条早已枯竭的灵脉，还能采下几块完整灵矿。', gainItems: { ore: 4 }, effects: { cultivation: 15 } }, failure: { result: '浊气突然涌起。你攀回井口，经脉却已受伤。', effects: { health: -15 }, addCondition: 'injured' } } },
        { text: '封好井口，提醒后来人', result: '你在井沿写下警示，继续上路。', effects: { reputation: 1 } }
      ] },
      { id: 'spring-market', title: '春日小集', icon: '春', body: '小镇开春市，糖画、风筝与灵果摆在同一条街上。摊主说今年的果子格外甜。', choices: [
        { text: '花 70 灵石买一枚灵果', result: '你收好灵果，等需要时再吃。', effects: { stones: -70 }, gainItems: { 'spirit-fruit': 1 } },
        { text: '看看风筝，慢慢逛一圈', result: '在人间烟火里，你想起了很久以前的春天。', effects: { resolve: 5 } }
      ] },
      { id: 'old-friend', title: '故乡寄来的信', icon: '信', body: '故人托商队带来一封信，讲的都是婚嫁、丰收与门前新种的树。信末问你这些年过得好不好。', weight: 2, bias: [{ stat: 'resolve', direction: 'low', factor: 1.5 }], choices: [
        { text: '提笔认真写一封回信', result: '你没有只谈境界，也写了途中的雨和热汤。写完后，心里的结松开了一些。', effects: { resolve: 10 } },
        { text: '把信收好，记在心里', result: '纸上的字还是熟悉的样子。', effects: { resolve: 4 } }
      ] },
      { id: 'restless-night', title: '迟迟不能入定', icon: '夜', body: '同一道经读了许多遍，心思却总飘到未做完的事情上。越急，灵力越不肯听话。', weight: 2, bias: [{ stat: 'resolve', direction: 'low', factor: 2 }], choices: [
        { text: '停下修炼，认真睡一觉', result: '第二天清晨，你终于听见院外的鸟鸣。', effects: { health: 6, resolve: 8 } },
        { text: '试着面对那件心事', result: '你让念头逐一浮上心头。', check: { stat: 'resolve', difficulty: 40, success: { result: '原来让你不安的事并没有想象中那么大。', effects: { insight: 4, resolve: 8 } }, failure: { result: '今夜仍没有答案。你及时停下，决定以后再想。', effects: { resolve: -3 } } } }
      ] },
      { id: 'wounded-traveler', title: '路边的伤者', icon: '药', body: '一位修士靠着树干喘息，护体灵光已经很弱。他需要一份续脉膏才能继续赶路。', choices: [
        { text: '拿出一份续脉膏', result: '伤者渐渐缓过气。他坚持用一袋灵石答谢你，留下了善意的约定。', costItems: { 'healing-salve': 1 }, effects: { stones: 130, reputation: 5 } },
        { text: '扶他到最近的医馆', result: '医馆的人接过担架，山路上的灯多亮了一盏。', effects: { reputation: 2 } }
      ] },
      { id: 'rain-garden', title: '雨后药圃', icon: '芽', body: '连日细雨让山谷里的野生药草长得极好。主人留下木牌：成熟的可以采，幼苗请留给来年。', choices: [
        { text: '只采成熟的两株', result: '两份药草装进了背囊，幼苗仍在雨珠下摇晃。', gainItems: { herb: 2 } },
        { text: '替药圃疏通积水', result: '水沟通了，香气从湿润的泥土里升起来。', effects: { resolve: 4, insight: 1 } }
      ] },
      { id: 'mountain-tea-gift', title: '半山茶棚', icon: '茶', body: '茶棚主人正愁搬不动一只水缸。你顺手帮忙后，他拿出一包自制的云雾灵茶。', once: true, choices: [
        { text: '收下灵茶，留待闭关前用', result: '小纸包中带着山雾般清淡的香气。', gainItems: { 'mountain-tea': 1 } },
        { text: '一起喝完这壶普通热茶', result: '你们谈天气，谈山路，谁也没有问谁的境界。', effects: { health: 5, resolve: 7 } }
      ] },
      { id: 'auction', title: '不起眼的拍品', icon: '拍', body: '拍卖会最后拿出一双踏云履。没有人争抢，但它能让漫长的山路好走一些。', once: true, minYear: 4, choices: [
        { text: '出价 180 灵石', result: '没有人再加价，踏云履归你所有。', effects: { stones: -180 }, gainItems: { 'cloud-boots': 1 } },
        { text: '看完拍卖便离开', result: '你记下了几件法器的用途，保住了自己的盘缠。', effects: { insight: 1 } }
      ] },
      { id: 'cave-echo', title: '空谷回声', icon: '音', body: '空谷里响起古老的钟声，每一次回荡都像一行未写完的经文。只有不被杂念牵动，才听得见句末。', minRealm: 1, choices: [
        { text: '屏息听完钟声', result: '你闭上双眼，让神识随声音远行。', check: { stat: 'spirit', difficulty: 45, success: { result: '最后一声钟响落在识海中，许多旧疑问忽然连在了一起。', effects: { spirit: 5, cultivation: 25 } }, failure: { result: '钟声渐渐散去，你只记住了片段。', effects: { insight: 1 } } } },
        { text: '把听见的片段记下来', result: '也许未来某一天，你会懂得这段回声。', effects: { insight: 2 } }
      ] },
      { id: 'small-demon', title: '偷粮的小妖', icon: '妖', body: '村民请你帮忙赶走一只偷粮的小妖。它不算凶恶，却会用迷雾把追赶者引进山沟。', minRealm: 1, choices: [
        { text: '破开迷雾，把它赶走', result: '你循着谷壳留下的痕迹追进山林。', check: { stat: 'power', difficulty: 65, success: { result: '小妖答应不再下山。村民送来盘缠和一篮药草。', effects: { stones: 90, reputation: 5 }, gainItems: { herb: 2 } }, failure: { result: '你没追上它，还在山沟里摔了一跤。好在及时脱身。', effects: { health: -10 }, addCondition: 'injured' } } },
        { text: '教村民布置简单的警铃', result: '一串铜铃守住粮仓，小妖找不到下手的机会。', effects: { reputation: 2 } }
      ] },
      { id: 'wandering-monk', title: '僧人的三个问题', icon: '问', body: '过路僧人只问三件事：为何修行，害怕失去什么，愿意把什么留给后来人。他并不催你回答。', minYear: 6, choices: [
        { text: '认真作答，不掩饰犹疑', result: '没有标准答案，但你比来时更明白自己的路。', effects: { insight: 3, resolve: 5 } },
        { text: '把问题带在身边', result: '僧人合掌道别。问题会陪你走过下一段山路。', effects: { resolve: 3 } }
      ] },
      { id: 'spirit-tide', title: '灵潮过山', icon: '潮', body: '山间灵气忽然浓郁起来。这股灵潮只停留片刻，强行纳入太多会损伤经脉。', minRealm: 2, weight: 2, choices: [
        { text: '以体魄承接灵潮', result: '你运转功法，让经脉迎向奔涌的灵气。', check: { stat: 'physique', difficulty: 55, success: { result: '灵潮被稳稳导入丹田，修为增长了一大截。', effects: { cultivation: 55 } }, failure: { result: '灵力超出了经脉能承受的范围。你果断收功，仍留下内伤。', effects: { health: -15, cultivation: 10 }, addCondition: 'injured' } } },
        { text: '只取一缕，缓慢炼化', result: '这份收获不多，却安安稳稳属于你。', effects: { cultivation: 12 } }
      ] },
      { id: 'gold-core-discussion', title: '江亭论道', icon: '道', body: '几位修士在江亭讨论金丹之道，争论越来越急。有人请你说说自己的理解。', minRealm: 2, bias: [{ stat: 'insight', direction: 'high', factor: 1 }], choices: [
        { text: '用自己的经历解释经文', result: '你放下杯子，从曾经的疑惑谈起。', check: { stat: 'insight', difficulty: 55, success: { result: '争论渐渐停下，一位修士以破境丹酬谢你的点拨。', effects: { reputation: 6, insight: 3 }, gainItems: { 'breakthrough-pill': 1 } }, failure: { result: '你的解释还不够周全，但听完别人的补充也有所得。', effects: { insight: 2 } } } },
        { text: '安静听完，记录不同说法', result: '你把分歧写在纸上，留待自己验证。', effects: { insight: 2 } }
      ] },
      { id: 'sect-exchange', title: '山门的功簿', icon: '簿', body: '执事正在核对各人的山门贡献。做过差事的人，可以用积累的贡献换一枚明心破境丹，也可以继续攒着，留待以后使用。', minRealm: 1, requireSect: true, weight: 2, choices: [
        { text: '用 40 贡献换一枚破境丹', result: '执事在功簿上扣去四十点贡献，把丹瓶交给你。等准备闭关时再服用。', require: { contribution: 40 }, effects: { contribution: -40 }, gainItems: { 'breakthrough-pill': 1 } },
        { text: '先留着贡献，听执事讲讲规矩', result: '你记住了差事酬劳和物资兑换的规矩，等有需要时再来。', effects: { insight: 1 } }
      ] },
      { id: 'sect-supply', title: '启封的山门库房', icon: '库', body: '库房把新制的护身符和续脉膏登记入册。有山门贡献的人，可以支取一套出行物资。', minRealm: 1, requireSect: true, choices: [
        { text: '用 25 贡献换一套出行物资', result: '你取走一张护身符和一份续脉膏，库管在功簿上记下这次支取。', require: { contribution: 25 }, effects: { contribution: -25 }, gainItems: { ward: 1, 'healing-salve': 1 } },
        { text: '看看清单，这次暂不支取', result: '你知道了哪种物资能应付伤势，哪种适合带进险地。', effects: { spirit: 1 } }
      ] },
      { id: 'hundred-lanterns', title: '百灯夜渡', icon: '灯', body: '河面漂满了纪念故人的灯。一个孩子问你，修仙以后是不是就不会难过。', minYear: 10, bias: [{ stat: 'resolve', direction: 'low', factor: 1.4 }], choices: [
        { text: '告诉他，难过也可以带着走', result: '你陪他看着河灯远去。修行并没有让告别消失，但让你愿意把它放进心里。', effects: { resolve: 9, spirit: 2 } },
        { text: '帮他把纸灯放稳', result: '灯没有熄。你们一起目送它驶向下游。', effects: { resolve: 5 } }
      ] },
      { id: 'rooftop-flute', title: '月下竹笛', icon: '笛', body: '客栈老人吹了一夜竹笛。天亮时，他说自己已不再远行，愿意把笛子卖给真正会带它上路的人。', once: true, minYear: 5, choices: [
        { text: '用 150 灵石买下清心竹笛', result: '老人教了你一段最简单的调子。今后的静坐多了一份安定。', effects: { stones: -150 }, gainItems: { 'spirit-flute': 1 } },
        { text: '为老人再斟一杯热茶', result: '你记住了这段旋律，和今夜的月色。', effects: { resolve: 5 } }
      ] },
      { id: 'storm-crossing', title: '雷雨封江', icon: '雷', body: '渡船被雷雨困在江心。你有机会为船撑起一片灵力屏障，但江上的雷意比平日强得多。', minRealm: 3, choices: [
        { text: '撑起屏障，护船靠岸', result: '江风掀起衣角，你把灵力送向船头。', check: { stat: 'power', difficulty: 100, success: { result: '渡船平安靠岸。船客们凑出谢礼，而雷意也磨炼了你的神识。', effects: { stones: 180, reputation: 8, spirit: 3 } }, failure: { result: '屏障支撑不住，你引导船家转入避风湾，自己却受了内伤。', effects: { health: -18 }, addCondition: 'injured' } } },
        { text: '协助船家泊入避风湾', result: '众人一起固定缆绳，等雷雨过去再起航。', effects: { reputation: 2 } }
      ] },
      { id: 'ancient-tree', title: '千年古树', icon: '树', body: '古树的年轮仿佛映在你的识海里。你感受到无数春秋，也感受到自己漫长修行里那些被忽略的日常。', minRealm: 3, choices: [
        { text: '在树下回顾自己的来路', result: '过去没有被删去，它们一同构成了此刻的你。', effects: { resolve: 10, insight: 3 } },
        { text: '摘下两枚自然落地的灵果', result: '枝叶轻轻摇晃，像是一声回应。', gainItems: { 'spirit-fruit': 2 } }
      ] },
      { id: 'sky-rift', title: '天隙一线', icon: '天', body: '云层在极高处裂开一道细缝，漏下此前未曾见过的道韵。神识不足的人，很容易在其中迷失。', minRealm: 4, weight: 2, choices: [
        { text: '以神识追寻道韵', result: '你把心神送入云层的裂隙。', check: { stat: 'spirit', difficulty: 75, success: { result: '一瞬间，天门与脚下尘土似乎连成一体。', effects: { cultivation: 80, insight: 5 } }, failure: { result: '浩瀚的回声让你一时失去方向。你回到身体里，先好好休息。', effects: { resolve: -15, health: -8 } } } },
        { text: '记下天象，稳住自己的道', result: '你收回目光，从能理解的部分开始。', effects: { cultivation: 20, insight: 2 } }
      ] },
      { id: 'last-letter', title: '晚辈来信', icon: '信', body: '一位刚刚入道的年轻人写信请教：修行很慢，是否说明自己走错了路。字迹像极了你初入山门时的模样。', minRealm: 3, choices: [
        { text: '认真写下曾经的失败与重来', result: '你没有只写风光的部分。信写到最后，连自己也觉得安心了些。', effects: { resolve: 8, reputation: 3 } },
        { text: '赠送一枚聚气丹与祝福', result: '你告诉他，丹药只能添一点修为，自己的路还要慢慢走。', costItems: { 'qi-pill': 1 }, effects: { reputation: 7, resolve: 5 } }
      ] },
      { id: 'quiet-snow', title: '无事的一场雪', icon: '雪', body: '这一年没有遗迹开启，也没有谁来寻仇。雪盖住山路，你在炉边翻书，忽然觉得平静本身也是修行。', weight: 1.5, choices: [
        { text: '温茶读书，等雪慢慢停', result: '书读到旧处，又多懂了一点。', effects: { insight: 2, resolve: 5 } },
        { text: '扫出一条通往山下的路', result: '傍晚有人沿着你扫出的路平安回家。', effects: { reputation: 2, physique: 1 } }
      ] }
    ]
  };

  if (typeof module !== 'undefined' && module.exports) module.exports = D;
  global.X_DATA = D;
})(typeof globalThis !== 'undefined' ? globalThis : this);
