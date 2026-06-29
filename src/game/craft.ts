import type { ClassId, Element, Equipment, EquipSlot, MaterialDef, Rarity } from '../types'
import {
  type ElementRecipe,
  enhanceBoost,
  FAKE_STAT_LEXICON,
  HIDDEN_RECIPES,
  LIFESTEAL_RANGE,
  RARITY_SCORE,
  REGEN_TABLE,
  ROLL_TABLE,
  SOAK_RANGE,
  type StatKey,
  STARTER_WEAPONS,
  SUFFIX_LEXICON,
  TIER_PREFIX,
  tierFromScore,
  WATER_REPLACE_ATK_DELTA,
  WHITE_POOL,
} from '../data/equipment'
import { REGEN_CHANCE } from '../data/potions'

const randInt = (lo: number, hi: number) => lo + Math.floor(Math.random() * (hi - lo + 1))
const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)]
const uid = () => crypto.randomUUID()

// 在「該階範圍 [lo,hi]」內 roll，下限被強化素材推升 boost 點（GDD §7.3/§7.4/§7.6）
function rollInRange([lo, hi]: [number, number], boost: number): number {
  return randInt(Math.min(hi, lo + boost), hi)
}

// ── 元素合成（GDD §7.1：跟職業走、固定配方、只 roll 數值）──
export function craftElementGear(
  classId: ClassId,
  slot: EquipSlot,
  recipe: ElementRecipe,
  materials: MaterialDef[],
  enhance: MaterialDef | null,
  whiteExtra: MaterialDef | null,
): Equipment {
  const avgScore =
    materials.reduce((sum, m) => sum + RARITY_SCORE[m.rarity], 0) / materials.length
  const tier = tierFromScore(avgScore) // 平均稀有度 → 取最接近的階（GDD §7.4）
  const slotTable = ROLL_TABLE[slot]

  const eq: Equipment = {
    id: uid(),
    slot,
    name: TIER_PREFIX[tier] + recipe.name,
    emoji: recipe.emoji,
    classId: slot === 'armor' || slot === 'accessory' ? null : classId,
    isWhite: false,
    tier,
    suffixes: [],
  }
  // 取該階範圍 roll；水替換版主手的 ATK 比同階微降
  const rangeFor = (stat: StatKey): [number, number] | undefined => {
    const r = slotTable[stat]?.[tier]
    if (!r) return undefined
    if (stat === 'atk' && recipe.waterReplace) {
      return [r[0] + WATER_REPLACE_ATK_DELTA[0], r[1] + WATER_REPLACE_ATK_DELTA[1]]
    }
    return r
  }
  // v1.0 §7.6.2：強化素材下限加成＝max( ceil(普通範圍寬 × 百分比), 最少推升保證 )
  // 百分比基於「普通範圍」算（同格不論稀有度都用普通寬）→ 短範圍格三階看得出差別
  const boostFor = (stat: StatKey): number => {
    if (!enhance) return 0
    const commonR = slotTable[stat]?.common
    return commonR ? enhanceBoost(commonR, enhance.rarity) : 0
  }
  const atkR = rangeFor('atk')
  const defR = rangeFor('def')
  const hpR = rangeFor('hp')
  const mainR = rangeFor('mainStat')
  if (atkR) eq.atk = rollInRange(atkR, boostFor('atk'))
  if (defR) eq.def = rollInRange(defR, boostFor('def'))
  if (hpR) eq.hp = rollInRange(hpR, boostFor('hp'))
  if (mainR) eq.mainStat = rollInRange(mainR, boostFor('mainStat'))

  // 帶水元素的武器 → 永久吸血%，看「放在水格位」素材的稀有度（GDD §7.5）
  // 用配方格位對位判定 → 全元素百搭素材（尾巴結）放水格也算水
  if (slot === 'mainHand') {
    const reqElements: Element[] = []
    for (const [el, n] of Object.entries(recipe.cost)) {
      for (let i = 0; i < (n ?? 0); i++) reqElements.push(el as Element)
    }
    const waters = materials.filter((_, i) => reqElements[i] === 'water')
    if (waters.length > 0) {
      const best = waters.reduce((a, b) =>
        RARITY_SCORE[a.rarity] >= RARITY_SCORE[b.rarity] ? a : b,
      )
      const [lo, hi] = LIFESTEAL_RANGE[best.rarity]
      eq.lifestealPct = randInt(lo, hi)
    }
  }

  // 防具詞綴：有機率帶「每回合回 X 血」（GDD §7.10 穩定型續航，v0.9 數值隨階抬升）
  if (slot === 'armor' && Math.random() < REGEN_CHANCE) {
    const regenBoost = enhance ? enhanceBoost(REGEN_TABLE.common, enhance.rarity) : 0
    eq.regen = rollInRange(REGEN_TABLE[tier], regenBoost)
    eq.suffixes.push(`每回合回 ${eq.regen} 血`)
  }

  // 白色搞笑素材 → 掛裝飾小字（不影響數值）
  if (whiteExtra) eq.suffixes.push(pick(SUFFIX_LEXICON))

  return eq
}

// ── 白色合成（GDD §7.8：無配方亂合、跨職業亂跑）──
export function craftWhiteGear(materials: MaterialDef[]): {
  equipment: Equipment
  hiddenRecipeId: string | null
} {
  // 先比對隱藏白配方（多重集合相等）
  const ids = materials.map((m) => m.id).sort()
  const hit = HIDDEN_RECIPES.find(
    (r) => r.ingredients.length === ids.length && [...r.ingredients].sort().join('|') === ids.join('|'),
  )

  // v2.1（vi 定案）：小灰字條數＝投入材料數（2~3 條），
  // 底線保證 1 裝飾＋1 假數值，第 3 條從兩個詞庫混抽——越多廢話越熱鬧
  if (hit) {
    const eq: Equipment = {
      id: uid(),
      slot: hit.slot,
      name: hit.name,
      emoji: hit.emoji,
      classId: hit.classId,
      isWhite: true,
      tier: null,
      suffixes: whiteSuffixes(materials.length, hit.suffix),
    }
    // 彩蛋裝數值比一般白裝體面一點（3~8）
    applyWhiteStats(eq, 3, 8)
    return { equipment: eq, hiddenRecipeId: hit.id }
  }

  // 沒中配方 → 白裝池全職業形態隨機抽
  const form = pick(WHITE_POOL)
  const eq: Equipment = {
    id: uid(),
    slot: form.slot,
    name: form.name,
    emoji: form.emoji,
    classId: form.classId,
    isWhite: true,
    tier: null,
    suffixes: whiteSuffixes(materials.length),
  }
  applyWhiteStats(eq, 1, 5) // 數值微弱隨機，聊勝於無
  return { equipment: eq, hiddenRecipeId: null }
}

// firstSuffix：隱藏配方的專屬小字佔第一條（不被隨機取代）
function whiteSuffixes(count: number, firstSuffix?: string): string[] {
  const suffixes = [firstSuffix ?? pick(SUFFIX_LEXICON), pick(FAKE_STAT_LEXICON)]
  while (suffixes.length < count) {
    const pool = [...SUFFIX_LEXICON, ...FAKE_STAT_LEXICON].filter((s) => !suffixes.includes(s))
    suffixes.push(pick(pool))
  }
  return suffixes
}

function applyWhiteStats(eq: Equipment, lo: number, hi: number) {
  if (eq.slot === 'mainHand') eq.atk = randInt(lo, hi)
  else if (eq.slot === 'offHand') eq.def = randInt(lo, hi)
  else if (eq.slot === 'armor') eq.hp = randInt(lo, hi)
  else eq.mainStat = randInt(1, Math.max(1, Math.min(3, hi)))
}

// ── 白武器泡水（GDD §7.8.3：一次性、永久、泡過定型）──
export function soakWhiteWeapon(eq: Equipment, water: MaterialDef): Equipment {
  const [lo, hi] = SOAK_RANGE[water.rarity]
  return {
    ...eq,
    lifestealPct: randInt(lo, hi),
    soaked: true,
    suffixes: [...eq.suffixes, '有點潮濕'],
  }
}

// ── 全收集獎勵武器「阿嬤的怒吼」（GDD §7.8.7）──
// 雞毛撢子、數值故意爛、通用職業（任何角色可拿）；配戴召喚幻影阿嬤（§9.7）
export function makeGrandmaWeapon(): Equipment {
  return {
    id: uid(),
    slot: 'mainHand',
    name: '阿嬤的怒吼',
    emoji: '🧹',
    classId: null,
    isWhite: true,
    tier: null,
    atk: 1, // 故意爛
    soaked: true, // 不給泡水
    special: 'grandma_duster',
    suffixes: ['揮起來灰塵很多'],
  }
}

// ── 開局配給（GDD §7.7）──
export function makeStarterWeapon(classId: ClassId): Equipment {
  const s = STARTER_WEAPONS[classId]
  return {
    id: uid(),
    slot: 'mainHand',
    name: s.name,
    emoji: s.emoji,
    classId,
    isWhite: true,
    tier: null,
    atk: s.atk,
    soaked: true, // 新手武器不給泡水
    suffixes: ['新手的味道'],
  }
}

// ── 裝備估價（GDD §11：依數值估價）──
export function equipmentValue(eq: Equipment): number {
  const v =
    (eq.atk ?? 0) * 4 +
    (eq.def ?? 0) * 5 +
    (eq.hp ?? 0) * 1 +
    (eq.mainStat ?? 0) * 6 +
    (eq.lifestealPct ?? 0) * 8 +
    (eq.regen ?? 0) * 10
  return Math.max(1, (eq.isWhite ? 5 : 15) + v)
}

export const RARITY_ORDER: Rarity[] = ['common', 'fine', 'rare', 'legendary']
