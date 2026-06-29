import type { MaterialDef } from '../types'

// GDD §9.3 怪物與素材命名表
// 元素素材正經命名、白素材搞笑亂命名、強化素材專門凹 roll 下限（GDD §7.6）
const LIST: MaterialDef[] = [
  // ───── B1 草原 ─────
  { id: 'resume_unsent', name: '沒投出去的履歷', kind: 'white', rarity: 'common' },
  { id: 'letter_to_boss', name: '罵老闆的信', kind: 'white', rarity: 'common' },
  { id: 'slime_gel', name: '史萊姆凝膠', kind: 'element', element: 'wood', rarity: 'common' },
  { id: 'tree_sap', name: '濃縮的樹液精華', kind: 'element', element: 'wood', rarity: 'common' },
  { id: 'crumpled_cheatsheet', name: '揉爛的小抄', kind: 'white', rarity: 'common' },
  { id: 'nervous_sweat', name: '忘詞冒的手汗', kind: 'white', rarity: 'common' },
  { id: 'green_leaf', name: '翠綠小樹葉', kind: 'element', element: 'wood', rarity: 'common' },
  { id: 'morning_dew', name: '凝聚的晨露', kind: 'element', element: 'water', rarity: 'common' },
  { id: 'hiccup_whisker', name: '打嗝震落的鬍鬚', kind: 'white', rarity: 'common' },
  { id: 'hiccup_bottle', name: '裝著嗝的小瓶子', kind: 'white', rarity: 'common' },
  { id: 'light_fluff', name: '輕盈的絨毛', kind: 'element', element: 'wind', rarity: 'common' },
  { id: 'leftover_dew', name: '沒喝完的露水', kind: 'element', element: 'water', rarity: 'common' },
  { id: 'nest_grass', name: '鳥窩裡的草', kind: 'white', rarity: 'common' },
  { id: 'poopy_feather', name: '沾到便便的羽毛', kind: 'white', rarity: 'common' },
  { id: 'colorful_feather', name: '斑斕的羽毛', kind: 'element', element: 'wind', rarity: 'common' },
  { id: 'soft_tailfeather', name: '柔軟的尾羽', kind: 'element', element: 'wind', rarity: 'common' },

  // ───── B2 礦坑 ─────
  { id: 'sturdy_screw', name: '堅固的螺絲', kind: 'element', element: 'metal', rarity: 'common' },
  { id: 'heavy_iron', name: '沉重的鐵塊', kind: 'element', element: 'metal', rarity: 'common' },
  { id: 'low_oil', name: '快見底的機油', kind: 'white', rarity: 'common' },
  { id: 'rusty_joint', name: '有點生鏽的關節', kind: 'white', rarity: 'common' },
  { id: 'pickaxe', name: '耐用的十字鎬', kind: 'element', element: 'metal', rarity: 'common' },
  { id: 'foreman_helmet', name: '有探照燈的工頭帽', kind: 'element', element: 'metal', rarity: 'common' },
  { id: 'dark_circles', name: '過勞的黑眼圈', kind: 'white', rarity: 'common' },
  { id: 'lazy_chair', name: '懶散的躺椅', kind: 'white', rarity: 'common' },
  { id: 'red_charcoal', name: '火紅的木炭', kind: 'element', element: 'fire', rarity: 'common' },
  { id: 'firewood_bundle', name: '一大綑柴枝', kind: 'element', element: 'wood', rarity: 'common' },
  { id: 'job_ad', name: '想轉職的廣告信', kind: 'white', rarity: 'common' },
  { id: 'dampproof_manual', name: '防潮秘笈', kind: 'white', rarity: 'common' },
  // 中層 BOSS：差點被拐到當鋪的黃金巨像
  { id: 'pawn_receipt', name: '典當收據', kind: 'white', rarity: 'rare' },
  { id: 'gold_cold_sweat', name: '嚇出的金箔冷汗', kind: 'white', rarity: 'common' },
  { id: 'escape_map', name: '珍藏的逃生地圖', kind: 'white', rarity: 'rare' },
  { id: 'pure_gold_brick', name: '純度超高的金磚', kind: 'element', element: 'metal', rarity: 'rare' },
  { id: 'heavy_gold_nugget', name: '沉甸甸的金塊', kind: 'element', element: 'metal', rarity: 'common' },
  { id: 'hoarded_coin', name: '捨不得花的金幣', kind: 'white', rarity: 'common' },

  // ───── B3 森林湖泊 ─────
  { id: 'song_bubble', name: '環繞歌聲的泡泡', kind: 'element', element: 'water', rarity: 'common' },
  { id: 'mint_oil', name: '防暈船的薄荷油', kind: 'white', rarity: 'common' },
  { id: 'shell_bra', name: '被當成嘔吐袋的貝殼奶罩', kind: 'white', rarity: 'common' },
  { id: 'lake_water', name: '湖心的清水', kind: 'element', element: 'water', rarity: 'common' },
  { id: 'uncookable_tail', name: '烤不熟的魚尾', kind: 'element', element: 'fire', rarity: 'common' }, // ※彩蛋：電鰻掉火
  { id: 'electric_spark', name: '電火花', kind: 'element', element: 'metal', rarity: 'common' },
  { id: 'transformer', name: '萬用變壓器', kind: 'white', rarity: 'common' },
  { id: 'bbq_sauce', name: '沒收遊客的烤肉醬', kind: 'white', rarity: 'common' },
  { id: 'gold_scale', name: '閃亮的金鱗', kind: 'element', element: 'metal', rarity: 'common' },
  { id: 'sandpaper', name: '拋光砂紙', kind: 'white', rarity: 'common' },
  { id: 'pricey_spray', name: '超貴的噴漆', kind: 'white', rarity: 'common' },
  { id: 'gold_glare', name: '反光刺眼的金光', kind: 'element', element: 'metal', rarity: 'common' },
  { id: 'cracked_mirror', name: '用到裂開的鏡子', kind: 'white', rarity: 'common' },
  { id: 'narcissus_lash', name: '自戀掉的睫毛', kind: 'white', rarity: 'common' },
  { id: 'reflection_drop', name: '映出倒影的水珠', kind: 'element', element: 'water', rarity: 'common' },
  { id: 'lake_breeze', name: '湖面的清風', kind: 'element', element: 'wind', rarity: 'common' },

  // ───── B4 火山熔岩（精良為主、稀有低機率，GDD §6.2/§9.3）─────
  { id: 'burning_feather', name: '燃燒的羽毛', kind: 'element', element: 'fire', rarity: 'fine' },
  { id: 'rebirth_ash', name: '重生的灰', kind: 'element', element: 'fire', rarity: 'rare' },
  { id: 'shed_scale', name: '脫皮的鱗', kind: 'element', element: 'metal', rarity: 'fine' },
  { id: 'leaping_flame', name: '躍動的火苗', kind: 'element', element: 'fire', rarity: 'fine' },
  { id: 'hammer_handle', name: '黑鐵大槌的木柄', kind: 'element', element: 'wood', rarity: 'fine' },
  { id: 'tempered_wood_handle', name: '千錘百鍊的硬木柄', kind: 'element', element: 'wood', rarity: 'rare' }, // v0.6 patch：補木·稀有
  { id: 'anvil_shard', name: '敲落的鐵砧碎片', kind: 'element', element: 'metal', rarity: 'fine' },
  { id: 'mini_golem', name: '自戀的縮小版魔像', kind: 'element', element: 'fire', rarity: 'rare' },
  { id: 'handsome_lava', name: '帥到融化的熔岩', kind: 'element', element: 'fire', rarity: 'fine' },

  // ───── B5 元素之巔（稀有為主、傳說在 BOSS 手上）─────
  { id: 'spinning_pressure', name: '旋轉的靈壓', kind: 'element', element: 'wind', rarity: 'rare' },
  { id: 'crumpled_cloud', name: '亂流揉皺的雲', kind: 'element', element: 'wind', rarity: 'rare' },
  { id: 'small_whirlwind', name: '小小的旋風', kind: 'element', element: 'wind', rarity: 'rare' },
  { id: 'charged_tailfeather', name: '帶電的尾羽', kind: 'element', element: 'water', rarity: 'rare' },
  { id: 'holy_water', name: '加持過的聖水', kind: 'element', element: 'water', rarity: 'rare' },
  { id: 'lucky_holy_water', name: '否極泰來的聖水', kind: 'element', element: 'water', rarity: 'rare' }, // v0.6 patch：補水·稀有
  { id: 'clumped_residue', name: '結塊的殘渣', kind: 'element', element: 'fire', rarity: 'rare' },
  { id: 'dragon_tornado', name: '氣勢驚人的龍捲風', kind: 'element', element: 'wind', rarity: 'rare' },
  { id: 'spiked_scale', name: '堅固帶著刺的鱗', kind: 'element', element: 'fire', rarity: 'rare' },
  // 最終 BOSS 傳說（GDD §9.5：必掉傳說、各元素皆有機會 → 用全元素百搭實現）
  { id: 'tail_knot', name: '解不開的尾巴結', kind: 'element', anyElement: true, rarity: 'legendary' },
  { id: 'lantern_hellfire', name: '只能點燈的地獄火', kind: 'element', element: 'fire', rarity: 'legendary' },
  { id: 'bull_horn', name: '毀滅級的牛頭角', kind: 'white', rarity: 'legendary' }, // 🐮 vi 的牛頭簽名彩蛋

  // ───── 強化素材（GDD §7.6：不當主料、專門凹下限）─────
  { id: 'polish_powder', name: '閃閃發亮的研磨粉', kind: 'enhance', rarity: 'fine' },
  { id: 'artisan_paste', name: '工匠的祕傳膏', kind: 'enhance', rarity: 'rare' },
  { id: 'god_spilled_oil', name: '神明打翻的金油', kind: 'enhance', rarity: 'legendary' }, // B5 限定（Phase 3）

  // ───── B4/B5 白素材（隱藏白配方用料，怪物 Phase 3 落地）─────
  { id: 'energy_drink_empty', name: '喝光的提神飲料', kind: 'white', rarity: 'common' },
  { id: 'bird_hair_tonic', name: '毛髮滋養劑-鳥類用', kind: 'white', rarity: 'common' },
  { id: 'hoarse_lozenge', name: '燒聲喉糖', kind: 'white', rarity: 'common' },
  { id: 'silence_order', name: '醫生開的禁聲令', kind: 'white', rarity: 'common' },
  { id: 'pain_patch', name: '痠痛貼布-日本製', kind: 'white', rarity: 'common' },
  { id: 'unpokable_needle', name: '扎不進去的針灸-全新', kind: 'white', rarity: 'rare' },
  { id: 'flame_selfie_album', name: '炎魔自拍的寫真集', kind: 'white', rarity: 'common' },
  { id: 'practiced_autograph', name: '練很久的簽名板', kind: 'white', rarity: 'common' },
  { id: 'spinning_compass', name: '亂轉的指南針', kind: 'white', rarity: 'common' },
  { id: 'unreadable_map', name: '看不懂的地圖', kind: 'white', rarity: 'common' },
  { id: 'illegal_speaker', name: '分貝已違規的喇叭', kind: 'white', rarity: 'common' },
  { id: 'cracking_mic', name: '會破音的麥克風', kind: 'white', rarity: 'common' },
  { id: 'blessed_amulet', name: '求來的護身符', kind: 'white', rarity: 'common' },
  { id: 'bad_fortune_slip', name: '忘記丟掉的爛籤', kind: 'white', rarity: 'common' },
  { id: 'torn_ranking', name: '撕碎的排行榜', kind: 'white', rarity: 'common' },
  { id: 'jealous_challenge', name: '充滿嫉妒的挑戰書', kind: 'white', rarity: 'common' },
  { id: 'altered_transcript', name: '塗改過的成績單', kind: 'white', rarity: 'common' },
  { id: 'knot_textbook', name: '打結教學書-愈看愈暴躁', kind: 'white', rarity: 'common' },
  { id: 'canned_roar', name: '裝著怒吼的罐頭', kind: 'white', rarity: 'common' },
]

export const MATERIALS: Record<string, MaterialDef> = Object.fromEntries(
  LIST.map((m) => [m.id, m]),
)

// ── 商店價格（GDD §11）──
// 賣價：素材變現；白素材是主要金源
export function sellPrice(m: MaterialDef): number {
  const byRarity = { common: 1, fine: 4, rare: 10, legendary: 40 }
  const base = m.kind === 'white' ? 3 : m.kind === 'enhance' ? 8 : 5
  return base * byRarity[m.rarity]
}

// 商店販售的普通元素（每元素一種代表素材；傳說不販售，必須自農）
export const SHOP_STOCK: { materialId: string; price: number }[] = [
  { materialId: 'heavy_iron', price: 15 }, // 金
  { materialId: 'slime_gel', price: 15 }, // 木
  { materialId: 'lake_water', price: 15 }, // 水
  { materialId: 'red_charcoal', price: 15 }, // 火
  { materialId: 'colorful_feather', price: 15 }, // 風
  { materialId: 'polish_powder', price: 60 }, // 強化素材（精良）
]
