import { useGameStore, WAREHOUSE_SIZE } from '../store/gameStore'
import { ItemCell } from './items'

export default function WarehouseView() {
  const backpack = useGameStore((s) => s.backpack)
  const backpackSize = useGameStore((s) => s.backpackSize)
  const warehouse = useGameStore((s) => s.warehouse)
  const moveToWarehouse = useGameStore((s) => s.moveToWarehouse)
  const takeFromWarehouse = useGameStore((s) => s.takeFromWarehouse)

  return (
    <div className="mt-3">
      <p className="text-center text-[11px] text-[#A08A6F]">
        點背包物品 → 存進倉庫；點倉庫物品 → 拿回背包。
        <br />
        倉庫是全裝置共用的（之後的小號也看得到！）
      </p>

      <h2 className="mt-3 flex items-center gap-2 text-sm font-black text-[#7A5C3D]">
        🏬 倉庫
        <span className="rounded-full bg-[#FFF0D4] px-2 py-0.5 text-xs text-[#B8862F]">
          {warehouse.length}/{WAREHOUSE_SIZE}
        </span>
      </h2>
      <div className="mt-2 grid grid-cols-6 gap-1.5">
        {Array.from({ length: WAREHOUSE_SIZE }).map((_, i) => {
          const it = warehouse[i]
          if (!it) return <div key={i} className="aspect-square rounded-xl bg-[#F0E6D2]" />
          return <ItemCell key={i} item={it} onClick={() => takeFromWarehouse(i)} />
        })}
      </div>

      <h2 className="mt-4 flex items-center gap-2 text-sm font-black text-[#7A5C3D]">
        🎒 背包
        <span className="rounded-full bg-[#FFF0D4] px-2 py-0.5 text-xs text-[#B8862F]">
          {backpack.length}/{backpackSize}
        </span>
      </h2>
      <div className="mt-2 grid grid-cols-6 gap-1.5">
        {Array.from({ length: backpackSize }).map((_, i) => {
          const it = backpack[i]
          if (!it) return <div key={i} className="aspect-square rounded-xl bg-[#F7EBD3]" />
          return <ItemCell key={i} item={it} onClick={() => moveToWarehouse(i)} />
        })}
      </div>
    </div>
  )
}
