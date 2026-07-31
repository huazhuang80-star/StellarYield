/**
 * 5 分钟症状自查的题目与判级规则。
 *
 * 设计原则：
 *   1. 宁可高估紧急度 —— 规则冲突时取最严重的结论。
 *   2. 只做"紧急度分级"，不做疾病诊断。输出的是"现在该做什么"，
 *      而不是"它得了什么病"。
 *   3. 物种差异必须显式建模。兔子 12 小时不排便是急症，蛇拒食两周
 *      可能完全正常 —— 用同一套规则会害死其中一个。
 */

export const LEVELS = {
  red: {
    id: 'red',
    icon: '🔴',
    title: '立即急诊',
    desc: '这是时间敏感的情况，请现在就联系 24 小时急诊，不要等到明天。',
  },
  yellow: {
    id: 'yellow',
    icon: '🟡',
    title: '今日 / 24 小时内就医',
    desc: '不属于分秒必争，但不该拖过一天。今天联系医院预约。',
  },
  green: {
    id: 'green',
    icon: '🟢',
    title: '可在家观察',
    desc: '目前指标基本正常。按观察要点记录，出现升级信号立刻重新自查。',
  },
};

/** Step 1：观察记录题目。value 为 null 表示未作答。 */
export const QUESTIONS = [
  {
    id: 'energy',
    label: '精神状态',
    hint: '和平时最有活力的样子相比',
    options: [
      { v: 'normal', t: '和平时一样' },
      { v: 'quiet', t: '略安静，但会互动' },
      { v: 'lethargic', t: '明显萎靡、躲起来、叫不动' },
      { v: 'collapsed', t: '虚弱瘫倒 / 无法站立' },
    ],
  },
  {
    id: 'appetite',
    label: '食欲',
    hint: '以平时的进食量为基准',
    options: [
      { v: 'normal', t: '正常吃完' },
      { v: 'reduced', t: '吃得比平时少' },
      { v: 'none12', t: '约 12 小时没吃' },
      { v: 'none24', t: '超过 24 小时没吃' },
      { v: 'none48', t: '超过 48 小时没吃' },
    ],
  },
  {
    id: 'water',
    label: '饮水',
    options: [
      { v: 'normal', t: '正常' },
      { v: 'less', t: '明显变少' },
      { v: 'more', t: '明显变多（多饮多尿）' },
      { v: 'none', t: '完全不喝' },
    ],
  },
  {
    id: 'vomit',
    label: '呕吐',
    options: [
      { v: 'none', t: '没有' },
      { v: 'once', t: '1 次，之后正常' },
      { v: 'repeated', t: '12 小时内多次' },
      { v: 'unproductive', t: '反复干呕但吐不出东西' },
      { v: 'blood', t: '带血 / 咖啡色' },
    ],
  },
  {
    id: 'stool',
    label: '排便',
    options: [
      { v: 'normal', t: '正常成形' },
      { v: 'soft', t: '偏软 1 次' },
      { v: 'diarrhea', t: '持续腹泻' },
      { v: 'blood', t: '带血 / 黑色柏油状' },
      { v: 'none24', t: '超过 24 小时没排便' },
      { v: 'shrunk', t: '便便明显变小、变少（草食小宠重点）' },
    ],
  },
  {
    id: 'urine',
    label: '排尿',
    hint: '猫请留意猫砂里尿团的数量与大小',
    options: [
      { v: 'normal', t: '正常' },
      { v: 'straining', t: '反复进砂盆 / 用力却尿不出、叫痛' },
      { v: 'blood', t: '尿液带血或粉色' },
      { v: 'none12', t: '超过 12 小时没有尿' },
      { v: 'more', t: '尿量明显变多' },
    ],
  },
  {
    id: 'breathing',
    label: '呼吸',
    hint: '安静休息时数胸腹起伏，猫犬静息一般 <30 次/分',
    options: [
      { v: 'normal', t: '平稳' },
      { v: 'fast', t: '偏快但平稳' },
      { v: 'labored', t: '费力 / 腹部用力 / 有声音' },
      { v: 'openMouth', t: '张口呼吸 / 伸颈' },
    ],
  },
  {
    id: 'gums',
    label: '牙龈或黏膜颜色',
    hint: '轻轻翻开嘴唇看牙龈；异宠可看口腔或眼周皮肤',
    options: [
      { v: 'pink', t: '粉红（正常）' },
      { v: 'pale', t: '苍白 / 发白' },
      { v: 'blue', t: '发紫 / 发灰' },
      { v: 'yellow', t: '发黄' },
      { v: 'unknown', t: '看不到 / 不确定' },
    ],
  },
];

/** 一票否决的危险信号（多选）。 */
export const RED_FLAGS = [
  { id: 'seizure', t: '抽搐 / 意识丧失' },
  { id: 'trauma', t: '摔落、被撞、被咬等外伤' },
  { id: 'toxin', t: '可能吃了有毒的东西或人药' },
  { id: 'bloat', t: '腹部胀大、发硬' },
  { id: 'heat', t: '高温环境后大口喘、体温高' },
  { id: 'bleeding', t: '出血止不住' },
  { id: 'dystocia', t: '难产 / 生产超过 1 小时无进展' },
  { id: 'eye', t: '眼球突出、眼睛外伤、突然失明' },
  { id: 'object', t: '吞了线、骨头、玩具等异物' },
  { id: 'painCry', t: '触碰某处就尖叫 / 持续哀鸣' },
];

/**
 * 判级规则。每条规则拿到 (a = 答案, ctx = {species, sex, ageMonths, breed}) 。
 * level 为该条规则触发时的紧急度。
 */
export const RULES = [
  // ── 全物种红灯 ──────────────────────────────────────────────
  {
    id: 'breathing',
    level: 'red',
    when: (a) => ['labored', 'openMouth'].includes(a.breathing),
    reason: '呼吸费力或张口呼吸',
    detail: '呼吸困难在任何物种都是最高优先级。猫张口呼吸尤其危险，往往意味着胸腔积液、心衰或哮喘急性发作。',
  },
  {
    id: 'gums',
    level: 'red',
    when: (a) => ['pale', 'blue', 'yellow'].includes(a.gums),
    reason: '黏膜颜色异常',
    detail: '苍白提示失血或休克，发紫提示缺氧，发黄提示肝脏或溶血问题——三者都需要马上处理。',
  },
  {
    id: 'collapse',
    level: 'red',
    when: (a) => a.energy === 'collapsed',
    reason: '虚弱瘫倒 / 无法站立',
    detail: '突然的站立不能可能是内出血、心脏事件、严重低血糖或中毒。',
  },
  { id: 'seizure', level: 'red', flag: 'seizure', reason: '抽搐或意识丧失', detail: '抽搐超过 3 分钟或反复发作会造成体温升高与脑损伤。' },
  { id: 'trauma', level: 'red', flag: 'trauma', reason: '外伤史', detail: '外表看不出伤不代表没事：内出血、膈疝、膀胱破裂常在数小时后才显现。' },
  { id: 'toxin', level: 'red', flag: 'toxin', reason: '可能中毒', detail: '带上包装或残留物就医。多数毒物的处理窗口只有几小时，且不要自行催吐——腐蚀性物质催吐会造成二次损伤。' },
  { id: 'bloat', level: 'red', flag: 'bloat', reason: '腹部胀硬', detail: '深胸犬种的胃扩张扭转（GDV）会在数小时内致命。' },
  { id: 'heat', level: 'red', flag: 'heat', reason: '疑似中暑', detail: '中暑是急诊：立刻移到阴凉处、用常温水（不是冰水）打湿全身并送医。' },
  { id: 'bleeding', level: 'red', flag: 'bleeding', reason: '活动性出血', detail: '直接加压止血并送医。' },
  { id: 'dystocia', level: 'red', flag: 'dystocia', reason: '难产', detail: '产程停滞会同时危及母体与胎儿。' },
  { id: 'eye', level: 'red', flag: 'eye', reason: '眼部急症', detail: '眼球问题的黄金处理时间以小时计，延误常导致永久失明。' },
  { id: 'object', level: 'red', flag: 'object', reason: '疑似吞入异物', detail: '线状异物（缝线、毛线、逗猫棒线）风险最高，可能切割肠道，且不要试图往外拉。' },
  {
    id: 'vomitBlood',
    level: 'red',
    when: (a) => a.vomit === 'blood' || a.stool === 'blood',
    reason: '呕吐物或粪便带血',
    detail: '提示消化道出血、严重炎症或凝血问题。',
  },
  {
    id: 'vomitPlusLethargy',
    level: 'red',
    when: (a) => a.vomit === 'repeated' && ['lethargic', 'collapsed'].includes(a.energy),
    reason: '反复呕吐 + 精神萎靡',
    detail: '反复呕吐叠加精神变差，脱水与电解质紊乱进展很快。',
  },
  {
    id: 'anuria',
    level: 'red',
    when: (a) => a.urine === 'none12',
    reason: '超过 12 小时无尿',
    detail: '尿路完全阻塞会在 24-48 小时内引起致命的高钾与尿毒症。',
  },

  // ── 猫特有 ──────────────────────────────────────────────────
  {
    id: 'catBlocked',
    level: 'red',
    species: ['cat'],
    when: (a) => a.urine === 'straining',
    reason: '猫用力排尿却尿不出',
    detail: '公猫尿道阻塞是最典型、也最容易被当成"便秘"耽误的急症。哪怕能挤出几滴，也要按急诊处理。',
  },
  {
    id: 'catAnorexia48',
    level: 'red',
    species: ['cat'],
    when: (a) => a.appetite === 'none48',
    reason: '猫超过 48 小时不进食',
    detail: '猫长时间不吃会启动脂肪动员，引发肝脏脂肪沉积（脂肪肝），进入恶性循环。',
  },
  {
    id: 'catAnorexia24',
    level: 'yellow',
    species: ['cat'],
    when: (a) => a.appetite === 'none24',
    reason: '猫超过 24 小时不进食',
    detail: '猫的绝食耐受度远低于狗，24 小时是就医门槛而不是观察门槛。',
  },
  {
    id: 'catUnproductive',
    level: 'yellow',
    species: ['cat'],
    when: (a) => a.vomit === 'unproductive',
    reason: '反复干呕吐不出东西',
    detail: '常被归因于"毛球"，但也可能是异物、哮喘或食道问题。若同时食欲下降请按红灯处理。',
  },

  // ── 犬特有 ──────────────────────────────────────────────────
  {
    id: 'dogGDV',
    level: 'red',
    species: ['dog'],
    when: (a) => a.vomit === 'unproductive',
    reason: '犬反复干呕（警惕胃扭转）',
    detail: '干呕吐不出、流口水、腹部胀大是胃扩张扭转的经典三联症，尤其见于大型深胸犬，需立即急诊。',
  },

  // ── 草食小宠特有 ────────────────────────────────────────────
  {
    id: 'giStasis',
    level: 'red',
    species: ['rabbit', 'guineaPig', 'chinchilla'],
    when: (a) => ['none12', 'none24', 'none48'].includes(a.appetite) || ['shrunk', 'none24'].includes(a.stool),
    reason: '草食小宠停食或便便变小变少',
    detail: '这是胃肠停滞（GI stasis）的典型表现，对兔子、豚鼠、龙猫属于急症：肠道停止蠕动后菌群产气、疼痛加剧，可在 24 小时内致命。不要等到明天。',
  },
  {
    id: 'herbivoreQuiet',
    level: 'yellow',
    species: ['rabbit', 'guineaPig', 'chinchilla'],
    when: (a) => a.energy === 'quiet' || a.appetite === 'reduced',
    reason: '草食小宠食欲或活力下降',
    detail: '被捕食动物会极力隐藏不适，任何"稍微不对"都值得当天处理。同时检查牙齿与环境温度。',
  },
  {
    id: 'gpVitC',
    level: 'yellow',
    species: ['guineaPig'],
    when: (a) => a.energy === 'lethargic',
    reason: '豚鼠精神萎靡',
    detail: '除常见肠道与呼吸道问题外，需排查维生素 C 缺乏（关节疼痛、不愿走动、牙龈出血）。',
  },

  // ── 鸟类特有 ────────────────────────────────────────────────
  {
    id: 'birdSick',
    level: 'red',
    species: ['parrot'],
    when: (a) => ['lethargic', 'collapsed'].includes(a.energy) || a.appetite !== 'normal',
    reason: '鸟出现可见的不适',
    detail: '鸟类会把病症隐藏到极限，一旦出现炸毛蹲底、闭眼、食欲下降，往往已经病了一段时间。对鸟来说"看起来不太好"就等于急诊。',
  },
  {
    id: 'birdTailBob',
    level: 'red',
    species: ['parrot'],
    when: (a) => ['fast', 'labored', 'openMouth'].includes(a.breathing),
    reason: '鸟呼吸异常',
    detail: '尾羽随呼吸摆动、张嘴呼吸提示气囊或肺部受累；同时排查不粘锅烟雾、香薰、二手烟等吸入性因素。',
  },

  // ── 爬宠特有 ────────────────────────────────────────────────
  {
    id: 'reptileMouthBreath',
    level: 'red',
    species: ['lizard', 'turtle', 'snake'],
    when: (a) => ['labored', 'openMouth'].includes(a.breathing),
    reason: '爬宠张口呼吸 / 口鼻有黏液',
    detail: '提示呼吸道感染，通常与温度过低、湿度不当或通风差有关。爬宠病程进展慢但一旦显现多已较重。',
  },
  {
    id: 'reptileWeak',
    level: 'yellow',
    species: ['lizard', 'turtle'],
    when: (a) => ['lethargic', 'collapsed'].includes(a.energy),
    reason: '爬宠明显无力',
    detail: '先核对温区与 UVB（温度不足会让它无法消化与活动），同时警惕代谢性骨病：下颌变软、四肢颤抖、走路拖行。',
  },
  {
    id: 'reptileAnorexia',
    level: 'green',
    species: ['snake'],
    when: (a) => ['none12', 'none24', 'none48'].includes(a.appetite),
    reason: '蛇拒食',
    detail: '蛇的拒食常与蜕皮期、季节、环境应激有关，短期拒食不等于生病。请记录体重变化：体重稳定可继续观察，持续下降或伴其他症状则需就医。',
  },

  // ── 黄灯（通用） ────────────────────────────────────────────
  {
    id: 'diarrhea',
    level: 'yellow',
    when: (a) => a.stool === 'diarrhea',
    reason: '持续腹泻',
    detail: '超过 24-48 小时的腹泻会造成脱水，幼年个体进展更快。留一份新鲜粪便样本带去医院。',
  },
  {
    id: 'lethargy',
    level: 'yellow',
    when: (a) => a.energy === 'lethargic',
    reason: '精神明显萎靡',
    detail: '精神状态是最灵敏的整体健康指标，明显变差就值得当天就医。',
  },
  {
    id: 'hematuria',
    level: 'yellow',
    when: (a) => a.urine === 'blood',
    reason: '尿液带血',
    detail: '常见于下泌尿道疾病、结石或感染。若同时出现排尿困难，请按红灯处理。',
  },
  {
    id: 'pu',
    level: 'yellow',
    when: (a) => a.water === 'more' && a.urine === 'more',
    reason: '多饮多尿',
    detail: '这是糖尿病、慢性肾病、甲状腺功能异常的共同早期信号，需要查血与尿。它容易被误认为"最近喝水多是好事"。',
  },
  {
    id: 'noWater',
    level: 'yellow',
    when: (a) => a.water === 'none',
    reason: '完全不喝水',
    detail: '结合食欲与精神判断；持续不喝水会迅速脱水。',
  },
  { id: 'pain', level: 'yellow', flag: 'painCry', reason: '疼痛表现', detail: '定位疼痛部位并避免自行按压。绝对不要给人用止痛药。' },
  {
    id: 'appetiteReduced',
    level: 'yellow',
    // 蛇的周期性拒食属正常生理，由物种规则单独判断，不套用通用食欲规则
    exceptSpecies: ['snake'],
    when: (a) => a.appetite === 'reduced' || a.appetite === 'none12',
    reason: '食欲下降',
    detail: '记录具体减少了多少、持续几天，这是最有价值的就医信息。',
  },

  // ── 绿灯（明确的可观察情形） ────────────────────────────────
  {
    id: 'singleSoft',
    level: 'green',
    when: (a) => a.stool === 'soft' && a.energy === 'normal' && a.appetite === 'normal',
    reason: '单次软便，精神食欲正常',
    detail: '常见于换粮过快、零食过多或轻度应激。回归原饮食并观察 24-48 小时。',
  },
  {
    id: 'singleVomit',
    level: 'green',
    when: (a) => a.vomit === 'once' && a.energy === 'normal' && a.appetite === 'normal',
    reason: '单次呕吐后恢复正常',
    detail: '可禁食 2-4 小时（幼年动物不禁食）后少量给水，逐步恢复进食。',
  },
];

/** 家庭护理与就医准备内容。 */
export const CARE_ACTIONS = {
  green: [
    '记录时间线：从什么时候开始、频率、和平时的差别',
    '保持原饮食，不要趁机换粮或加零食',
    '确保随时能喝到干净的水',
    '每 4-6 小时复看一次精神、食欲、排泄',
    '出现下列升级信号立刻重新自查：呼吸变化、无法站立、持续呕吐、尿不出、牙龈发白',
  ],
  yellow: [
    '今天就联系医院预约，说明症状与持续时间',
    '出门前拍下呕吐物 / 粪便 / 异常姿态的照片或视频（医院往往看不到发作时的样子）',
    '留一份新鲜粪便或尿液样本（用干净容器，冷藏保存，勿冷冻）',
    '记录近期变化：换粮、新零食、新环境、新植物、驱虫或疫苗时间',
    '不要自行使用人药或上次剩下的处方药',
  ],
  red: [
    '现在就打电话给 24 小时急诊，说明症状并告知预计到达时间',
    '路上保持安静与保温（中暑相反：常温水打湿降温，不要用冰水）',
    '不要喂食喂水，可能需要麻醉或手术',
    '疑似中毒请带上包装、残留物或呕吐物',
    '用航空箱或稳固容器运送，减少颠簸与二次伤害',
  ],
};

/** 就医时的沟通话术，帮助家长既拿到必要检查、又不被过度消费。 */
export const VET_SCRIPTS = [
  { q: '这项检查是为了排除什么？如果不做，会漏掉什么？', why: '把"要不要做"变成"为了什么做"，医生的回答会立刻具体化。' },
  { q: '有没有先做一步、看结果再决定下一步的方案？', why: '避免一次性打包所有项目，也让费用可控。' },
  { q: '这次的处理目标是什么？多久应该看到变化？没有变化时下一步是什么？', why: '让治疗有可验证的预期，而不是无限续单。' },
  { q: '能给我一份检查结果与病历的复印/电子件吗？', why: '病历是你的资产，换医院或做第二意见时至关重要。' },
  { q: '如果需要麻醉，术前评估包含哪些项目？风险如何？', why: '麻醉是真正需要严谨评估的环节，该做的不要省。' },
];
