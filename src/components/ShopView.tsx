import { MATERIALS, sellPrice, SHOP_STOCK } from '../data/materials'
import { RARITY_INFO } from '../data/classes'
import { equipmentValue } from '../game/craft'
import { BACKPACK_MAX, backpackUpgradeCost, useGameStore } from '../store/gameStore'
import { materialEmoji } from './items'

export default function ShopView() {
  const character = useGameStore((s) => s.character)!
  const backpack = useGameStore((s) => s.backpack)
  const backpackSize = useGameStore((s) => s.backpackSize)
  const buyMaterial = useGameStore((s) => s.buyMaterial)
  const sellItem = useGameStore((s) => s.sellItem)
  const upgradeBackpack = useGameStore((s) => s.upgradeBackpack)

  const upgradeCost = backpackUpgradeCost(backpackSize)

  return (
    <div className="mt-3">
      <div className="rounded-2xl bg-white p-3 text-center shadow-sm">
        <span className="text-sm font-black text-[#7A5C3D]">💰 持有金幣：{character.gold}</span>
      </div>

      {/* ── 買（GDD §11：傳說不販售，必須自農）── */}
      <h2 className="mt-4 text-sm font-black text-[#7A5C3D]">🛒 補貨區（職業農不到的元素）</h2>
      <div className="mt-2 grid grid-cols-2 gap-1.5">
        {SHOP_STOCK.map(({ materialId, price }) => {
          const m = MATERIALS[materialId]
          return (
            <button
              key={materialId}
              onClick={() => buyMaterial(materialId)}
              disabled={character.gold < price}
              className="flex items-center gap-1.5 rounded-xl bg-white p-2.5 text-left text-[11px] font-bold text-[#5C4A36] shadow-sm active:scale-95 disabled:opacity-40"
            >
              <span className="text-base">{materialEmoji(m)}</span>
              <span className="min-w-0 flex-1 truncate">{m.name}</span>
              <span className="text-[#B8862F]">💰{price}</span>
            </button>
          )
        })}
      </div>

      {/* ── 背包擴建（GDD §10.1）── */}
      <h2 className="mt-4 text-sm font-black text-[#7A5C3D]">🎒 背包擴建</h2>
      <button
        onClick={upgradeBackpack}
        disabled={backpackSize >= BACKPACK_MAX || character.gold < upgradeCost}
        className="mt-2 w-full rounded-xl bg-white p-3 text-sm font-bold text-[#5C4A36] shadow-sm active:scale-95 disabled:opacity-40"
      >
        {backpackSize >= BACKPACK_MAX
          ? `背包已是最大（${BACKPACK_MAX} 格），剩下的是人生的取捨`
          : `${backpackSize} 格 → ${backpackSize + 2} 格　💰${upgradeCost}`}
      </button>

      {/* ── 賣 ── */}
      <h2 className="mt-4 text-sm font-black text-[#7A5C3D]">
        💸 收購區（點一下賣 1 個／裝備整件賣）
      </h2>
      <div className="mt-2 space-y-1.5">
        {backpack.length === 0 && (
          <p className="text-center text-xs text-[#A08A6F]">背包空空，沒東西可賣。</p>
        )}
        {backpack.map((it, i) => {
          if (it.type === 'equipment') {
            const eq = it.equipment
            // 阿嬤的怒吼非賣品（GDD §7.8.7）：顯示為禁售、點了也不會賣
            const protectedItem = eq.special === 'grandma_duster'
            return (
              <button
                key={`e${i}`}
                disabled={protectedItem}
                onClick={() => sellItem(i, 1)}
                className={`flex w-full items-center gap-2 rounded-xl p-2.5 text-left text-[11px] font-bold shadow-sm ${
                  protectedItem
                    ? 'bg-[#F4EFE6] text-[#A89A86]'
                    : 'bg-white text-[#5C4A36] active:scale-95'
                }`}
              >
                <span className="text-base">{eq.emoji}</span>
                <span className="min-w-0 flex-1 truncate">{eq.name}</span>
                {protectedItem ? (
                  <span className="rounded-full bg-[#E8DFD0] px-2 py-0.5 text-[10px] text-[#8A7A60]">
                    🚫 非賣品
                  </span>
                ) : (
                  <span className="text-[#B8862F]">💰{equipmentValue(eq)}</span>
                )}
              </button>
            )
          }
          const m = MATERIALS[it.materialId]
          return (
            <button
              key={`m${i}`}
              onClick={() => sellItem(i, 1)}
              className="flex w-full items-center gap-2 rounded-xl bg-white p-2.5 text-left text-[11px] font-bold text-[#5C4A36] shadow-sm active:scale-95"
            >
              <span className="text-base">{materialEmoji(m)}</span>
              <span className="min-w-0 flex-1 truncate">
                {m.name} <span className="text-[#B8A488]">×{it.count}</span>
              </span>
              {m.rarity !== 'common' && (
                <span
                  className="rounded-full px-1.5 text-[9px] text-white"
                  style={{ background: RARITY_INFO[m.rarity].color }}
                >
                  {RARITY_INFO[m.rarity].name}
                </span>
              )}
              <span className="text-[#B8862F]">💰{sellPrice(m)}/個</span>
            </button>
          )
        })}
      </div>
    </div>
  )
}
