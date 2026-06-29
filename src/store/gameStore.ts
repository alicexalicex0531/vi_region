import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type {
  ArmedPotions,
  BagItem,
  BattleResult,
  Character,
  ClassId,
  Equipment,
  EquipSlot,
} from '../types'
import { expToNext, MAX_LEVEL } from '../data/classes'
import { ELITE, MONSTERS, MONSTER_BY_ID, monsterCombatStats } from '../data/monsters'
import { MATERIALS, sellPrice, SHOP_STOCK } from '../data/materials'
import { ELEMENT_RECIPES, HIDDEN_RECIPES, LUCKY_RECIPES } from '../data/equipment'
import { POTIONS, type PotionId } from '../data/potions'
import { buildBattleBuffs, getPlayerStats, simulateBattle, type Equipped } from '../game/battle'
import { FLOOR_GRID, pickFreeCell, TEMPLATE_POS } from '../components/dungeonLevels'
import {
  craftElementGear,
  craftWhiteGear,
  equipmentValue,
  makeGrandmaWeapon,
  makeStarterWeapon,
  soakWhiteWeapon,
} from '../game/craft'

export const GRANDMA_TITLE = '背包開始發臭' // GDD §7.8.7 全收集稱號

export type MonsterPos = { col: number; row: number }
const EMPTY_ARMED: ArmedPotions = { attack: false, defense: false, heal: false }

export const BACKPACK_INITIAL = 20
export const BACKPACK_MAX = 40
export const WAREHOUSE_SIZE = 30
export const STACK_MAX = 99
export const MAX_CHARACTERS = 9 // GDD §3.2

const EMPTY_EQUIPPED: Equipped = { mainHand: null, offHand: null, armor: null, accessory: null }

// 一隻角色的完整存檔（GDD §3.2 多角色；倉庫與配方手冊跨角色共用）
export interface CharacterSlot {
  character: Character
  backpack: BagItem[]
  backpackSize: number
  equipped: Equipped
  respawns: Record<string, number>
  elites: Record<string, boolean>
}

interface GameState {
  // ── 多角色（GDD §3.2）：roster 存全部角色，下面的單數欄位是「目前操作中」的工作副本 ──
  roster: CharacterSlot[]
  activeIndex: number | null // null = 在選角畫面
  creatingNew: boolean // 從選角畫面進入建角流程（不持久化）

  character: Character | null
  backpack: BagItem[]
  backpackSize: number
  warehouse: BagItem[]
  equipped: Equipped
  respawns: Record<string, number>
  elites: Record<string, boolean> // 重生成菁英的怪（紫名，不打死不消失）
  discovered: string[] // 已發現的隱藏白配方 id（全角色共用，GDD §7.8.6 圖鑑）
  grandmaClaimed: boolean // 全收集 18/18 的「阿嬤的怒吼」是否已發放（GDD §7.8.7）
  battle: BattleResult | null
  notice: string | null // 短暫提示（背包滿了之類）
  lastCrafted: { equipment: Equipment; hiddenRecipeId: string | null } | null // 合成開獎結果
  armed: ArmedPotions // 戰前武裝的藥水（工作狀態，不持久化）
  positions: Record<string, MonsterPos> // 怪物現位置覆寫（隨機重生用，不持久化）

  createCharacter: (classId: ClassId, name: string) => void
  startCreate: () => void
  cancelCreate: () => void
  enterCharacter: (index: number) => void
  exitToSelect: () => void
  deleteSlot: (index: number) => void
  fight: (monsterId: string) => void
  closeBattle: () => void
  clearNotice: () => void
  clearCrafted: () => void
  discardItem: (bagIndex: number, count: number) => void
  equip: (bagIndex: number) => void
  unequip: (slot: EquipSlot) => void
  craftElement: (
    slot: EquipSlot,
    recipeIndex: number,
    materialIds: string[],
    enhanceId: string | null,
    whiteId: string | null,
  ) => void
  craftWhite: (materialIds: string[]) => void
  soak: (bagIndex: number, waterId: string) => void
  craftLucky: (materialId: string, recipeIndex: number) => void
  craftPotion: (potionId: PotionId) => void
  toggleArm: (which: keyof ArmedPotions) => void
  relocateRevived: () => void // 重生倒數結束 → 跳隨機空格（GDD §12.1 v0.7）
  sellItem: (bagIndex: number, count: number) => void
  buyMaterial: (materialId: string) => void
  upgradeBackpack: () => void
  moveToWarehouse: (bagIndex: number) => void
  takeFromWarehouse: (whIndex: number) => void
}

// ── 背包/倉庫工具 ──

// 不可賣/不可丟的保護道具（GDD §7.8.7：阿嬤的怒吼全收集才一把、賣丟即永久失去）
function isProtectedItem(it: BagItem): boolean {
  return it.type === 'equipment' && it.equipment.special === 'grandma_duster'
}

function countMaterial(bag: BagItem[], materialId: string): number {
  return bag.reduce(
    (n, it) => n + (it.type === 'material' && it.materialId === materialId ? it.count : 0),
    0,
  )
}

// 消耗素材（ids 可重複），不夠回傳 null
function consumeMaterials(bag: BagItem[], ids: string[]): BagItem[] | null {
  const need = new Map<string, number>()
  for (const id of ids) need.set(id, (need.get(id) ?? 0) + 1)
  for (const [id, n] of need) if (countMaterial(bag, id) < n) return null

  const next: BagItem[] = bag.map((it) => (it.type === 'material' ? { ...it } : it))
  for (const [id, n] of need) {
    let remaining = n
    for (const it of next) {
      if (remaining <= 0) break
      if (it.type !== 'material' || it.materialId !== id) continue
      const take = Math.min(remaining, it.count)
      it.count -= take
      remaining -= take
    }
  }
  return next.filter((it) => it.type !== 'material' || it.count > 0)
}

// 加素材，回傳塞不下的部分
function addMaterials(
  bag: BagItem[],
  size: number,
  items: { materialId: string; count: number }[],
): { next: BagItem[]; lost: { materialId: string; count: number }[] } {
  const next: BagItem[] = bag.map((it) => (it.type === 'material' ? { ...it } : it))
  const lost: { materialId: string; count: number }[] = []
  for (const item of items) {
    let remaining = item.count
    for (const it of next) {
      if (remaining <= 0) break
      if (it.type !== 'material' || it.materialId !== item.materialId || it.count >= STACK_MAX)
        continue
      const add = Math.min(remaining, STACK_MAX - it.count)
      it.count += add
      remaining -= add
    }
    while (remaining > 0 && next.length < size) {
      const add = Math.min(remaining, STACK_MAX)
      next.push({ type: 'material', materialId: item.materialId, count: add })
      remaining -= add
    }
    if (remaining > 0) lost.push({ materialId: item.materialId, count: remaining })
  }
  return { next, lost }
}

// 把工作副本打包回 roster 用的快照
function snapshotActive(s: GameState): CharacterSlot {
  return {
    character: s.character!,
    backpack: s.backpack,
    backpackSize: s.backpackSize,
    equipped: s.equipped,
    respawns: s.respawns,
    elites: s.elites,
  }
}

// 把一隻角色載入成工作副本
function slotToState(slot: CharacterSlot) {
  return {
    character: slot.character,
    backpack: slot.backpack,
    backpackSize: slot.backpackSize,
    equipped: slot.equipped,
    respawns: slot.respawns,
    elites: slot.elites,
  }
}

export const useGameStore = create<GameState>()(
  persist(
    (set, get) => ({
      roster: [],
      activeIndex: null,
      creatingNew: false,
      character: null,
      backpack: [],
      backpackSize: BACKPACK_INITIAL,
      warehouse: [],
      equipped: { ...EMPTY_EQUIPPED },
      respawns: {},
      elites: {},
      discovered: [],
      grandmaClaimed: false,
      battle: null,
      notice: null,
      lastCrafted: null,
      armed: { ...EMPTY_ARMED },
      positions: {},

      createCharacter: (classId, name) => {
        const { roster } = get()
        if (roster.length >= MAX_CHARACTERS) {
          set({ notice: `冒險者宿舍滿了（${MAX_CHARACTERS} 隻）！先送走一位吧。`, creatingNew: false })
          return
        }
        const slot: CharacterSlot = {
          character: { name, classId, level: 1, exp: 0, deaths: 0, gold: 0, luckyBuff: null, potions: {} },
          backpack: [],
          backpackSize: BACKPACK_INITIAL,
          equipped: { ...EMPTY_EQUIPPED, mainHand: makeStarterWeapon(classId) }, // GDD §7.7 開局配給
          respawns: {},
          elites: {},
        }
        set({
          roster: [...roster, slot],
          activeIndex: roster.length,
          creatingNew: false,
          ...slotToState(slot),
          armed: { ...EMPTY_ARMED },
          positions: {},
          battle: null,
        })
      },

      startCreate: () => set({ creatingNew: true }),
      cancelCreate: () => set({ creatingNew: false }),

      enterCharacter: (index) => {
        const slot = get().roster[index]
        if (!slot) return
        set({ activeIndex: index, ...slotToState(slot), armed: { ...EMPTY_ARMED }, positions: {}, battle: null })
      },

      exitToSelect: () => {
        const s = get()
        const roster =
          s.activeIndex != null && s.character
            ? s.roster.map((slot, i) => (i === s.activeIndex ? snapshotActive(s) : slot))
            : s.roster
        set({
          roster,
          activeIndex: null,
          character: null,
          backpack: [],
          backpackSize: BACKPACK_INITIAL,
          equipped: { ...EMPTY_EQUIPPED },
          respawns: {},
          elites: {},
          armed: { ...EMPTY_ARMED },
          positions: {},
          battle: null,
        })
      },

      // 只在選角畫面呼叫（activeIndex 為 null 時）
      deleteSlot: (index) => set({ roster: get().roster.filter((_, i) => i !== index) }),

      fight: (monsterId) => {
        const { character, backpack, backpackSize, respawns, equipped, elites, armed } = get()
        const monster = MONSTER_BY_ID[monsterId]
        if (!character || !monster) return
        if ((respawns[monsterId] ?? 0) > Date.now()) return

        // 戰前武裝的藥水（GDD §7.9）：只在實際有持有時生效；補血帶入全部持有
        const ownedPotions = character.potions
        const useAtk = armed.attack && (ownedPotions.attack ?? 0) > 0
        const useDef = armed.defense && (ownedPotions.defense ?? 0) > 0
        const healCount = armed.heal ? (ownedPotions.heal ?? 0) : 0
        const buffs = buildBattleBuffs(
          { attack: useAtk, defense: useDef, heal: healCount > 0 },
          healCount,
        )

        // 菁英變體（v2）：數值 ×2.5、掉落判定 ×2、不打死不消失
        const isElite = !monster.isBoss && elites[monsterId] === true
        const combat = monsterCombatStats(monster, isElite)
        const sim = simulateBattle(character, equipped, combat, buffs)
        const stats = getPlayerStats(character, equipped)

        // 扣藥水：攻/防各消耗 1（若有武裝且持有）、補血扣實際喝掉的數量
        const nextPotions = { ...ownedPotions }
        if (useAtk) nextPotions.attack = (nextPotions.attack ?? 0) - 1
        if (useDef) nextPotions.defense = (nextPotions.defense ?? 0) - 1
        if (sim.healsUsed > 0) nextPotions.heal = (nextPotions.heal ?? 0) - sim.healsUsed
        const buffsSnapshot = { atkRounds: useAtk ? buffs.rounds : 0, defRounds: useDef ? buffs.rounds : 0, heals: healCount }

        // 幸運 buff：透明限時，每打一場扣一場（GDD §8.4）
        const buff = character.luckyBuff
        const nextBuff =
          buff && buff.battlesLeft > 1 ? { ...buff, battlesLeft: buff.battlesLeft - 1 } : null

        if (!sim.victory) {
          set({
            character: {
              ...character,
              deaths: character.deaths + 1,
              luckyBuff: nextBuff,
              potions: nextPotions,
            },
            armed: { ...EMPTY_ARMED },
            battle: {
              monsterId,
              isElite,
              victory: false,
              turns: sim.turns,
              playerMaxHp: stats.maxHp,
              buffs: buffsSnapshot,
              expGained: 0,
              drops: [],
              lostDrops: [],
            },
          })
          return
        }

        let level = character.level
        let exp = character.exp + combat.exp
        let levelUpTo: number | undefined
        while (level < MAX_LEVEL && exp >= expToNext(level)) {
          exp -= expToNext(level)
          level++
          levelUpTo = level
        }
        if (level >= MAX_LEVEL) exp = 0

        // 雙池掉落＋幸運/快樂套餐加成；菁英怪整張掉落表多判定一輪
        const luckyMult = buff ? 1 + buff.bonusPct / 100 : 1
        const whiteMult = stats.happyMeal ? 1.2 : 1
        const passes = isElite ? ELITE.dropRolls : 1
        const rolled = new Map<string, number>()
        for (let p = 0; p < passes; p++) {
          for (const d of monster.drops) {
            const m = MATERIALS[d.materialId]
            const isRarePool = m.kind === 'element' || m.rarity !== 'common'
            const chance = d.chance * (isRarePool ? luckyMult : whiteMult)
            if (Math.random() < chance) rolled.set(d.materialId, (rolled.get(d.materialId) ?? 0) + 1)
          }
        }
        let drops = [...rolled.entries()].map(([materialId, count]) => ({ materialId, count }))
        if (drops.length === 0) {
          const whites = monster.drops.filter((d) => d.chance >= 0.4)
          const pickD = whites[Math.floor(Math.random() * whites.length)] ?? monster.drops[0]
          drops = [{ materialId: pickD.materialId, count: 1 }]
        }

        const { next, lost } = addMaterials(backpack, backpackSize, drops)
        const kept = drops
          .map((d) => {
            const lostItem = lost.find((l) => l.materialId === d.materialId)
            return { ...d, count: d.count - (lostItem?.count ?? 0) }
          })
          .filter((d) => d.count > 0)

        set({
          character: { ...character, level, exp, luckyBuff: nextBuff, potions: nextPotions },
          armed: { ...EMPTY_ARMED },
          backpack: next,
          respawns: { ...respawns, [monsterId]: Date.now() + monster.respawnSec * 1000 },
          // 打死後，下一次重生擲骰決定是否變菁英（BOSS 不變）
          // v0.6 patch：同層菁英上限 1 隻——本層已有別隻菁英在龜時，只出普通怪，
          // 堵死「全層變菁英→無小怪可農→死局」（vi 14 條命換來的規則💀）
          elites: {
            ...elites,
            [monsterId]:
              !monster.isBoss &&
              !MONSTERS.some(
                (mm) => mm.floorId === monster.floorId && mm.id !== monsterId && elites[mm.id],
              ) &&
              Math.random() < ELITE.chance,
          },
          battle: {
            monsterId,
            isElite,
            victory: true,
            turns: sim.turns,
            playerMaxHp: stats.maxHp,
            buffs: buffsSnapshot,
            expGained: combat.exp,
            levelUpTo,
            drops: kept,
            lostDrops: lost,
          },
        })
      },

      closeBattle: () => set({ battle: null }),
      clearNotice: () => set({ notice: null }),
      clearCrafted: () => set({ lastCrafted: null }),

      discardItem: (bagIndex, count) => {
        const { backpack } = get()
        const it = backpack[bagIndex]
        if (!it) return
        if (isProtectedItem(it)) {
          set({ notice: '阿嬤的怒吼丟不得！阿嬤會生氣 👵' })
          return
        }
        if (it.type === 'equipment') {
          set({ backpack: backpack.filter((_, i) => i !== bagIndex) })
        } else {
          const next = backpack
            .map((s, i) =>
              i === bagIndex && s.type === 'material' ? { ...s, count: s.count - count } : s,
            )
            .filter((s) => s.type !== 'material' || s.count > 0)
          set({ backpack: next })
        }
      },

      equip: (bagIndex) => {
        const { backpack, equipped, character } = get()
        const it = backpack[bagIndex]
        if (!character || !it || it.type !== 'equipment') return
        const eq = it.equipment
        if (eq.classId && eq.classId !== character.classId) {
          set({ notice: '這是別職業的形態，先丟倉庫給未來的小號吧！' })
          return
        }
        const old = equipped[eq.slot]
        const next = backpack.filter((_, i) => i !== bagIndex)
        if (old) next.push({ type: 'equipment', equipment: old }) // 換下來的塞回空出的格
        set({ backpack: next, equipped: { ...equipped, [eq.slot]: eq } })
      },

      unequip: (slot) => {
        const { backpack, backpackSize, equipped } = get()
        const eq = equipped[slot]
        if (!eq) return
        if (backpack.length >= backpackSize) {
          set({ notice: '背包又滿了！清出一格才能卸裝。' })
          return
        }
        set({
          backpack: [...backpack, { type: 'equipment', equipment: eq }],
          equipped: { ...equipped, [slot]: null },
        })
      },

      craftElement: (slot, recipeIndex, materialIds, enhanceId, whiteId) => {
        const { character, backpack, backpackSize } = get()
        if (!character) return
        const recipe = ELEMENT_RECIPES[character.classId][slot][recipeIndex]
        if (!recipe) return
        const allIds = [...materialIds, ...(enhanceId ? [enhanceId] : []), ...(whiteId ? [whiteId] : [])]
        const consumed = consumeMaterials(backpack, allIds)
        if (!consumed) {
          set({ notice: '素材不夠！再去農一點～' })
          return
        }
        if (consumed.length >= backpackSize) {
          set({ notice: '背包又滿了！清出一格放成品再合成。' })
          return
        }
        const eq = craftElementGear(
          character.classId,
          slot,
          recipe,
          materialIds.map((id) => MATERIALS[id]),
          enhanceId ? MATERIALS[enhanceId] : null,
          whiteId ? MATERIALS[whiteId] : null,
        )
        set({
          backpack: [...consumed, { type: 'equipment', equipment: eq }],
          lastCrafted: { equipment: eq, hiddenRecipeId: null },
        })
      },

      craftWhite: (materialIds) => {
        const { backpack, backpackSize, discovered, grandmaClaimed, character } = get()
        const consumed = consumeMaterials(backpack, materialIds)
        if (!consumed) {
          set({ notice: '素材不夠！再去農一點～' })
          return
        }
        if (consumed.length >= backpackSize) {
          set({ notice: '背包又滿了！清出一格放成品再合成。' })
          return
        }
        const { equipment, hiddenRecipeId } = craftWhiteGear(materialIds.map((id) => MATERIALS[id]))
        const nextDiscovered =
          hiddenRecipeId && !discovered.includes(hiddenRecipeId)
            ? [...discovered, hiddenRecipeId]
            : discovered

        // 全收集獎勵（GDD §7.8.7）：18 組全發現 → 發稱號 + 阿嬤的怒吼（只發一次）
        let nextBag = [...consumed, { type: 'equipment' as const, equipment }]
        let claimed = grandmaClaimed
        let nextChar = character
        let notice: string | null = null
        if (!grandmaClaimed && nextDiscovered.length >= HIDDEN_RECIPES.length && character) {
          claimed = true
          nextChar = { ...character, title: GRANDMA_TITLE }
          // 阿嬤的怒吼塞進背包（剛放完白裝至少還有空間就放，否則之後可由設定補領）
          if (nextBag.length < backpackSize) {
            nextBag = [...nextBag, { type: 'equipment' as const, equipment: makeGrandmaWeapon() }]
          }
          notice = '📖 圖鑑全收集 18/18！獲得稱號「背包開始發臭」＋武器「阿嬤的怒吼」👵🪶'
        }

        set({
          backpack: nextBag,
          discovered: nextDiscovered,
          grandmaClaimed: claimed,
          character: nextChar,
          lastCrafted: { equipment, hiddenRecipeId },
          ...(notice ? { notice } : {}),
        })
      },

      soak: (bagIndex, waterId) => {
        const { backpack } = get()
        const it = backpack[bagIndex]
        if (!it || it.type !== 'equipment' || !it.equipment.isWhite || it.equipment.soaked) return
        if (it.equipment.slot !== 'mainHand') return
        const consumed = consumeMaterials(backpack, [waterId])
        if (!consumed) return
        // 消耗後 bagIndex 可能位移：用裝備 id 重新定位
        const idx = consumed.findIndex(
          (x) => x.type === 'equipment' && x.equipment.id === it.equipment.id,
        )
        if (idx < 0) return
        const soaked = soakWhiteWeapon(it.equipment, MATERIALS[waterId])
        const next = [...consumed]
        next[idx] = { type: 'equipment', equipment: soaked }
        set({ backpack: next, notice: `${soaked.name} 喝飽水了，吸血 ${soaked.lifestealPct}%！💧` })
      },

      craftLucky: (materialId, recipeIndex) => {
        const { character, backpack, equipped } = get()
        const recipe = LUCKY_RECIPES[recipeIndex]
        if (!character || !recipe) return
        if (!equipped.accessory) {
          set({ notice: '幸運 buff 要附在飾品上，先戴個飾品！💍' })
          return
        }
        const consumed = consumeMaterials(backpack, Array(recipe.cost).fill(materialId))
        if (!consumed) {
          set({ notice: '素材不夠！再去農一點～' })
          return
        }
        set({
          backpack: consumed,
          character: {
            ...character,
            luckyBuff: { bonusPct: recipe.bonusPct, battlesLeft: recipe.battles }, // 單層覆蓋
          },
          notice: `🍀 ${equipped.accessory.name} 暫時充滿了好運！（稀有掉率 +${recipe.bonusPct}%、${recipe.battles} 場）`,
        })
      },

      // 🧪 用白素材合成藥水（GDD §7.9；任選白素材，消耗 whiteCost 個）
      craftPotion: (potionId) => {
        const { character, backpack } = get()
        const def = POTIONS[potionId]
        if (!character || !def) return
        // 挑出背包裡的白素材，湊滿 whiteCost 個（任選，從數量多的先用）
        const whites = backpack.filter(
          (it) => it.type === 'material' && MATERIALS[it.materialId].kind === 'white',
        ) as Extract<BagItem, { type: 'material' }>[]
        const ids: string[] = []
        for (const stack of whites) {
          for (let i = 0; i < stack.count && ids.length < def.whiteCost; i++) ids.push(stack.materialId)
          if (ids.length >= def.whiteCost) break
        }
        if (ids.length < def.whiteCost) {
          set({ notice: `白素材不夠！做${def.name}要 ${def.whiteCost} 個白素材。` })
          return
        }
        const consumed = consumeMaterials(backpack, ids)
        if (!consumed) {
          set({ notice: '白素材不夠！再去農一點～' })
          return
        }
        set({
          backpack: consumed,
          character: {
            ...character,
            potions: { ...character.potions, [potionId]: (character.potions[potionId] ?? 0) + 1 },
          },
          notice: `${def.emoji} 做好一瓶${def.name}！`,
        })
      },

      // 戰前武裝/卸下藥水（持有 0 的不能武裝）
      toggleArm: (which) => {
        const { character, armed } = get()
        if (!character) return
        if ((character.potions[which] ?? 0) <= 0) {
          set({ notice: `沒有${POTIONS[which].name}，先去合成做幾瓶吧 🧪` })
          return
        }
        set({ armed: { ...armed, [which]: !armed[which] } })
      },

      // 重生倒數結束 → 復活並跳到隨機空格（GDD §12.1 v0.7；避開樹籬H/熔岩L/活怪佔位）
      relocateRevived: () => {
        const { respawns, positions } = get()
        const now = Date.now()
        const expired = Object.keys(respawns).filter((id) => respawns[id] <= now)
        if (expired.length === 0) return
        const nextRespawns = { ...respawns }
        const nextPositions = { ...positions }
        for (const id of expired) {
          delete nextRespawns[id]
          const m = MONSTER_BY_ID[id]
          if (!m || !FLOOR_GRID[m.floorId]) continue
          // 本層其他「活怪」佔用的格子（不含自己），活怪 = 不在重生名單
          const occupied = new Set<string>()
          for (const other of MONSTERS) {
            if (other.floorId !== m.floorId || other.id === id) continue
            if (nextRespawns[other.id] && nextRespawns[other.id] > now) continue // 死的不佔位
            const p = nextPositions[other.id] ?? TEMPLATE_POS[other.id]
            if (p) occupied.add(`${p.col},${p.row}`)
          }
          const cur = nextPositions[id] ?? TEMPLATE_POS[id]
          const spot = pickFreeCell(m.floorId, occupied, cur)
          if (spot) nextPositions[id] = spot
        }
        set({ respawns: nextRespawns, positions: nextPositions })
      },

      sellItem: (bagIndex, count) => {
        const { character, backpack } = get()
        const it = backpack[bagIndex]
        if (!character || !it) return
        if (isProtectedItem(it)) {
          set({ notice: '阿嬤的怒吼是非賣品！再窮也不能賣阿嬤 👵🪶' })
          return
        }
        if (it.type === 'equipment') {
          const gold = equipmentValue(it.equipment)
          set({
            backpack: backpack.filter((_, i) => i !== bagIndex),
            character: { ...character, gold: character.gold + gold },
            notice: `賣出 ${it.equipment.name}，+${gold} 金幣 💰`,
          })
        } else {
          const n = Math.min(count, it.count)
          const gold = sellPrice(MATERIALS[it.materialId]) * n
          const next = backpack
            .map((s, i) => (i === bagIndex && s.type === 'material' ? { ...s, count: s.count - n } : s))
            .filter((s) => s.type !== 'material' || s.count > 0)
          set({
            backpack: next,
            character: { ...character, gold: character.gold + gold },
            notice: `賣出 ${MATERIALS[it.materialId].name} ×${n}，+${gold} 金幣 💰`,
          })
        }
      },

      buyMaterial: (materialId) => {
        const { character, backpack, backpackSize } = get()
        const stock = SHOP_STOCK.find((s) => s.materialId === materialId)
        if (!character || !stock) return
        if (character.gold < stock.price) {
          set({ notice: '金幣不夠！白素材是很好的變現管道喔～' })
          return
        }
        const { next, lost } = addMaterials(backpack, backpackSize, [{ materialId, count: 1 }])
        if (lost.length > 0) {
          set({ notice: '背包又滿了！買了也沒地方放。' })
          return
        }
        set({
          backpack: next,
          character: { ...character, gold: character.gold - stock.price },
        })
      },

      upgradeBackpack: () => {
        const { character, backpackSize } = get()
        if (!character || backpackSize >= BACKPACK_MAX) return
        const cost = backpackUpgradeCost(backpackSize)
        if (character.gold < cost) {
          set({ notice: '金幣不夠！背包的擴建是很貴的～' })
          return
        }
        set({
          backpackSize: backpackSize + 2,
          character: { ...character, gold: character.gold - cost },
          notice: `背包擴大了！${backpackSize} → ${backpackSize + 2} 格 🎒`,
        })
      },

      moveToWarehouse: (bagIndex) => {
        const { backpack, warehouse } = get()
        const it = backpack[bagIndex]
        if (!it) return
        if (it.type === 'equipment') {
          if (warehouse.length >= WAREHOUSE_SIZE) {
            set({ notice: '倉庫也滿了！這個遊戲名不虛傳吧。' })
            return
          }
          set({
            backpack: backpack.filter((_, i) => i !== bagIndex),
            warehouse: [...warehouse, it],
          })
        } else {
          const { next, lost } = addMaterials(warehouse, WAREHOUSE_SIZE, [
            { materialId: it.materialId, count: it.count },
          ])
          if (lost.length === it.count) {
            set({ notice: '倉庫也滿了！這個遊戲名不虛傳吧。' })
            return
          }
          const moved = it.count - (lost[0]?.count ?? 0)
          const nextBag = backpack
            .map((s, i) =>
              i === bagIndex && s.type === 'material' ? { ...s, count: s.count - moved } : s,
            )
            .filter((s) => s.type !== 'material' || s.count > 0)
          set({ backpack: nextBag, warehouse: next })
        }
      },

      takeFromWarehouse: (whIndex) => {
        const { backpack, backpackSize, warehouse } = get()
        const it = warehouse[whIndex]
        if (!it) return
        if (it.type === 'equipment') {
          if (backpack.length >= backpackSize) {
            set({ notice: '背包又滿了！' })
            return
          }
          set({
            warehouse: warehouse.filter((_, i) => i !== whIndex),
            backpack: [...backpack, it],
          })
        } else {
          const { next, lost } = addMaterials(backpack, backpackSize, [
            { materialId: it.materialId, count: it.count },
          ])
          if (lost.length === it.count) {
            set({ notice: '背包又滿了！' })
            return
          }
          const moved = it.count - (lost[0]?.count ?? 0)
          const nextWh = warehouse
            .map((s, i) =>
              i === whIndex && s.type === 'material' ? { ...s, count: s.count - moved } : s,
            )
            .filter((s) => s.type !== 'material' || s.count > 0)
          set({ warehouse: nextWh, backpack: next })
        }
      },
    }),
    {
      name: 'backpack-dungeon-save',
      version: 6,
      migrate: (persisted: unknown, version: number) => {
        let s = persisted as Record<string, unknown>

        // v0→v2（Phase 1 → Phase 2）：加金幣/幸運欄位、素材堆改 BagItem、補發新手武器
        if (version < 2) {
          const oldChar = s.character as
            | { name: string; classId: ClassId; level: number; exp: number; deaths: number }
            | null
          const oldBackpack = (s.backpack as { materialId: string; count: number }[]) ?? []
          s = {
            character: oldChar ? { ...oldChar, gold: 0, luckyBuff: null } : null,
            backpack: oldBackpack.map((st) => ({ type: 'material' as const, ...st })),
            backpackSize: (s.backpackSize as number) ?? BACKPACK_INITIAL,
            warehouse: [],
            equipped: oldChar
              ? { ...EMPTY_EQUIPPED, mainHand: makeStarterWeapon(oldChar.classId) }
              : { ...EMPTY_EQUIPPED },
            respawns: (s.respawns as Record<string, number>) ?? {},
            elites: {},
            discovered: [],
          }
        }

        // v2→v3（多角色）：把現有角色包成 roster 的第一隻
        if (version < 3) {
          const hasChar = s.character != null
          s = {
            ...s,
            roster: hasChar
              ? [
                  {
                    character: s.character,
                    backpack: s.backpack ?? [],
                    backpackSize: s.backpackSize ?? BACKPACK_INITIAL,
                    equipped: s.equipped ?? { ...EMPTY_EQUIPPED },
                    respawns: s.respawns ?? {},
                    elites: s.elites ?? {},
                  },
                ]
              : [],
            activeIndex: hasChar ? 0 : null,
          }
        }

        // v3→v4（菁英上限 patch）：解救「全菁英卡死」的舊存檔——每層裁到最多 1 隻菁英
        if (version < 4) {
          const trim = (elites: Record<string, boolean> | undefined) => {
            if (!elites) return {}
            const keptPerFloor = new Set<string>()
            const out: Record<string, boolean> = {}
            for (const m of MONSTERS) {
              if (!elites[m.id] || m.isBoss) continue
              if (keptPerFloor.has(m.floorId)) continue // 該層已留 1 隻，其餘降回普通
              keptPerFloor.add(m.floorId)
              out[m.id] = true
            }
            return out
          }
          const roster = (s.roster as CharacterSlot[] | undefined) ?? []
          s = {
            ...s,
            roster: roster.map((slot) => ({ ...slot, elites: trim(slot.elites) })),
            elites: trim(s.elites as Record<string, boolean> | undefined),
          }
        }

        // v4→v5（藥水系統）：每個角色補上 potions 欄位（空持有）
        if (version < 5) {
          const addPotions = (ch: unknown) =>
            ch ? { potions: {}, ...(ch as Record<string, unknown>) } : ch
          const roster = (s.roster as CharacterSlot[] | undefined) ?? []
          s = {
            ...s,
            roster: roster.map((slot) => ({ ...slot, character: addPotions(slot.character) })),
            character: addPotions(s.character),
          }
        }

        // v5→v6（白裝圖鑑全收集獎勵）：補 grandmaClaimed 旗標
        if (version < 6) {
          s = { ...s, grandmaClaimed: (s.grandmaClaimed as boolean) ?? false }
        }
        return s as never
      },
      partialize: (state) => ({
        // 持久化前把工作副本同步回 roster，確保選角列表永遠是最新進度
        roster:
          state.activeIndex != null && state.character
            ? state.roster.map((slot, i) =>
                i === state.activeIndex ? snapshotActive(state) : slot,
              )
            : state.roster,
        activeIndex: state.activeIndex,
        character: state.character,
        backpack: state.backpack,
        backpackSize: state.backpackSize,
        warehouse: state.warehouse,
        equipped: state.equipped,
        respawns: state.respawns,
        elites: state.elites,
        discovered: state.discovered,
        grandmaClaimed: state.grandmaClaimed,
      }),
    },
  ),
)

export function backpackUpgradeCost(currentSize: number): number {
  // 20→22 要 100，之後每次 ×1.5（金幣遞增，GDD §10.1）
  const steps = (currentSize - BACKPACK_INITIAL) / 2
  return Math.round(100 * Math.pow(1.5, steps))
}
