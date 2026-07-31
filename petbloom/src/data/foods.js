/**
 * 食物安全与适口性数据库 —— 回答"它到底能吃什么"。
 *
 * 每条记录给出 **按物种区分** 的结论，因为同一种食物对不同物种差别极大：
 * 胡萝卜对狗是安全零食，对兔子是高糖零食，对龙猫则应完全避免。
 *
 * 结论等级（verdict）：
 *   staple  主食级：可以作为日常主要能量来源
 *   safe    安全：可常规少量给予
 *   limit   限量：有条件可给，超量有害
 *   avoid   不建议：非急性剧毒，但风险显著大于收益
 *   toxic   有毒：明确毒性，误食需按剂量评估甚至急诊
 *   unknown 缺乏可靠资料：按"不给"处理
 *
 * 用途是日常喂养决策与误食初判，不替代中毒急救的专业处置。
 */

export const VERDICT_META = {
  staple: { label: '主食级', icon: '🥇', tone: 'good', rank: 0 },
  safe: { label: '安全', icon: '✅', tone: 'good', rank: 1 },
  limit: { label: '限量', icon: '⚠️', tone: 'warn', rank: 2 },
  avoid: { label: '不建议', icon: '🚫', tone: 'bad', rank: 3 },
  toxic: { label: '有毒', icon: '☠️', tone: 'danger', rank: 4 },
  unknown: { label: '资料不足', icon: '❔', tone: 'neutral', rank: 2 },
};

const MAMMAL_PETS = ['cat', 'dog', 'rabbit', 'guineaPig', 'chinchilla', 'hamster'];
const HERBIVORES = ['rabbit', 'guineaPig', 'chinchilla'];
const ALL_SPECIES = [...MAMMAL_PETS, 'parrot', 'lizard', 'turtle', 'snake'];

/** 把同一结论套用到多个物种上。 */
function each(speciesIds, verdict) {
  return Object.fromEntries(speciesIds.map((id) => [id, verdict]));
}

export const FOODS = [
  // ── 明确毒物 ────────────────────────────────────────────────
  {
    id: 'chocolate',
    name: '巧克力 / 可可',
    aliases: ['可可粉', '黑巧克力', '巧克力饼干'],
    category: '人类食物',
    verdicts: each(ALL_SPECIES, 'toxic'),
    why: '含可可碱与咖啡因，宠物代谢极慢，会造成呕吐、心率过快、抽搐甚至死亡。黑巧克力与烘焙可可粉毒性最强，白巧克力最弱但仍不该给。',
    firstAid: '记录巧克力种类、大致克数与体重，立即联系兽医；不要自行催吐。',
    tags: ['急诊', '甲基咖啡因'],
  },
  {
    id: 'allium',
    name: '洋葱 / 大蒜 / 葱 / 韭菜',
    aliases: ['蒜', '葱', '洋葱粉', '蒜粉', '韭菜盒子'],
    category: '人类食物',
    verdicts: each(ALL_SPECIES, 'toxic'),
    why: '葱属植物破坏红细胞，导致溶血性贫血。猫比狗更敏感；煮熟、粉末、汤汁同样有毒，且粉末浓度更高。很多人是通过"人类熟食里的调味"不知不觉喂到的。',
    firstAid: '中毒表现常延迟 1-3 天出现（乏力、牙龈发白、尿色变深），需就医查血常规。',
    tags: ['急诊', '溶血', '隐藏在熟食中'],
  },
  {
    id: 'grape',
    name: '葡萄 / 葡萄干',
    aliases: ['提子', '青提', '葡萄干面包'],
    category: '水果',
    verdicts: { ...each(ALL_SPECIES, 'avoid'), dog: 'toxic', cat: 'avoid' },
    why: '对狗可引起急性肾损伤，且致病机制与安全剂量都不明确——同样的量有的狗没事、有的狗肾衰，因此不存在"安全份量"。猫与其他物种资料不足，一并按不给处理。',
    firstAid: '狗误食后属时间敏感事件，应尽快就医评估催吐与补液。',
    tags: ['急诊', '肾损伤', '无安全剂量'],
  },
  {
    id: 'xylitol',
    name: '木糖醇 / 无糖甜味制品',
    aliases: ['无糖口香糖', '代糖', '无糖花生酱'],
    category: '添加剂',
    verdicts: { ...each(ALL_SPECIES, 'avoid'), dog: 'toxic' },
    why: '木糖醇会让狗大量释放胰岛素，几十分钟内出现严重低血糖，高剂量可致肝衰竭。常藏在无糖口香糖、无糖花生酱、部分牙膏里。',
    firstAid: '属分钟级急诊：立即带上包装（看清木糖醇含量）就医。',
    tags: ['急诊', '低血糖', '隐藏配料'],
  },
  {
    id: 'macadamia',
    name: '澳洲坚果（夏威夷果）',
    aliases: ['夏威夷果'],
    category: '坚果',
    verdicts: { ...each(ALL_SPECIES, 'avoid'), dog: 'toxic' },
    why: '狗食入后可出现后肢无力、震颤、体温升高，机制未明。其他坚果虽多非剧毒，但高脂易诱发胰腺炎、且霉变坚果含黄曲霉毒素。',
    tags: ['神经症状'],
  },
  {
    id: 'caffeine',
    name: '咖啡 / 茶 / 能量饮料',
    aliases: ['咖啡渣', '茶叶', '奶茶'],
    category: '人类食物',
    verdicts: each(ALL_SPECIES, 'toxic'),
    why: '咖啡因与可可碱同类，刺激心脏与中枢神经，宠物体重小、代谢慢，一小杯就可能超量。咖啡渣与茶包同样危险。',
    tags: ['急诊', '甲基咖啡因'],
  },
  {
    id: 'alcohol',
    name: '酒精 / 含酒食物',
    aliases: ['啤酒', '白酒', '酒心巧克力', '醉虾'],
    category: '人类食物',
    verdicts: each(ALL_SPECIES, 'toxic'),
    why: '宠物对乙醇极敏感，会出现低血糖、呼吸抑制、酸中毒。发酵的生面团在胃里同样会产生乙醇。',
    tags: ['急诊'],
  },
  {
    id: 'dough',
    name: '生面团 / 活性酵母',
    aliases: ['发面', '面包生坯'],
    category: '人类食物',
    verdicts: each(ALL_SPECIES, 'toxic'),
    why: '生面团在温暖胃里继续发酵：一边膨胀造成胃扩张，一边产生乙醇造成酒精中毒，双重危险。',
    tags: ['急诊', '胃扩张'],
  },
  {
    id: 'humanPainkiller',
    name: '人用止痛药（对乙酰氨基酚 / 布洛芬）',
    aliases: ['扑热息痛', '泰诺', '芬必得', '感冒药'],
    category: '药物',
    verdicts: each(ALL_SPECIES, 'toxic'),
    why: '这是最容易被善意好心害死宠物的一类。猫缺乏关键代谢酶，一片对乙酰氨基酚即可致命；布洛芬对猫狗都会造成胃穿孔与肾衰。任何情况下都不要自行给人药。',
    firstAid: '疑似误食立即急诊，带上药品包装与估算剂量。',
    tags: ['急诊', '致死剂量极低'],
  },
  {
    id: 'lily',
    name: '百合 / 郁金香 / 绿萝 / 滴水观音',
    aliases: ['百合花', '香水百合', '天堂鸟', '龟背竹', '一品红'],
    category: '植物',
    verdicts: { ...each(ALL_SPECIES, 'toxic'), cat: 'toxic' },
    why: '百合属对猫是急性肾衰级毒物，花粉、花瓶水、任何部位都算。家里养猫就不要出现百合。其他常见观叶植物多含草酸钙结晶，会造成口腔灼痛与呕吐。',
    firstAid: '猫接触百合属于急诊，越早补液预后越好。',
    tags: ['急诊', '肾衰', '家居风险'],
  },
  {
    id: 'essentialOil',
    name: '精油 / 香薰 / 茶树油',
    aliases: ['扩香', '薰衣草精油', '风油精', '樟脑丸'],
    category: '家居',
    verdicts: { ...each(ALL_SPECIES, 'toxic'), parrot: 'toxic' },
    why: '猫缺乏葡萄糖醛酸转移酶，无法代谢多种酚类精油，皮肤接触或吸入都可造成肝损伤。鸟类呼吸系统极敏感，扩香与不粘锅高温烟雾可在数分钟内致死。',
    tags: ['急诊', '呼吸道', '肝损伤'],
  },
  {
    id: 'pyrethroid',
    name: '狗用体外驱虫剂（含拟除虫菊酯）',
    aliases: ['除虫菊酯', '狗滴剂给猫用'],
    category: '药物',
    verdicts: { cat: 'toxic', dog: 'safe' },
    why: '高浓度拟除虫菊酯是犬用配方，用在猫身上会造成剧烈震颤与抽搐。多宠家庭给狗上药后 24-48 小时内要隔离，猫舔到同样中毒。',
    firstAid: '猫出现震颤属急诊，需洗去药物并抗癫痫处理。',
    tags: ['急诊', '多宠家庭注意'],
  },
  {
    id: 'wildMushroom',
    name: '野生蘑菇',
    aliases: ['野菇'],
    category: '蔬菜',
    verdicts: each(ALL_SPECIES, 'toxic'),
    why: '部分野生菌含鹅膏毒素，造成不可逆肝衰竭，且早期症状会"假性好转"。遛狗时留意草地菌菇。',
    tags: ['急诊', '肝衰'],
  },
  {
    id: 'stoneFruitPit',
    name: '樱桃核 / 桃核 / 杏核 / 苹果籽',
    aliases: ['果核'],
    category: '水果',
    verdicts: each(ALL_SPECIES, 'toxic'),
    why: '核仁含氰苷，咬碎后释放氰化物；整颗吞下还有肠道阻塞与穿孔风险。果肉本身多数无毒，去核即可。',
    tags: ['氰苷', '梗塞'],
  },
  {
    id: 'rawPotato',
    name: '生土豆 / 发芽土豆 / 番茄茎叶',
    aliases: ['土豆芽', '青番茄'],
    category: '蔬菜',
    verdicts: each(ALL_SPECIES, 'toxic'),
    why: '茄科植物的茄碱集中在生的、发芽的、青绿部位，造成消化道与神经症状。彻底煮熟去皮的土豆本身风险低。',
    tags: ['茄碱'],
  },
  {
    id: 'avocado',
    name: '牛油果',
    aliases: ['鳄梨'],
    category: '水果',
    verdicts: { ...each(ALL_SPECIES, 'avoid'), parrot: 'toxic' },
    why: '含 persin，对鸟类可造成心肌损伤与猝死，绝对禁止。犬猫对果肉相对耐受，但高脂易致胰腺炎、果核会梗塞，没有必要冒险。',
    tags: ['鸟类致死', '高脂'],
  },
  {
    id: 'salt',
    name: '高盐食物（火腿 / 培根 / 腌制品 / 薯片）',
    aliases: ['香肠', '咸鱼', '卤味', '肉干'],
    category: '人类食物',
    verdicts: each(ALL_SPECIES, 'avoid'),
    why: '宠物钠耐受远低于人；长期高盐加重心肾负担，加工肉还有亚硝酸盐与大量脂肪。所谓"就吃一点"的火腿，往往是猫狗慢性泌尿与心脏问题的背景音。',
    tags: ['钠', '加工肉'],
  },

  // ── 需要限量 / 有条件 ────────────────────────────────────────
  {
    id: 'milk',
    name: '牛奶',
    aliases: ['纯牛奶', '奶'],
    category: '乳制品',
    verdicts: { ...each(ALL_SPECIES, 'avoid'), cat: 'avoid', dog: 'limit' },
    why: '断奶后乳糖酶活性大幅下降，乳糖不耐造成腹泻。想给的话用宠物专用无乳糖奶或羊奶粉；草食动物与鸟类的肠道完全不该接触乳制品。',
    tags: ['乳糖不耐'],
  },
  {
    id: 'cheeseYogurt',
    name: '奶酪 / 无糖酸奶',
    category: '乳制品',
    verdicts: { cat: 'limit', dog: 'limit', ...each(HERBIVORES, 'avoid'), hamster: 'limit', parrot: 'limit' },
    why: '发酵后乳糖较低，少量多数能耐受，可作为藏药载体。但高脂高钠，切片奶酪与再制奶酪尤其不适合，仅当"极少量零食"。',
    limitNote: '不超过每日热量的 5%',
    tags: ['零食'],
  },
  {
    id: 'liver',
    name: '肝脏（鸡肝 / 猪肝）',
    category: '肉类',
    verdicts: { cat: 'limit', dog: 'limit', ...each(HERBIVORES, 'avoid'), hamster: 'limit', lizard: 'limit', turtle: 'limit' },
    why: '营养密度极高，但维生素 A 长期过量会造成骨骼病变与关节僵硬。"猫只吃鸡肝"是典型的自制饮食翻车路径。',
    limitNote: '不超过日粮的 5%，每周 1-2 次即可',
    tags: ['维A过量'],
  },
  {
    id: 'tuna',
    name: '人类金枪鱼罐头 / 生鱼',
    aliases: ['吞拿鱼', '刺身'],
    category: '肉类',
    verdicts: { cat: 'limit', dog: 'limit', snake: 'avoid' },
    why: '人类罐头含盐与油，长期单一喂食造成营养失衡与挑食；某些生鱼含硫胺素酶，破坏维生素 B1 引起神经症状。熟的、无调味的鱼肉少量给才合理。',
    limitNote: '每周不超过 1-2 次，不作主食',
    tags: ['挑食风险', '硫胺素'],
  },
  {
    id: 'rawEggWhite',
    name: '生鸡蛋白',
    category: '蛋类',
    verdicts: { cat: 'limit', dog: 'limit', parrot: 'avoid' },
    why: '生蛋白中的抗生物素蛋白会结合生物素，长期造成皮肤与毛发问题，还有沙门氏菌风险。水煮全蛋是更好的选择。',
    limitNote: '建议煮熟后给，每周 1-2 个蛋黄或少量蛋白',
    tags: ['生物素'],
  },
  {
    id: 'carrot',
    name: '胡萝卜',
    category: '蔬菜',
    verdicts: { dog: 'safe', cat: 'limit', rabbit: 'limit', guineaPig: 'limit', chinchilla: 'avoid', hamster: 'limit', parrot: 'safe', lizard: 'limit', turtle: 'limit' },
    why: '"兔子爱吃胡萝卜"是动画片留下的最大误解——胡萝卜是根茎类高糖食物，把它当兔子主食会造成肥胖、盲肠菌群失衡与牙齿磨损不足。兔子的主食永远是干草。狗吃生胡萝卜条则是不错的低热量磨牙零食。',
    limitNote: '兔/豚鼠：每 1kg 体重每日不超过一小片，作为零食',
    tags: ['经典误区', '高糖根茎'],
  },
  {
    id: 'icebergLettuce',
    name: '西生菜（球生菜）',
    aliases: ['冰山生菜'],
    category: '蔬菜',
    verdicts: { ...each(HERBIVORES, 'avoid'), dog: 'safe', cat: 'safe', hamster: 'limit' },
    why: '含水量极高、纤维与营养极低，草食小宠吃了容易软便腹泻。要喂叶菜请选罗马生菜、苦菊、青江菜、羽衣甘蓝等深色品种。',
    tags: ['低营养'],
  },
  {
    id: 'brassica',
    name: '西兰花 / 卷心菜 / 花菜',
    category: '蔬菜',
    verdicts: { dog: 'limit', cat: 'limit', rabbit: 'limit', guineaPig: 'limit', chinchilla: 'avoid', hamster: 'limit', parrot: 'safe' },
    why: '十字花科产气，草食小宠一次吃多会腹胀（兔子无法打嗝或呕吐，胀气非常痛苦）。少量、逐步引入、观察便便即可。',
    limitNote: '作为多种叶菜轮换中的一种，不单独大量给',
    tags: ['产气'],
  },
  {
    id: 'spinach',
    name: '菠菜 / 甜菜叶 / 欧芹',
    category: '蔬菜',
    verdicts: { ...each(HERBIVORES, 'limit'), dog: 'limit', cat: 'limit', parrot: 'limit', lizard: 'limit', turtle: 'limit' },
    why: '草酸与钙含量高，长期大量会影响钙吸收并增加尿路结石风险，对易发结石的兔子、豚鼠与陆龟尤其要控制。轮换而非固定投喂即可。',
    limitNote: '每周 1-2 次，混在多种叶菜中',
    tags: ['草酸', '结石'],
  },
  {
    id: 'alfalfa',
    name: '苜蓿草',
    aliases: ['紫花苜蓿'],
    category: '草料',
    verdicts: { rabbit: 'limit', guineaPig: 'limit', chinchilla: 'limit', turtle: 'limit' },
    why: '蛋白与钙都高，适合 6 月龄以下幼体、孕期或消瘦个体。成年后长期吃会导致钙过量、尿钙沉积与肥胖，应换成提摩西等禾本科干草。',
    limitNote: '成体只作少量点心；6 月龄前可作主草',
    tags: ['高钙', '按年龄切换'],
  },
  {
    id: 'sunflowerSeed',
    name: '葵花籽 / 花生 / 混合种子',
    aliases: ['瓜子'],
    category: '种子',
    verdicts: { parrot: 'limit', hamster: 'limit', ...each(HERBIVORES, 'avoid'), dog: 'limit', cat: 'avoid' },
    why: '鹦鹉会挑着高脂种子吃、拒绝均衡食物，长期造成脂肪肝、维生素 A 缺乏与羽毛质量下降。"喂瓜子养鸟"是鸟类营养第一大坑；种子只该作为训练奖励。花生还有黄曲霉毒素风险。',
    limitNote: '不超过鹦鹉日粮的 10%，作为奖励',
    tags: ['经典误区', '高脂', '选择性进食'],
  },
  {
    id: 'fruitSugar',
    name: '香蕉 / 苹果 / 葡萄糖类水果',
    aliases: ['香蕉', '苹果', '梨', '西瓜'],
    category: '水果',
    verdicts: { dog: 'limit', cat: 'limit', rabbit: 'limit', guineaPig: 'limit', chinchilla: 'avoid', hamster: 'limit', parrot: 'limit', lizard: 'limit', turtle: 'limit' },
    why: '去核去籽的果肉本身无毒，但糖分高。猫是严格肉食动物，尝不到甜味也不需要水果；三线仓鼠与龙猫因糖代谢问题应避免；兔子每日水果上限约每 1kg 体重 5g。',
    limitNote: '按物种上限，通常 ≤ 每日热量 5%',
    tags: ['高糖'],
  },
  {
    id: 'citrus',
    name: '柑橘类（橙 / 柠檬 / 柚）',
    category: '水果',
    verdicts: { dog: 'avoid', cat: 'avoid', parrot: 'limit', ...each(HERBIVORES, 'limit'), lizard: 'avoid', turtle: 'limit' },
    why: '果皮与精油成分刺激消化道，多数猫狗本能厌恶。鬃狮蜥等爬宠应避免柑橘（干扰钙吸收、刺激肠道）。鹦鹉可少量吃果肉。',
    tags: ['刺激性'],
  },
  {
    id: 'cornCob',
    name: '玉米（粒 / 芯）',
    category: '谷物',
    verdicts: { dog: 'limit', cat: 'limit', ...each(HERBIVORES, 'avoid'), hamster: 'limit', parrot: 'limit' },
    why: '煮熟玉米粒无毒但营养价值有限，在粮里常被用作廉价填充；玉米芯是犬类肠梗阻的常见异物，必须收好。草食小宠不该吃淀粉类谷物。',
    tags: ['填充原料', '梗塞风险'],
  },
  {
    id: 'bread',
    name: '面包 / 馒头 / 饼干',
    category: '谷物',
    verdicts: { dog: 'limit', cat: 'limit', ...each(HERBIVORES, 'avoid'), hamster: 'limit', parrot: 'limit' },
    why: '纯热量、无营养，还常含盐、糖、黄油甚至葡萄干与木糖醇。给鸟喂面包更是老年营养不良的常见原因。',
    tags: ['空热量'],
  },
  {
    id: 'cookedBone',
    name: '熟骨头（鸡骨 / 排骨）',
    category: '肉类',
    verdicts: { dog: 'avoid', cat: 'avoid' },
    why: '加热后骨骼变脆，咀嚼时纵向劈裂成尖片，可造成口腔割伤、食道与肠道穿刺。想满足啃咬需求应选专用咬胶或兽医指导下的生骨肉。',
    tags: ['穿刺风险'],
  },
  {
    id: 'rawMeatDiet',
    name: '生骨肉 / 自制生食',
    aliases: ['BARF', '生食'],
    category: '喂养方式',
    verdicts: { cat: 'limit', dog: 'limit', snake: 'staple' },
    why: '不是"天然就更好"：家庭自制生食的两大问题是病原（沙门氏菌、弓形虫、寄生虫）与营养失衡（钙磷比、牛磺酸、微量元素）。若坚持，需要经兽医营养师核算的配方 + 严格冷链与卫生，且免疫低下人群家庭慎选。蛇则本就以整只冷冻猎物为主食。',
    limitNote: '需专业配方核算 + 卫生管理，不建议凭经验自配',
    tags: ['需专业指导'],
  },
  {
    id: 'crossSpeciesFood',
    name: '猫吃狗粮 / 狗吃猫粮',
    category: '喂养方式',
    verdicts: { cat: 'avoid', dog: 'limit' },
    why: '猫需要食物中直接提供牛磺酸、维生素 A 与花生四烯酸，狗粮不按此配方设计——长期让猫吃狗粮会造成扩张型心肌病与视网膜萎缩。反过来狗吃猫粮不缺营养，但蛋白脂肪过高易胖、易诱发胰腺炎。',
    tags: ['牛磺酸', '多宠家庭注意'],
  },
  {
    id: 'mealworm',
    name: '面包虫 / 大麦虫',
    category: '昆虫',
    verdicts: { lizard: 'limit', turtle: 'limit', hamster: 'limit', parrot: 'limit' },
    why: '脂肪高、外壳几丁质多、钙磷比差，只能作为零食。爬宠主食虫应以杜比亚蟑螂、蟋蟀、黑水虻幼虫为主，并在喂前"填充营养"（gut-loading）与蘸钙粉。',
    limitNote: '每周 1-2 次，作为奖励',
    tags: ['高脂', '钙磷比差'],
  },

  // ── 安全 / 主食级 ───────────────────────────────────────────
  {
    id: 'timothyHay',
    name: '提摩西草（禾本科干草）',
    aliases: ['牧草', '提摩西'],
    category: '草料',
    verdicts: { rabbit: 'staple', guineaPig: 'staple', chinchilla: 'staple', turtle: 'safe' },
    why: '草食小宠的绝对主食，应占日粮 80% 并全天不断供。它同时解决三件事：磨掉终生生长的牙齿、维持盲肠发酵菌群、提供饱腹感控制体重。没有任何颗粒粮能替代它。',
    tags: ['主食', '纤维'],
  },
  {
    id: 'completeFood',
    name: '正规全价粮（猫粮 / 狗粮 / 专用粮）',
    category: '主食',
    verdicts: { cat: 'staple', dog: 'staple', rabbit: 'limit', guineaPig: 'limit', chinchilla: 'limit', hamster: 'staple', parrot: 'staple' },
    why: '符合 AAFCO/FEDIAF 等全价标准的粮，能一次解决所有必需营养素与配比问题，是最省心也最不容易出错的基础。挑粮看配料表前几位是否为明确的肉源、干物质蛋白是否达标、是否标注全生命阶段或对应阶段。草食小宠的颗粒粮则相反：只是补充，必须限量。',
    tags: ['主食', '全价标准'],
  },
  {
    id: 'wetFood',
    name: '主食罐 / 湿粮',
    category: '主食',
    verdicts: { cat: 'staple', dog: 'staple' },
    why: '含水量约 75%，是提高猫每日总摄水量最有效的方式，对预防泌尿道疾病与慢性肾病特别有价值。注意区分"主食罐"（营养全面）与"零食罐"（只作添头）。',
    tags: ['补水', '主食'],
  },
  {
    id: 'plainMeat',
    name: '水煮白肉（鸡胸 / 鱼肉 / 牛肉，无调味）',
    category: '肉类',
    verdicts: { cat: 'safe', dog: 'safe', hamster: 'limit', parrot: 'limit', lizard: 'limit', turtle: 'limit' },
    why: '无盐无油、彻底煮熟的瘦肉是很好的零食与拌食，也适合食欲不佳时诱食。但单纯的肉不是全价饮食（缺钙与多种微量元素），不能长期当主食。',
    limitNote: '不超过每日热量 10%（作为零食）',
    tags: ['零食', '诱食'],
  },
  {
    id: 'pumpkin',
    name: '熟南瓜 / 无糖南瓜泥',
    category: '蔬菜',
    verdicts: { cat: 'safe', dog: 'safe', rabbit: 'limit', guineaPig: 'limit', chinchilla: 'avoid', hamster: 'limit', parrot: 'safe', turtle: 'safe' },
    why: '可溶性纤维有助于调节轻度软便与便秘，热量低，适口性好。注意是无糖纯南瓜，不是南瓜派馅料。',
    tags: ['纤维', '肠道'],
  },
  {
    id: 'fishOil',
    name: '鱼油（EPA / DHA）',
    category: '补充剂',
    verdicts: { cat: 'safe', dog: 'safe', parrot: 'limit' },
    why: 'Omega-3 对皮肤毛发、关节炎症与老年认知有支持作用，是少数证据较好的补充剂。但过量会造成软便与凝血时间延长，按体重与产品说明给。',
    limitNote: '每周 2-3 次，按产品剂量',
    tags: ['补充剂', 'Omega-3'],
  },
  {
    id: 'calciumPowder',
    name: '钙粉 / 墨鱼骨 / 钙 + D3',
    category: '补充剂',
    verdicts: { lizard: 'staple', turtle: 'staple', parrot: 'safe', cat: 'avoid', dog: 'avoid' },
    why: '对爬宠与鸟类是硬需求：钙 + D3 + UVB 三者缺一就会走向代谢性骨病。但对吃全价粮的猫狗则相反——额外补钙会打乱钙磷比，大型犬幼犬期补钙尤其有害。',
    tags: ['爬宠必需', '猫狗勿乱补'],
  },
  {
    id: 'catGrass',
    name: '猫草 / 化毛膏',
    category: '补充剂',
    verdicts: { cat: 'safe', dog: 'safe' },
    why: '帮助排出舔入的毛发，换毛季可配合每日梳毛使用。若猫频繁干呕却吐不出东西、或食欲同时下降，那不是"毛球"，需要就医排查。',
    limitNote: '化毛膏按说明，不可长期每日大量（影响脂溶性维生素吸收）',
    tags: ['换毛季'],
  },
  {
    id: 'frozenPrey',
    name: '冷冻鼠 / 冷冻鹌鹑（解冻后）',
    category: '猎物',
    verdicts: { snake: 'staple', lizard: 'limit', turtle: 'limit' },
    why: '整只猎物提供骨骼、内脏与肌肉的完整营养，是蛇类最合理的食物。务必彻底解冻至体温附近，且绝不使用活体喂食——活鼠反咬会造成蛇的严重感染伤口。',
    tags: ['主食', '禁止活食'],
  },
  {
    id: 'darkLeafyGreens',
    name: '深色叶菜（羽衣甘蓝 / 青江菜 / 苦菊 / 蒲公英叶）',
    category: '蔬菜',
    verdicts: { rabbit: 'safe', guineaPig: 'safe', chinchilla: 'avoid', parrot: 'safe', lizard: 'safe', turtle: 'safe', dog: 'safe', cat: 'safe', hamster: 'limit' },
    why: '草食与杂食物种每日蔬菜的正确选择：至少 3 种轮换，避免长期单一造成某种矿物质偏高。彻底洗净、去除农残，不要给冰的或蔫掉的。龙猫例外——它的肠道不适合新鲜蔬菜。',
    tags: ['每日蔬菜', '轮换'],
  },
  {
    id: 'bellPepper',
    name: '彩椒（甜椒）',
    category: '蔬菜',
    verdicts: { guineaPig: 'staple', rabbit: 'safe', parrot: 'safe', dog: 'safe', cat: 'safe', chinchilla: 'avoid', turtle: 'safe' },
    why: '维生素 C 含量很高，是豚鼠每日补 C 的首选食材（豚鼠无法自行合成维 C，缺乏会得坏血病）。去籽切条即可，红黄椒糖分略高于青椒。',
    tags: ['维生素C', '豚鼠必需'],
  },
];

/** 归一化搜索词：去空格、转小写。 */
function norm(s) {
  return String(s ?? '').trim().toLowerCase().replace(/\s+/g, '');
}

/**
 * 按关键词搜索食物；可选按物种过滤结论。
 * 返回结果按"该物种的风险等级"降序，让危险的先出现。
 */
export function searchFoods(query, speciesId) {
  const q = norm(query);
  const hits = q
    ? FOODS.filter((f) => {
        const haystack = [f.name, f.category, ...(f.aliases ?? []), ...(f.tags ?? [])].map(norm);
        return haystack.some((h) => h.includes(q) || q.includes(h));
      })
    : FOODS.slice();

  return hits
    .map((f) => ({ food: f, verdict: verdictFor(f, speciesId) }))
    .sort((a, b) => VERDICT_META[b.verdict].rank - VERDICT_META[a.verdict].rank);
}

/** 取某食物对某物种的结论；无记录时按"资料不足"处理。 */
export function verdictFor(food, speciesId) {
  if (!speciesId) {
    // 未指定物种时，取所有物种中最严重的结论，避免给出偏松的答案
    const all = Object.values(food.verdicts ?? {});
    return all.sort((a, b) => VERDICT_META[b].rank - VERDICT_META[a].rank)[0] ?? 'unknown';
  }
  return food.verdicts?.[speciesId] ?? 'unknown';
}

/** 该物种的"绝对禁区"清单，用于首页与档案里的常驻提醒。 */
export function toxicListFor(speciesId) {
  return FOODS.filter((f) => verdictFor(f, speciesId) === 'toxic');
}

/** 该物种可以放心作为主食/日常的清单。 */
export function stapleListFor(speciesId) {
  return FOODS.filter((f) => ['staple', 'safe'].includes(verdictFor(f, speciesId)));
}
