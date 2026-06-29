import type { FloorDef, MonsterDef } from '../types'

// GDD §9：B1=B2=B3 同難度（新手大區）< B4（Lv15~20）< B5（Lv25+）
// 樓層切換無條件限制（GDD 附錄 B 未定案 → 先自由通行，深度即是門檻）
export const FLOORS: FloorDef[] = [
  { id: 'B1', name: '草原', emoji: '🌳' },
  { id: 'B2', name: '礦坑', emoji: '🪨' },
  { id: 'B3', name: '森林湖泊', emoji: '🌲' },
  { id: 'B4', name: '火山熔岩', emoji: '🌋' },
  { id: 'B5', name: '元素之巔', emoji: '⛈️' },
]

// 掉率：白素材高（打怪不空手）、元素中低（GDD §8 雙池）
const W = 0.45 // 白素材
const E = 0.3 // 普通元素
const ENH = 0.05 // 研磨粉：小怪通用 5%（v2 定案，雙管道：怪掉＋商店）

// 菁英變體（v2 定案：龜點制）——重生時 6% 變紫名菁英，數值×2.5、掉落判定×2、不打死不消失
export const ELITE = { chance: 0.06, statMult: 2.5, dropRolls: 2 }

export function monsterCombatStats(m: MonsterDef, isElite: boolean) {
  if (!isElite) return { hp: m.hp, atk: m.atk, exp: m.exp }
  return {
    hp: Math.round(m.hp * ELITE.statMult),
    atk: Math.round(m.atk * ELITE.statMult),
    exp: Math.round(m.exp * ELITE.statMult),
  }
}

export const MONSTERS: MonsterDef[] = [
  // ───── B1 草原 ─────
  {
    id: 'jobless_slime',
    name: '失業的史萊姆',
    emoji: '🫠',
    color: '#7CC576',
    floorId: 'B1',
    hp: 45,
    atk: 8,
    exp: 25,
    respawnSec: 5,
    drops: [
      { materialId: 'resume_unsent', chance: W },
      { materialId: 'letter_to_boss', chance: W },
      { materialId: 'slime_gel', chance: E },
      { materialId: 'tree_sap', chance: E },
    ],
  },
  {
    id: 'forgetful_fairy',
    name: '忘記台詞的森林精靈',
    emoji: '🧚',
    color: '#A8D86F',
    floorId: 'B1',
    hp: 50,
    atk: 9,
    exp: 28,
    respawnSec: 5,
    drops: [
      { materialId: 'crumpled_cheatsheet', chance: W },
      { materialId: 'nervous_sweat', chance: W },
      { materialId: 'green_leaf', chance: E },
      { materialId: 'morning_dew', chance: E },
    ],
  },
  {
    id: 'hiccup_bunny',
    name: '喝到打嗝的露水兔',
    emoji: '🐰',
    color: '#8FD3E8',
    floorId: 'B1',
    hp: 55,
    atk: 9,
    exp: 30,
    respawnSec: 5,
    drops: [
      { materialId: 'hiccup_whisker', chance: W },
      { materialId: 'hiccup_bottle', chance: W },
      { materialId: 'light_fluff', chance: E },
      { materialId: 'leftover_dew', chance: E },
    ],
  },
  {
    id: 'lost_chick',
    name: '迷路的風之雛鳥',
    emoji: '🐤',
    color: '#B5E3C8',
    floorId: 'B1',
    hp: 60,
    atk: 10,
    exp: 32,
    respawnSec: 5,
    drops: [
      { materialId: 'nest_grass', chance: W },
      { materialId: 'poopy_feather', chance: W },
      { materialId: 'colorful_feather', chance: E },
      { materialId: 'soft_tailfeather', chance: E },
    ],
  },

  // ───── B2 礦坑 ─────
  {
    id: 'grumpy_golem',
    name: '鬧脾氣的鐵傀儡',
    emoji: '🤖',
    color: '#9FA8B5',
    floorId: 'B2',
    hp: 75,
    atk: 11,
    exp: 40,
    respawnSec: 5,
    drops: [
      { materialId: 'sturdy_screw', chance: E },
      { materialId: 'heavy_iron', chance: E },
      { materialId: 'low_oil', chance: W },
      { materialId: 'rusty_joint', chance: W },
    ],
  },
  {
    id: 'lying_mole',
    name: '挖到躺平的鼴鼠工頭',
    emoji: '🐹',
    color: '#B58A5F',
    floorId: 'B2',
    hp: 60,
    atk: 10,
    exp: 34,
    respawnSec: 5,
    drops: [
      { materialId: 'pickaxe', chance: E },
      { materialId: 'foreman_helmet', chance: E },
      { materialId: 'dark_circles', chance: W },
      { materialId: 'lazy_chair', chance: W },
    ],
  },
  {
    id: 'charcoal_goblin',
    name: '燒到一半的木炭哥布林',
    emoji: '👺',
    color: '#E8845F',
    floorId: 'B2',
    hp: 65,
    atk: 12,
    exp: 38,
    respawnSec: 5,
    drops: [
      { materialId: 'red_charcoal', chance: E },
      { materialId: 'firewood_bundle', chance: E },
      { materialId: 'job_ad', chance: W },
      { materialId: 'dampproof_manual', chance: W },
    ],
  },
  {
    id: 'golden_colossus',
    name: '差點被拐到當鋪的黃金巨像',
    emoji: '🗿',
    color: '#F5C542',
    floorId: 'B2',
    hp: 420,
    atk: 20,
    exp: 350,
    respawnSec: 30,
    isBoss: true,
    drops: [
      { materialId: 'pawn_receipt', chance: 0.2 },
      { materialId: 'gold_cold_sweat', chance: 0.6 },
      { materialId: 'escape_map', chance: 0.2 },
      { materialId: 'pure_gold_brick', chance: 0.18 },
      { materialId: 'heavy_gold_nugget', chance: 0.5 },
      { materialId: 'hoarded_coin', chance: 0.6 },
      { materialId: 'artisan_paste', chance: 0.15 }, // 稀有強化素材唯一來源（B4/B5 開放前）
    ],
  },

  // ───── B3 森林湖泊 ─────
  {
    id: 'seasick_mermaid',
    name: '暈船的人魚',
    emoji: '🧜‍♀️',
    color: '#6FB8D8',
    floorId: 'B3',
    hp: 58,
    atk: 10,
    exp: 33,
    respawnSec: 5,
    drops: [
      { materialId: 'song_bubble', chance: E },
      { materialId: 'mint_oil', chance: W },
      { materialId: 'shell_bra', chance: W },
      { materialId: 'lake_water', chance: E },
    ],
  },
  {
    id: 'ungrillable_eel',
    name: '不能蒲燒的電鰻',
    emoji: '⚡',
    color: '#5F8AE8',
    floorId: 'B3',
    hp: 62,
    atk: 12,
    exp: 37,
    respawnSec: 5,
    drops: [
      { materialId: 'uncookable_tail', chance: E },
      { materialId: 'electric_spark', chance: E },
      { materialId: 'transformer', chance: W },
      { materialId: 'bbq_sauce', chance: W },
    ],
  },
  {
    id: 'shiny_carp',
    name: '金鑠鑠的金鱗鯉',
    emoji: '🐠',
    color: '#F0B840',
    floorId: 'B3',
    hp: 66,
    atk: 11,
    exp: 36,
    respawnSec: 5,
    drops: [
      { materialId: 'gold_scale', chance: E },
      { materialId: 'sandpaper', chance: W },
      { materialId: 'pricey_spray', chance: W },
      { materialId: 'gold_glare', chance: E },
    ],
  },
  {
    id: 'narcissus_sprite',
    name: '在湖面照鏡子的水仙精',
    emoji: '🪞',
    color: '#8FC8C0',
    floorId: 'B3',
    hp: 60,
    atk: 10,
    exp: 34,
    respawnSec: 5,
    drops: [
      { materialId: 'cracked_mirror', chance: W },
      { materialId: 'narcissus_lash', chance: W },
      { materialId: 'reflection_drop', chance: E },
      { materialId: 'lake_breeze', chance: E },
    ],
  },
]

// ───── B4 火山熔岩（對 Lv15~20 調，GDD §9.1.1）─────
MONSTERS.push(
  {
    id: 'overworked_phoenix',
    name: '過勞的鳳凰',
    emoji: '🐦‍🔥',
    color: '#E86A3C',
    floorId: 'B4',
    hp: 750,
    atk: 48,
    exp: 420,
    respawnSec: 5,
    drops: [
      { materialId: 'burning_feather', chance: E },
      { materialId: 'rebirth_ash', chance: 0.12 },
      { materialId: 'energy_drink_empty', chance: W },
      { materialId: 'bird_hair_tonic', chance: W },
    ],
  },
  {
    id: 'hoarse_salamander',
    name: '燒聲的火蜥蜴',
    emoji: '🦎',
    color: '#D9583B',
    floorId: 'B4',
    hp: 680,
    atk: 52,
    exp: 400,
    respawnSec: 5,
    drops: [
      { materialId: 'shed_scale', chance: E },
      { materialId: 'hoarse_lozenge', chance: W },
      { materialId: 'leaping_flame', chance: E },
      { materialId: 'silence_order', chance: W },
    ],
  },
  {
    id: 'sore_dwarf',
    name: '鍛造到鐵腕痠痛的熔岩矮人',
    emoji: '🧔‍♂️',
    color: '#B5502F',
    floorId: 'B4',
    hp: 820,
    atk: 50,
    exp: 450,
    respawnSec: 5,
    drops: [
      { materialId: 'hammer_handle', chance: E },
      { materialId: 'tempered_wood_handle', chance: 0.12 }, // v0.6 patch：木·稀有
      { materialId: 'anvil_shard', chance: E },
      { materialId: 'pain_patch', chance: W },
      { materialId: 'unpokable_needle', chance: 0.15 },
    ],
  },
  {
    id: 'flame_golem',
    name: '被自己帥醒的炎之魔像',
    emoji: '🌋',
    color: '#E8453C',
    floorId: 'B4',
    hp: 3000, // v0.9 §9.1.1：吸血上限降→BOSS 血微調降（~15%）
    atk: 75,
    exp: 3000,
    respawnSec: 30,
    isBoss: true,
    drops: [
      { materialId: 'mini_golem', chance: 0.25 },
      { materialId: 'handsome_lava', chance: 0.55 },
      { materialId: 'flame_selfie_album', chance: 0.6 },
      { materialId: 'practiced_autograph', chance: 0.6 },
    ],
  },
)

// ───── B5 元素之巔（對 Lv25+ 調）─────
MONSTERS.push(
  {
    id: 'lost_wind_spirit',
    name: '亂流裡的迷途風靈',
    emoji: '💨',
    color: '#7FB8C8',
    floorId: 'B5',
    hp: 1500,
    atk: 92,
    exp: 1200,
    respawnSec: 5,
    drops: [
      { materialId: 'spinning_pressure', chance: 0.22 },
      { materialId: 'crumpled_cloud', chance: 0.22 },
      { materialId: 'spinning_compass', chance: W },
      { materialId: 'unreadable_map', chance: W },
    ],
  },
  {
    id: 'bgm_thunderbird',
    name: '自帶BGM的雷霆鷲',
    emoji: '🦅',
    color: '#6B7FD8',
    floorId: 'B5',
    hp: 1600,
    atk: 100,
    exp: 1300,
    respawnSec: 5,
    drops: [
      { materialId: 'small_whirlwind', chance: 0.22 },
      { materialId: 'charged_tailfeather', chance: 0.22 },
      { materialId: 'illegal_speaker', chance: W },
      { materialId: 'cracking_mic', chance: W },
    ],
  },
  {
    id: 'unlucky_residue',
    name: '運勢不順的元素殘渣',
    emoji: '🌫️',
    color: '#8A93A8',
    floorId: 'B5',
    hp: 1550,
    atk: 96,
    exp: 1250,
    respawnSec: 5,
    drops: [
      { materialId: 'holy_water', chance: 0.22 },
      { materialId: 'lucky_holy_water', chance: 0.22 }, // v0.6 patch：水·稀有
      { materialId: 'clumped_residue', chance: 0.22 },
      { materialId: 'blessed_amulet', chance: W },
      { materialId: 'bad_fortune_slip', chance: W },
    ],
  },
  {
    id: 'ranking_wyvern',
    name: '討厭看排名的亞龍',
    emoji: '🐉',
    color: '#4A8FE8',
    floorId: 'B5',
    hp: 4300, // v0.9 §9.1.1：BOSS 血微調降（~15%）
    atk: 130,
    exp: 6000,
    respawnSec: 30,
    isBoss: true,
    drops: [
      { materialId: 'dragon_tornado', chance: 0.35 },
      { materialId: 'spiked_scale', chance: 0.35 },
      { materialId: 'torn_ranking', chance: 0.6 },
      { materialId: 'jealous_challenge', chance: 0.6 },
      { materialId: 'altered_transcript', chance: 0.6 },
      { materialId: 'god_spilled_oil', chance: 0.08 }, // 傳說強化素材（B5 限定）
    ],
  },
  {
    id: 'knotted_god',
    name: '尾巴打結的破壞神',
    emoji: '🐮',
    color: '#8B5CF6',
    floorId: 'B5',
    hp: 9800, // v0.9 §9.1.1：最終 BOSS 血微調降（~18%，配合吸血上限 25→14%）
    atk: 110,
    exp: 20000,
    respawnSec: 60, // GDD §9.4 最終 BOSS
    isBoss: true,
    drops: [
      { materialId: 'tail_knot', chance: 1.0 }, // 必掉傳說（GDD §9.5），全元素百搭
      { materialId: 'lantern_hellfire', chance: 0.25 },
      { materialId: 'bull_horn', chance: 0.2 }, // 🐮
      { materialId: 'knot_textbook', chance: 0.6 },
      { materialId: 'canned_roar', chance: 0.6 },
      { materialId: 'god_spilled_oil', chance: 0.2 },
    ],
  },
)

// v2 定案：研磨粉為小怪通用掉落（BOSS 掉的是更高階的祕傳膏）
for (const m of MONSTERS) {
  if (!m.isBoss) m.drops.push({ materialId: 'polish_powder', chance: ENH })
}

export const MONSTER_BY_ID: Record<string, MonsterDef> = Object.fromEntries(
  MONSTERS.map((m) => [m.id, m]),
)
