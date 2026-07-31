import { describe, expect, it } from 'vitest'
import { BOX_POOL } from '../../data/shop'
import { checkinReward, isEarlyRise, openBox, streakBonus } from '../rewards'

describe('streakBonus', () => {
  it('N×5 且上限 50', () => {
    expect(streakBonus(1)).toBe(5)
    expect(streakBonus(9)).toBe(45)
    expect(streakBonus(10)).toBe(50)
    expect(streakBonus(400)).toBe(50)
  })

  it('负数或 0 不给加成', () => {
    expect(streakBonus(0)).toBe(0)
    expect(streakBonus(-3)).toBe(0)
  })
})

describe('checkinReward', () => {
  it('基础打卡只给 10 金币', () => {
    const r = checkinReward({ streak: 0, perfect: false, earlyRise: false, earlySleep: false })
    expect(r.coins).toBe(10)
    expect(r.box).toBe(false)
  })

  it('完美日额外 50 且赠送宝箱', () => {
    const r = checkinReward({ streak: 1, perfect: true, earlyRise: false, earlySleep: false })
    expect(r.coins).toBe(10 + 5 + 50)
    expect(r.box).toBe(true)
  })

  it('早起 + 早睡各 20', () => {
    const r = checkinReward({ streak: 0, perfect: false, earlyRise: true, earlySleep: true })
    expect(r.coins).toBe(50)
  })

  it('明细合计等于总额', () => {
    const r = checkinReward({ streak: 12, perfect: true, earlyRise: true, earlySleep: true })
    expect(r.breakdown.reduce((s, b) => s + b.coins, 0)).toBe(r.coins)
  })
})

describe('openBox', () => {
  it('roll 落在区间内取对应奖品', () => {
    expect(openBox(BOX_POOL, 0)).toBe(BOX_POOL[0])
    expect(openBox(BOX_POOL, 0.99)).toBe(BOX_POOL.at(-1))
  })

  it('越界 roll 被夹紧而不是崩溃', () => {
    expect(openBox(BOX_POOL, 1)).toBe(BOX_POOL.at(-1))
    expect(openBox(BOX_POOL, -1)).toBe(BOX_POOL[0])
  })
})

describe('isEarlyRise', () => {
  it('只有 6 点这一小时算早起', () => {
    expect(isEarlyRise(new Date(2026, 0, 1, 6, 30))).toBe(true)
    expect(isEarlyRise(new Date(2026, 0, 1, 7, 0))).toBe(false)
  })
})
