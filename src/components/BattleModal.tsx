import { useEffect, useRef, useState } from 'react'
import type { BattleResult } from '../types'
import { MATERIALS } from '../data/materials'
import { MONSTER_BY_ID, monsterCombatStats } from '../data/monsters'
import { RARITY_INFO } from '../data/classes'
import Modal from './Modal'
import { materialEmoji } from './items'

const TURN_MS = 320

function BuffCell({ active, emoji, label }: { active: boolean; emoji: string; label: string }) {
  return (
    <div
      className={`flex flex-1 items-center justify-center gap-1 rounded-lg py-1 text-[10px] font-bold ${
        active ? 'bg-[#FFF0D4] text-[#7A5C3D]' : 'bg-[#F0EDE6] text-[#C9B89D]'
      }`}
    >
      <span className={active ? '' : 'grayscale opacity-50'}>{emoji}</span>
      {label}
    </div>
  )
}

function HpBar({ label, hp, max, color }: { label: string; hp: number; max: number; color: string }) {
  return (
    <div className="flex-1">
      <div className="flex justify-between text-[11px] font-bold text-[#7A6850]">
        <span>{label}</span>
        <span>
          {hp}/{max}
        </span>
      </div>
      <div className="h-2.5 overflow-hidden rounded-full bg-[#EFE3CC]">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${(hp / max) * 100}%`, background: color }}
        />
      </div>
    </div>
  )
}

export default function BattleModal({
  battle,
  onClose,
}: {
  battle: BattleResult
  onClose: () => void
}) {
  const monster = MONSTER_BY_ID[battle.monsterId]
  const combat = monsterCombatStats(monster, battle.isElite)
  const [shown, setShown] = useState(0)
  const logRef = useRef<HTMLDivElement>(null)
  const done = shown >= battle.turns.length

  useEffect(() => {
    if (done) return
    const t = setTimeout(() => setShown((n) => n + 1), TURN_MS)
    return () => clearTimeout(t)
  }, [shown, done])

  useEffect(() => {
    logRef.current?.scrollTo({ top: logRef.current.scrollHeight })
  }, [shown])

  let playerHp = battle.playerMaxHp
  let monsterHp = combat.hp
  for (const t of battle.turns.slice(0, shown)) {
    if (t.side === 'player') monsterHp = t.hpAfter
    else playerHp = t.hpAfter
  }

  // 藥水 buff 狀態列（GDD §7.9.3）：依目前播放到的回合更新剩餘
  const b = battle.buffs
  const hasBuffs = b.atkRounds > 0 || b.defRounds > 0 || b.heals > 0
  const lastShown = shown > 0 ? battle.turns[Math.min(shown, battle.turns.length) - 1] : undefined
  const atkLeft = lastShown?.atkLeft ?? b.atkRounds
  const defLeft = lastShown?.defLeft ?? b.defRounds
  const healsLeft = lastShown?.healsLeft ?? b.heals

  return (
    <Modal>
      <div className="flex items-center gap-3">
        <span className={`text-4xl ${done && battle.victory ? '' : 'shake'}`}>{monster.emoji}</span>
        <div className="min-w-0 flex-1">
          <div
            className={`truncate text-sm font-black ${
              battle.isElite ? 'text-[#9B5DE5]' : 'text-[#5C4A36]'
            }`}
          >
            {battle.isElite && '💢 '}
            {monster.name}
          </div>
          <div className="mt-1 flex gap-3">
            <HpBar label="😤 你" hp={playerHp} max={battle.playerMaxHp} color="#6FBF73" />
            <HpBar label="👾 牠" hp={monsterHp} max={combat.hp} color="#E8604A" />
          </div>
        </div>
      </div>

      {/* 🧪 藥水 buff 狀態列（GDD §7.9.3）*/}
      {hasBuffs && (
        <div className="mt-2 flex gap-1.5">
          <BuffCell active={healsLeft > 0} emoji="🔴" label={`補血 ${healsLeft}`} />
          <BuffCell active={defLeft > 0} emoji="🔵" label={defLeft > 0 ? `防禦 ${defLeft}回` : '防禦'} />
          <BuffCell active={atkLeft > 0} emoji="🟡" label={atkLeft > 0 ? `攻擊 ${atkLeft}回` : '攻擊'} />
        </div>
      )}

      <div
        ref={logRef}
        className="mt-3 h-36 overflow-y-auto rounded-xl bg-[#FFF4DC] p-2 text-xs leading-relaxed"
      >
        {battle.turns.slice(0, shown).map((t, i) => (
          <div key={i} className={t.side === 'player' ? 'text-[#3E7A42]' : 'text-[#B5503E]'}>
            {t.side === 'player' ? (
              <>
                ⚔️ 你打出 <b>{t.dmg}</b> 傷害（×{t.crit.toFixed(2)}）{t.crit > 1.9 ? '💥' : ''}
                {t.heal ? <span className="text-[#2E8A5C]">　🩸回復{t.heal}</span> : null}
              </>
            ) : (
              <>
                {t.dmg === 0 ? (
                  <>🛡️ 牠的攻擊被你完全擋下！</>
                ) : (
                  <>
                    👊 牠反擊 <b>{t.dmg}</b> 傷害（×{t.crit.toFixed(2)}）
                  </>
                )}
                {t.regen ? <span className="text-[#2E8A5C]">　💚回血{t.regen}</span> : null}
                {t.potionHeal ? (
                  <span className="text-[#C44]">　🔴喝藥水回{t.potionHeal}</span>
                ) : null}
              </>
            )}
          </div>
        ))}
        {!done && <div className="text-[#C9B89D]">…</div>}
      </div>

      {done && (
        <div className="pop-in mt-3">
          {battle.victory ? (
            <div className="rounded-xl bg-[#EAF6E3] p-3">
              <div className="text-center text-lg font-black text-[#3E7A42]">🎉 勝利！</div>
              <div className="text-center text-sm font-bold text-[#5C4A36]">
                EXP +{battle.expGained}
                {battle.levelUpTo && (
                  <span className="ml-2 rounded-full bg-[#F5A623] px-2 py-0.5 text-xs text-white">
                    🆙 升到 Lv{battle.levelUpTo}！
                  </span>
                )}
              </div>
              {battle.drops.length > 0 && (
                <div className="mt-2 space-y-1">
                  {battle.drops.map((d) => {
                    const m = MATERIALS[d.materialId]
                    const r = RARITY_INFO[m.rarity]
                    return (
                      <div key={d.materialId} className="flex items-center gap-1.5 text-xs">
                        <span>{materialEmoji(m)}</span>
                        <span className="font-bold" style={{ color: r.color }}>
                          {m.name}
                        </span>
                        <span className="text-[#A08A6F]">×{d.count}</span>
                        {m.rarity !== 'common' && (
                          <span
                            className="rounded-full px-1.5 text-[10px] font-bold text-white"
                            style={{ background: r.color }}
                          >
                            {r.name}
                          </span>
                        )}
                      </div>
                    )
                  })}
                </div>
              )}
              {battle.lostDrops.length > 0 && (
                <div className="mt-2 rounded-lg bg-[#FDE8E4] p-2 text-xs text-[#B5503E]">
                  <b>🎒 背包又滿了！</b>這些掉落不翼而飛：
                  {battle.lostDrops.map((d) => (
                    <div key={d.materialId}>
                      ・{MATERIALS[d.materialId].name} ×{d.count}
                    </div>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="rounded-xl bg-[#FDE8E4] p-3 text-center">
              <div className="text-lg font-black text-[#B5503E]">💀 你倒下了…</div>
              <div className="mt-1 text-xs text-[#7A6850]">
                死亡次數 +1（已永久記錄😈）
                <br />
                物品都還在，回城躺一下就好。
              </div>
            </div>
          )}
        </div>
      )}

      <div className="mt-3 flex gap-2">
        {!done ? (
          <button
            onClick={() => setShown(battle.turns.length)}
            className="flex-1 rounded-xl bg-[#EFE3CC] p-2.5 text-sm font-bold text-[#7A6850] active:scale-95"
          >
            ⏩ 快轉
          </button>
        ) : (
          <button
            onClick={onClose}
            className="flex-1 rounded-xl bg-[#F5A623] p-2.5 text-sm font-black text-white active:scale-95"
          >
            {battle.victory ? '收工！' : '爬回城裡 🏠'}
          </button>
        )}
      </div>
    </Modal>
  )
}
