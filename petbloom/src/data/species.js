/**
 * 物种档案库 —— PetBloom 全物种养护的数据底座。
 *
 * 每个物种定义三件事：
 *   1. energyModel  用什么方式算"该吃多少"（热量制 / 配比制 / 猎物制）
 *   2. care         日常护理频率、环境要求
 *   3. redFlags     该物种"必须立刻就医"的特有信号（见 triage.js 使用）
 *
 * 所有数值取自常见兽医营养学共识区间（RER/MER 公式、草食动物干草为主原则、
 * 爬宠体重比例投喂），仅作科学养护参考，不替代执业兽医的个体化处方。
 */

/** 生命阶段划分（月龄）。上界为开区间。 */
const STAGES = {
  catdog: [
    { id: 'baby', name: '幼年', maxMonths: 4 },
    { id: 'junior', name: '亚成年', maxMonths: 12 },
    { id: 'adult', name: '成年', maxMonths: 84 },
    { id: 'senior', name: '老年', maxMonths: Infinity },
  ],
  smallPet: [
    { id: 'baby', name: '幼年', maxMonths: 6 },
    { id: 'adult', name: '成年', maxMonths: 36 },
    { id: 'senior', name: '老年', maxMonths: Infinity },
  ],
  bird: [
    { id: 'baby', name: '幼鸟', maxMonths: 12 },
    { id: 'adult', name: '成鸟', maxMonths: 120 },
    { id: 'senior', name: '老鸟', maxMonths: Infinity },
  ],
  reptile: [
    { id: 'baby', name: '幼体', maxMonths: 6 },
    { id: 'junior', name: '亚成体', maxMonths: 18 },
    { id: 'adult', name: '成体', maxMonths: Infinity },
  ],
};

export const SPECIES = {
  cat: {
    id: 'cat',
    name: '猫',
    emoji: '🐱',
    theme: 'meow',
    themeName: '喵星球',
    stages: STAGES.catdog,
    diet: '严格肉食动物',
    // 热量制：RER = 70 × 体重^0.75，再乘生理系数
    energyModel: {
      type: 'kcal',
      factors: {
        baby: { factor: 2.5, label: '幼猫（<4月）快速生长期' },
        junior: { factor: 2.0, label: '亚成猫（4-12月）生长期' },
        adultNeutered: { factor: 1.2, label: '已绝育成猫' },
        adultIntact: { factor: 1.4, label: '未绝育成猫' },
        senior: { factor: 1.1, label: '老年猫（代谢下降）' },
        weightLoss: { factor: 0.8, label: '减重方案（需兽医监督）' },
        weightGain: { factor: 1.6, label: '增重方案' },
      },
      // 猫从食物获取水分的能力弱，泌尿系统病高发，饮水量是核心指标
      waterMlPerKg: [45, 60],
      treatCapRatio: 0.1,
      keyNutrients: [
        { name: '牛磺酸', why: '猫无法自行合成，缺乏导致扩张型心肌病与视网膜萎缩', source: '正规全价猫粮已足量，无需额外补' },
        { name: '动物蛋白', why: '猫无法高效利用植物蛋白', source: '干物质蛋白 >40% 为佳' },
        { name: '花生四烯酸 / 维生素A', why: '猫不能由植物前体转化', source: '动物性原料' },
      ],
    },
    care: [
      { id: 'litter', name: '铲屎 + 换水', freq: 'daily', why: '猫砂盆脏是乱尿第一诱因；同时观察尿团大小与便便形态' },
      { id: 'brush', name: '梳毛', freq: 'daily', season: '换毛季', why: '减少舔入毛量、预防毛球与肠梗阻' },
      { id: 'play', name: '陪玩 15 分钟', freq: 'daily', why: '室内猫肥胖与行为问题的第一处方是运动' },
      { id: 'eyes', name: '检查眼/耳/鼻', freq: 'weekly', why: '早期发现耳螨、泪痕、上呼吸道感染' },
      { id: 'nail', name: '剪指甲', freq: '14d', why: '过长会劈裂、嵌入肉垫' },
      { id: 'teeth', name: '刷牙', freq: 'daily', min: '每周 2-3 次', why: '3 岁以上猫牙周病发生率超 70%' },
      { id: 'bath', name: '洗澡', freq: '90-180d', why: '猫自洁能力强，过度洗澡破坏皮肤油脂屏障' },
    ],
    env: [
      '垂直空间优先：猫爬架/高处落脚点比平面面积更重要',
      '猫砂盆数量 = 猫数 + 1，放在安静、通风、非死角处',
      '流动水源或多点放置水碗，提高饮水量',
    ],
    breeds: {
      英国短毛猫: [3.5, 5.5], 中华田园猫: [3.5, 5.5], 美国短毛猫: [3.5, 6.0],
      布偶猫: [4.5, 9.0], 缅因猫: [4.5, 8.0], 暹罗猫: [3.0, 5.0],
      波斯猫: [3.5, 5.5], 苏格兰折耳猫: [3.0, 6.0], 孟加拉豹猫: [4.0, 7.0],
      橘猫: [4.0, 6.5], 无毛猫: [3.5, 5.0], 银渐层: [3.5, 5.5],
    },
    breedRisks: {
      英国短毛猫: ['肥厚型心肌病（HCM）', '多囊肾（PKD）'],
      布偶猫: ['肥厚型心肌病（HCM）', '多囊肾（PKD）'],
      缅因猫: ['肥厚型心肌病（HCM）', '髋关节发育不良', '脊髓性肌萎缩'],
      波斯猫: ['多囊肾（PKD）', '短鼻导致的呼吸道问题', '泪管狭窄'],
      苏格兰折耳猫: ['骨软骨发育异常（终生关节疼痛，不建议繁育）'],
      暹罗猫: ['哮喘', '斜视', '淀粉样变'],
      银渐层: ['多囊肾（PKD）', '肥厚型心肌病'],
    },
  },

  dog: {
    id: 'dog',
    name: '狗',
    emoji: '🐶',
    theme: 'woof',
    themeName: '汪星球',
    stages: STAGES.catdog,
    diet: '偏肉食的杂食动物',
    energyModel: {
      type: 'kcal',
      factors: {
        baby: { factor: 3.0, label: '幼犬（<4月）快速生长期' },
        junior: { factor: 2.0, label: '幼犬（4-12月）生长期' },
        adultNeutered: { factor: 1.6, label: '已绝育成犬' },
        adultIntact: { factor: 1.8, label: '未绝育成犬' },
        senior: { factor: 1.4, label: '老年犬' },
        weightLoss: { factor: 1.0, label: '减重方案（需兽医监督）' },
        weightGain: { factor: 2.0, label: '增重 / 高运动量' },
      },
      waterMlPerKg: [50, 70],
      treatCapRatio: 0.1,
      keyNutrients: [
        { name: '钙磷比', why: '大型犬幼犬期钙过量会造成骨骼发育异常', source: '选择大型犬专用幼犬粮，勿乱补钙' },
        { name: 'Omega-3（EPA/DHA）', why: '支持关节、皮肤与认知', source: '鱼油，每周 2-3 次' },
      ],
    },
    care: [
      { id: 'walk', name: '遛狗 / 户外活动', freq: 'daily', min: '每日 2 次，合计 30-60 分钟', why: '运动不足是破坏行为与肥胖的根源' },
      { id: 'water', name: '换水 + 清洗食盆', freq: 'daily', why: '食盆生物膜是隐性健康风险' },
      { id: 'brush', name: '梳毛', freq: 'daily', season: '换毛季', why: '双层毛犬种换毛季必须每日梳，否则底毛打结' },
      { id: 'teeth', name: '刷牙', freq: 'daily', min: '每周 2-3 次', why: '牙周病会引发心脏与肾脏继发问题' },
      { id: 'ear', name: '检查耳道', freq: 'weekly', why: '垂耳犬种耳道不通风，外耳炎高发' },
      { id: 'nail', name: '剪指甲', freq: '14-21d', why: '指甲过长改变步态，长期造成关节代偿' },
      { id: 'bath', name: '洗澡', freq: '14-30d', why: '比猫需要更频繁，但过度清洗同样破坏皮脂' },
    ],
    env: [
      '有固定、可退守的休息位（犬笼/垫子），不被打扰',
      '每日嗅闻散步（sniff walk）比高强度奔跑更能满足神经需求',
      '独处训练从短时间开始，预防分离焦虑',
    ],
    breeds: {
      柯基: [10, 14], 泰迪: [2, 6], 比熊: [4.5, 8], 柴犬: [8, 11],
      金毛: [25, 34], 拉布拉多: [25, 36], 边境牧羊犬: [14, 20],
      法国斗牛犬: [9, 14], 博美: [1.8, 3.5], 迷你雪纳瑞: [5, 9],
      萨摩耶: [16, 30], 哈士奇: [16, 27], 德国牧羊犬: [22, 40],
      吉娃娃: [1.5, 3], 中华田园犬: [10, 20], 阿拉斯加: [32, 43],
      巴哥: [6, 8], 腊肠犬: [7, 15], 比格: [9, 11], 杜宾: [27, 45],
    },
    breedRisks: {
      柯基: ['椎间盘疾病（IVDD）', '退行性脊髓病', '肥胖加重脊柱负担'],
      金毛: ['髋/肘关节发育不良', '淋巴瘤等肿瘤', '甲状腺功能减退'],
      拉布拉多: ['髋关节发育不良', '肥胖倾向（基因相关）', '渐进性视网膜萎缩'],
      法国斗牛犬: ['短头颅呼吸道综合征（BOAS）', '椎体畸形', '皮肤褶皱感染'],
      巴哥: ['短头颅呼吸道综合征', '角膜溃疡', '巴哥犬脑炎'],
      泰迪: ['髌骨脱位', '气管塌陷', '泪痕与牙结石'],
      腊肠犬: ['椎间盘疾病（IVDD）—— 严禁跳沙发/上下楼梯'],
      德国牧羊犬: ['髋关节发育不良', '胃扩张扭转（GDV）', '胰腺外分泌不足'],
      哈士奇: ['锌反应性皮肤病', '青光眼', '极高运动需求未满足→拆家'],
      比熊: ['泪痕', '膀胱结石', '髌骨脱位'],
    },
  },

  rabbit: {
    id: 'rabbit',
    name: '兔子',
    emoji: '🐰',
    theme: 'bunny',
    themeName: '萌兔窝',
    stages: STAGES.smallPet,
    diet: '严格草食动物（后肠发酵）',
    // 配比制：干草无限量 + 蔬菜/颗粒按体重折算
    energyModel: {
      type: 'ration',
      hay: { unlimited: true, note: '提摩西草等禾本科干草应占日粮 80%，且全天不断供' },
      rations: [
        { id: 'hay', name: '禾本科干草', gPerKg: null, note: '无限量，每日体积约等于兔子自身大小' },
        { id: 'greens', name: '新鲜叶菜（3 种以上轮换）', gPerKg: 55, note: '约每 1kg 体重 1 满杯' },
        { id: 'pellet', name: '提摩西基础兔粮', gPerKg: 25, note: '成兔严格限量，幼兔可适度放宽' },
        { id: 'fruit', name: '水果 / 高糖零食', gPerKg: 5, note: '上限，非必需' },
      ],
      waterMlPerKg: [50, 150],
      keyNutrients: [
        { name: '粗纤维', why: '牙齿终生生长需持续磨牙；纤维不足直接导致胃肠停滞', source: '干草，不可用兔粮替代' },
        { name: '钙控制', why: '苜蓿草与高钙菜过量易致尿钙/结石', source: '成兔以提摩西为主' },
      ],
    },
    care: [
      { id: 'hay', name: '补满干草', freq: 'daily', why: '断草超过数小时就可能启动胃肠停滞' },
      { id: 'poop', name: '检查便便数量与大小', freq: 'daily', why: '兔子最可靠的健康指标；便便变小/变少是急症前兆' },
      { id: 'clean', name: '清理厕所与垫料', freq: 'daily', why: '氨气刺激呼吸道，湿垫料引起足底皮炎' },
      { id: 'brush', name: '梳毛', freq: 'daily', season: '换毛季', why: '兔子不能吐毛球，吞入过多毛发会堵塞肠道' },
      { id: 'teeth', name: '观察门齿与进食姿势', freq: 'weekly', why: '牙齿过长/错位会让它"想吃却吃不下"' },
      { id: 'nail', name: '剪指甲', freq: '21-30d', why: '过长指甲改变落地姿势，易骨折' },
      { id: 'bath', name: '洗澡', freq: 'never', why: '兔子不能水洗——应激可致死；脏污只做局部清理' },
    ],
    env: [
      '活动空间远大于笼子：每日至少数小时自由活动区',
      '必须有躲避屋（兔子是被捕食者，无处可躲会长期应激）',
      '环境温度 <28°C，兔子怕热不怕冷',
      '禁止抓提耳朵或后颈悬空；受惊挣扎可造成脊椎骨折',
    ],
    breeds: {
      侏儒兔: [0.9, 1.4], 荷兰垂耳兔: [1.3, 1.8], 狮子头兔: [1.4, 1.8],
      新西兰白兔: [4.0, 5.5], 法国垂耳兔: [4.5, 5.5], 家兔通用: [1.5, 2.5],
      道奇兔: [1.6, 2.3], 安哥拉兔: [2.0, 3.5],
    },
    breedRisks: {
      侏儒兔: ['门齿咬合不正（brachycephalic 面部结构）', '泪管阻塞'],
      安哥拉兔: ['毛球性肠梗阻（必须每日梳毛）'],
      法国垂耳兔: ['耳道炎', '牙齿疾病'],
    },
  },

  guineaPig: {
    id: 'guineaPig',
    name: '豚鼠',
    emoji: '🐹',
    theme: 'tiny',
    themeName: '小宠屋',
    stages: STAGES.smallPet,
    diet: '严格草食动物',
    energyModel: {
      type: 'ration',
      hay: { unlimited: true, note: '提摩西干草全天不断供' },
      rations: [
        { id: 'hay', name: '禾本科干草', gPerKg: null, note: '无限量' },
        { id: 'veg', name: '新鲜蔬菜（重点补维C）', gPerKg: 60, note: '甜椒、羽衣甘蓝等' },
        { id: 'pellet', name: '豚鼠专用粮', gPerKg: 30, note: '不可用兔粮替代（维C 与配方不同）' },
      ],
      waterMlPerKg: [80, 120],
      keyNutrients: [
        { name: '维生素 C', why: '豚鼠无法自行合成，缺乏导致坏血病（关节痛、出血、免疫低）', source: '每日 10-30 mg/kg，来自新鲜蔬菜或专用补充剂；水中投放会快速失效' },
      ],
    },
    care: [
      { id: 'vitc', name: '补充维 C 蔬菜', freq: 'daily', why: '豚鼠特有的硬性需求' },
      { id: 'hay', name: '补满干草', freq: 'daily', why: '磨牙与肠道动力' },
      { id: 'clean', name: '清理垫料', freq: 'daily', why: '预防足底皮炎与呼吸道刺激' },
      { id: 'brush', name: '梳毛（长毛品种）', freq: 'daily', why: '长毛豚鼠易打结' },
      { id: 'nail', name: '剪指甲', freq: '30d', why: '笼养缺少磨损' },
    ],
    env: ['群居动物，单独饲养会抑郁，建议同性 2 只以上', '笼底须实心（铁丝网易致足底损伤）', '怕热，>28°C 有中暑风险'],
    breeds: { 英国短毛豚鼠: [0.7, 1.2], 阿比西尼亚豚鼠: [0.7, 1.2], 秘鲁长毛豚鼠: [0.7, 1.2] },
    breedRisks: { 秘鲁长毛豚鼠: ['毛发打结与皮肤问题'] },
  },

  chinchilla: {
    id: 'chinchilla',
    name: '龙猫',
    emoji: '🐭',
    theme: 'tiny',
    themeName: '小宠屋',
    stages: STAGES.smallPet,
    diet: '严格草食动物（极敏感肠道）',
    energyModel: {
      type: 'ration',
      hay: { unlimited: true, note: '提摩西干草为绝对主食' },
      rations: [
        { id: 'hay', name: '禾本科干草', gPerKg: null, note: '无限量' },
        { id: 'pellet', name: '龙猫专用粮', gPerKg: 35, note: '约每日 1-2 汤匙' },
        { id: 'treat', name: '零食（干玫瑰果/苹果木）', gPerKg: 2, note: '极少量；禁新鲜蔬果与坚果' },
      ],
      waterMlPerKg: [40, 80],
      keyNutrients: [
        { name: '低糖低脂', why: '龙猫肠道菌群极脆弱，蔬果和坚果易致腹泻与肝脏问题', source: '只吃干草与专用粮' },
      ],
    },
    care: [
      { id: 'temp', name: '确认室温 <25°C', freq: 'daily', why: '龙猫毛极密，>26°C 就有中暑风险，夏季必须空调' },
      { id: 'sand', name: '浴沙 10-15 分钟', freq: '2-3d', why: '用火山灰洗沙浴清洁毛发；绝对不能水洗' },
      { id: 'hay', name: '补满干草', freq: 'daily', why: '磨牙与肠道动力' },
      { id: 'chew', name: '检查磨牙木', freq: 'weekly', why: '牙齿终生生长' },
    ],
    env: ['高笼 + 多层跳台，满足垂直跳跃需求', '室温 15-25°C，湿度 <60%', '夜行动物，白天勿频繁打扰'],
    breeds: { 标准灰龙猫: [0.4, 0.6], 银斑龙猫: [0.4, 0.6], 紫罗兰龙猫: [0.4, 0.6] },
    breedRisks: {},
  },

  hamster: {
    id: 'hamster',
    name: '仓鼠',
    emoji: '🐹',
    theme: 'tiny',
    themeName: '小宠屋',
    stages: STAGES.smallPet,
    diet: '杂食（谷物为主 + 动物蛋白）',
    energyModel: {
      type: 'ration',
      rations: [
        { id: 'mix', name: '仓鼠主粮（营养均衡型）', gPerKg: 75, note: '叙利亚约 10-15g/日，侏儒约 7-10g/日' },
        { id: 'protein', name: '动物蛋白（面包虫/水煮蛋白）', gPerKg: 5, note: '每周 2-3 次少量' },
        { id: 'veg', name: '新鲜蔬菜', gPerKg: 15, note: '少量，避免水分过多致腹泻' },
      ],
      waterMlPerKg: [80, 120],
      keyNutrients: [
        { name: '蛋白质', why: '野生仓鼠会捕食昆虫；纯谷物饲喂会营养不足', source: '主粮 +少量动物蛋白' },
      ],
    },
    care: [
      { id: 'wheel', name: '检查跑轮是否顺畅', freq: 'daily', why: '跑轮是仓鼠主要运动方式，直径需 ≥20cm 以免弯腰伤脊' },
      { id: 'food', name: '清理食物囤积角', freq: '2-3d', why: '囤积的湿食会霉变' },
      { id: 'cheek', name: '观察颊囊与体表', freq: 'weekly', why: '颊囊外翻/肿块是常见急症' },
      { id: 'bedding', name: '更换部分垫料', freq: 'weekly', why: '整体更换会破坏气味安全感，建议保留部分旧垫料' },
    ],
    env: [
      '笼底面积 ≥60×40cm，垫料厚度 ≥15cm 供挖掘',
      '独居动物（除某些侏儒品系），合笼会打斗致死',
      '禁止水洗，只用浴沙',
    ],
    breeds: { 叙利亚仓鼠: [0.12, 0.2], 三线仓鼠: [0.03, 0.05], 一线仓鼠: [0.03, 0.05], 罗伯罗夫斯基仓鼠: [0.02, 0.03] },
    breedRisks: { 叙利亚仓鼠: ['肾上腺与肿瘤（2 岁后高发）'], 三线仓鼠: ['糖尿病（避免高糖零食）'] },
  },

  parrot: {
    id: 'parrot',
    name: '鹦鹉',
    emoji: '🦜',
    theme: 'feather',
    themeName: '羽乐园',
    stages: STAGES.bird,
    diet: '杂食（以颗粒粮为基础）',
    energyModel: {
      type: 'ratio',
      composition: [
        { id: 'pellet', name: '专用颗粒粮', pct: [60, 70], note: '营养均衡的基础，取代"只喂瓜子"' },
        { id: 'veg', name: '新鲜蔬菜与深色叶菜', pct: [20, 30], note: '每日更换，避免久放变质' },
        { id: 'fruitNut', name: '水果 / 坚果 / 种子', pct: [0, 10], note: '作为训练奖励，非主食' },
      ],
      dailyGramsPerKg: 80,
      waterMlPerKg: [50, 100],
      keyNutrients: [
        { name: '维生素 A', why: '纯种子饮食最常见的缺乏，导致呼吸道与皮肤问题', source: '深色蔬菜、颗粒粮' },
        { name: '钙 / D3', why: '产蛋期母鸟极易低血钙抽搐', source: '墨鱼骨、日照或全光谱灯' },
      ],
    },
    care: [
      { id: 'social', name: '互动陪伴 ≥1 小时', freq: 'daily', why: '鹦鹉高度社会化，孤独会导致啄羽、尖叫、刻板行为' },
      { id: 'freshFood', name: '更换蔬果并清走剩食', freq: 'daily', why: '鸟类对霉菌毒素极敏感' },
      { id: 'cage', name: '清理笼底与站杆', freq: 'daily', why: '粪便形态是重要健康指标，干净底盘才看得清' },
      { id: 'forage', name: '更换觅食玩具', freq: 'weekly', why: '觅食行为是心理健康核心需求' },
      { id: 'nail', name: '检查喙与趾甲', freq: 'monthly', why: '过长提示肝病或磨损不足' },
    ],
    env: [
      '笼宽 ≥ 展翅 2 倍，站杆粗细不一以锻炼足部',
      '严禁不粘锅高温烟雾（PTFE 中毒可在数分钟内致死）、香薰、蚊香、二手烟',
      '每日 10-12 小时安静黑暗睡眠',
    ],
    breeds: { 虎皮鹦鹉: [0.03, 0.04], 玄凤鹦鹉: [0.08, 0.1], 牡丹鹦鹉: [0.045, 0.06], 金太阳鹦鹉: [0.1, 0.13], 非洲灰鹦鹉: [0.4, 0.6], 和尚鹦鹉: [0.12, 0.15] },
    breedRisks: {
      非洲灰鹦鹉: ['低血钙症', '啄羽（心理需求未满足）'],
      玄凤鹦鹉: ['夜惊', '母鸟慢性产蛋'],
      虎皮鹦鹉: ['脂肪瘤（高脂种子饮食）', '甲状腺肿'],
    },
  },

  lizard: {
    id: 'lizard',
    name: '蜥蜴',
    emoji: '🦎',
    theme: 'scale',
    themeName: '爬宠堡',
    stages: STAGES.reptile,
    diet: '按物种而异（虫食 / 草食 / 杂食）',
    energyModel: {
      type: 'schedule',
      schedules: [
        { stage: 'baby', text: '每日 2-3 次昆虫（15 分钟内吃完的量）+ 每日新鲜叶菜（杂食种）' },
        { stage: 'junior', text: '每日 1 次昆虫 + 每日叶菜' },
        { stage: 'adult', text: '每日叶菜为主，昆虫每周 2-3 次（鬃狮蜥）；纯虫食种如豹纹守宫每 2-4 天一次' },
      ],
      supplements: [
        { name: '钙粉（含 D3）', freq: '每周 2-3 次蘸粉', why: '缺钙 + 缺 UVB = 代谢性骨病（MBD），是人工饲养爬宠第一大死因' },
        { name: '复合维生素', freq: '每周 1 次', why: '补充人工虫源营养缺口' },
      ],
      waterNote: '每日喷水或提供浅水盘，部分种类只饮流动/滴落水珠',
      keyNutrients: [
        { name: 'UVB + 温度梯度', why: '爬宠是冷血动物，没有正确温区就无法消化食物；没有 UVB 就无法合成 D3 利用钙', source: '专用 UVB 灯管每 6-12 个月更换（可见光还亮≠UVB 还有效）' },
      ],
    },
    care: [
      { id: 'temp', name: '记录冷热端温度与湿度', freq: 'daily', why: '温度是爬宠的"开关"，错误温区等于慢性饥饿' },
      { id: 'uvb', name: '确认 UVB 灯工作', freq: 'daily', why: '预防代谢性骨病' },
      { id: 'water', name: '换水 / 喷雾', freq: 'daily', why: '脱水会导致蜕皮不全与肾损伤' },
      { id: 'spot', name: '清理粪便与残虫', freq: 'daily', why: '残留昆虫会啃咬宿主' },
      { id: 'uvbChange', name: '更换 UVB 灯管', freq: '180-365d', why: 'UVB 输出会衰减到无效' },
    ],
    env: [
      '必须建立温度梯度：热点晒台 + 冷端，让它自主调温',
      '夜间温度按物种回落，但不可过低',
      '禁用加热石（易造成腹部烫伤）',
    ],
    breeds: { 鬃狮蜥: [0.35, 0.6], 豹纹守宫: [0.045, 0.09], 蓝舌石龙子: [0.3, 0.7], 王者蜥: [0.3, 0.9], 绿鬣蜥: [4, 8] },
    breedRisks: {
      鬃狮蜥: ['代谢性骨病（UVB/钙不足）', '球虫感染', '成体过量喂虫导致脂肪肝'],
      豹纹守宫: ['蜕皮不全导致趾端坏死（湿度不足）', '沙砾垫材造成肠道阻塞'],
      绿鬣蜥: ['误喂动物蛋白导致肾衰（成体应为纯草食）'],
    },
  },

  turtle: {
    id: 'turtle',
    name: '龟',
    emoji: '🐢',
    theme: 'scale',
    themeName: '爬宠堡',
    stages: STAGES.reptile,
    diet: '按物种而异（水龟多杂食，陆龟多草食）',
    energyModel: {
      type: 'schedule',
      schedules: [
        { stage: 'baby', text: '幼龟每日投喂，量约头部大小' },
        { stage: 'junior', text: '每 1-2 日一次' },
        { stage: 'adult', text: '水龟每 2-3 日一次；陆龟每日供应草料与叶菜（草食种以牧草为主）' },
      ],
      supplements: [
        { name: '钙（墨鱼骨/钙粉）', freq: '每周 1-2 次', why: '龟甲发育需要大量钙' },
        { name: 'UVB', freq: '每日 10-12 小时', why: '无 UVB 会造成龟甲软化与畸形' },
      ],
      waterNote: '水龟水质是核心：过滤 + 定期换水，水深至少能让它伸头呼吸并翻身',
      keyNutrients: [
        { name: '钙磷比与 UVB', why: '预防软甲与金字塔形隆背', source: '钙粉 + UVB + 低蛋白高纤维草料' },
      ],
    },
    care: [
      { id: 'water', name: '检查水质 / 温度', freq: 'daily', why: '脏水直接导致烂甲、眼病、肺炎' },
      { id: 'bask', name: '确认晒台与 UVB 可用', freq: 'daily', why: '龟必须能完全离水晒背烘干' },
      { id: 'shell', name: '检查龟甲与四肢', freq: 'weekly', why: '早期发现软甲、白点、外伤' },
      { id: 'filter', name: '清洗过滤 / 换水', freq: 'weekly', why: '控制氨氮' },
    ],
    env: ['水陆分区：完全干燥的晒台是硬需求', '陆龟需要可挖掘的垫材与湿度躲避区', '冬眠需专门评估健康与体重，勿贸然操作'],
    breeds: { 巴西龟: [0.5, 2.5], 草龟: [0.4, 2.0], 苏卡达陆龟: [10, 60], 赫曼陆龟: [1.5, 3.5], 缅甸陆龟: [5, 15] },
    breedRisks: {
      巴西龟: ['白眼病 / 烂甲（水质差）', '过度投喂龟粮导致隆背'],
      苏卡达陆龟: ['金字塔形隆背（蛋白过高、湿度过低）', '成体巨大，需评估长期空间'],
    },
  },

  snake: {
    id: 'snake',
    name: '蛇',
    emoji: '🐍',
    theme: 'scale',
    themeName: '爬宠堡',
    stages: STAGES.reptile,
    diet: '纯肉食（整只猎物）',
    energyModel: {
      type: 'prey',
      preyRatio: [0.1, 0.15], // 猎物重量占蛇体重比例
      intervals: {
        baby: '每 5-7 天一次',
        junior: '每 7-10 天一次',
        adult: '每 10-21 天一次（按品种与体况）',
      },
      waterNote: '始终提供可浸泡的水盆，蜕皮期尤为重要',
      keyNutrients: [
        { name: '整只猎物', why: '骨骼、内脏共同构成完整营养；只喂肉块会缺钙', source: '解冻的冷冻鼠/鹌鹑' },
      ],
    },
    care: [
      { id: 'temp', name: '记录冷热端温度', freq: 'daily', why: '温度不足会导致食物在胃里腐败' },
      { id: 'water', name: '换水', freq: 'daily', why: '饮水与浸泡辅助蜕皮' },
      { id: 'hide', name: '确认躲避穴完好', freq: 'weekly', why: '缺乏躲避处会长期应激拒食' },
      { id: 'shed', name: '蜕皮期提高湿度', freq: 'as-needed', why: '蜕皮不全会造成眼罩残留与尾端坏死' },
    ],
    env: [
      '禁止活体喂食：猎物反咬会造成严重伤口，也不人道',
      '进食后 48 小时内不要搬动，以免吐食',
      '躲避穴（冷端 + 热端各一个）是硬需求',
    ],
    breeds: { 玉米蛇: [0.5, 0.9], 王蛇: [0.6, 1.4], 球蟒: [1.2, 2.2], 猪鼻蛇: [0.2, 0.5] },
    breedRisks: {
      球蟒: ['应激性拒食（环境不当、躲避不足）', '呼吸道感染（湿度过高不通风）'],
      玉米蛇: ['吐食（进食后受扰动）', '蜕皮不全'],
    },
  },
};

export const SPECIES_LIST = Object.values(SPECIES);

/** 按月龄解析生命阶段。 */
export function resolveStage(speciesId, ageMonths) {
  const sp = SPECIES[speciesId];
  if (!sp) return null;
  const months = Number(ageMonths) || 0;
  return sp.stages.find((s) => months < s.maxMonths) ?? sp.stages[sp.stages.length - 1];
}

/** 品种标准体重区间（kg）；未知品种返回 null。 */
export function breedStandard(speciesId, breed) {
  const range = SPECIES[speciesId]?.breeds?.[breed];
  return range ? { min: range[0], max: range[1] } : null;
}

/** 品种高发遗传/结构性疾病。 */
export function breedRisks(speciesId, breed) {
  return SPECIES[speciesId]?.breedRisks?.[breed] ?? [];
}
