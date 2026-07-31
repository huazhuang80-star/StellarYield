/** 金币与商城系统（PRD 5.4.5） */

export interface ShopItem {
  id: string
  name: string
  price: number
  category: 'skin' | 'habitat' | 'box' | 'merch' | 'donation'
  desc: string
  emoji: string
}

export const SHOP_ITEMS: ShopItem[] = [
  { id: 'skin-wuxia', name: '武侠皮肤', price: 300, category: 'skin', desc: '侠客装扮，剑眉星目', emoji: '🗡️' },
  { id: 'skin-scifi', name: '科幻皮肤', price: 400, category: 'skin', desc: '机械外骨骼，赛博质感', emoji: '🤖' },
  { id: 'skin-nature', name: '自然皮肤', price: 200, category: 'skin', desc: '苔原与晨雾', emoji: '🍃' },
  { id: 'habitat-bamboo', name: '竹林栖息地', price: 150, category: 'habitat', desc: '清风过竹，沙沙作响', emoji: '🎍' },
  { id: 'habitat-cliff', name: '悬崖栖息地', price: 250, category: 'habitat', desc: '云海之上的巢穴', emoji: '⛰️' },
  { id: 'box-mystery', name: '神秘宝箱', price: 50, category: 'box', desc: '随机开出皮肤 / 金币 / 课程', emoji: '🎁' },
  { id: 'merch-tshirt', name: '实体 T 恤', price: 1000, category: 'merch', desc: 'Day 180 起可兑换，包邮', emoji: '👕' },
  { id: 'merch-band', name: '提醒手环', price: 1200, category: 'merch', desc: '刻有你的起始日期', emoji: '⌚' },
  { id: 'donation-cert', name: '捐赠证书', price: 500, category: 'donation', desc: '以你的名义向慈善机构捐赠', emoji: '📜' },
]

/** 宝箱奖池（等权重随机，由调用方注入随机数以便测试） */
export const BOX_POOL = [
  { id: 'coins-100', label: '100 金币', coins: 100 },
  { id: 'coins-30', label: '30 金币', coins: 30 },
  { id: 'skin-nature', label: '自然皮肤', coins: 0 },
  { id: 'course-taiji', label: '太极课程解锁', coins: 0 },
  { id: 'coins-10', label: '10 金币（安慰奖）', coins: 10 },
]

export const COIN_SOURCES = [
  { id: 'checkin', label: '每日打卡', amount: 10 },
  { id: 'streak', label: '连续打卡加成', amount: 50, note: '最多 50/天' },
  { id: 'course', label: '完成课程', amount: 20, note: '20-100' },
  { id: 'help', label: '帮助社区新人', amount: 30 },
  { id: 'poster', label: '分享成就海报', amount: 50 },
  { id: 'invite', label: '邀请好友', amount: 100 },
]
