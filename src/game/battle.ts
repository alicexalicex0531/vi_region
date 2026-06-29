import type { BattleTurn, Character, Equipment, EquipSlot } from '../types'
import { CLASSES } from '../data/classes'
import { HAPPY_MEAL } from '../data/equipment'
import {
  ATK_POTION_VALUE,
  DEF_POTION_VALUE,
  HEAL_PCT,
  HEAL_TRIGGER_PCT,
  POTION_BUFF_ROUNDS,
} from '../data/potions'

export type Equipped = Record<EquipSlot, Equipment | null>

export interface PlayerStats {
  maxHp: number
  baseAtk: number
  baseDef: number
  mainStat: number
  totalDef: number
  lifestealPct: number
  regen: number // 防具詞綴每回合回血（GDD §7.10）
  happyMeal: boolean // 快樂套餐：四格全白
}

// GDD §4：等級成長 + 裝備加成
export function getPlayerStats(char: Character, equipped: Equipped): PlayerStats {
  const c = CLASSES[char.classId]
  const lv = char.level - 1
  const gear = Object.values(equipped).filter((e): e is Equipment => e !== null)

  const mainStat =
    c.baseMain + c.mainPerLevel * lv + gear.reduce((s, e) => s + (e.mainStat ?? 0), 0)
  const baseAtk = c.baseAtk + c.atkPerLevel * lv + (equipped.mainHand?.atk ?? 0)
  const baseDef = Math.floor(c.baseDef + c.defPerLevel * lv) + (equipped.offHand?.def ?? 0)

  // 快樂套餐：主手+副手+防具+飾品四格全白（GDD §7.8.4）
  const happyMeal = gear.length === 4 && gear.every((e) => e.isWhite)
  let maxHp = c.baseHp + c.hpPerLevel * lv + (equipped.armor?.hp ?? 0)
  if (happyMeal) maxHp = Math.floor(maxHp * HAPPY_MEAL.hpMult)

  return {
    maxHp,
    baseAtk,
    baseDef,
    mainStat,
    totalDef: Math.floor(mainStat * c.defCoef + baseDef),
    lifestealPct: equipped.mainHand?.lifestealPct ?? 0,
    regen: equipped.armor?.regen ?? 0,
    happyMeal,
  }
}

// GDD §2.1：Crit 每刀 [1.5, 2.0] 純隨機，玩家與怪物對稱，永不受裝備影響
const rollCrit = () => 1.5 + Math.random() * 0.5

// 戰前武裝的藥水 buff（GDD §7.9）
export interface BattleBuffs {
  atk: number // 攻擊藥水加成（0 = 未用）
  def: number // 防禦藥水加成
  rounds: number // 攻/防 buff 持續回合
  heals: number // 帶入的補血藥水數量
}

export interface SimResult {
  victory: boolean
  turns: BattleTurn[]
  healsUsed: number // 實際消耗的補血藥水（回存扣數）
}

// 回合制，雙方每回合互打一次，角色先手（GDD §2.2）
// combat：怪物實際戰鬥數值（菁英怪 ×2.5 由呼叫端先算好傳入）
// buffs：戰前武裝的藥水（攻/防限前 N 回合、同種不疊；補血快沒血時自動灌）
export function simulateBattle(
  char: Character,
  equipped: Equipped,
  combat: { hp: number; atk: number },
  buffs: BattleBuffs,
): SimResult {
  const c = CLASSES[char.classId]
  const stats = getPlayerStats(char, equipped)
  let playerHp = stats.maxHp
  let monsterHp = combat.hp
  let healsLeft = buffs.heals
  const healAmount = Math.floor((stats.maxHp * HEAL_PCT) / 100)
  const healThreshold = (stats.maxHp * HEAL_TRIGGER_PCT) / 100
  const turns: BattleTurn[] = []

  for (let round = 1; round <= 99; round++) {
    const buffOn = round <= buffs.rounds
    const atkBonus = buffOn ? buffs.atk : 0
    const defBonus = buffOn ? buffs.def : 0
    const atkLeft = Math.max(0, buffs.atk > 0 ? buffs.rounds - round + 1 : 0)
    const defLeft = Math.max(0, buffs.def > 0 ? buffs.rounds - round + 1 : 0)

    // 角色攻擊：總攻擊 = Crit × (主屬性 × 職業係數 + 基礎ATK[+攻擊藥水])，怪物無防禦
    const pCrit = rollCrit()
    const pDmg = Math.max(
      1,
      Math.round(pCrit * (stats.mainStat * c.atkCoef + stats.baseAtk + atkBonus)),
    )
    monsterHp = Math.max(0, monsterHp - pDmg)

    // 吸血：回復 = 該次造成傷害 × 吸血%，攻擊後立即回血（GDD §2.1）
    let heal = 0
    if (stats.lifestealPct > 0 && playerHp < stats.maxHp) {
      heal = Math.min(stats.maxHp - playerHp, Math.floor((pDmg * stats.lifestealPct) / 100))
      playerHp += heal
    }
    turns.push({
      round,
      side: 'player',
      dmg: pDmg,
      crit: pCrit,
      hpAfter: monsterHp,
      ...(heal > 0 ? { heal } : {}),
      atkLeft,
      defLeft,
      healsLeft,
    })
    if (monsterHp <= 0) return { victory: true, turns, healsUsed: buffs.heals - healsLeft }

    // 怪物反擊：max(0, 怪物ATK × Crit − 角色總防禦[+防禦藥水])
    // ⚠️ 用「真實血量 hp（可為負）」結算，不先 clamp 成 0，
    //    否則溢殺傷害會被吞掉 → 喝藥水變假不死（vi 回報的 bug）
    const mCrit = rollCrit()
    const mDmg = Math.max(0, Math.round(combat.atk * mCrit) - (stats.totalDef + defBonus))
    let hp = playerHp - mDmg

    // 防具詞綴每回合固定回（活著才回，與傷害無關，GDD §7.10）
    let regenHeal = 0
    if (stats.regen > 0 && hp > 0 && hp < stats.maxHp) {
      regenHeal = Math.min(stats.maxHp - hp, stats.regen)
      hp += regenHeal
    }

    // 補血藥水：血量危險（≤35% 或被打到 0 以下）時自動灌一罐（GDD §7.9）
    // 從真實 hp 加血 → 溢殺太大（這罐補完仍 ≤0）就救不回來，且不浪費藥水（留著也死了）
    let potionHeal = 0
    if (healsLeft > 0 && hp <= healThreshold && hp + healAmount > 0) {
      healsLeft--
      const beforeClamped = Math.max(0, hp)
      hp = Math.min(stats.maxHp, hp + healAmount)
      potionHeal = hp - beforeClamped
    }

    playerHp = Math.max(0, hp)
    turns.push({
      round,
      side: 'monster',
      dmg: mDmg,
      crit: mCrit,
      hpAfter: playerHp,
      ...(regenHeal > 0 ? { regen: regenHeal } : {}),
      ...(potionHeal > 0 ? { potionHeal } : {}),
      atkLeft,
      defLeft,
      healsLeft,
    })
    if (playerHp <= 0) return { victory: false, turns, healsUsed: buffs.heals - healsLeft }
  }
  // 理論上到不了這裡（玩家每刀至少 1 傷害）
  return { victory: false, turns, healsUsed: buffs.heals - healsLeft }
}

// 由武裝旗標組出實際 buff 數值（同種不疊：就是固定值；攻防可共存）
export function buildBattleBuffs(armed: {
  attack: boolean
  defense: boolean
  heal: boolean
}, healCount: number): BattleBuffs {
  return {
    atk: armed.attack ? ATK_POTION_VALUE : 0,
    def: armed.defense ? DEF_POTION_VALUE : 0,
    rounds: POTION_BUFF_ROUNDS,
    heals: armed.heal ? healCount : 0,
  }
}
