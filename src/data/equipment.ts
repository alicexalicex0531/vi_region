import type { ClassId, Element, EquipSlot, Rarity } from '../types'

// ─────────────── 四格制（GDD §7.2）───────────────

export const SLOT_INFO: Record<EquipSlot, { name: string; emoji: string; rollDesc: string }> = {
  mainHand: { name: '主手', emoji: '🗡️', rollDesc: '基礎ATK＋主屬性' },
  offHand: { name: '副手', emoji: '🛡️', rollDesc: '基礎DEF' },
  armor: { name: '防具', emoji: '👕', rollDesc: '+HP' },
  accessory: { name: '飾品', emoji: '💍', rollDesc: '主屬性（小量）' },
}

export const SLOT_ORDER: EquipSlot[] = ['mainHand', 'offHand', 'armor', 'accessory']

export type StatKey = 'atk' | 'def' | 'hp' | 'mainStat'

// v0.9 公式手術（GDD §7.2/§7.3）：稀有度「上下限都抬」，根治「普通滿值贏稀有低值」陷阱
// 此表為定案速查表，照表實裝（推導規則：精良=普通上限+2、稀有+5、傳說+8；下限 30%/60%/80% 起）
export const ROLL_TABLE: Record<
  EquipSlot,
  Partial<Record<StatKey, Record<Rarity, [number, number]>>>
> = {
  mainHand: {
    atk: { common: [10, 20], fine: [13, 22], rare: [16, 25], legendary: [18, 28] },
    mainStat: { common: [2, 8], fine: [4, 10], rare: [6, 13], legendary: [7, 16] },
  },
  offHand: {
    def: { common: [4, 12], fine: [6, 14], rare: [9, 17], legendary: [10, 20] },
  },
  armor: {
    hp: { common: [20, 60], fine: [32, 62], rare: [47, 65], legendary: [52, 68] },
  },
  accessory: {
    mainStat: { common: [1, 6], fine: [3, 8], rare: [4, 11], legendary: [5, 14] },
  },
}

// 回血防具詞綴範圍（GDD §7.10，v0.9 同步抬升）
export const REGEN_TABLE: Record<Rarity, [number, number]> = {
  common: [3, 8],
  fine: [5, 10],
  rare: [7, 13],
  legendary: [8, 16],
}

// 水替換版主手的 ATK 微降（相對同階：下限 -1、上限 -2；普通 10~20 → 9~18）
export const WATER_REPLACE_ATK_DELTA: [number, number] = [-1, -2]

// ─────────────── 元素配方（草案 v1：跟職業走，GDD §7.1.1）───────────────

export interface ElementRecipe {
  name: string
  emoji: string
  cost: Partial<Record<Element, number>>
  // 水替換版主手：ATK 比同階微降、換吸血 roll（v2 設計、v0.9 改用同階 -delta）
  waterReplace?: boolean
}

// 每格可有多條配方變體（v2 定案：劍士/弓手主手開「水替換版」，純輸出 vs 續航取捨）
export const ELEMENT_RECIPES: Record<ClassId, Record<EquipSlot, ElementRecipe[]>> = {
  swordsman: {
    mainHand: [
      { name: '鐵骨大劍', emoji: '🗡️', cost: { metal: 1, wood: 1, fire: 1 } },
      { name: '飲血之刃', emoji: '⚔️', cost: { metal: 1, water: 1, fire: 1 }, waterReplace: true },
    ],
    offHand: [{ name: '堅毅之盾', emoji: '🛡️', cost: { metal: 2, wood: 1 } }],
    armor: [{ name: '戰士鎧甲', emoji: '🥋', cost: { wood: 2, fire: 1 } }],
    accessory: [{ name: '勇氣徽章', emoji: '🎖️', cost: { metal: 1, fire: 1 } }],
  },
  mage: {
    mainHand: [{ name: '元素法杖', emoji: '🪄', cost: { fire: 1, water: 1, metal: 1 } }],
    offHand: [{ name: '水紋魔導書', emoji: '📖', cost: { water: 2, metal: 1 } }],
    armor: [{ name: '星紋長袍', emoji: '👘', cost: { water: 2, fire: 1 } }],
    accessory: [{ name: '智慧護符', emoji: '🧿', cost: { metal: 1, water: 1 } }],
  },
  archer: {
    mainHand: [
      { name: '風羽長弓', emoji: '🏹', cost: { wood: 1, wind: 1, metal: 1 } },
      { name: '晨露長弓', emoji: '💧', cost: { wood: 1, wind: 1, water: 1 }, waterReplace: true },
    ],
    offHand: [{ name: '鷹眼箭袋', emoji: '🎯', cost: { wood: 1, wind: 2 } }],
    armor: [{ name: '獵手皮甲', emoji: '🧥', cost: { wood: 2, wind: 1 } }],
    accessory: [{ name: '迅捷羽飾', emoji: '🪶', cost: { metal: 1, wind: 1 } }],
  },
}

// ─────────────── 稀有度 → roll 下限（GDD §7.3/§7.4）───────────────

// 稀有度分數：普通1 精良2 稀有3 傳說4；多元素取平均 → 決定產出稀有度階（GDD §7.4）
export const RARITY_SCORE: Record<Rarity, number> = { common: 1, fine: 2, rare: 3, legendary: 4 }

// 強化素材公式（GDD §7.6 v1.0）：百分比加成 ＋ 最少推升保證，取較大者
// 百分比基於該格「普通範圍」算（不隨稀有度縮小範圍）；短範圍格位靠最少保證托底
export const ENHANCE_BONUS: Record<Rarity, number> = {
  common: 0,
  fine: 0.05,
  rare: 0.12,
  legendary: 0.25,
}
export const ENHANCE_MIN_BOOST: Record<Rarity, number> = {
  common: 0,
  fine: 1,
  rare: 2,
  legendary: 3,
}

// 算下限加成：max( ceil(普通範圍寬 × 百分比), 最少推升保證 )（GDD §7.6.2）
export function enhanceBoost(commonRange: [number, number], rarity: Rarity): number {
  if (rarity === 'common') return 0
  const pct = Math.ceil((commonRange[1] - commonRange[0]) * ENHANCE_BONUS[rarity])
  return Math.max(pct, ENHANCE_MIN_BOOST[rarity])
}

// 平均分數 → 顯示用的稀有度階（取最接近）
export function tierFromScore(avgScore: number): Rarity {
  if (avgScore >= 3.5) return 'legendary'
  if (avgScore >= 2.5) return 'rare'
  if (avgScore >= 1.5) return 'fine'
  return 'common'
}

export const TIER_PREFIX: Record<Rarity, string> = {
  common: '',
  fine: '精良的',
  rare: '稀有的',
  legendary: '傳說的',
}

// 吸血% roll 範圍：看投入的水素材稀有度（GDD §7.5，v0.9 改四段不重疊）
// 接合點：精良最低=普通最高=4、稀有最低=精良最高=7、傳說最低=稀有最高=10 → 上位永不輸下位
export const LIFESTEAL_RANGE: Record<Rarity, [number, number]> = {
  common: [1, 4],
  fine: [4, 7],
  rare: [7, 10],
  legendary: [10, 14],
}

// 白武器泡水：一次性微吸血（GDD §7.8.3，上限遠低於元素武器）
export const SOAK_RANGE: Record<Rarity, [number, number]> = {
  common: [1, 2],
  fine: [2, 3],
  rare: [3, 4],
  legendary: [5, 5],
}

// ─────────────── 白裝池（GDD §7.8.1，附錄B草案）───────────────

export interface WhiteForm {
  name: string
  emoji: string
  slot: EquipSlot
  classId: ClassId | null // 武器/副手有職業形態；防具/飾品通用
}

export const WHITE_POOL: WhiteForm[] = [
  // 劍（劍士主手）
  { name: '硬掉的法國麵包', emoji: '🥖', slot: 'mainHand', classId: 'swordsman' },
  { name: '馬桶疏通神器', emoji: '🪠', slot: 'mainHand', classId: 'swordsman' },
  { name: '「禁止通行」路牌', emoji: '🚧', slot: 'mainHand', classId: 'swordsman' },
  // 杖（法師主手）
  { name: '壞掉的自拍棒', emoji: '🤳', slot: 'mainHand', classId: 'mage' },
  { name: '雞毛撢子', emoji: '🪶', slot: 'mainHand', classId: 'mage' },
  { name: '撈金魚的網子', emoji: '🥅', slot: 'mainHand', classId: 'mage' },
  // 弓（弓手主手）
  { name: '橡皮筋彈弓', emoji: '🪃', slot: 'mainHand', classId: 'archer' },
  { name: '壞掉的雨傘骨', emoji: '☂️', slot: 'mainHand', classId: 'archer' },
  { name: '曬衣竿改造弓', emoji: '🧹', slot: 'mainHand', classId: 'archer' },
  // 盾（劍士副手）
  { name: '燒焦的鍋蓋', emoji: '🍳', slot: 'offHand', classId: 'swordsman' },
  { name: '紙箱擋板', emoji: '📦', slot: 'offHand', classId: 'swordsman' },
  // 魔導書（法師副手）
  { name: '過期的電話簿', emoji: '📒', slot: 'offHand', classId: 'mage' },
  { name: '全是廣告的週刊', emoji: '📰', slot: 'offHand', classId: 'mage' },
  // 箭袋（弓手副手）
  { name: '義大利麵收納罐', emoji: '🥫', slot: 'offHand', classId: 'archer' },
  { name: '裝雨傘的桶子', emoji: '🌂', slot: 'offHand', classId: 'archer' },
  // 防具（通用）
  { name: '紙箱鎧甲', emoji: '📦', slot: 'armor', classId: null },
  { name: '洗到縮水的毛衣', emoji: '🧶', slot: 'armor', classId: null },
  { name: '阿嬤牌花雨衣', emoji: '🧥', slot: 'armor', classId: null },
  // 飾品（通用）
  { name: '瓶蓋項鍊', emoji: '📿', slot: 'accessory', classId: null },
  { name: '路上撿的鈕扣', emoji: '🔘', slot: 'accessory', classId: null },
  { name: '橡皮筋手環', emoji: '⭕', slot: 'accessory', classId: null },

  // ── v2 擴充（vi & Chat 克勞德共同定稿）──
  // 劍
  { name: '阿公的拐杖', emoji: '🦯', slot: 'mainHand', classId: 'swordsman' },
  { name: '刷毛掉一半的掃帚', emoji: '🧹', slot: 'mainHand', classId: 'swordsman' },
  { name: '拆不了信的超鈍瑞士刀', emoji: '🔪', slot: 'mainHand', classId: 'swordsman' },
  { name: '過期的競選海報', emoji: '🪧', slot: 'mainHand', classId: 'swordsman' },
  // 杖
  { name: '臭臭馬桶刷', emoji: '🚽', slot: 'mainHand', classId: 'mage' },
  { name: '放完的仙女棒', emoji: '🎇', slot: 'mainHand', classId: 'mage' },
  { name: '演唱會的螢光棒(沒電)', emoji: '🔦', slot: 'mainHand', classId: 'mage' },
  // 弓
  { name: '髮圈彈弓', emoji: '🎀', slot: 'mainHand', classId: 'archer' },
  { name: '晾衣架掰的弓', emoji: '🧷', slot: 'mainHand', classId: 'archer' },
  // 盾
  { name: '麻將桌墊', emoji: '🀄', slot: 'offHand', classId: 'swordsman' },
  { name: '「頂讓」廣告看板', emoji: '🪧', slot: 'offHand', classId: 'swordsman' },
  { name: '浴室防滑墊', emoji: '🛁', slot: 'offHand', classId: 'swordsman' },
  // 書
  { name: 'IKEA的說明書', emoji: '🔧', slot: 'offHand', classId: 'mage' },
  { name: '拿來壓泡麵的字典', emoji: '📕', slot: 'offHand', classId: 'mage' },
  // 箭袋
  { name: '羽毛球筒', emoji: '🏸', slot: 'offHand', classId: 'archer' },
  { name: '特大杯薯條盒', emoji: '🍟', slot: 'offHand', classId: 'archer' },
  // 防具
  { name: '氣泡紙戰甲', emoji: '🫧', slot: 'armor', classId: null },
  { name: '紙袋頭套', emoji: '🛍️', slot: 'armor', classId: null },
  { name: '超人款毛巾披風', emoji: '🦸', slot: 'armor', classId: null },
  { name: '防曬袖套', emoji: '🧤', slot: 'armor', classId: null },
  // 飾品
  { name: '吃剩的戒指糖', emoji: '🍭', slot: 'accessory', classId: null },
  { name: '差一格的超商點數卡', emoji: '💳', slot: 'accessory', classId: null },
  { name: '演唱會掉落的彩帶', emoji: '🎊', slot: 'accessory', classId: null },
  { name: '抽屜挖出來的鑰匙', emoji: '🗝️', slot: 'accessory', classId: null },
]

// ─────────────── 隱藏白配方 18 組（GDD §7.8.2 定稿）───────────────

export interface HiddenRecipe {
  id: string
  name: string
  emoji: string
  slot: EquipSlot
  classId: ClassId | null
  ingredients: string[] // material ids（多重集合比對）
  suffix: string
}

export const HIDDEN_RECIPES: HiddenRecipe[] = [
  // 🗡️ 主手（4）
  { id: 'h01', name: '離職劍', emoji: '⚔️', slot: 'mainHand', classId: 'swordsman', ingredients: ['letter_to_boss', 'resume_unsent'], suffix: '揮出去就回不來了' },
  { id: 'h02', name: '躺平者之鎚', emoji: '🔨', slot: 'mainHand', classId: 'swordsman', ingredients: ['lazy_chair', 'dark_circles'], suffix: '揮一下就想休息' },
  { id: 'h03', name: '尖叫法杖', emoji: '📢', slot: 'mainHand', classId: 'mage', ingredients: ['canned_roar', 'illegal_speaker'], suffix: '音量即是力量' },
  { id: 'h04', name: '雛鳥的逆襲', emoji: '🐤', slot: 'mainHand', classId: 'archer', ingredients: ['nest_grass', 'poopy_feather'], suffix: '箭羽有味道' },
  // 🛡️ 盾（2）
  { id: 'h05', name: '保住C位的防線', emoji: '🛡️', slot: 'offHand', classId: 'swordsman', ingredients: ['flame_selfie_album', 'practiced_autograph'], suffix: '上面全是簽名' },
  { id: 'h06', name: '防潮專家', emoji: '🛡️', slot: 'offHand', classId: 'swordsman', ingredients: ['dampproof_manual', 'low_oil'], suffix: '本體比你還怕濕' },
  // 📖 魔導書（2）
  { id: 'h07', name: '厚厚一疊的回收紙', emoji: '📖', slot: 'offHand', classId: 'mage', ingredients: ['knot_textbook', 'job_ad'], suffix: '一頁都讀不下去' },
  { id: 'h08', name: '重修生的筆記', emoji: '📖', slot: 'offHand', classId: 'mage', ingredients: ['crumpled_cheatsheet', 'altered_transcript'], suffix: '重點全畫錯' },
  // 🏹 箭袋（2）
  { id: 'h09', name: '一樣可以扎', emoji: '🎯', slot: 'offHand', classId: 'archer', ingredients: ['unpokable_needle', 'hiccup_whisker'], suffix: '功能完全等價' },
  { id: 'h10', name: '裝滿不服氣的筒子', emoji: '🎯', slot: 'offHand', classId: 'archer', ingredients: ['torn_ranking', 'jealous_challenge'], suffix: '怨念比箭多' },
  // 👕 防具（3）
  { id: 'h11', name: '海的歉意', emoji: '🐚', slot: 'armor', classId: null, ingredients: ['shell_bra', 'mint_oil'], suffix: '聞起來意外清爽' },
  { id: 'h12', name: '迷路者之靴', emoji: '👢', slot: 'armor', classId: null, ingredients: ['escape_map', 'spinning_compass'], suffix: '永遠到不了目的地' },
  { id: 'h13', name: '堅固的五十肩', emoji: '💪', slot: 'armor', classId: null, ingredients: ['dark_circles', 'pain_patch', 'rusty_joint'], suffix: '職業傷害認證' },
  // 💍 飾品（5）
  { id: 'h14', name: '停不了手的籤運', emoji: '🎰', slot: 'accessory', classId: null, ingredients: ['blessed_amulet', 'bad_fortune_slip'], suffix: '抽到爛籤的解方就是繼續抽' },
  { id: 'h15', name: '消音器', emoji: '🤫', slot: 'accessory', classId: null, ingredients: ['silence_order', 'hiccup_bottle'], suffix: '世界安靜了' },
  { id: 'h16', name: '焦慮的頭皮', emoji: '😱', slot: 'accessory', classId: null, ingredients: ['bird_hair_tonic', 'cracked_mirror'], suffix: '照了更焦慮' },
  { id: 'h17', name: '守財奴的證明', emoji: '🪙', slot: 'accessory', classId: null, ingredients: ['pawn_receipt', 'hoarded_coin'], suffix: '價值連城但一毛不能花' },
  { id: 'h18', name: '金牌歌喉(自稱)', emoji: '🎤', slot: 'accessory', classId: null, ingredients: ['cracking_mic', 'hoarse_lozenge'], suffix: '佩戴後自我感覺良好' },
]

// ─────────────── 詞庫 ───────────────

// 裝飾小字（GDD §8.1，白素材加進合成 → 掛小字，不影響數值）
export const SUFFIX_LEXICON = [
  '有一股臭味',
  '會微微發光',
  '摸起來黏黏的',
  '聞起來像便當',
  '半夜會自己叫',
  '拒絕被洗乾淨',
  '沾到不明液體',
]

// 假數值小字（GDD §7.8.5；v2 起所有白裝都掛一條，看起來像屬性但完全不是屬性）
export const FAKE_STAT_LEXICON = [
  '水噹噹值增加了30%',
  '帥氣度增加了8倍',
  '腰圍胖了2圈',
  '鼻毛露了3根',
  '人見人愛率+12%',
  '中午想睡指數×3',
  // v2 擴充（vi 鎮店三條）
  '頭腦靈光了3個亮度',
  '血壓下降了20 mmHg',
  '分貝提高了100！',
  // v2 擴充（Chat 克勞德）
  '桃花運延後了2週',
  '蛀牙率下降了0.5顆',
  '對香菜的抵抗力+99',
  '午覺品質提升了1.8倍',
  '撞到小指的機率-15%',
  '被蚊子咬的包更癢了',
  'WiFi訊號增強1格(自我感覺)',
  '緣分指數+0.01%',
  '鞋帶鬆開週期延長3天',
  '夢到忘記讀書就考試的頻率-2次/月',
  '飯量+半碗',
  '笑點降低了30%',
]

// ─────────────── 幸運道具 / 快樂套餐 ───────────────

// 透明限時幸運 buff（GDD §8.4，飾品專屬、單層覆蓋）
export const LUCKY_RECIPES = [
  { rarity: 'common' as Rarity, cost: 5, bonusPct: 10, battles: 10, label: '普通白素材 ×5' },
  { rarity: 'rare' as Rarity, cost: 2, bonusPct: 25, battles: 15, label: '稀有白素材 ×2' },
]

// 快樂套餐（GDD §7.8.4：四格全白 → HP+15%、白素材掉率+20%）
export const HAPPY_MEAL = { hpMult: 1.15, whiteDropMult: 1.2 }

// 開局配給（GDD §7.7）
export const STARTER_WEAPONS: Record<ClassId, { name: string; emoji: string; atk: number }> = {
  swordsman: { name: '新手鐵劍', emoji: '🗡️', atk: 3 },
  mage: { name: '新手木杖', emoji: '🪄', atk: 3 },
  archer: { name: '新手短弓', emoji: '🏹', atk: 3 },
}
