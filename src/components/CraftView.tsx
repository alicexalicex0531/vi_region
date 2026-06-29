import { useMemo, useState } from 'react'
import type { Element, EquipSlot } from '../types'
import { RARITY_INFO } from '../data/classes'
import {
  ELEMENT_RECIPES,
  enhanceBoost,
  HIDDEN_RECIPES,
  LIFESTEAL_RANGE,
  LUCKY_RECIPES,
  RARITY_SCORE,
  ROLL_TABLE,
  SLOT_INFO,
  SLOT_ORDER,
  tierFromScore,
  WATER_REPLACE_ATK_DELTA,
} from '../data/equipment'
import { MATERIALS } from '../data/materials'
import { POTIONS, POTION_ORDER } from '../data/potions'
import { useGameStore } from '../store/gameStore'
import Codex from './Codex'
import Modal from './Modal'
import { EquipmentCard, materialEmoji } from './items'

type PickerTarget = { kind: 'element'; element: Element; index: number } | { kind: 'enhance' } | { kind: 'suffix' }

export default function CraftView() {
  const character = useGameStore((s) => s.character)!
  const backpack = useGameStore((s) => s.backpack)
  const equipped = useGameStore((s) => s.equipped)
  const discovered = useGameStore((s) => s.discovered)
  const craftElement = useGameStore((s) => s.craftElement)
  const craftWhite = useGameStore((s) => s.craftWhite)
  const craftLucky = useGameStore((s) => s.craftLucky)
  const craftPotion = useGameStore((s) => s.craftPotion)
  const unequip = useGameStore((s) => s.unequip)
  const lastCrafted = useGameStore((s) => s.lastCrafted)
  const clearCrafted = useGameStore((s) => s.clearCrafted)

  const [tab, setTab] = useState<'element' | 'white'>('element')
  const [slot, setSlot] = useState<EquipSlot>('mainHand')
  const [recipeIdx, setRecipeIdx] = useState(0)
  const [picks, setPicks] = useState<(string | null)[]>([null, null, null])
  const [enhanceId, setEnhanceId] = useState<string | null>(null)
  const [suffixId, setSuffixId] = useState<string | null>(null)
  const [picker, setPicker] = useState<PickerTarget | null>(null)
  const [whitePicks, setWhitePicks] = useState<string[]>([])
  const [codexOpen, setCodexOpen] = useState(false)

  // v2：每格可有多條配方變體（如劍士主手＝鐵骨大劍/飲血之刃）
  const variants = ELEMENT_RECIPES[character.classId][slot]
  const recipe = variants[Math.min(recipeIdx, variants.length - 1)]
  // 配方展開：{金:2,木:1} → [金,金,木]
  const reqList = useMemo(() => {
    const list: Element[] = []
    for (const [el, n] of Object.entries(recipe.cost)) {
      for (let i = 0; i < (n ?? 0); i++) list.push(el as Element)
    }
    return list
  }, [recipe])

  const owned = useMemo(() => {
    const map = new Map<string, number>()
    for (const it of backpack) {
      if (it.type === 'material')
        map.set(it.materialId, (map.get(it.materialId) ?? 0) + it.count)
    }
    return map
  }, [backpack])

  const used = useMemo(() => {
    const map = new Map<string, number>()
    const all = [...picks.filter(Boolean), enhanceId, suffixId, ...whitePicks] as string[]
    for (const id of all) if (id) map.set(id, (map.get(id) ?? 0) + 1)
    return map
  }, [picks, enhanceId, suffixId, whitePicks])

  const available = (id: string) => (owned.get(id) ?? 0) - (used.get(id) ?? 0)

  const selectSlot = (s: EquipSlot) => {
    setSlot(s)
    setRecipeIdx(0)
    setPicks(Array(expandCost(s, 0)).fill(null))
    setEnhanceId(null)
    setSuffixId(null)
  }
  const selectVariant = (idx: number) => {
    setRecipeIdx(idx)
    setPicks(Array(expandCost(slot, idx)).fill(null))
  }
  function expandCost(s: EquipSlot, idx: number): number {
    return Object.values(ELEMENT_RECIPES[character.classId][s][idx].cost).reduce(
      (a, b) => a + (b ?? 0),
      0,
    )
  }
  // 初始 picks 長度對齊目前配方
  if (picks.length !== reqList.length) setPicks(Array(reqList.length).fill(null))

  const allPicked = picks.length === reqList.length && picks.every(Boolean)

  // 開獎範圍預覽（透明原則：開獎前就告訴你範圍；v0.9 四段表＋v1.0 強化素材公式）
  const preview = useMemo(() => {
    if (!allPicked) return null
    const score =
      picks.reduce((s, id) => s + RARITY_SCORE[MATERIALS[id!].rarity], 0) / picks.length
    const tier = tierFromScore(score) // 平均稀有度 → 取最接近的階
    const enhanceRarity = enhanceId ? MATERIALS[enhanceId].rarity : null
    const slotTable = ROLL_TABLE[slot]
    const labels: Record<string, string> = { atk: 'ATK', def: 'DEF', hp: 'HP', mainStat: '主屬性' }
    const parts: string[] = []
    for (const stat of ['atk', 'def', 'hp', 'mainStat'] as const) {
      const r = slotTable[stat]?.[tier]
      if (!r) continue
      let [lo, hi] = r
      if (stat === 'atk' && recipe.waterReplace) {
        lo += WATER_REPLACE_ATK_DELTA[0]
        hi += WATER_REPLACE_ATK_DELTA[1]
      }
      // v1.0 §7.6.2：強化素材的加成基於該格普通範圍算（含最少推升保證）
      const commonR = slotTable[stat]?.common
      const boost = enhanceRarity && commonR ? enhanceBoost(commonR, enhanceRarity) : 0
      const lo2 = Math.min(hi, lo + boost)
      parts.push(`${labels[stat]} ${lo2}~${hi}`)
    }
    // 帶水主手 → 吸血範圍預告（看放在水格位素材的最高稀有度；百搭素材放水格也算）
    if (slot === 'mainHand') {
      const waters = picks
        .map((id) => MATERIALS[id!])
        .filter((_, i) => reqList[i] === 'water')
      if (waters.length > 0) {
        const best = waters.reduce((a, b) =>
          RARITY_SCORE[a.rarity] >= RARITY_SCORE[b.rarity] ? a : b,
        )
        const [lo, hi] = LIFESTEAL_RANGE[best.rarity]
        parts.push(`🩸吸血 ${lo}~${hi}%`)
      }
    }
    return parts.join('、')
  }, [allPicked, picks, enhanceId, slot, recipe, reqList])

  const doCraftElement = () => {
    if (!allPicked) return
    craftElement(slot, recipeIdx, picks as string[], enhanceId, suffixId)
    setPicks(Array(reqList.length).fill(null))
    setEnhanceId(null)
    setSuffixId(null)
  }

  // ── 候選素材（picker 用）──
  const candidates = useMemo(() => {
    if (!picker) return []
    return [...owned.keys()]
      .map((id) => MATERIALS[id])
      .filter((m) => {
        if (picker.kind === 'element')
          // 全元素百搭素材（尾巴結🌀）哪個元素格都能放
          return m.kind === 'element' && (m.element === picker.element || m.anyElement === true)
        if (picker.kind === 'enhance') return m.kind === 'enhance'
        return m.kind === 'white'
      })
      .filter((m) => available(m.id) > 0)
      .sort((a, b) => RARITY_SCORE[a.rarity] - RARITY_SCORE[b.rarity])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [picker, owned, used])

  const whiteStacks = [...owned.keys()]
    .map((id) => MATERIALS[id])
    .filter((m) => m.kind === 'white')

  const ELEMENT_NAME: Record<Element, string> = {
    metal: '金',
    wood: '木',
    water: '水',
    fire: '火',
    wind: '風',
  }

  return (
    <div className="mt-3">
      {/* ── 裝備中（四格制）── */}
      <h2 className="text-sm font-black text-[#7A5C3D]">🧍 裝備中（點擊卸下）</h2>
      <div className="mt-2 grid grid-cols-4 gap-1.5">
        {SLOT_ORDER.map((s) => {
          const eq = equipped[s]
          return (
            <button
              key={s}
              onClick={() => eq && unequip(s)}
              className="flex flex-col items-center rounded-xl border-2 border-[#EFE3CC] bg-white p-2 active:scale-95"
            >
              <span className="text-[9px] font-bold text-[#B8A488]">
                {SLOT_INFO[s].emoji} {SLOT_INFO[s].name}
              </span>
              {eq ? (
                <>
                  <span className="mt-0.5 text-xl leading-none">{eq.emoji}</span>
                  <span className="w-full truncate text-center text-[8px] text-[#7A6850]">
                    {eq.name}
                  </span>
                </>
              ) : (
                <span className="mt-1 text-xs text-[#D8CBB4]">（空）</span>
              )}
            </button>
          )
        })}
      </div>

      {/* ── 合成分流 tabs（GDD §7.1.1）── */}
      <div className="mt-4 flex gap-1.5">
        <button
          onClick={() => setTab('element')}
          className={`flex-1 rounded-xl py-2 text-xs font-black ${
            tab === 'element' ? 'bg-[#7A5C3D] text-white' : 'bg-white text-[#7A6850]'
          }`}
        >
          🎨 元素合成（跟職業走）
        </button>
        <button
          onClick={() => setTab('white')}
          className={`flex-1 rounded-xl py-2 text-xs font-black ${
            tab === 'white' ? 'bg-[#7A5C3D] text-white' : 'bg-white text-[#7A6850]'
          }`}
        >
          🤍 白色合成（憑運氣）
        </button>
      </div>

      {tab === 'element' ? (
        <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
          {/* 做哪一格 */}
          <div className="flex gap-1.5">
            {SLOT_ORDER.map((s) => (
              <button
                key={s}
                onClick={() => selectSlot(s)}
                className={`flex-1 rounded-xl py-1.5 text-[11px] font-bold ${
                  slot === s ? 'bg-[#F5A623] text-white' : 'bg-[#FFF4DC] text-[#7A6850]'
                }`}
              >
                {SLOT_INFO[s].emoji}
                {SLOT_INFO[s].name}
              </button>
            ))}
          </div>
          {/* 配方變體選擇（v2：水替換版） */}
          {variants.length > 1 && (
            <div className="mt-2 flex gap-1.5">
              {variants.map((v, i) => (
                <button
                  key={i}
                  onClick={() => selectVariant(i)}
                  className={`flex-1 rounded-xl border-2 py-1.5 text-[11px] font-bold ${
                    recipeIdx === i
                      ? 'border-[#4A9FE8] bg-[#EAF4FD] text-[#33658A]'
                      : 'border-[#EFE3CC] bg-white text-[#A08A6F]'
                  }`}
                >
                  {v.emoji} {v.name}
                  {v.waterReplace && (
                    <span className="block text-[9px] font-bold text-[#4A9FE8]">
                      ATK略低，換🩸吸血
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}
          <div className="mt-2 text-center text-xs font-black text-[#5C4A36]">
            {recipe.emoji} {recipe.name}
            <span className="ml-1 font-bold text-[#B8A488]">（roll {SLOT_INFO[slot].rollDesc}）</span>
          </div>

          {/* 配方素材格 */}
          <div className="mt-2 flex flex-wrap justify-center gap-1.5">
            {reqList.map((el, i) => {
              const id = picks[i]
              return (
                <button
                  key={i}
                  onClick={() => setPicker({ kind: 'element', element: el, index: i })}
                  className={`flex h-16 w-16 flex-col items-center justify-center rounded-xl border-2 border-dashed p-1 active:scale-95 ${
                    id ? 'border-[#6FBF73] bg-[#F2FAEF]' : 'border-[#E0D3B8] bg-[#FFFBF0]'
                  }`}
                >
                  {id ? (
                    <>
                      <span className="text-base leading-none">{materialEmoji(MATERIALS[id])}</span>
                      <span className="w-full truncate text-center text-[8px] text-[#7A6850]">
                        {MATERIALS[id].name}
                      </span>
                    </>
                  ) : (
                    <>
                      <span className="text-base">➕</span>
                      <span className="text-[9px] font-bold text-[#B8A488]">
                        {ELEMENT_NAME[el]}元素
                      </span>
                    </>
                  )}
                </button>
              )
            })}
          </div>

          {/* 可選：強化素材＋白素材小字 */}
          <div className="mt-2 flex justify-center gap-1.5">
            <button
              onClick={() => setPicker({ kind: 'enhance' })}
              className={`flex h-14 flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed p-1 active:scale-95 ${
                enhanceId ? 'border-[#F5A623] bg-[#FFF8E8]' : 'border-[#EFE3CC] bg-[#FFFBF0]'
              }`}
            >
              <span className="text-sm">{enhanceId ? '✨' : '＋'}</span>
              <span className="w-full truncate text-[9px] font-bold text-[#B8A488]">
                {enhanceId ? MATERIALS[enhanceId].name : '強化素材（選配，凹下限）'}
              </span>
            </button>
            <button
              onClick={() => setPicker({ kind: 'suffix' })}
              className={`flex h-14 flex-1 flex-col items-center justify-center rounded-xl border-2 border-dashed p-1 active:scale-95 ${
                suffixId ? 'border-[#B89BD8] bg-[#F7F2FC]' : 'border-[#EFE3CC] bg-[#FFFBF0]'
              }`}
            >
              <span className="text-sm">{suffixId ? '🤍' : '＋'}</span>
              <span className="w-full truncate text-[9px] font-bold text-[#B8A488]">
                {suffixId ? MATERIALS[suffixId].name : '白素材（選配，掛搞笑小字）'}
              </span>
            </button>
          </div>

          {(enhanceId || suffixId) && (
            <div className="mt-1 text-center">
              <button
                onClick={() => {
                  setEnhanceId(null)
                  setSuffixId(null)
                }}
                className="text-[10px] text-[#B8A488] underline"
              >
                清掉選配素材
              </button>
            </div>
          )}

          {preview && (
            <div className="mt-2 rounded-lg bg-[#FFF4DC] p-2 text-center text-[11px] font-bold text-[#B8862F]">
              🎰 開獎範圍：{preview}
            </div>
          )}

          <button
            disabled={!allPicked}
            onClick={doCraftElement}
            className="mt-2 w-full rounded-xl bg-[#E8604A] p-3 text-sm font-black text-white active:scale-95 disabled:opacity-40"
          >
            合成開獎！🎰
          </button>
        </div>
      ) : (
        <div className="mt-3 rounded-2xl bg-white p-3 shadow-sm">
          <div className="text-center text-[11px] font-bold text-[#B8A488]">
            丟 2~3 個白素材亂合，看會出什麼鬼東西。
          </div>
          <button
            onClick={() => setCodexOpen(true)}
            className="mt-1.5 flex w-full items-center justify-center gap-2 rounded-xl bg-[#FFF4DC] p-2 text-[11px] font-black text-[#B8862F] active:scale-95"
          >
            📖 白裝配方圖鑑　已發現 {discovered.length} / {HIDDEN_RECIPES.length}
          </button>

          {/* 已選 */}
          <div className="mt-2 flex min-h-12 flex-wrap justify-center gap-1.5">
            {whitePicks.map((id, i) => (
              <button
                key={i}
                onClick={() => setWhitePicks(whitePicks.filter((_, j) => j !== i))}
                className="flex items-center gap-1 rounded-full bg-[#F0EDE6] px-2 py-1 text-[10px] font-bold text-[#7A6850] active:scale-95"
              >
                🤍 {MATERIALS[id].name} ✕
              </button>
            ))}
            {whitePicks.length === 0 && (
              <span className="self-center text-[11px] text-[#D8CBB4]">（還沒選素材）</span>
            )}
          </div>

          {/* 白素材清單 */}
          <div className="mt-2 grid grid-cols-2 gap-1.5">
            {whiteStacks.map((m) => (
              <button
                key={m.id}
                disabled={available(m.id) <= 0 || whitePicks.length >= 3}
                onClick={() => setWhitePicks([...whitePicks, m.id])}
                className="flex items-center gap-1.5 rounded-xl bg-[#FFFBF0] p-2 text-left text-[10px] font-bold text-[#7A6850] active:scale-95 disabled:opacity-40"
              >
                <span>🤍</span>
                <span className="min-w-0 flex-1 truncate">{m.name}</span>
                <span className="text-[#B8A488]">×{available(m.id)}</span>
                {m.rarity !== 'common' && (
                  <span
                    className="rounded-full px-1 text-[8px] text-white"
                    style={{ background: RARITY_INFO[m.rarity].color }}
                  >
                    {RARITY_INFO[m.rarity].name}
                  </span>
                )}
              </button>
            ))}
            {whiteStacks.length === 0 && (
              <p className="col-span-2 text-center text-xs text-[#A08A6F]">
                沒有白素材了！怪物們等著送你。
              </p>
            )}
          </div>

          <button
            disabled={whitePicks.length < 2}
            onClick={() => {
              craftWhite(whitePicks)
              setWhitePicks([])
            }}
            className="mt-2 w-full rounded-xl bg-[#8A8070] p-3 text-sm font-black text-white active:scale-95 disabled:opacity-40"
          >
            亂合開獎！🤪
          </button>

          {/* 幸運道具（GDD §8.4：飾品專屬、單層覆蓋） */}
          <div className="mt-4 border-t-2 border-dashed border-[#EFE3CC] pt-2">
            <div className="text-center text-[11px] font-black text-[#3E7A42]">
              🍀 幸運道具（附在飾品上，限時透明，重複用會覆蓋）
            </div>
            {character.luckyBuff && (
              <div className="mt-1 text-center text-[10px] font-bold text-[#3E7A42]">
                目前：稀有掉率 +{character.luckyBuff.bonusPct}%，剩{' '}
                {character.luckyBuff.battlesLeft} 場
              </div>
            )}
            {LUCKY_RECIPES.map((r, ri) => {
              const eligible = whiteStacks.filter(
                (m) => m.rarity === r.rarity && (owned.get(m.id) ?? 0) >= r.cost,
              )
              return (
                <div key={ri} className="mt-1.5">
                  <div className="text-[10px] font-bold text-[#A08A6F]">
                    {r.label} → 稀有掉率 +{r.bonusPct}%（{r.battles} 場）
                  </div>
                  <div className="mt-0.5 flex flex-wrap gap-1">
                    {eligible.map((m) => (
                      <button
                        key={m.id}
                        onClick={() => craftLucky(m.id, ri)}
                        className="rounded-full bg-[#EAF6E3] px-2 py-1 text-[10px] font-bold text-[#3E7A42] active:scale-95"
                      >
                        用 {m.name} ×{r.cost} 🍀
                      </button>
                    ))}
                    {eligible.length === 0 && (
                      <span className="text-[10px] text-[#D8CBB4]">（素材不夠）</span>
                    )}
                  </div>
                </div>
              )
            })}
          </div>

          {/* 🧪 藥水（GDD §7.9：白素材的又一個去處，續航手段）*/}
          <div className="mt-4 border-t-2 border-dashed border-[#EFE3CC] pt-2">
            <div className="text-center text-[11px] font-black text-[#B5503E]">
              🧪 藥水（白素材製，戰前喝、續航用）
            </div>
            <div className="mt-1.5 space-y-1.5">
              {POTION_ORDER.map((pid) => {
                const def = POTIONS[pid]
                const owned = character.potions[pid] ?? 0
                return (
                  <div
                    key={pid}
                    className="flex items-center gap-2 rounded-xl bg-[#FFFBF0] p-2"
                  >
                    <span className="text-lg">{def.emoji}</span>
                    <div className="min-w-0 flex-1">
                      <div className="text-[11px] font-bold text-[#5C4A36]">
                        {def.name}
                        <span className="ml-1 text-[10px] font-normal text-[#A08A6F]">
                          持有 {owned}
                        </span>
                      </div>
                      <div className="text-[9px] leading-tight text-[#A08A6F]">{def.desc}</div>
                    </div>
                    <button
                      onClick={() => craftPotion(pid)}
                      className="shrink-0 rounded-full bg-[#E8604A] px-2.5 py-1 text-[10px] font-black text-white active:scale-95"
                    >
                      做（白×{def.whiteCost}）
                    </button>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* ── 素材選擇器 ── */}
      {picker && (
        <Modal onClose={() => setPicker(null)}>
          <h3 className="text-center text-sm font-black text-[#5C4A36]">
            {picker.kind === 'element'
              ? `選一個${ELEMENT_NAME[picker.element]}元素素材`
              : picker.kind === 'enhance'
                ? '選一個強化素材（凹 roll 下限）'
                : '選一個白素材（掛搞笑小字）'}
          </h3>
          <div className="mt-2 space-y-1.5">
            {candidates.length === 0 && (
              <p className="text-center text-xs text-[#A08A6F]">
                {picker.kind === 'element'
                  ? '沒有這種元素的素材…去對應樓層農，或商店買！'
                  : picker.kind === 'enhance'
                    ? '沒有強化素材…商店有賣「閃閃發亮的研磨粉」！'
                    : '沒有白素材…打怪幾乎都會掉！'}
              </p>
            )}
            {candidates.map((m) => (
              <button
                key={m.id}
                onClick={() => {
                  if (picker.kind === 'element') {
                    const next = [...picks]
                    next[picker.index] = m.id
                    setPicks(next)
                  } else if (picker.kind === 'enhance') setEnhanceId(m.id)
                  else setSuffixId(m.id)
                  setPicker(null)
                }}
                className="flex w-full items-center gap-2 rounded-xl bg-[#FFF4DC] p-2.5 text-xs font-bold text-[#5C4A36] active:scale-95"
              >
                <span>{materialEmoji(m)}</span>
                <span className="min-w-0 flex-1 truncate text-left">{m.name}</span>
                <span className="text-[#B8A488]">×{available(m.id)}</span>
                <span
                  className="rounded-full px-1.5 text-[10px] text-white"
                  style={{ background: RARITY_INFO[m.rarity].color }}
                >
                  {RARITY_INFO[m.rarity].name}
                </span>
              </button>
            ))}
          </div>
          <button
            onClick={() => setPicker(null)}
            className="mt-3 w-full rounded-xl bg-[#EFE3CC] p-2.5 text-xs font-bold text-[#7A6850] active:scale-95"
          >
            取消
          </button>
        </Modal>
      )}

      {/* ── 開獎結果 ── */}
      {lastCrafted && (
        <Modal onClose={clearCrafted}>
          {lastCrafted.hiddenRecipeId && (
            <div className="pop-in mb-2 rounded-xl bg-gradient-to-r from-[#FFE9A8] to-[#FFD4E0] p-2 text-center text-sm font-black text-[#B8602F]">
              ✨ 發現隱藏白配方！✨
            </div>
          )}
          <EquipmentCard eq={lastCrafted.equipment} />
          <button
            onClick={clearCrafted}
            className="mt-3 w-full rounded-xl bg-[#F5A623] p-2.5 text-sm font-black text-white active:scale-95"
          >
            {lastCrafted.hiddenRecipeId ? '太神奇了吧！！' : '收下！'}
          </button>
        </Modal>
      )}

      {/* ── 白裝配方圖鑑（GDD §7.8.6）── */}
      {codexOpen && <Codex onClose={() => setCodexOpen(false)} />}
    </div>
  )
}
