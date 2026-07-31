import { describe, expect, it } from 'vitest'
import { QUESTIONS } from '../../data/assessment'
import { avoidanceOf, constitutionOf, recoveryWindow, scoreAssessment, severityOf, triggerShares } from '../assessment'

const HEAVY = {
  freq: 8,
  duration: 8,
  control: 8,
  energy: 9,
  sleep: 9,
  fitness: 9,
  anxiety: 6,
  avoidance: 6,
  esteem: 7,
  focus: 6,
  'trigger-night': 9,
  'trigger-stress': 3,
  'trigger-weekend': 1,
  'trigger-visual': 0,
  'trigger-lonely': 0,
  'const-yang': 9,
  'const-yin': 3,
  'const-qi': 6,
  'const-phlegm': 0,
}

describe('severityOf', () => {
  it('把高频 + 长期 + 屡次失败判为重度', () => {
    expect(severityOf(HEAVY)).toBe('severe')
  })

  it('把低频短期判为轻度', () => {
    expect(severityOf({ freq: 1, duration: 1, control: 2 })).toBe('mild')
  })

  it('空答案不抛错，落在轻度', () => {
    expect(severityOf({})).toBe('mild')
  })
})

describe('triggerShares', () => {
  it('占比合计恒为 100 且按大小降序', () => {
    const shares = triggerShares(HEAVY)
    expect(shares.reduce((s, t) => s + t.share, 0)).toBe(100)
    expect(shares[0].id).toBe('night-boredom')
    expect(shares.map((s) => s.share)).toEqual([...shares.map((s) => s.share)].sort((a, b) => b - a))
  })

  it('全 0 作答时均分而非返回空', () => {
    const shares = triggerShares({})
    expect(shares.length).toBeGreaterThan(0)
    expect(shares.reduce((s, t) => s + t.share, 0)).toBe(100)
  })

  it('取整余数补给权重最大项，不会丢百分点', () => {
    const shares = triggerShares({ 'trigger-night': 1, 'trigger-stress': 1, 'trigger-weekend': 1 })
    expect(shares.reduce((s, t) => s + t.share, 0)).toBe(100)
  })
})

describe('constitutionOf', () => {
  it('取得分最高的体质', () => {
    expect(constitutionOf(HEAVY)).toBe('yang')
    expect(constitutionOf({ 'const-phlegm': 9 })).toBe('phlegm')
  })

  it('并列时结果稳定（阳虚优先）', () => {
    const answers = { 'const-yang': 6, 'const-qi': 6, 'const-yin': 6, 'const-phlegm': 6 }
    expect(constitutionOf(answers)).toBe('yang')
    expect(constitutionOf(answers)).toBe(constitutionOf({ ...answers }))
  })
})

describe('recoveryWindow', () => {
  it('严重度越高周期越长', () => {
    expect(recoveryWindow('mild', 0)[1]).toBeLessThan(recoveryWindow('severe', 0)[1])
  })

  it('高焦虑追加缓冲', () => {
    expect(recoveryWindow('moderate', 8)).toEqual([120, 150])
    expect(recoveryWindow('moderate', 0)).toEqual([90, 120])
  })
})

describe('avoidanceOf', () => {
  it('按阈值分级', () => {
    expect(avoidanceOf(0)).toBe('none')
    expect(avoidanceOf(3)).toBe('mild')
    expect(avoidanceOf(6)).toBe('obvious')
    expect(avoidanceOf(9)).toBe('severe')
  })
})

describe('scoreAssessment', () => {
  it('相同答案得到完全相同的报告（可复现）', () => {
    const now = new Date(2026, 0, 15)
    expect(scoreAssessment(HEAVY, now)).toEqual(scoreAssessment(HEAVY, now))
  })

  it('生理指标是"越高越好"的方向', () => {
    const good = scoreAssessment({ ...HEAVY, energy: 0, sleep: 0 })
    const bad = scoreAssessment(HEAVY)
    expect(good.physical.energy).toBeGreaterThan(bad.physical.energy)
    expect(good.physical.sleep).toBeGreaterThan(bad.physical.sleep)
  })

  it('方案随首要诱因变化', () => {
    const night = scoreAssessment({ ...HEAVY, 'trigger-night': 9, 'trigger-stress': 0 })
    const lonely = scoreAssessment({ ...HEAVY, 'trigger-night': 0, 'trigger-stress': 0, 'trigger-lonely': 9 })
    expect(night.plan).toContain('睡前替代方案')
    expect(lonely.plan).toContain('问责伙伴')
  })

  it('题库里每道题都有可选项，避免死题', () => {
    QUESTIONS.forEach((q) => expect(q.options.length).toBeGreaterThan(1))
  })
})
