import { useState } from 'react'
import { Card, Sheet } from '../components/ui'
import { BOX_POOL, COIN_SOURCES, SHOP_ITEMS } from '../data/shop'
import { openBox } from '../lib/rewards'
import { useStore } from '../state/store'

/** 金币与商城系统（PRD 5.4.5） */
export function Shop() {
  const { state, dispatch, days } = useStore()
  const [prize, setPrize] = useState<string | null>(null)

  function open(free: boolean) {
    const roll = Math.random()
    dispatch({ type: 'open-box', roll, free })
    setPrize(openBox(BOX_POOL, roll).label)
  }

  const boxPrice = SHOP_ITEMS.find((i) => i.category === 'box')?.price ?? 50

  return (
    <div className="screen">
      <h1>商城</h1>
      <p className="small muted">
        金币余额 <span className="tag">💎 {state.coins}</span>{' '}
        {state.boxes > 0 && <span className="tag jade">🎁 免费宝箱 ×{state.boxes}</span>}
      </p>

      <Card tone="jade">
        <div className="card-title">🎁 神秘宝箱</div>
        <p className="small muted" style={{ marginTop: 0 }}>
          随机开出皮肤 / 金币 / 课程解锁。完美日会额外赠送一个。
        </p>
        <div className="btn-row">
          <button className="btn amber" disabled={state.boxes < 1} onClick={() => open(true)}>
            免费开启（{state.boxes}）
          </button>
          <button className="btn" disabled={state.coins < boxPrice} onClick={() => open(false)}>
            花 {boxPrice} 金币开
          </button>
        </div>
      </Card>

      <h2>商城物品</h2>
      {SHOP_ITEMS.filter((i) => i.category !== 'box').map((item) => {
        const owned = state.unlocked.includes(item.id)
        const merchLocked = item.category === 'merch' && days < 180
        return (
          <Card key={item.id}>
            <div className="row">
              <div>
                <div className="card-title" style={{ marginBottom: 2 }}>
                  {item.emoji} {item.name}
                </div>
                <p className="small muted" style={{ margin: 0 }}>
                  {item.desc}
                </p>
              </div>
              <button
                className={`btn${owned || merchLocked ? '' : ' primary'}`}
                style={{ width: 108 }}
                disabled={owned || merchLocked || state.coins < item.price}
                onClick={() => dispatch({ type: 'buy', itemId: item.id })}
              >
                {owned ? '已拥有' : merchLocked ? 'Day 180' : `${item.price} 💎`}
              </button>
            </div>
          </Card>
        )
      })}

      <h2>金币获取方式</h2>
      <Card>
        {COIN_SOURCES.map((s) => (
          <div key={s.id} className="row small">
            <span className="muted">
              {s.label}
              {s.note ? ` · ${s.note}` : ''}
            </span>
            <span>+{s.amount}</span>
          </div>
        ))}
      </Card>

      {prize && (
        <Sheet title="开箱结果" onClose={() => setPrize(null)}>
          <div className="egg">
            <div className="art">🎉</div>
            <h1>{prize}</h1>
            <p className="muted small">已放入你的账户</p>
          </div>
          <button className="btn primary" onClick={() => setPrize(null)}>
            收下
          </button>
        </Sheet>
      )}
    </div>
  )
}
