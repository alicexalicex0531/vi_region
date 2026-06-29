import { HIDDEN_RECIPES } from '../data/equipment'
import { MATERIALS } from '../data/materials'
import { GRANDMA_TITLE, useGameStore } from '../store/gameStore'
import Modal from './Modal'

// 白裝配方圖鑑（GDD §7.8.6）：18 組隱藏白配方永久記錄
// 未解鎖 → 剪影「？？？」；解鎖 → 名稱/圖示/配方完全公開/小字
export default function Codex({ onClose }: { onClose: () => void }) {
  const discovered = useGameStore((s) => s.discovered)
  const grandmaClaimed = useGameStore((s) => s.grandmaClaimed)
  const total = HIDDEN_RECIPES.length
  const found = HIDDEN_RECIPES.filter((r) => discovered.includes(r.id)).length

  return (
    <Modal onClose={onClose}>
      <div className="text-center">
        <h3 className="text-base font-black text-[#5C4A36]">📖 白裝配方圖鑑</h3>
        <div className="mt-1 text-xs font-bold text-[#B8862F]">
          已發現 {found} / {total}
        </div>
        <div className="mx-auto mt-1 h-2 w-40 overflow-hidden rounded-full bg-[#EFE3CC]">
          <div
            className="h-full rounded-full bg-[#F5A623] transition-all"
            style={{ width: `${(found / total) * 100}%` }}
          />
        </div>
      </div>

      {/* 全收集獎勵狀態（GDD §7.8.7）*/}
      <div
        className={`mt-2 rounded-xl p-2 text-center text-[11px] font-bold ${
          grandmaClaimed ? 'bg-[#EAF6E3] text-[#3E7A42]' : 'bg-[#FFF4DC] text-[#A08A6F]'
        }`}
      >
        {grandmaClaimed ? (
          <>👵 全收集達成！稱號「{GRANDMA_TITLE}」＋武器「阿嬤的怒吼」入手</>
        ) : (
          <>集滿 18 組 → 解鎖稱號「{GRANDMA_TITLE}」＋武器「阿嬤的怒吼」👵🪶</>
        )}
      </div>

      <div className="mt-3 space-y-1.5">
        {HIDDEN_RECIPES.map((r) => {
          const unlocked = discovered.includes(r.id)
          const recipeText = r.ingredients.map((id) => MATERIALS[id]?.name ?? id).join(' ＋ ')
          return (
            <div
              key={r.id}
              className={`flex items-start gap-2 rounded-xl border-2 p-2 ${
                unlocked ? 'border-[#EFE3CC] bg-white' : 'border-transparent bg-[#F0EDE6]'
              }`}
            >
              <span className={`text-xl leading-none ${unlocked ? '' : 'opacity-30 grayscale'}`}>
                {unlocked ? r.emoji : '❔'}
              </span>
              <div className="min-w-0 flex-1">
                {unlocked ? (
                  <>
                    <div className="text-[12px] font-black text-[#5C4A36]">{r.name}</div>
                    <div className="text-[10px] text-[#7A6850]">🧩 {recipeText}</div>
                    <div className="text-[10px] text-[#B8A488] italic">「{r.suffix}」</div>
                  </>
                ) : (
                  <>
                    <div className="text-[12px] font-black text-[#C9B89D]">？？？</div>
                    <div className="text-[10px] text-[#C9B89D]">尚未發現這組神祕配方</div>
                  </>
                )}
              </div>
            </div>
          )
        })}
      </div>

      <button
        onClick={onClose}
        className="mt-3 w-full rounded-xl bg-[#F5A623] p-2.5 text-sm font-black text-white active:scale-95"
      >
        關閉
      </button>
    </Modal>
  )
}
