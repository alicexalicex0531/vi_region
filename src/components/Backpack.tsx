import { useState } from 'react'
import { MATERIALS } from '../data/materials'
import { RARITY_INFO } from '../data/classes'
import { useGameStore } from '../store/gameStore'
import Modal from './Modal'
import { EquipmentCard, ItemCell, materialEmoji, materialKindLabel } from './items'

export default function Backpack() {
  const backpack = useGameStore((s) => s.backpack)
  const backpackSize = useGameStore((s) => s.backpackSize)
  const discardItem = useGameStore((s) => s.discardItem)
  const equip = useGameStore((s) => s.equip)
  const soak = useGameStore((s) => s.soak)
  const [selected, setSelected] = useState<number | null>(null)
  const [pickingWater, setPickingWater] = useState(false)

  const full = backpack.length >= backpackSize
  const item = selected !== null ? backpack[selected] : null

  const waterStacks = backpack
    .map((it, i) => ({ it, i }))
    .filter(
      (x) =>
        x.it.type === 'material' &&
        MATERIALS[x.it.materialId].kind === 'element' &&
        MATERIALS[x.it.materialId].element === 'water',
    )

  const close = () => {
    setSelected(null)
    setPickingWater(false)
  }

  return (
    <section className="mt-4">
      <h2 className="flex items-center gap-2 text-sm font-black text-[#7A5C3D]">
        🎒 背包
        <span
          className={`rounded-full px-2 py-0.5 text-xs ${
            full ? 'bg-[#E8604A] text-white' : 'bg-[#FFF0D4] text-[#B8862F]'
          }`}
        >
          {backpack.length}/{backpackSize}
        </span>
        {full && <span className="text-xs font-bold text-[#E8604A]">又滿了！！</span>}
      </h2>

      <div className="mt-2 grid grid-cols-5 gap-1.5">
        {Array.from({ length: backpackSize }).map((_, i) => {
          const it = backpack[i]
          if (!it) return <div key={i} className="aspect-square rounded-xl bg-[#F7EBD3]" />
          return <ItemCell key={i} item={it} onClick={() => setSelected(i)} />
        })}
      </div>

      {/* ── 素材詳情 ── */}
      {item && item.type === 'material' && (
        <Modal onClose={close}>
          {(() => {
            const m = MATERIALS[item.materialId]
            return (
              <div className="text-center">
                <div className="text-4xl">{materialEmoji(m)}</div>
                <div className="mt-1 text-base font-black text-[#5C4A36]">{m.name}</div>
                <div className="mt-1 flex justify-center gap-1.5 text-xs">
                  <span
                    className="rounded-full px-2 py-0.5 font-bold text-white"
                    style={{ background: RARITY_INFO[m.rarity].color }}
                  >
                    {RARITY_INFO[m.rarity].emoji} {RARITY_INFO[m.rarity].name}
                  </span>
                  <span className="rounded-full bg-[#FFF0D4] px-2 py-0.5 font-bold text-[#B8862F]">
                    {materialKindLabel(m)}
                  </span>
                </div>
                <p className="mt-2 text-xs text-[#A08A6F]">
                  {m.kind === 'white'
                    ? '可以亂合白裝、掛搞笑小字、做幸運道具，或賣商店換金幣。'
                    : m.kind === 'enhance'
                      ? '合成時丟一個進去，把 roll 下限再往上推！'
                      : '合成裝備的主料。去合成箱開獎吧！'}
                </p>
                <div className="mt-1 text-xs font-bold text-[#7A6850]">持有：{item.count} 個</div>
              </div>
            )
          })()}
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => {
                discardItem(selected!, 1)
                if (item.count <= 1) close()
              }}
              className="flex-1 rounded-xl bg-[#EFE3CC] p-2.5 text-xs font-bold text-[#7A6850] active:scale-95"
            >
              丟掉 1 個
            </button>
            <button
              onClick={() => {
                discardItem(selected!, item.count)
                close()
              }}
              className="flex-1 rounded-xl bg-[#FDE8E4] p-2.5 text-xs font-bold text-[#B5503E] active:scale-95"
            >
              整疊丟掉 🗑️
            </button>
            <button
              onClick={close}
              className="flex-1 rounded-xl bg-[#F5A623] p-2.5 text-xs font-black text-white active:scale-95"
            >
              關閉
            </button>
          </div>
        </Modal>
      )}

      {/* ── 裝備詳情 ── */}
      {item && item.type === 'equipment' && (
        <Modal onClose={close}>
          {!pickingWater ? (
            <>
              <EquipmentCard eq={item.equipment} />
              <div className="mt-3 flex gap-2">
                <button
                  onClick={() => {
                    equip(selected!)
                    close()
                  }}
                  className="flex-1 rounded-xl bg-[#6FBF73] p-2.5 text-xs font-black text-white active:scale-95"
                >
                  裝備！💪
                </button>
                {item.equipment.isWhite &&
                  item.equipment.slot === 'mainHand' &&
                  !item.equipment.soaked && (
                    <button
                      onClick={() => setPickingWater(true)}
                      className="flex-1 rounded-xl bg-[#4A9FE8] p-2.5 text-xs font-black text-white active:scale-95"
                    >
                      泡水 💧
                    </button>
                  )}
                {/* 阿嬤的怒吼丟不得（GDD §7.8.7）→ 不顯示丟掉鈕 */}
                {item.equipment.special !== 'grandma_duster' && (
                  <button
                    onClick={() => {
                      discardItem(selected!, 1)
                      close()
                    }}
                    className="flex-1 rounded-xl bg-[#FDE8E4] p-2.5 text-xs font-bold text-[#B5503E] active:scale-95"
                  >
                    丟掉 🗑️
                  </button>
                )}
                <button
                  onClick={close}
                  className="flex-1 rounded-xl bg-[#EFE3CC] p-2.5 text-xs font-bold text-[#7A6850] active:scale-95"
                >
                  關閉
                </button>
              </div>
            </>
          ) : (
            <>
              <h3 className="text-center text-sm font-black text-[#5C4A36]">
                💧 選一個水素材泡下去（一把只能泡一次，泡過定型！）
              </h3>
              <div className="mt-2 space-y-1.5">
                {waterStacks.length === 0 && (
                  <p className="text-center text-xs text-[#A08A6F]">
                    沒有水素材…B1 的露水兔和 B3 的湖泊在等你。
                  </p>
                )}
                {waterStacks.map(({ it, i }) => {
                  if (it.type !== 'material') return null
                  const m = MATERIALS[it.materialId]
                  return (
                    <button
                      key={i}
                      onClick={() => {
                        soak(selected!, it.materialId)
                        close()
                      }}
                      className="flex w-full items-center gap-2 rounded-xl bg-[#EAF4FD] p-2.5 text-xs font-bold text-[#33658A] active:scale-95"
                    >
                      💧 {m.name}
                      <span className="text-[#8FB8D8]">×{it.count}</span>
                      <span
                        className="ml-auto rounded-full px-1.5 text-[10px] text-white"
                        style={{ background: RARITY_INFO[m.rarity].color }}
                      >
                        {RARITY_INFO[m.rarity].name}
                      </span>
                    </button>
                  )
                })}
              </div>
              <button
                onClick={() => setPickingWater(false)}
                className="mt-3 w-full rounded-xl bg-[#EFE3CC] p-2.5 text-xs font-bold text-[#7A6850] active:scale-95"
              >
                返回
              </button>
            </>
          )}
        </Modal>
      )}
    </section>
  )
}
