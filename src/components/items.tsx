import type { BagItem, Equipment, MaterialDef } from '../types'
import { ELEMENT_INFO, RARITY_INFO } from '../data/classes'
import { MATERIALS } from '../data/materials'

export function materialEmoji(m: MaterialDef): string {
  if (m.kind === 'white') return '🤍'
  if (m.kind === 'enhance') return '✨'
  if (m.anyElement) return '🌀'
  return ELEMENT_INFO[m.element!].emoji
}

export function materialKindLabel(m: MaterialDef): string {
  if (m.kind === 'white') return '白色搞笑素材'
  if (m.kind === 'enhance') return '強化素材'
  if (m.anyElement) return '全元素百搭素材'
  return `${ELEMENT_INFO[m.element!].name}元素素材`
}

export function equipmentStatText(eq: Equipment): string {
  const parts: string[] = []
  if (eq.atk) parts.push(`⚔️ATK+${eq.atk}`)
  if (eq.def) parts.push(`🛡️DEF+${eq.def}`)
  if (eq.hp) parts.push(`❤️HP+${eq.hp}`)
  if (eq.mainStat) parts.push(`💪主屬性+${eq.mainStat}`)
  if (eq.lifestealPct) parts.push(`🩸吸血${eq.lifestealPct}%`)
  if (eq.regen) parts.push(`💚每回合+${eq.regen}`)
  return parts.join('　')
}

export function itemBorderColor(item: BagItem): string {
  if (item.type === 'equipment') {
    const eq = item.equipment
    if (eq.isWhite) return '#D8D2C6'
    return RARITY_INFO[eq.tier ?? 'common'].color
  }
  const m = MATERIALS[item.materialId]
  return m.rarity === 'common' ? '#EFE3CC' : RARITY_INFO[m.rarity].color
}

// 背包/倉庫格子（縮圖）
export function ItemCell({
  item,
  onClick,
}: {
  item: BagItem
  onClick?: () => void
}) {
  const emoji =
    item.type === 'equipment' ? item.equipment.emoji : materialEmoji(MATERIALS[item.materialId])
  const name = item.type === 'equipment' ? item.equipment.name : MATERIALS[item.materialId].name
  return (
    <button
      onClick={onClick}
      className="relative flex aspect-square flex-col items-center justify-center rounded-xl border-2 bg-white p-0.5 active:scale-95"
      style={{ borderColor: itemBorderColor(item) }}
    >
      <span className="text-lg leading-none">{emoji}</span>
      <span className="mt-0.5 w-full truncate text-center text-[8px] leading-tight text-[#7A6850]">
        {name}
      </span>
      {item.type === 'material' && (
        <span className="absolute -top-1 -right-1 rounded-full bg-[#7A5C3D] px-1 text-[9px] font-bold text-white">
          {item.count}
        </span>
      )}
      {item.type === 'equipment' && item.equipment.isWhite && (
        <span className="absolute -top-1 -right-1 text-[9px]">🤍</span>
      )}
    </button>
  )
}

// 裝備完整資訊卡（modal 內用）
export function EquipmentCard({ eq }: { eq: Equipment }) {
  return (
    <div className="text-center">
      <div className="text-4xl">{eq.emoji}</div>
      <div className="mt-1 text-base font-black text-[#5C4A36]">{eq.name}</div>
      <div className="mt-1 flex flex-wrap justify-center gap-1.5 text-xs">
        {eq.isWhite ? (
          <span className="rounded-full bg-[#F0EDE6] px-2 py-0.5 font-bold text-[#8A8070]">
            🤍 白裝
          </span>
        ) : (
          <span
            className="rounded-full px-2 py-0.5 font-bold text-white"
            style={{ background: RARITY_INFO[eq.tier ?? 'common'].color }}
          >
            {RARITY_INFO[eq.tier ?? 'common'].emoji} {RARITY_INFO[eq.tier ?? 'common'].name}
          </span>
        )}
      </div>
      <div className="mt-2 text-xs font-bold text-[#5C4A36]">{equipmentStatText(eq) || '？'}</div>
      {eq.suffixes.length > 0 && (
        <div className="mt-1.5 space-y-0.5">
          {eq.suffixes.map((s, i) => (
            <div key={i} className="text-[11px] text-[#B8A488] italic">
              「{s}」
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
