// 🧪 藥水系統（GDD §7.9）——白素材的又一個去處，提供吸血以外的續航
// 數值為 v0.7 預設值（GDD 未定死，之後可調）；配方：任選白素材合成

export type PotionId = 'heal' | 'defense' | 'attack'

export interface PotionDef {
  id: PotionId
  name: string
  emoji: string
  color: string
  desc: string
  whiteCost: number // 合成消耗的白素材數（任選）
}

export const POTIONS: Record<PotionId, PotionDef> = {
  heal: {
    id: 'heal',
    name: '補血藥水',
    emoji: '🔴',
    color: '#E8604A',
    desc: '快沒血時自動灌，回復 30% 最大生命（百分比，後期不變廢）。可堆疊。',
    whiteCost: 2,
  },
  defense: {
    id: 'defense',
    name: '防禦藥水',
    emoji: '🔵',
    color: '#4A9FE8',
    desc: '本場 +12 DEF，最多 5 回合。可與攻擊藥水共存，同種不疊加。',
    whiteCost: 3,
  },
  attack: {
    id: 'attack',
    name: '攻擊藥水',
    emoji: '🟡',
    color: '#E8B33C',
    desc: '本場 +10 ATK，最多 5 回合。可與防禦藥水共存，同種不疊加。',
    whiteCost: 3,
  },
}

export const POTION_ORDER: PotionId[] = ['heal', 'defense', 'attack']

// 平衡數值（v0.7 預設）
export const HEAL_PCT = 30 // 補血藥水回 30% maxHP
export const HEAL_TRIGGER_PCT = 35 // HP 低於 35% 時自動灌（或將致死時）
export const DEF_POTION_VALUE = 12 // 防禦藥水 +DEF
export const ATK_POTION_VALUE = 10 // 攻擊藥水 +ATK
export const POTION_BUFF_ROUNDS = 5 // 攻/防 buff 最多 5 回合

// 回血防具詞綴帶到的機率（GDD §7.10；數值範圍見 equipment.ts 的 REGEN_TABLE，隨階抬升）
export const REGEN_CHANCE = 0.35
