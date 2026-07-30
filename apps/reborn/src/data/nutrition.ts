import type { Constitution } from '../types'

export interface NutritionCard {
  id: string
  direction: string
  foods: string[]
  effect: string
  form: string
}

/** 膳食与营养指导（PRD 5.3.3） */
export const NUTRITION: NutritionCard[] = [
  { id: 'kidney', direction: '肾精补充', foods: ['黑芝麻', '核桃', '枸杞', '山药', '桑葚'], effect: '传统补肾益精', form: '食谱推荐' },
  { id: 'brain', direction: '脑力恢复', foods: ['DHA', '卵磷脂', '蓝莓', '深海鱼'], effect: '神经修复、记忆力', form: '科普卡片' },
  { id: 'vitality', direction: '精力提升', foods: ['牛肉', '鸡蛋', '菠菜', '南瓜籽'], effect: '铁、锌、蛋白质', form: '每日营养提醒' },
  { id: 'sleep', direction: '助眠食物', foods: ['温牛奶', '香蕉', '燕麦', '酸枣仁'], effect: '褪黑素前体、镁', form: '睡前食谱' },
  { id: 'avoid', direction: '忌口提醒', foods: ['冷饮', '生冷', '过度辛辣', '过量咖啡因'], effect: '保护脾胃阳气', form: '饮食日记' },
]

export const CONSTITUTION_MENU: Record<Constitution, { lunch: string; tea: string; avoid: string }> = {
  yang: { lunch: '山药排骨汤 + 姜丝炒羊肉', tea: '桂圆红枣茶', avoid: '冰饮、生鱼片' },
  yin: { lunch: '银耳莲子羹 + 清蒸鱼', tea: '枸杞菊花茶', avoid: '辣椒、烧烤、熬夜' },
  qi: { lunch: '黄芪炖鸡 + 小米粥', tea: '黄芪泡水', avoid: '过度节食、剧烈运动' },
  phlegm: { lunch: '薏米赤小豆粥 + 白灼时蔬', tea: '陈皮普洱', avoid: '甜点、油炸、夜宵' },
}

export const WATER_GOAL = 8
