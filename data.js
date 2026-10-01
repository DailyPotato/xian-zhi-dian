(function (global) {
  'use strict';

  const D = {
    version: 3,
    realms: [
      { id: 'qi', name: '炼气', threshold: 90, lifespan: 100, world: 'mortal', subtitle: '引气入体 · 初闻大道' },
      { id: 'foundation', name: '筑基', threshold: 180, lifespan: 200, world: 'mortal', subtitle: '道基初成 · 择山而栖' },
      { id: 'core', name: '金丹', threshold: 280, lifespan: 500, world: 'mortal', subtitle: '一粒金丹 · 山河入眼' },
      { id: 'soul', name: '元婴', threshold: 420, lifespan: 1000, world: 'mortal', subtitle: '婴神离窍 · 问心问道' },
      { id: 'divinity', name: '化神', threshold: 560, lifespan: 2000, world: 'mortal', subtitle: '神游太虚 · 叩问天门' },
      { id: 'mahayana', name: '大乘', threshold: 850, lifespan: 5000, world: 'mortal', subtitle: '百川归海 · 大道渐成' },
      { id: 'tribulation', name: '渡劫', threshold: 1100, lifespan: 10000, world: 'mortal', subtitle: '九霄劫动 · 凡身将蜕' },
      { id: 'ascended', name: '真仙', threshold: 1600, lifespan: 20000, world: 'immortal', subtitle: '飞升仙界 · 再启道途' },
      { id: 'heaven', name: '天仙', threshold: 2200, lifespan: 50000, world: 'immortal', subtitle: '驭风御法 · 天地同游' },
      { id: 'mystic', name: '玄仙', threshold: 3000, lifespan: 100000, world: 'immortal', subtitle: '玄理入微 · 万象归心' },
      { id: 'gold', name: '金仙', threshold: 4200, lifespan: 200000, world: 'immortal', subtitle: '金性不朽 · 道果长存' },
      { id: 'king', name: '仙王', threshold: 5600, lifespan: 500000, world: 'immortal', subtitle: '镇守一域 · 星河俯首' },
      { id: 'venerable', name: '仙尊', threshold: 7500, lifespan: 1000000, world: 'immortal', subtitle: '诸天问道 · 万法归一' },
      { id: 'emperor', name: '仙帝', threshold: 0, lifespan: null, world: 'immortal', subtitle: '道临诸天 · 此生登巅' }
    ],
    roots: [
      { id: 'metal', name: '金灵根', desc: '金气锐利，炼体与锻器时更容易有所收获。', start: { physique: 6 }, actions: { train: { physique: 2 }, forge: { cultivation: 3 } } },
      { id: 'wood', name: '木灵根', desc: '亲近草木，采药能养神，炼丹时灵息更顺。', start: { health: 10 }, actions: { gather: { spirit: 2 }, alchemy: { cultivation: 4 } } },
      { id: 'water', name: '水灵根', desc: '心神澄澈，静坐与参悟如细水长流。', start: { spirit: 5 }, actions: { meditate: { cultivation: 3 }, comprehend: { insight: 1 } } },
      { id: 'fire', name: '火灵根', desc: '灵力旺盛，修行进境快，炼丹也更有灵性。', start: { cultivation: 15 }, actions: { meditate: { cultivation: 4 }, alchemy: { spirit: 1 } } },
      { id: 'earth', name: '土灵根', desc: '厚重安稳，身体强健，采矿与休整更有效。', start: { physique: 4, health: 6 }, actions: { mine: { physique: 2 }, rest: { health: 4 } } },
      { id: 'ice', name: '冰灵根', desc: '灵息凝寒，心思澄定。参悟更易明理，休整时也能迅速安定心境。', start: { insight: 4, resolve: 4 }, actions: { comprehend: { insight: 1 }, rest: { resolve: 3 } } },
      { id: 'thunder', name: '雷灵根', desc: '雷意藏于经脉。炼体与凝神时能将震荡化成修为，宜留意气血消耗。', start: { physique: 3, spirit: 3 }, actions: { train: { cultivation: 4 }, 'spirit-practice': { cultivation: 2 } } },
      { id: 'wind', name: '风灵根', desc: '灵气轻灵，身法敏捷。山海游历消耗更少，也更容易找到沿途生计。', start: { spirit: 5, stones: 20 }, actions: { explore: { health: 2, stones: 10 } } },
      { id: 'yin', name: '阴灵根', desc: '识海敏锐，却稍欠阳和。凝神观想进境更好，参悟能安定心境。', start: { spirit: 6, health: -5 }, actions: { 'spirit-practice': { spirit: 2 }, comprehend: { resolve: 1 } } },
      { id: 'yang', name: '阳灵根', desc: '阳气充盈，筋骨有力。炼体时更耐消耗，归舍休整也恢复得更快。', start: { health: 10, physique: 3 }, actions: { train: { health: 3 }, rest: { health: 4 } } }
    ],
    paths: [
      { id: 'sword', name: '剑修', icon: '剑', desc: '以剑破局。炼体、斗法与江湖行走更得心应手；专修剑意兼顾修为与体魄。', affinityRoots: ['metal', 'wind'], technique: 'sword-intent', start: { physique: 6, reputation: 2 }, actions: { train: { physique: 2 }, explore: { cultivation: 3 } } },
      { id: 'alchemy', name: '丹修', icon: '丹', desc: '以丹养道。采药、开炉与经营灵材是修行的一部分；双炉合丹能以同样药草炼出两枚聚气丹。', affinityRoots: ['wood', 'fire'], technique: 'dual-pill', start: { insight: 4, stones: 60 }, actions: { alchemy: { cultivation: 5 }, gather: { insight: 1 } } },
      { id: 'wander', name: '逍遥', icon: '游', desc: '山海皆道场。游历所得更丰厚，也更懂凡间生计；行吟能在修行之余养心赚些盘缠。', affinityRoots: ['water', 'wind'], technique: 'free-roam', start: { spirit: 4, resolve: 6 }, actions: { explore: { stones: 15 }, work: { stones: 15 } } },
      { id: 'body', name: '体修', icon: '体', desc: '把筋骨炼成自己的法器。体魄成长快，采矿也能练功；淬身耗血较多，需要安排疗养。', affinityRoots: ['earth', 'yang'], technique: 'body-temper', start: { physique: 8, health: 5 }, actions: { train: { physique: 3 }, mine: { cultivation: 4 } } },
      { id: 'formation', name: '阵修', icon: '阵', desc: '借天地纹理布阵。参悟、锻器更有所得；以一份灵矿推阵，可把阵力封成护身符。', affinityRoots: ['earth', 'water'], technique: 'formation-weave', start: { insight: 6, spirit: 2 }, actions: { comprehend: { cultivation: 4 }, forge: { insight: 2 } } },
      { id: 'beast', name: '御兽', icon: '兽', desc: '先懂万灵，再谈驾驭。游历能养神，照料灵兽更有效；与万灵共鸣时也能平复心绪。', affinityRoots: ['wood', 'yang'], technique: 'beast-attune', start: { spirit: 6, resolve: 4 }, actions: { explore: { spirit: 2 }, 'beast-care': { spirit: 2, resolve: 2 } } },
      { id: 'ice', name: '玄冰', icon: '冰', desc: '以寒息定心，以静制动。参悟与凝神更稳；寒潭吐纳增长修为、悟性与心境，但要付出气血。', affinityRoots: ['ice', 'water'], technique: 'frost-breath', start: { insight: 5, resolve: 5 }, actions: { comprehend: { resolve: 2 }, 'spirit-practice': { cultivation: 3 } } },
      { id: 'thunder', name: '雷修', icon: '雷', desc: '引雷意磨炼经脉。修为进境凌厉，也最考验气血和心境；受伤时必须停下引雷。', affinityRoots: ['thunder', 'metal'], technique: 'thunder-temper', start: { cultivation: 12, physique: 4 }, actions: { train: { cultivation: 4 }, 'spirit-practice': { spirit: 1 } } },
      { id: 'soul', name: '魂修', icon: '魂', desc: '守住一盏心灯，探索识海深处。神识成长突出；照魂之术消耗心境，不能忘记回到日常休整。', affinityRoots: ['yin', 'ice'], technique: 'soul-lantern', start: { spirit: 8, insight: 2 }, actions: { 'spirit-practice': { spirit: 2 }, comprehend: { resolve: 2 } } },
      { id: 'yang', name: '纯阳', icon: '阳', desc: '采朝阳养身，借正气固本。炼体时更耐消耗；晨间采气同时恢复气血，却不能代替完整休养。', affinityRoots: ['yang', 'fire'], technique: 'sun-breath', start: { health: 10, physique: 4 }, actions: { train: { health: 3 }, rest: { cultivation: 4 } } }
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
      { id: 'beast-care', name: '照料幼兽', category: '生活', icon: '灵', desc: '喂食、换药，等它终于愿意靠近。每完成一次，照料进度增加一格。', effects: { spirit: 3, resolve: 5, health: -2 }, requireStory: 'beast' },
      { id: 'sword-intent', name: '问剑悟意', category: '修行', icon: '剑', desc: '不借法剑的锋利，先磨炼出剑时的心意。兼修筋骨与剑气，需付出少量气血与心境。', effects: { cultivation: 14, physique: 4, spirit: 1, health: -4, resolve: -2 }, requirePath: 'sword', hint: '剑修专属；无需持有法剑。' },
      { id: 'dual-pill', name: '双炉合丹', category: '修行', icon: '丹', desc: '交替掌控两炉火候，将同一份药性分成两枚聚气丹。丹药收入背囊，需自行决定服用时机。', effects: { cultivation: 6, insight: 2, stones: -45 }, requirePath: 'alchemy', costItems: { herb: 2 }, gainItems: { 'qi-pill': 2 }, hint: '丹修专属；药草 ×2、灵石 45 → 聚气丹 ×2。' },
      { id: 'free-roam', name: '乘风行吟', category: '修行', icon: '游', desc: '沿山水缓行，以见闻化入吐纳。赚得的盘缠不多，却能在旅途中养神定心。', effects: { cultivation: 10, spirit: 2, resolve: 5, stones: 12, health: -3 }, requirePath: 'wander', hint: '逍遥专属；比专程游历少赚灵石，额外恢复心境。' },
      { id: 'body-temper', name: '熬骨淬身', category: '修行', icon: '体', desc: '用山石与水压反复磨炼筋骨。体魄增长显著，但气血消耗也大；受伤时不可强练。', effects: { cultivation: 10, physique: 8, health: -12, resolve: -2 }, requirePath: 'body', hint: '体修专属；经脉受伤时不能安排。' },
      { id: 'formation-weave', name: '推阵结符', category: '修行', icon: '阵', desc: '借一份灵矿推演小阵，将阵眼的灵光封入纸符。所得护身符可留待险地使用。', effects: { cultivation: 8, insight: 3, stones: -30 }, requirePath: 'formation', costItems: { ore: 1 }, gainItems: { ward: 1 }, hint: '阵修专属；灵矿 ×1、灵石 30 → 护身符 ×1。' },
      { id: 'beast-attune', name: '万灵共鸣', category: '修行', icon: '兽', desc: '在林间静听飞鸟走兽的呼吸，学习以神识回应。尚无灵兽伙伴时，也能从万物中修行。', effects: { cultivation: 10, spirit: 5, resolve: 3, health: -2 }, requirePath: 'beast', hint: '御兽专属；无需先获得灵兽伙伴。' },
      { id: 'frost-breath', name: '寒潭吐纳', category: '修行', icon: '冰', desc: '以一缕寒息压下杂念，让灵气缓缓凝练。悟性与心境一并成长，寒意却会消磨气血。', effects: { cultivation: 17, insight: 2, resolve: 3, health: -5 }, requirePath: 'ice', hint: '玄冰专属；养心增悟，需要定期温养气血。' },
      { id: 'thunder-temper', name: '引雷淬脉', category: '修行', icon: '雷', desc: '引入细微雷意锻炼经脉，以更大的消耗换取修为。雷势虽小，也需要完整的身体承受。', effects: { cultivation: 24, physique: 3, spirit: 2, health: -14, resolve: -7 }, requirePath: 'thunder', hint: '雷修专属；高气血、心境消耗，经脉受伤时不能安排。' },
      { id: 'soul-lantern', name: '照魂守灯', category: '修行', icon: '魂', desc: '点亮识海中的心灯，照见散乱念头。神识增长突出，但长久内观也会疲惫，需要休养心境。', effects: { cultivation: 12, spirit: 7, health: -3, resolve: -7 }, requirePath: 'soul', hint: '魂修专属；神识成长快，心境消耗较高。' },
      { id: 'sun-breath', name: '朝阳采气', category: '修行', icon: '阳', desc: '在日出时采一缕温和阳气，以修为滋养筋骨。能恢复部分气血，心境仍需靠日常休整。', effects: { cultivation: 14, health: 8, physique: 1, resolve: -5 }, requirePath: 'yang', hint: '纯阳专属；恢复气血，但不解除经脉受伤。' },
      { id: 'partner-cultivate', name: '同心共修', category: '修行', icon: '缘', desc: '与彼此认可的道侣一同参悟，交流各自的修行所得。双方心意相通，修为与神识也能相互印证。', effects: { cultivation: 18, spirit: 3, resolve: 4 }, requirePartner: true, hint: '需要已结为道侣的成年伙伴；共修不会消耗关系。' },
      { id: 'charity', name: '赈济乡里', category: '生活', icon: '善', desc: '花 60 灵石购置粮药，亲自送到需要的人手里。善行能改善外界评价，也是挽回恶名的一条踏实道路。', effects: { stones: -60, morality: 8, reputation: 2, resolve: 2 }, hint: '所有流派均可安排；道德评价 +8。' }
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
      { id: 'spirit-fruit', name: '赤玉灵果', icon: '果', kind: 'consumable', price: 120, max: 8, desc: '温和滋补，立即气血 +15、心境 +10、体魄 +2。', useEffects: { health: 15, resolve: 10, physique: 2 } },
      { id: 'sect-armlet', name: '山门玄铁护臂', icon: '铠', kind: 'equipment', price: 900, max: 1, requireRealm: 3, desc: '元婴境可用。常驻战力 +18；瀑下炼体、熬骨淬身的气血消耗各减少 2。也可在炼器堂以贡献兑换。', powerBonus: 18, actions: { train: { health: 2 }, 'body-temper': { health: 2 } } },
      { id: 'star-map', name: '周天星图', icon: '图', kind: 'equipment', price: 680, max: 1, requireRealm: 2, auctionOnly: true, desc: '拍卖场珍藏，金丹境可用。参悟经典额外修为 +10、悟性 +1；星位会随修行记录逐渐清晰。', actions: { comprehend: { cultivation: 10, insight: 1 } } },
      { id: 'thunder-jade', name: '雷纹镇心玉', icon: '玉', kind: 'equipment', price: 1400, max: 1, requireRealm: 4, auctionOnly: true, desc: '拍卖场珍藏，化神境可用。常驻战力 +24，静室修炼额外心境 +1。', powerBonus: 24, actions: { meditate: { resolve: 1 } } },
      { id: 'void-bell', name: '太虚清音钟', icon: '钟', kind: 'equipment', price: 3800, max: 1, requireRealm: 7, auctionOnly: true, desc: '仙界拍品，真仙境可用。常驻战力 +65，凝神观想额外修为 +20、神识 +3。', powerBonus: 65, actions: { 'spirit-practice': { cultivation: 20, spirit: 3 } } },
      { id: 'emperor-seal', name: '镇星古印', icon: '印', kind: 'equipment', price: 9200, max: 1, requireRealm: 10, auctionOnly: true, desc: '上古拍品，金仙境可用。常驻战力 +120，静室修炼额外修为 +30。古印只是法器，不能代替真正的帝境突破。', powerBonus: 120, actions: { meditate: { cultivation: 30 } } },
      { id: 'phoenix-elixir', name: '涅槃仙露', icon: '露', kind: 'consumable', price: 4500, max: 3, requireRealm: 7, auctionOnly: true, desc: '仙界拍品，真仙境可用。立即气血 +60、心境 +40、修为 +180，并解除经脉受伤。', useEffects: { health: 60, resolve: 40, cultivation: 180 }, clearCondition: 'injured' }
    ],
    buffs: [
      { id: 'ward', name: '符光护身', desc: '护身符仍有灵光，战力 +15。', duration: 3, powerBonus: 15 },
      { id: 'insight', name: '明心定神', desc: '破境成功率提高 15 个百分点。', duration: 3, breakthroughBonus: 0.15 },
      { id: 'clear-mind', name: '灵台清明', desc: '参悟经典额外悟性 +3；静室修炼额外修为 +4。', duration: 3, actions: { comprehend: { insight: 3 }, meditate: { cultivation: 4 } } }
    ],
    conditions: [
      { id: 'injured', name: '经脉受伤', desc: '暂时不能山海游历、瀑下炼体、熬骨淬身或引雷淬脉。安排归舍休整，或使用续脉膏即可恢复。', blocks: ['explore', 'train', 'body-temper', 'thunder-temper'] }
    ],
    perks: [
      { id: 'road-guide', name: '商路故交', desc: '商队记住了你的信义。山海游历额外灵石 +20，战力 +6。', actions: { explore: { stones: 20 } }, powerBonus: 6 },
      { id: 'ancient-method', name: '古阵传承', desc: '从残阵中复原一门心法。静室修炼额外修为 +6，破境成功率 +4 个百分点。', actions: { meditate: { cultivation: 6 } }, breakthroughBonus: 0.04 },
      { id: 'beast-companion', name: '灵兽相伴', desc: '一只云纹小兽跟随你走南闯北。战力 +8，山海游历的气血消耗减少 3。', powerBonus: 8, actions: { explore: { health: 3 } } },
      { id: 'village-contact', name: '小镇灯火', desc: '镇上的人把你当作自己人。凡间营生额外灵石 +25、心境 +2。', actions: { work: { stones: 25, resolve: 2 } } },
      { id: 'library-pass', name: '藏书楼常客', desc: '获得旧藏书楼的长期借阅资格。参悟经典额外悟性 +2。', actions: { comprehend: { insight: 2 } } },
      { id: 'sword-echo', name: '一剑留痕', desc: '记住了前辈落剑的分寸。问剑悟意额外修为 +3，战力 +4。', actions: { 'sword-intent': { cultivation: 3 } }, powerBonus: 4 },
      { id: 'tempered-sinew', name: '筋骨有节', desc: '学会在发力间隙养护筋骨。瀑下炼体的气血消耗减少 2，熬骨淬身减少 3。', actions: { train: { health: 2 }, 'body-temper': { health: 3 } } },
      { id: 'beast-accord', name: '林间灵契', desc: '附近鸟兽愿意回应你的灵识。万灵共鸣额外修为 +3，照料幼兽的气血消耗减少 2。', actions: { 'beast-attune': { cultivation: 3 }, 'beast-care': { health: 2 } } },
      { id: 'soul-anchor', name: '归魂心灯', desc: '你在识海中留下了返回日常的锚点。照魂守灯的心境消耗减少 3，凝神观想额外修为 +2。', actions: { 'soul-lantern': { resolve: 3 }, 'spirit-practice': { cultivation: 2 } } },
      { id: 'sect-meditation', name: '山门吐纳真解', desc: '藏经阁传授的进阶行气法。静室修炼额外修为 +8。', actions: { meditate: { cultivation: 8 } } },
      { id: 'sect-insight', name: '经义辨微', desc: '熟悉典籍之间的脉络。参悟经典额外悟性 +3，听长老讲经额外修为 +5。', actions: { comprehend: { insight: 3 }, lecture: { cultivation: 5 } } },
      { id: 'immortal-sutra', name: '太清仙经', desc: '仙界经义融入旧日功法。静室修炼额外修为 +18，破境成功率提高 4 个百分点。', actions: { meditate: { cultivation: 18 } }, breakthroughBonus: 0.04 },
      { id: 'tide-memory', name: '潮生道痕', desc: '水府遗迹留下的行气印记。凝神观想额外修为 +8，战力 +10。', actions: { 'spirit-practice': { cultivation: 8 } }, powerBonus: 10 },
      { id: 'thunder-mark', name: '雷府古篆', desc: '古雷府的守护篆文已经刻入识海。瀑下炼体额外修为 +8，战力 +24。', actions: { train: { cultivation: 8 } }, powerBonus: 24 },
      { id: 'star-compass', name: '星墟道标', desc: '能在仙界星海中辨认方位。山海游历额外修为 +15，战力 +40。', actions: { explore: { cultivation: 15 } }, powerBonus: 40 },
      { id: 'ancient-crown', name: '古帝传道', desc: '古帝陵中留下的是道理，而非现成的境界。战力 +80，破境成功率提高 5 个百分点。', powerBonus: 80, breakthroughBonus: 0.05 }
    ],
    facilities: [
      { id: 'pill-hall', name: '炼丹堂', desc: '凭山门贡献支取丹药。药性与坊市相同，每一份都真实收入背囊。', offers: [
        { id: 'qi-pair', name: '聚气丹两枚', desc: '支取两枚聚气丹，留待修为不足时服用。', cost: 30, gainItems: { 'qi-pill': 2 } },
        { id: 'healing-pair', name: '续脉膏两份', desc: '为下一次受伤或气血不足预留药物。', cost: 20, gainItems: { 'healing-salve': 2 } },
        { id: 'breakthrough-dose', name: '明心破境丹', desc: '闭关前服用，提高未来三年破境成功率。', cost: 40, gainItems: { 'breakthrough-pill': 1 } },
        { id: 'fruit-pair', name: '赤玉灵果两枚', desc: '补充气血与心境，也能温养体魄。', cost: 25, gainItems: { 'spirit-fruit': 2 } }
      ] },
      { id: 'library', name: '藏经阁', desc: '以贡献换取传法资格。读懂后成为长期收获，不占背囊，也不能重复兑换。', offers: [
        { id: 'breathing-book', name: '研读吐纳真解', desc: '永久提升静室修炼收益：额外修为 +8。', cost: 100, requireRealm: 1, grantPerk: 'sect-meditation' },
        { id: 'insight-book', name: '研读经义辨微', desc: '参悟额外悟性 +3，讲经额外修为 +5。', cost: 80, requireRealm: 1, grantPerk: 'sect-insight' },
        { id: 'immortal-book', name: '研读太清仙经', desc: '真仙境可读。静坐额外修为 +18，破境成功率 +4 个百分点。', cost: 400, requireRealm: 7, grantPerk: 'immortal-sutra' }
      ] },
      { id: 'forge-hall', name: '炼器堂', desc: '凭贡献换取护身法器。装备持有即生效，相同装备只可拥有一件。', offers: [
        { id: 'sect-sword', name: '领用青锋法剑', desc: '战力 +12，并开启通用的练习御剑行动。', cost: 80, requireRealm: 1, gainItems: { sword: 1 } },
        { id: 'sect-boots', name: '领用踏云履', desc: '游历更省气血，采矿也能更好地锻炼筋骨。', cost: 50, requireRealm: 1, gainItems: { 'cloud-boots': 1 } },
        { id: 'sect-armor', name: '领用玄铁护臂', desc: '元婴境可用。战力 +18，炼体与淬身气血消耗减少。', cost: 180, requireRealm: 3, gainItems: { 'sect-armlet': 1 } }
      ] }
    ],
    companions: [
      { id: 'qinghe', name: '青禾', gender: '女', path: 'alchemy', requireRealm: 0, minMorality: 20, desc: '二十八岁的成年丹师，常在山镇义诊。看重言行一致与善意，愿与能相互尊重的人慢慢了解彼此。', actions: { alchemy: { cultivation: 3 }, rest: { health: 3 }, 'partner-cultivate': { health: 2 } } },
      { id: 'moling', name: '墨凌', gender: '男', path: 'sword', requireRealm: 1, minMorality: 0, desc: '四十二岁的成年剑修，说话直接、守诺如一。欣赏稳扎稳打的练习，也尊重对方独自修行的时间。', actions: { train: { physique: 1 }, 'sword-intent': { cultivation: 4 } }, powerBonus: 6 },
      { id: 'shenxing', name: '沈行', gender: '男', path: 'wander', requireRealm: 0, minMorality: -20, desc: '三十一岁的成年游方客，爱记录各地风物。待人宽厚但有自己的边界，希望伴侣也是能平等同行的朋友。', actions: { explore: { stones: 12 }, 'free-roam': { resolve: 2 }, 'partner-cultivate': { spirit: 1 } } },
      { id: 'yanluo', name: '燕落', gender: '女', path: 'thunder', requireRealm: 2, minMorality: -40, desc: '九十六岁的成年雷修，行事果断，不以传闻判断人。她愿意了解过去，但要求双方为眼下的选择负责。', actions: { 'thunder-temper': { health: 2 }, 'spirit-practice': { cultivation: 4 } }, powerBonus: 10 },
      { id: 'suyue', name: '素月', gender: '女', path: 'ice', requireRealm: 4, minMorality: 10, desc: '三百六十岁的成年玄冰修士，寡言而细心。看重安静陪伴与彼此信任，不会把境界高低当作亲近的理由。', actions: { comprehend: { insight: 1 }, 'frost-breath': { health: 2 }, 'partner-cultivate': { resolve: 2 } }, powerBonus: 12 },
      { id: 'zhuyin', name: '烛隐', gender: '男', path: 'soul', requireRealm: 7, minMorality: -80, desc: '两千四百岁的成年仙界魂修，曾历经许多是非。他重视清楚说出的心意，也不替任何人回避行为的后果。', actions: { 'soul-lantern': { resolve: 2 }, 'partner-cultivate': { cultivation: 10, spirit: 1 } }, powerBonus: 25 }
    ],
    dungeons: [
      { id: 'mist-gorge', name: '雾隐峡', desc: '山雾、断桥与一座封存药圃组成最初的历练。适合准备了疗伤物资的新修士。', requireRealm: 0, entryCost: 60, difficulty: 28, reward: { effects: { stones: 180, cultivation: 40 }, gainItems: { herb: 3, 'qi-pill': 1 } } },
      { id: 'sunken-palace', name: '沉璧水府', desc: '沿水下甬道穿过三重旧阵，寻找水府主人留下的行气道痕。', requireRealm: 2, entryCost: 220, difficulty: 160, reward: { effects: { stones: 550, cultivation: 110 }, gainItems: { 'breakthrough-pill': 1 }, grantPerk: 'tide-memory' } },
      { id: 'thunder-vault', name: '万雷古府', desc: '大乘境方能承受古府余威。残存的雷池、守卫与篆文都不会因来客强大而轻易退让。', requireRealm: 5, entryCost: 600, difficulty: 560, reward: { effects: { stones: 1400, cultivation: 260 }, gainItems: { ward: 2 }, grantPerk: 'thunder-mark' } },
      { id: 'star-ruins', name: '星海残墟', desc: '飞升仙界后开启。三段破碎星路通向一枚仍在指引归途的道标。', requireRealm: 7, entryCost: 1200, difficulty: 950, reward: { effects: { stones: 2800, cultivation: 500 }, gainItems: { 'phoenix-elixir': 1 }, grantPerk: 'star-compass' } },
      { id: 'emperor-tomb', name: '古帝传道陵', desc: '金仙境后的艰险试炼。穿越三重道境，得到古帝留下的修行体悟，帝位仍要靠自己突破。', requireRealm: 10, entryCost: 3000, difficulty: 1800, reward: { effects: { stones: 7000, cultivation: 1100 }, gainItems: { 'phoenix-elixir': 2 }, grantPerk: 'ancient-crown' } }
    ],
    opponents: [
      { id: 'ferry-guard', name: '渡口守卫陆川', desc: '成年修士，守着商旅往来的渡口。接受点到即止的切磋；若遭劫掠，会尽力反击。', requireRealm: 0, powerOffset: -8, loot: 90 },
      { id: 'roaming-swordsman', name: '游剑客程岳', desc: '成年剑客，走南闯北积累剑术。愿意以武会友，随身盘缠则不会轻易交出。', requireRealm: 1, powerOffset: 8, loot: 180 },
      { id: 'rogue-alchemist', name: '散丹师阮闻', desc: '成年丹师，独自经营灵药生意。看似文弱却准备了许多护身手段。', requireRealm: 3, powerOffset: 20, loot: 300 },
      { id: 'immortal-sentinel', name: '仙关守将白朔', desc: '成年仙界修士，值守星路关隘。境界相近也不可轻敌，敌意会换来真正的反击。', requireRealm: 7, powerOffset: 40, loot: 800 }
    ],
    auctionPool: [
      { itemId: 'manual', quantity: 1, requireRealm: 0, basePrice: 220 },
      { itemId: 'qi-pill', quantity: 2, requireRealm: 0, basePrice: 210 },
      { itemId: 'ward', quantity: 2, requireRealm: 0, basePrice: 170 },
      { itemId: 'breakthrough-pill', quantity: 1, requireRealm: 0, basePrice: 170 },
      { itemId: 'star-map', quantity: 1, requireRealm: 2, basePrice: 680 },
      { itemId: 'thunder-jade', quantity: 1, requireRealm: 4, basePrice: 1400 },
      { itemId: 'void-bell', quantity: 1, requireRealm: 7, basePrice: 3800 },
      { itemId: 'emperor-seal', quantity: 1, requireRealm: 10, basePrice: 9200 },
      { itemId: 'phoenix-elixir', quantity: 1, requireRealm: 7, basePrice: 4500 }
    ],
    stories: [
      { id: 'escort', name: '一程风雪', desc: '商队等着你护送两段山路。订金已经收下，尾款要等交付后领取。', actionId: 'escort-work', target: 2, duration: 3, followupEvent: 'escort-finish', rewardDesc: '交付获得灵石 260，并留下长期收获「商路故交」。' },
      { id: 'secret', name: '无名洞府', desc: '石壁上的古阵不是一眼能懂的，需要分三次整理与推演。', actionId: 'secret-study', target: 3, duration: 4, followupEvent: 'secret-finish', rewardDesc: '复原古阵，获得修为 45、悟性 5 与长期收获「古阵传承」。' },
      { id: 'beast', name: '山雨里的小兽', desc: '受伤的幼兽住进了你的院子。两次耐心照料之后，再决定它的去处。', actionId: 'beast-care', target: 2, duration: 3, followupEvent: 'beast-finish', rewardDesc: '照料完成后可结为伙伴，获得长期收获「灵兽相伴」。' }
    ],
    events: [
      { id: 'misfortune-torn-pack', title: '夜路上的断绳', icon: '险', body: '山路湿滑，行囊的背绳突然断开，几件东西滚向斜坡。你可以舍弃一份灵矿稳住身形，也可以护住行囊，承受这一跤。', negative: true, minYear: 2, weight: 1.6, choices: [
        { text: '放开一份灵矿，先站稳脚步', result: '矿石滚入了深沟。你稳住身体，把余下的东西重新绑好。', costItems: { ore: 1 }, effects: { resolve: -3 } },
        { text: '护住行囊，慢慢爬回山路', result: '东西保住了，手臂却被碎石划伤。夜路比想象中难走。', effects: { health: -8, resolve: -4 } }
      ] },
      { id: 'misfortune-poison-fog', title: '药谷的瘴气', icon: '瘴', body: '潮湿谷底突然升起灰雾，来时的路已经模糊。气息带着刺痛，越久留越危险。', negative: true, weight: 1.7, choices: [
        { text: '用续脉膏护住经脉后撤离', result: '药膏压住了大部分瘴毒。你仍有些疲惫，但经脉没有留下损伤。', costItems: { 'healing-salve': 1 }, effects: { health: -3, resolve: -3 } },
        { text: '屏息撤离，先保住退路', result: '你终于走出灰雾，却已有瘴毒伤及经脉。需要休整或药物治疗。', effects: { health: -11, resolve: -5 }, addCondition: 'injured' }
      ] },
      { id: 'misfortune-inn-fire', title: '客栈走水', icon: '火', body: '半夜，隔壁房梁突然起火。浓烟灌入走廊，楼上还有人未醒。无论如何都要尽快离开。', negative: true, weight: 1.4, choices: [
        { text: '破开窗梁，接应楼上的住客', result: '你顶着热浪撑住了一截梁木。', check: { stat: 'power', difficulty: 38, success: { result: '住客们顺着绳索逃出火场，你的手臂被烫伤，却救下了几个人。', effects: { health: -6, reputation: 5, morality: 7 } }, failure: { result: '梁木先一步倒塌。你被赶来的巡夜人拉出火场，身上留下伤势。', effects: { health: -18, resolve: -8, morality: 3 }, addCondition: 'injured' } } },
        { text: '敲响警钟，从侧门撤离', result: '警钟唤醒了附近的人。你穿过浓烟逃出，仍被热浪灼伤。', effects: { health: -7, resolve: -5, morality: 1 } }
      ] },
      { id: 'misfortune-false-debt', title: '无端追来的债单', icon: '讼', body: '一名陌生人拿着模糊手印，硬说你欠下盘缠。围观者越聚越多，对方带来的人也堵住了去路。', negative: true, weight: 1.2, choices: [
        { text: '花 90 灵石打发纠缠，尽快脱身', result: '对方拿到钱便散开了。这件事毫无道理，却实实在在耗掉了盘缠。', effects: { stones: -90, resolve: -5 } },
        { text: '守住证据，请附近执事查明', result: '来回对证耗去许多精力，推搡中也受了轻伤。最后债单被认定为伪造。', effects: { health: -5, resolve: -9, morality: 2 } }
      ] },
      { id: 'misfortune-sect-censure', title: '山门传来的质询', icon: '戒', body: '你近来的恶名传到了山门，执事要求解释。曾经的师承并不会让过去的行为自动消失。', negative: true, requireSect: true, maxMorality: -20, weight: 2, choices: [
        { text: '交出 25 贡献弥补受损公物', result: '执事收回相应贡献，记下你的补偿。名声不会立刻恢复，但至少迈出了修正的一步。', require: { contribution: 25 }, effects: { contribution: -25, morality: 8, resolve: -3 } },
        { text: '公开说明过失，接受责问', result: '质询让你难堪，也让一些被忽略的后果变得清楚。你答应今后以实际行动补偿。', effects: { reputation: -5, resolve: -12, morality: 5 } }
      ] },
      { id: 'misfortune-dao-deviation', title: '周天逆流', icon: '逆', body: '一次寻常吐纳忽然引动旧伤，灵力在经脉里逆行。继续强行运转只会把损伤扩大。', negative: true, minRealm: 4, weight: 1.5, choices: [
        { text: '耗一张护身符，稳住紊乱灵息', result: '符纸在掌心化灰，帮你撑过了最剧烈的一阵冲击。', costItems: { ward: 1 }, effects: { health: -5, resolve: -5, cultivation: -15 } },
        { text: '立即散去部分修为，终止周天', result: '你保住了继续修行的根本，经脉仍需一段时间恢复。', effects: { cultivation: -45, health: -15, resolve: -6 }, addCondition: 'injured' }
      ] },
      { id: 'misfortune-old-grievance', title: '旧怨找上门', icon: '怨', body: '过去受过你欺压的人找到了同伴，拦在山口要求一个交代。此刻的选择仍会继续影响你的名声。', negative: true, minRealm: 1, maxMorality: -20, weight: 2, choices: [
        { text: '拿出 200 灵石补偿旧事', result: '对方收下补偿，但没有立刻说出原谅。至少这一次，你正面承认了责任。', effects: { stones: -200, morality: 12, resolve: -5 } },
        { text: '以武力逼退追问者', result: '你再次运转灵力，把争执推向对抗。', effects: { morality: -8 }, check: { stat: 'power', difficulty: 110, success: { result: '众人暂时退开，关于你的传闻却只会更坏。', effects: { health: -8, reputation: -4 } }, failure: { result: '这次你未能压住对方，受伤后才得以离开。', effects: { health: -24, resolve: -8 }, addCondition: 'injured' } } },
        { text: '请巡山使调停，承认自己的过失', result: '调停终止了冲突，但你仍挨了一记愤怒的拳头。旧事不会消失，修正可以从现在开始。', effects: { health: -8, reputation: -5, resolve: -8, morality: 8 } }
      ] },
      { id: 'misfortune-good-name', title: '求援者挤满院门', icon: '困', body: '你的善名招来了许多求助。药材和人手都不足，逐一奔走已经超出体力，但他们眼下确实没有别的去处。', negative: true, minMorality: 20, weight: 1.6, choices: [
        { text: '花 120 灵石请医师来分担', result: '有了足够人手，最紧急的伤病先得到处理。你付出一笔盘缠，也终于能缓一口气。', effects: { stones: -120, resolve: -3, morality: 7 } },
        { text: '按轻重缓急逐一转介，亲自跑完各处', result: '事情没有一夜解决，但大家都有了求助方向。等最后一个人离开，你已经疲惫不堪。', effects: { health: -10, resolve: -9, morality: 3 } }
      ] },
      { id: 'misfortune-heart-demon', title: '识海里的旧影', icon: '魇', body: '多年前的恐惧突然出现在静室，真假难分。那并非外敌，而是修行中从未认真面对的旧影。', negative: true, minRealm: 2, weight: 1.6, choices: [
        { text: '守住心境，直面旧影', result: '你让那些画面浮现，不再假装它们不存在。', check: { stat: 'resolve', difficulty: 55, success: { result: '旧影缓缓散开。这次对视十分疲惫，却让你更了解自己的弱处。', effects: { resolve: -4, insight: 5 } }, failure: { result: '过往情绪涌来得太快，你费力才找回当下的身体。', effects: { health: -14, resolve: -18 } } } },
        { text: '结束内观，靠熟悉的日常稳住自己', result: '你点亮窗边的灯，听着院外声响等天亮。这一夜并没有答案，但你没有继续陷下去。', effects: { health: -6, resolve: -9 } }
      ] },
      { id: 'misfortune-blood-ledger', title: '恶名录上的新一页', icon: '债', body: '你的名字被记进几处坊市的恶名录。与其说是诅咒，不如说越来越多人不再信任你；旧日受害者也开始结伴讨还公道。', negative: true, maxMorality: -60, weight: 2.4, choices: [
        { text: '交出 300 灵石，逐一补偿有据的损失', result: '补偿不能抹去已经发生的事，但有人愿意记下你这一次的改变。', effects: { stones: -300, morality: 18, reputation: -3, resolve: -8 } },
        { text: '收敛行止，承认旧账并接受追责', result: '你散去一部分争斗中积累的灵息，任由对方留下问责印记。重建信任还需要很久。', effects: { cultivation: -60, health: -10, resolve: -12, morality: 12 } }
      ] },
      { id: 'misfortune-immortal-toll', title: '仙渡临时封关', icon: '关', body: '仙界渡口因界潮紊乱临时封关。补阵物资由过路者分担，也可以留下来承担一段维持阵线的苦役。', negative: true, minRealm: 7, weight: 1.6, choices: [
        { text: '缴纳 900 灵石，补足阵材', result: '阵材记在公开的清单里，守关者放你通行。仙界的远行同样需要盘缠。', effects: { stones: -900, resolve: -5 } },
        { text: '亲自维持阵线，换取通行', result: '你撑到替班的人赶来，体内灵息已被阵线磨去一截，气血也明显衰弱。', effects: { cultivation: -90, health: -13, resolve: -10 } }
      ] },
      { id: 'misfortune-space-rift', title: '星路裂隙', icon: '裂', body: '脚下星路突然断裂，空间乱流扯住衣角。此地已经没有从容绕路的余地，只能选择如何脱身。', negative: true, minRealm: 7, weight: 1.8, choices: [
        { text: '用两张护身符护住全身，借力脱离', result: '两层符光先后破碎，替你挡住了最致命的乱流。', costItems: { ward: 2 }, effects: { health: -7, resolve: -6 } },
        { text: '强行破开乱流', result: '你将灵力凝在身前，向薄弱处突进。', check: { stat: 'power', difficulty: 1000, success: { result: '裂隙被短暂撑开，你拖着疲惫身体冲回星路。', effects: { health: -11, resolve: -8 } }, failure: { result: '乱流先一步撕开护体灵力，留下了严重的经脉伤势。', effects: { health: -32, resolve: -14 }, addCondition: 'injured' } } },
        { text: '散去修为，换取最稳妥的退路', result: '你让一部分灵息抵消乱流，总算回到稳定星路。即使这样，经脉也已受伤。', effects: { cultivation: -140, health: -16, resolve: -8 }, addCondition: 'injured' }
      ] },
      { id: 'misfortune-broken-oath', title: '道誓回响', icon: '誓', body: '境界越深，曾经违背的承诺就越难被遗忘。金仙道果中传来不协调的回响，逼你面对这些年留下的因果。', negative: true, minRealm: 10, maxMorality: -20, weight: 2, choices: [
        { text: '拿出 1500 灵石补偿仍可挽回的损失', result: '并非所有人都愿意接受，但你的行动令道果中的裂声稍稍平息。', effects: { stones: -1500, morality: 16, resolve: -12 } },
        { text: '正视道誓，舍去不稳的修为', result: '你不再用更强的力量掩住裂缝。这一段修为散去，气血也受到重创，之后仍需要以行动守信。', effects: { cultivation: -280, health: -25, resolve: -16, morality: 12 } }
      ] },
      { id: 'misfortune-rogue-betrayal', title: '同行者的暗手', icon: '变', body: '曾与你谈论劫掠的同行者盯上了你的行囊。恶名并不会替你换来可靠的盟友，夜里的营火已经被人围住。', negative: true, minRealm: 2, maxMorality: -40, weight: 1.8, choices: [
        { text: '留下 250 灵石，趁对方分赃离开', result: '你走出营地，知道这份同行关系从来不值得信赖。', effects: { stones: -250, resolve: -10 } },
        { text: '先发制人，以武力突围', result: '你拔起一根燃木，为自己争取退路。', effects: { morality: -6 }, check: { stat: 'power', difficulty: 180, success: { result: '包围被打出缺口，你受了些伤，总算保住行囊。', effects: { health: -9, resolve: -6 } }, failure: { result: '对方早有准备，你付出更重的伤势才脱身。', effects: { health: -24, resolve: -14 }, addCondition: 'injured' } } },
        { text: '舍弃不稳灵息作为诱饵，远离这群人', result: '一道散出的灵息引开了注意。你翻出营地，身心俱疲，也开始反省这些年结下的关系。', effects: { cultivation: -55, health: -10, resolve: -10, morality: 5 } }
      ] },
      { id: 'path-sword-echo', title: '无锋石上的剑痕', icon: '剑', body: '废弃剑坪上，一位老人正用木枝描摹石面的旧痕。他看出你练的是剑，邀你接着前人的笔势补完最后一剑。', requirePath: 'sword', once: true, minYear: 2, weight: 2.2, choices: [
        { text: '以自身剑意续上石痕', result: '你捡起木枝，慢慢调匀呼吸。', check: { stat: 'physique', difficulty: 35, success: { result: '木枝没有折断，剑势却完整地落在了石上。老人点出发力的关节，这一剑从此留在你心里。', effects: { cultivation: 20, reputation: 3 }, grantPerk: 'sword-echo' }, failure: { result: '剑意在最后一寸散开，反震让手臂隐隐发痛。老人收起木枝，提醒你先练稳自己的节奏。', effects: { health: -6, insight: 2 } } } },
        { text: '先看老人把整套剑势演完', result: '你记下起剑与收剑的分寸，知道还有哪些基本功需要慢慢磨。', effects: { insight: 2 } }
      ] },
      { id: 'path-alchemy-furnace', title: '旧炉里的双生丹纹', icon: '丹', body: '修炉匠从废炉内壁刮出一张丹纹拓片，上面记着双炉分火的次序。他愿意借一口旧炉，与你合炼一枚明心破境丹。', requirePath: 'alchemy', once: true, minYear: 2, weight: 2.2, choices: [
        { text: '出两份药草与 60 灵石，共同开炉', result: '两股丹火在炉心相会，明心丹顺利成形。你收好丹瓶，也亲手摸清了分火时机。', costItems: { herb: 2 }, effects: { stones: -60, insight: 4 }, gainItems: { 'breakthrough-pill': 1 } },
        { text: '帮他清理旧炉，抄下火候笔记', result: '修炉匠没有藏私，把火候次序完整讲了一遍。暂时没有材料，也不妨碍你学懂道理。', effects: { insight: 2, spirit: 1 } }
      ] },
      { id: 'path-wander-road', title: '一条被雨冲断的路', icon: '游', body: '行吟到小镇时，你发现商队与村民都堵在塌方处。你熟悉附近水势，能为他们寻一条便道，只是要出些钱租来船和绳索。', requirePath: 'wander', once: true, minYear: 2, weight: 2.2, choices: [
        { text: '出 90 灵石开通便道', result: '船穿过浅湾，绳桥重新连起两岸。镇民邀请你以后路过时来喝碗热汤，这里从此有了一处落脚地。', effects: { stones: -90, reputation: 5 }, grantPerk: 'village-contact' },
        { text: '把沿途见过的地形画给村民', result: '你画下河湾和高地的位置。等物资备齐，他们就能照图开路。', effects: { spirit: 2, reputation: 1 } }
      ] },
      { id: 'path-body-stone', title: '磨坊里的炼体老人', icon: '体', body: '山村磨坊的老人不用牛马，自己推着石磨。听说你也修炼筋骨，他请你试着分清蛮力与巧劲。', requirePath: 'body', once: true, minYear: 2, weight: 2.2, choices: [
        { text: '接过磨杆，以全身劲力推动', result: '你稳住脚跟，让力量从地面一路传到双臂。', check: { stat: 'physique', difficulty: 40, success: { result: '石磨转过一整圈，呼吸仍然平稳。老人教你在发力之间养住筋骨，今后淬身不必总靠硬撑。', effects: { physique: 3, cultivation: 15 }, grantPerk: 'tempered-sinew' }, failure: { result: '你一时急于发力，反而扯伤经脉。老人扶你坐下，嘱咐养好伤势再来练基本功。', effects: { health: -12 }, addCondition: 'injured' } } },
        { text: '先跟着老人学站桩与换气', result: '石磨没动，但你的呼吸与脚步比来时更稳了。', effects: { physique: 2, resolve: 2 } }
      ] },
      { id: 'path-formation-library', title: '藏书楼外的断阵', icon: '阵', body: '旧藏书楼的护书阵缺了两个阵眼，雨气正渗入卷宗。守楼人认出你是阵修，请你用灵矿补好阵脚，之后可长期来借书。', requirePath: 'formation', once: true, minYear: 2, weight: 2.2, choices: [
        { text: '用两份灵矿补好护书阵', result: '水汽被稳稳挡在窗外。守楼人递来借书木牌，留出一张靠窗的桌子供你推演阵图。', costItems: { ore: 2 }, effects: { insight: 3 }, grantPerk: 'library-pass' },
        { text: '先把受潮卷宗搬到高处', result: '你帮忙护住了最旧的一批书，也看清了断阵为何会漏水。', effects: { insight: 2 } }
      ] },
      { id: 'path-beast-spring', title: '春林里的求助声', icon: '兽', body: '你在鸟鸣里听见急促的求助。几只幼鸟误食了苦藤，成鸟守在树梢，等着一个能理解它们的人。', requirePath: 'beast', once: true, minYear: 2, weight: 2.2, choices: [
        { text: '取两份药草，为幼鸟调养', result: '幼鸟渐渐恢复精神，整片林子的鸣声也柔和起来。鸟兽记住了这道善意的神识，往后愿意回应你的共鸣。', costItems: { herb: 2 }, effects: { spirit: 3, resolve: 4 }, grantPerk: 'beast-accord' },
        { text: '引成鸟去找山下的兽医', result: '你沿路留下温和的灵识，直到兽医带着药箱赶来。', effects: { spirit: 2, reputation: 1 } }
      ] },
      { id: 'path-ice-plum', title: '寒潭上最后一枝梅', icon: '冰', body: '山中寒潮将梅枝冻在潭面，枝下却藏着一处温泉灵眼。若能读懂冰与水转换的脉络，也许能不伤树根地取出其中灵药。', requirePath: 'ice', once: true, minYear: 2, weight: 2.2, choices: [
        { text: '顺着冰纹引开寒息', result: '你把吐纳的节奏放得比水滴还慢。', check: { stat: 'insight', difficulty: 40, success: { result: '冰纹依次散开，梅根安然无恙。泉眼旁留着前人封存的一枚明心丹，还有两包可温养心神的灵茶。', gainItems: { 'breakthrough-pill': 1, 'mountain-tea': 2 }, effects: { cultivation: 15 } }, failure: { result: '寒息比预计更深，你及时收手，仍被冻得气血迟滞。', effects: { health: -8, insight: 2 } } } },
        { text: '沿潭观察，记下冰纹的走向', result: '你没有扰动梅根，却把寒息流转的次序记在了心里。', effects: { insight: 2, resolve: 2 } }
      ] },
      { id: 'path-thunder-pillar', title: '山顶引雷柱', icon: '雷', body: '一根残旧铜柱仍在替山下村落分散雷电。守柱人见你修雷法，邀你借一次雷意修补柱纹，但提醒你量力而行。', requirePath: 'thunder', once: true, minYear: 2, weight: 2.2, choices: [
        { text: '以自身雷意接续柱纹', result: '你先找好退路，才将灵力送向铜柱。', check: { stat: 'power', difficulty: 42, success: { result: '雷光顺着新纹路泄入地下。守柱人送来两张护身符，提醒你驾驭雷霆也要记得保护自己。', effects: { cultivation: 30, reputation: 4 }, gainItems: { ward: 2 } }, failure: { result: '一缕雷意逆冲经脉，你立刻切断联系。铜柱还在，伤势却需要先养好。', effects: { health: -14, resolve: -4 }, addCondition: 'injured' } } },
        { text: '帮忙清理接地沟，观察雷纹', result: '排雷的沟渠疏通了。即使没有引雷，你也看懂了一部分雷意的去向。', effects: { spirit: 2, reputation: 1 } }
      ] },
      { id: 'path-soul-lantern', title: '夜渡的纸灯', icon: '魂', body: '江边的旧渡口每到夜晚就有纸灯自明。残留的思念没有恶意，只是在等待一条回到安宁的路。你熟悉识海，也许能帮它们找到归处。', requirePath: 'soul', once: true, minYear: 2, weight: 2.2, choices: [
        { text: '以心灯照见思念的来处', result: '你先记住身边的江声，再让神识靠近纸灯。', check: { stat: 'spirit', difficulty: 40, success: { result: '灯光一盏盏熄灭，渡口恢复宁静。你也学会在深处内观时，为自己留下返回日常的心灯。', effects: { spirit: 3, resolve: 5 }, grantPerk: 'soul-anchor' }, failure: { result: '太多记忆同时涌来。你循着江声收回神识，决定今夜先好好休息。', effects: { resolve: -10, insight: 2 } } } },
        { text: '坐在岸边，为往事留一夜安静', result: '你没有强求答案，只看着灯光随水波摇晃。', effects: { resolve: 4 } }
      ] },
      { id: 'path-yang-clinic', title: '药房的第一缕晨光', icon: '阳', body: '阴雨连绵，山镇药房的草药迟迟晾不干。你的纯阳灵息可以温和驱散湿寒，药师愿意拿药材与你合作制一份续脉膏。', requirePath: 'yang', once: true, minYear: 2, weight: 2.2, choices: [
        { text: '花 40 灵石补齐辅料，温养药炉', result: '晨光般的灵息慢慢融入药炉，病人们也能用上新药。药师把两份续脉膏装好送给你。', effects: { stones: -40, health: 10, reputation: 3 }, gainItems: { 'healing-salve': 2 } },
        { text: '替药房晒干草药，再一起吃顿早饭', result: '草药重新有了清香。一碗热粥下肚，你觉得温养身体也可以从这样的小事开始。', effects: { health: 5, resolve: 3 } }
      ] },
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
        { text: '带回院子，慢慢照料', result: '你用外衣裹好它。它还不信任人，但终于不再发抖。', effects: { morality: 3 }, startStory: 'beast' },
        { text: '送到附近兽医那里', result: '兽医接过小兽，点亮了药房的灯。你放心地继续赶路。', effects: { morality: 2 } }
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
        { text: '拿出 120 灵石助修桥', result: '新桥落成那天，镇民在桥头给你留了一碗热汤。从此这里有人记得你的名字。', effects: { stones: -120, reputation: 8, morality: 8 }, grantPerk: 'village-contact' },
        { text: '留下修桥图纸和建议', result: '你帮忙找到一段更浅的河道，镇民决定先搭一座便桥。', effects: { reputation: 1, morality: 2 } }
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
        { text: '把整只货箱送回驿站', result: '驿卒核对完封条，按规矩给了你一份答谢。', effects: { stones: 45, reputation: 2, morality: 4 } },
        { text: '写下地点，请驿卒来取', result: '你留下记号，很快看见驿卒带人赶来。', effects: { reputation: 1, morality: 2 } }
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
        { text: '拿出一份续脉膏', result: '伤者渐渐缓过气。他坚持用一袋灵石答谢你，留下了善意的约定。', costItems: { 'healing-salve': 1 }, effects: { stones: 130, reputation: 5, morality: 6 } },
        { text: '扶他到最近的医馆', result: '医馆的人接过担架，山路上的灯多亮了一盏。', effects: { reputation: 2, morality: 3 } }
      ] },
      { id: 'rain-garden', title: '雨后药圃', icon: '芽', body: '连日细雨让山谷里的野生药草长得极好。主人留下木牌：成熟的可以采，幼苗请留给来年。', choices: [
        { text: '只采成熟的两株', result: '两份药草装进了背囊，幼苗仍在雨珠下摇晃。', gainItems: { herb: 2 } },
        { text: '替药圃疏通积水', result: '水沟通了，香气从湿润的泥土里升起来。', effects: { resolve: 4, insight: 1, morality: 2 } }
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
        { text: '认真写下曾经的失败与重来', result: '你没有只写风光的部分。信写到最后，连自己也觉得安心了些。', effects: { resolve: 8, reputation: 3, morality: 3 } },
        { text: '赠送一枚聚气丹与祝福', result: '你告诉他，丹药只能添一点修为，自己的路还要慢慢走。', costItems: { 'qi-pill': 1 }, effects: { reputation: 7, resolve: 5, morality: 5 } }
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
