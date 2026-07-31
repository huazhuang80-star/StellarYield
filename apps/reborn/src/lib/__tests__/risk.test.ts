import { describe, expect, it } from 'vitest'
import { scoreAssessment } from '../assessment'
import { formatWindow, inWindow, predictRiskWindow } from '../risk'
import type { RelapseRecord, UrgeEvent } from '../../types'

function relapse(hour: number): RelapseRecord {
  return { at: new Date(2026, 2, 10, hour, 15).toISOString(), trigger: 'night-boredom', feeling: '累', regret: 6 }
}

function urge(hour: number): UrgeEvent {
  return { at: new Date(2026, 2, 11, hour, 5).toISOString(), intensity: 7, resolution: 'grounding' }
}

describe('predictRiskWindow', () => {
  it('样本不足时回退到测评首要诱因', () => {
    const assessment = scoreAssessment({ 'trigger-stress': 9 })
    const w = predictRiskWindow({ relapses: [], urgeEvents: [], assessment })
    expect(w.startHour).toBe(18)
    expect(w.confidence).toBeLessThan(0.5)
  })

  it('无任何数据时给出深夜默认窗口', () => {
    const w = predictRiskWindow({ relapses: [], urgeEvents: [], assessment: null })
    expect(w.startHour).toBe(23)
    expect(w.endHour).toBe(1)
  })

  it('样本足够时找出 3 小时滑动峰值', () => {
    const w = predictRiskWindow({
      relapses: [relapse(23), relapse(23), relapse(0)],
      urgeEvents: [urge(1), urge(0)],
      assessment: null,
    })
    expect(w.startHour).toBe(23)
    expect(w.endHour).toBe(2)
  })

  it('置信度随样本量上升但不超过 0.95', () => {
    const many = Array.from({ length: 40 }, () => relapse(22))
    expect(predictRiskWindow({ relapses: many, urgeEvents: [], assessment: null }).confidence).toBeLessThanOrEqual(0.95)
  })

  it('忽略无法解析的时间戳', () => {
    const broken = [{ ...relapse(22), at: 'not-a-date' }]
    expect(() => predictRiskWindow({ relapses: broken, urgeEvents: [], assessment: null })).not.toThrow()
  })
})

describe('inWindow', () => {
  it('跨零点窗口判断正确', () => {
    const w = { startHour: 23, endHour: 2, confidence: 0.5, reason: '' }
    expect(inWindow(w, new Date(2026, 0, 1, 23, 30))).toBe(true)
    expect(inWindow(w, new Date(2026, 0, 1, 1, 30))).toBe(true)
    expect(inWindow(w, new Date(2026, 0, 1, 12, 0))).toBe(false)
  })

  it('普通窗口左闭右开', () => {
    const w = { startHour: 18, endHour: 20, confidence: 0.5, reason: '' }
    expect(inWindow(w, new Date(2026, 0, 1, 18, 0))).toBe(true)
    expect(inWindow(w, new Date(2026, 0, 1, 20, 0))).toBe(false)
  })
})

describe('formatWindow', () => {
  it('补零展示', () => {
    expect(formatWindow({ startHour: 1, endHour: 4, confidence: 0.5, reason: '' })).toBe('01:00-04:00')
  })
})
