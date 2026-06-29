export type ClassId = 'swordsman' | 'mage' | 'archer'
export type Element = 'metal' | 'wood' | 'water' | 'fire' | 'wind'
export type Rarity = 'common' | 'fine' | 'rare' | 'legendary'
export type MaterialKind = 'element' | 'white' | 'enhance'

export interface MaterialDef {
  id: string
  name: string
  kind: MaterialKind
  element?: Element
  anyElement?: boolean // 全元素百搭（解不開的尾巴結）：合成時可當任何元素
  rarity: Rarity
}

export interface DropEntry {
  materialId: string
  chance: number // 0~1
}

export interface MonsterDef {
  id: string
  name: string
  emoji: string
  color: string
  floorId: string
  hp: number
  atk: number
  exp: number
  respawnSec: number
  isBoss?: boolean
  drops: DropEntry[]
}

export interface FloorDef {
  id: string
  name: string
  emoji: string
  locked?: boolean
  lockedNote?: string
}

export interface ClassDef {
  id: ClassId
  name: string
  emoji: string
  mainStatName: string // STR / INT / DEX
  desc: string
  baseHp: number
  baseAtk: number
  baseDef: number
  baseMain: number
  hpPerLevel: number
  atkPerLevel: number
  defPerLevel: number
  mainPerLevel: number
  atkCoef: number // 主屬性 → 攻擊係數（本職）
  defCoef: number // 主屬性 → 防禦係數（本職）
}

// ── 裝備（GDD §7.2 四格制）──
export type EquipSlot = 'mainHand' | 'offHand' | 'armor' | 'accessory'

export interface Equipment {
  id: string
  slot: EquipSlot
  name: string
  emoji: string
  classId: ClassId | null // null = 通用（防具/飾品）
  isWhite: boolean
  tier: Rarity | null // 元素合成的平均稀有度階；白裝為 null
  atk?: number
  def?: number
  hp?: number
  mainStat?: number
  lifestealPct?: number // 吸血%（水元素武器 or 白武器泡水）
  regen?: number // 每回合固定回血（防具詞綴，GDD §7.10；穩定型續航）
  soaked?: boolean // 白武器只能泡一次水
  special?: 'grandma_duster' // 成就武器標記（阿嬤的怒吼，配戴召喚幻影阿嬤，GDD §7.8.7）
  suffixes: string[] // 裝飾小字（不影響數值）
}

export type BagItem =
  | { type: 'material'; materialId: string; count: number }
  | { type: 'equipment'; equipment: Equipment }

export interface LuckyBuff {
  bonusPct: number // 稀有掉率 +X%
  battlesLeft: number
}

export interface Character {
  name: string
  classId: ClassId
  level: number
  exp: number
  deaths: number
  gold: number
  luckyBuff: LuckyBuff | null
  potions: Record<string, number> // 藥水持有數（GDD §7.9，potionId → 數量）
  title?: string // 稱號（GDD §7.8.7 全收集 → 「背包開始發臭」）
}

// 戰前武裝的藥水（GDD §7.9：攻/防各一格可共存、補血自動灌）
export interface ArmedPotions {
  attack: boolean
  defense: boolean
  heal: boolean // 帶補血藥水入場（快沒血時自動灌）
}

export interface BattleTurn {
  round: number
  side: 'player' | 'monster'
  dmg: number
  crit: number
  hpAfter: number // 被打那一方剩餘 HP
  heal?: number // 吸血回復（玩家攻擊時）
  regen?: number // 防具詞綴每回合回血
  potionHeal?: number // 補血藥水自動灌
  atkLeft?: number // 此回合結束後攻擊 buff 剩餘回合（給狀態列）
  defLeft?: number // 此回合結束後防禦 buff 剩餘回合
  healsLeft?: number // 此回合結束後補血藥水剩餘數
}

export interface BattleBuffSnapshot {
  atkRounds: number // 攻擊 buff 起始回合數（0 = 未用）
  defRounds: number
  heals: number // 帶入的補血藥水數
}

export interface BattleResult {
  monsterId: string
  isElite: boolean
  victory: boolean
  turns: BattleTurn[]
  playerMaxHp: number
  buffs: BattleBuffSnapshot
  expGained: number
  levelUpTo?: number
  drops: { materialId: string; count: number }[]
  lostDrops: { materialId: string; count: number }[] // 背包又滿了！
}
