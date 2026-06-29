import type { ClassDef, ClassId, Element, Rarity } from '../types'

export const MAX_LEVEL = 30

// GDD §5.1：expToNext(level) = floor(100 × 1.4^(level-1))
export function expToNext(level: number): number {
  if (level >= MAX_LEVEL) return Infinity
  return Math.floor(100 * Math.pow(1.4, level - 1))
}

// GDD §3.1 起始屬性；每級成長與職業係數為原型平衡值，可隨時調
export const CLASSES: Record<ClassId, ClassDef> = {
  swordsman: {
    id: 'swordsman',
    name: '劍士',
    emoji: '⚔️',
    mainStatName: 'STR',
    desc: '高 HP 高 ATK，正面硬剛',
    baseHp: 100,
    baseAtk: 12,
    baseDef: 5,
    baseMain: 10,
    hpPerLevel: 12,
    atkPerLevel: 2,
    defPerLevel: 1,
    mainPerLevel: 3,
    atkCoef: 1.0,
    defCoef: 0.4,
  },
  mage: {
    id: 'mage',
    name: '法師',
    emoji: '🪄',
    mainStatName: 'INT',
    desc: '高爆發，未來靠水元素吸血續航',
    baseHp: 70,
    baseAtk: 14,
    baseDef: 2,
    baseMain: 12,
    hpPerLevel: 7,
    atkPerLevel: 3,
    defPerLevel: 0.5,
    mainPerLevel: 3,
    atkCoef: 1.2,
    defCoef: 0.2,
  },
  archer: {
    id: 'archer',
    name: '弓手',
    emoji: '🏹',
    mainStatName: 'DEX',
    desc: '均衡爆發，進可攻退可守',
    baseHp: 85,
    baseAtk: 13,
    baseDef: 3,
    baseMain: 11,
    hpPerLevel: 9,
    atkPerLevel: 2,
    defPerLevel: 0.8,
    mainPerLevel: 3,
    atkCoef: 1.1,
    defCoef: 0.3,
  },
}

export const ELEMENT_INFO: Record<Element, { name: string; emoji: string; color: string }> = {
  metal: { name: '金', emoji: '⚙️', color: '#D9A520' },
  wood: { name: '木', emoji: '🌿', color: '#5BA85A' },
  water: { name: '水', emoji: '💧', color: '#4A9FE8' },
  fire: { name: '火', emoji: '🔥', color: '#E8604A' },
  wind: { name: '風', emoji: '🌪️', color: '#5FC8B8' },
}

export const RARITY_INFO: Record<Rarity, { name: string; emoji: string; color: string }> = {
  common: { name: '普通', emoji: '⬜', color: '#9CA3AF' },
  fine: { name: '精良', emoji: '🟢', color: '#22C55E' },
  rare: { name: '稀有', emoji: '🔵', color: '#3B82F6' },
  legendary: { name: '傳說', emoji: '🟡', color: '#EAB308' },
}
