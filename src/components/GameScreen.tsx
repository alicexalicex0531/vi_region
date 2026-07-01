import { useEffect, useState } from 'react'
import type { MonsterDef } from '../types'
import { CLASSES, RARITY_INFO, expToNext, MAX_LEVEL } from '../data/classes'
import { MATERIALS } from '../data/materials'
import { FLOORS, MONSTER_BY_ID, monsterCombatStats } from '../data/monsters'
import { POTIONS, POTION_ORDER } from '../data/potions'
import { getPlayerStats } from '../game/battle'
import { useGameStore } from '../store/gameStore'
import Backpack from './Backpack'
import BattleModal from './BattleModal'
import CraftView from './CraftView'
import IsometricDungeonMap from './IsometricDungeonMap'
import { GRANDMA_QUOTES } from './PhantomGrandma'
import SaveManager from './SaveManager'
import { buildLevel, monsterIdAt, PLACEMENT_ORDER } from './dungeonLevels'
import Modal from './Modal'
import ShopView from './ShopView'
import WarehouseView from './WarehouseView'
import { materialEmoji } from './items'

type View = 'dungeon' | 'craft' | 'shop' | 'warehouse'

const VIEWS: { id: View; name: string; emoji: string }[] = [
  { id: 'dungeon', name: '地下城', emoji: '⚔️' },
  { id: 'craft', name: '合成', emoji: '🔨' },
  { id: 'shop', name: '商店', emoji: '🏪' },
  { id: 'warehouse', name: '倉庫', emoji: '🏬' },
]

// 穩定空物件參考（避免 zustand selector 每次回傳新物件造成無限 re-render）
const EMPTY_POTIONS: Record<string, number> = {}

export default function GameScreen() {
  const character = useGameStore((s) => s.character)!
  const equipped = useGameStore((s) => s.equipped)
  const battle = useGameStore((s) => s.battle)
  const closeBattle = useGameStore((s) => s.closeBattle)
  const exitToSelect = useGameStore((s) => s.exitToSelect)
  const notice = useGameStore((s) => s.notice)
  const clearNotice = useGameStore((s) => s.clearNotice)

  const [view, setView] = useState<View>('dungeon')
  const [settingsOpen, setSettingsOpen] = useState(false)
  const [saveOpen, setSaveOpen] = useState(false)

  // 提示自動消失
  useEffect(() => {
    if (!notice) return
    const t = setTimeout(clearNotice, 2800)
    return () => clearTimeout(t)
  }, [notice, clearNotice])

  const cls = CLASSES[character.classId]
  const stats = getPlayerStats(character, equipped)
  const need = expToNext(character.level)
  const expPct = need === Infinity ? 100 : Math.min(100, (character.exp / need) * 100)

  return (
    <div className="pb-20">
      {/* ── 角色狀態列 ── */}
      <header className="sticky top-0 z-10 -mx-3 bg-[#FFF4DC]/95 px-3 pt-3 pb-2 backdrop-blur">
        <div className="flex items-center gap-3 rounded-2xl bg-white p-3 shadow-sm">
          <span className="text-3xl">{cls.emoji}</span>
          <div className="min-w-0 flex-1">
            {character.title && (
              <div className="text-[10px] font-black text-[#9B5DE5]">👵「{character.title}」</div>
            )}
            <div className="flex items-baseline gap-2">
              <span className="truncate text-sm font-black text-[#5C4A36]">{character.name}</span>
              <span className="text-xs font-bold text-[#B8862F]">
                Lv{character.level} {cls.name}
              </span>
              <span className="ml-auto text-xs font-black text-[#B8862F]">
                💰{character.gold}
              </span>
            </div>
            <div className="mt-1 h-2 overflow-hidden rounded-full bg-[#EFE3CC]">
              <div
                className="h-full rounded-full bg-[#F5A623] transition-all"
                style={{ width: `${expPct}%` }}
              />
            </div>
            <div className="mt-0.5 flex justify-between text-[10px] text-[#A08A6F]">
              <span>
                ❤️{stats.maxHp} ⚔️{stats.baseAtk} 🛡️{stats.totalDef} {cls.mainStatName}
                {stats.mainStat}
                {stats.lifestealPct > 0 && ` 🩸${stats.lifestealPct}%`}
              </span>
              <span>
                {character.level >= MAX_LEVEL ? 'MAX' : `EXP ${character.exp}/${need}`}
              </span>
            </div>
            {(character.luckyBuff || stats.happyMeal) && (
              <div className="mt-0.5 flex gap-1.5 text-[9px] font-bold">
                {character.luckyBuff && (
                  <span className="rounded-full bg-[#EAF6E3] px-1.5 py-0.5 text-[#3E7A42]">
                    🍀 稀有掉率+{character.luckyBuff.bonusPct}%（剩
                    {character.luckyBuff.battlesLeft}場）
                  </span>
                )}
                {stats.happyMeal && (
                  <span className="rounded-full bg-[#FFF0D4] px-1.5 py-0.5 text-[#B8602F]">
                    🍔 快樂套餐：破爛但快樂
                  </span>
                )}
              </div>
            )}
          </div>
          {/* 死亡次數醒目顯示：精神攻擊核心（GDD §12） */}
          <div className="flex flex-col items-center rounded-xl bg-[#FDE8E4] px-2.5 py-1.5">
            <span className="text-base leading-none">💀</span>
            <span className="text-sm font-black text-[#B5503E]">{character.deaths}</span>
          </div>
          <button
            onClick={() => setSettingsOpen(true)}
            className="text-xl opacity-60 active:scale-90"
            aria-label="設定"
          >
            ⚙️
          </button>
        </div>
      </header>

      {/* ── 主視圖 ── */}
      {view === 'dungeon' && <DungeonView />}
      {view === 'craft' && <CraftView />}
      {view === 'shop' && <ShopView />}
      {view === 'warehouse' && <WarehouseView />}

      {/* ── 底部功能列 ── */}
      <nav className="fixed inset-x-0 bottom-0 z-20 mx-auto flex max-w-md gap-1 bg-[#FFF4DC]/95 p-2 backdrop-blur">
        {VIEWS.map((v) => (
          <button
            key={v.id}
            onClick={() => setView(v.id)}
            className={`flex-1 rounded-xl py-2 text-center text-[11px] font-black transition-all ${
              view === v.id ? 'bg-[#7A5C3D] text-white shadow' : 'bg-white text-[#7A6850] shadow-sm'
            }`}
          >
            <span className="block text-base leading-none">{v.emoji}</span>
            {v.name}
          </button>
        ))}
      </nav>

      {/* ── 戰鬥過程 ── */}
      {battle && <BattleModal battle={battle} onClose={closeBattle} />}

      {/* ── 提示 toast ── */}
      {notice && (
        <div className="pop-in fixed inset-x-0 bottom-16 z-30 mx-auto w-fit max-w-[90%] rounded-full bg-[#5C4A36] px-4 py-2 text-center text-xs font-bold text-white shadow-lg">
          {notice}
        </div>
      )}

      {/* ── 設定 ── */}
      {settingsOpen && (
        <Modal onClose={() => setSettingsOpen(false)}>
          <h3 className="text-center text-base font-black text-[#5C4A36]">⚙️ 設定</h3>
          <div className="mt-3 rounded-xl bg-[#FFF4DC] p-3 text-xs leading-relaxed text-[#7A6850]">
            ⚠️ 存檔說明：角色資料儲存在<b>瀏覽器本機</b>，清除瀏覽記錄會讓角色蒸發。
            記得用下方的存檔備份，匯出到雲端保平安！
          </div>
          <button
            onClick={() => {
              setSettingsOpen(false)
              setSaveOpen(true)
            }}
            className="mt-3 w-full rounded-xl bg-[#6FBF73] p-3 text-sm font-black text-white active:scale-95"
          >
            💾 存檔備份（匯出 / 匯入）
          </button>
          <button
            onClick={() => {
              setSettingsOpen(false)
              exitToSelect()
            }}
            className="mt-2 w-full rounded-xl bg-[#EAF4FD] p-3 text-sm font-bold text-[#33658A] active:scale-95"
          >
            回選角畫面，換隻角色玩 🏘️
          </button>
          <p className="mt-1 text-center text-[10px] text-[#C9B89D]">
            （進度自動保存；刪除角色請到選角畫面）
          </p>
          <button
            onClick={() => setSettingsOpen(false)}
            className="mt-3 w-full rounded-xl bg-[#F5A623] p-2.5 text-sm font-black text-white active:scale-95"
          >
            關閉
          </button>
          <p className="mt-2 text-center text-[10px] text-[#C9B89D]">
            《背包又滿了》由 vi & Claude 共同打造 🐮✨
          </p>
        </Modal>
      )}

      {/* ── 存檔備份（匯出/匯入，GDD §13.3）── */}
      {saveOpen && <SaveManager onClose={() => setSaveOpen(false)} />}
    </div>
  )
}

// ═══════════════ 地下城視圖 ═══════════════

function DungeonView() {
  const respawns = useGameStore((s) => s.respawns)
  const elites = useGameStore((s) => s.elites)
  const positions = useGameStore((s) => s.positions)
  const potions = useGameStore((s) => s.character?.potions ?? EMPTY_POTIONS)
  const armed = useGameStore((s) => s.armed)
  const toggleArm = useGameStore((s) => s.toggleArm)
  const fight = useGameStore((s) => s.fight)
  const relocateRevived = useGameStore((s) => s.relocateRevived)
  // 配戴「阿嬤的怒吼」才召喚幻影阿嬤（GDD §9.7）
  const grandmaOn = useGameStore((s) => s.equipped.mainHand?.special === 'grandma_duster')

  const [floorId, setFloorId] = useState('B1')
  const [now, setNow] = useState(Date.now())
  const [inspecting, setInspecting] = useState<MonsterDef | null>(null)
  const [grandma, setGrandma] = useState<{ x: number; y: number; quote: string } | null>(null)

  // 重生倒數用的時鐘（250ms 讓立體地圖的倒數膠囊更流暢，GDD §12.1）
  // 每 tick 也處理「倒數結束 → 復活並跳隨機空格」（GDD §12.1 v0.7）
  useEffect(() => {
    const t = setInterval(() => {
      setNow(Date.now())
      relocateRevived()
    }, 250)
    return () => clearInterval(t)
  }, [relocateRevived])

  // 幻影阿嬤狀態機（GDD §9.7）：20~40 秒出現、停 8 秒輪播 2 句後消失，循環
  useEffect(() => {
    if (!grandmaOn) {
      setGrandma(null)
      return
    }
    let quoteTimer: ReturnType<typeof setTimeout>
    let hideTimer: ReturnType<typeof setTimeout>
    let loop: ReturnType<typeof setTimeout>
    const scheduleNext = () =>
      setTimeout(
        () => {
          const x = 180 + Math.random() * 320 // 地圖中央偏上飄
          const y = 150 + Math.random() * 120
          let qi = Math.floor(Math.random() * GRANDMA_QUOTES.length)
          setGrandma({ x, y, quote: GRANDMA_QUOTES[qi] })
          quoteTimer = setTimeout(() => {
            qi = (qi + 1) % GRANDMA_QUOTES.length
            setGrandma((g) => (g ? { ...g, quote: GRANDMA_QUOTES[qi] } : null))
          }, 4000)
          hideTimer = setTimeout(() => {
            setGrandma(null)
            loop = scheduleNext()
          }, 8000)
        },
        20000 + Math.random() * 20000,
      )
    loop = scheduleNext()
    return () => {
      clearTimeout(loop)
      clearTimeout(quoteTimer)
      clearTimeout(hideTimer)
    }
  }, [grandmaOn])

  // 組立體地圖資料：擺位/造型沿用 template、名字/菁英/數值/位置由 store 餵入
  const level = buildLevel(floorId, elites, positions)
  // respawns（store 用怪物 id）換算成元件要的「擺位索引 → 剩餘秒數」
  const respawning: Record<number, number> = {}
  PLACEMENT_ORDER[floorId].forEach((id, i) => {
    const left = ((respawns[id] ?? 0) - now) / 1000
    if (left > 0) respawning[i] = left
  })

  return (
    <>
      {/* ── 樓層選擇 ── */}
      <nav className="mt-3 flex gap-1.5">
        {FLOORS.map((f) => (
          <button
            key={f.id}
            disabled={f.locked}
            onClick={() => setFloorId(f.id)}
            className={`flex-1 rounded-xl py-2 text-center text-xs font-bold transition-all ${
              f.id === floorId
                ? 'bg-[#7A5C3D] text-white shadow'
                : f.locked
                  ? 'bg-[#F0E6D2] text-[#C9B89D]'
                  : 'bg-white text-[#7A6850] shadow-sm active:scale-95'
            }`}
          >
            <span className="block text-base leading-none">{f.locked ? '🔒' : f.emoji}</span>
            {f.id}
          </button>
        ))}
      </nav>

      {/* ── 地下城等距立體地圖（GDD §12.1）── */}
      <main className="mt-2">
        <IsometricDungeonMap
          level={level}
          respawning={respawning}
          grandma={grandma}
          onMonsterClick={(_, index) => {
            const id = monsterIdAt(floorId, index)
            if (id) setInspecting(MONSTER_BY_ID[id])
          }}
        />
      </main>

      {/* ── 背包預覽 ── */}
      <Backpack />

      {/* ── 怪物資訊（GDD：點怪 → 看資訊 → 戰鬥） ── */}
      {inspecting && (
        <Modal onClose={() => setInspecting(null)}>
          {(() => {
            const isElite = !inspecting.isBoss && elites[inspecting.id] === true
            const combat = monsterCombatStats(inspecting, isElite)
            return (
              <div className="text-center">
                <span className="text-5xl">{inspecting.emoji}</span>
                <div
                  className={`mt-1 text-base font-black ${
                    isElite ? 'text-[#9B5DE5]' : 'text-[#5C4A36]'
                  }`}
                >
                  {inspecting.isBoss && '👑 '}
                  {isElite && '💢 '}
                  {inspecting.name}
                </div>
                <div className="mt-1 text-xs font-bold text-[#7A6850]">
                  ❤️ {combat.hp}　⚔️ {isElite ? combat.atk : inspecting.atk}　EXP {combat.exp}
                </div>
                {isElite && (
                  <div className="mt-1 text-[10px] font-bold text-[#9B5DE5]">
                    菁英個體：數值 ×2.5、掉落判定 ×2。牠不打死不會走，先去攢裝備也行！
                  </div>
                )}
              </div>
            )
          })()}
          <div className="mt-3 rounded-xl bg-[#FFF4DC] p-2.5">
            <div className="text-[11px] font-black text-[#7A5C3D]">可能掉落：</div>
            {inspecting.drops.map((d) => {
              const m = MATERIALS[d.materialId]
              const r = RARITY_INFO[m.rarity]
              return (
                <div key={d.materialId} className="mt-0.5 flex items-center gap-1.5 text-[11px]">
                  <span>{materialEmoji(m)}</span>
                  <span style={{ color: m.rarity === 'common' ? '#7A6850' : r.color }}>
                    {m.name}
                  </span>
                  {m.rarity !== 'common' && (
                    <span
                      className="rounded-full px-1.5 text-[9px] font-bold text-white"
                      style={{ background: r.color }}
                    >
                      {r.name}
                    </span>
                  )}
                </div>
              )
            })}
          </div>
          {/* 戰前武裝藥水（GDD §7.9：攻/防各一格可共存、補血帶入快沒血自動灌）*/}
          <div className="mt-3">
            <div className="text-[11px] font-black text-[#7A5C3D]">🧪 戰前喝藥水（點選帶入本場）：</div>
            <div className="mt-1 flex gap-1.5">
              {POTION_ORDER.map((pid) => {
                const def = POTIONS[pid]
                const owned = potions[pid] ?? 0
                const on = armed[pid]
                return (
                  <button
                    key={pid}
                    disabled={owned <= 0}
                    onClick={() => toggleArm(pid)}
                    className={`flex-1 rounded-xl border-2 p-1.5 text-center text-[10px] font-bold transition-all active:scale-95 disabled:opacity-35 ${
                      on ? 'border-[#6FBF73] bg-[#EAF6E3] text-[#3E7A42]' : 'border-[#EFE3CC] bg-white text-[#7A6850]'
                    }`}
                  >
                    <span className="block text-base leading-none">{def.emoji}</span>
                    {def.name.slice(0, 2)}
                    <span className="block text-[9px] text-[#A08A6F]">
                      {on ? '✓帶' : '持有'} {owned}
                    </span>
                  </button>
                )
              })}
            </div>
          </div>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setInspecting(null)}
              className="flex-1 rounded-xl bg-[#EFE3CC] p-2.5 text-sm font-bold text-[#7A6850] active:scale-95"
            >
              先不要
            </button>
            <button
              onClick={() => {
                fight(inspecting.id)
                setInspecting(null)
              }}
              className="flex-1 rounded-xl bg-[#E8604A] p-2.5 text-sm font-black text-white active:scale-95"
            >
              開打！⚔️
            </button>
          </div>
        </Modal>
      )}
    </>
  )
}
