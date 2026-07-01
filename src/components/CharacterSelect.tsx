import { useState } from 'react'
import { CLASSES } from '../data/classes'
import { MAX_CHARACTERS, useGameStore } from '../store/gameStore'
import Modal from './Modal'
import SaveManager from './SaveManager'

// 開頭選角畫面（GDD §3.2）：名字、職業、等級、💀死亡數；可建新角、可刪角（二次確認）
export default function CharacterSelect() {
  const roster = useGameStore((s) => s.roster)
  const enterCharacter = useGameStore((s) => s.enterCharacter)
  const deleteSlot = useGameStore((s) => s.deleteSlot)
  const startCreate = useGameStore((s) => s.startCreate)
  const [confirmIdx, setConfirmIdx] = useState<number | null>(null)
  const [saveOpen, setSaveOpen] = useState(false)

  const confirming = confirmIdx !== null ? roster[confirmIdx] : null

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 py-8">
      <div className="text-center">
        <div className="text-5xl">🎒</div>
        <h1 className="mt-2 text-3xl font-black text-[#7A5C3D]">背包又滿了</h1>
        <p className="mt-1 text-sm text-[#A08A6F]">
          冒險者宿舍（{roster.length}/{MAX_CHARACTERS}）
        </p>
      </div>

      <div className="flex w-full flex-col gap-3">
        {roster.map((slot, i) => {
          const c = slot.character
          const cls = CLASSES[c.classId]
          return (
            <div
              key={i}
              className="flex items-center gap-3 rounded-2xl border-4 border-transparent bg-white p-3.5 shadow-sm transition-all hover:border-[#F5D9A6]"
            >
              <button
                onClick={() => enterCharacter(i)}
                className="flex min-w-0 flex-1 items-center gap-3 text-left active:scale-95"
              >
                <span className="text-3xl">{cls.emoji}</span>
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-base font-black text-[#5C4A36]">
                    {c.name}
                  </span>
                  <span className="block text-xs font-bold text-[#B8862F]">
                    Lv{c.level} {cls.name}・💰{c.gold}
                  </span>
                </span>
                <span className="flex flex-col items-center rounded-xl bg-[#FDE8E4] px-2 py-1">
                  <span className="text-sm leading-none">💀</span>
                  <span className="text-xs font-black text-[#B5503E]">{c.deaths}</span>
                </span>
              </button>
              <button
                onClick={() => setConfirmIdx(i)}
                className="text-lg opacity-40 active:scale-90"
                aria-label="刪除角色"
              >
                🗑️
              </button>
            </div>
          )
        })}
      </div>

      <button
        onClick={startCreate}
        disabled={roster.length >= MAX_CHARACTERS}
        className="w-full rounded-2xl bg-[#F5A623] p-4 text-lg font-black text-white shadow-md transition-all enabled:active:scale-95 disabled:opacity-40"
      >
        {roster.length >= MAX_CHARACTERS ? '宿舍滿了！要先送走一位～' : '＋ 建立新冒險者'}
      </button>

      <button
        onClick={() => setSaveOpen(true)}
        className="w-full rounded-2xl bg-white p-3 text-sm font-black text-[#6F9E56] shadow-sm active:scale-95"
      >
        💾 存檔備份（匯出 / 匯入）
      </button>

      <p className="text-center text-[11px] leading-relaxed text-[#C9B89D]">
        🏬 倉庫與配方手冊全角色共用
        <br />
        ⚠️ 資料儲存在本機，清除瀏覽記錄會遺失角色（記得存檔備份！）
      </p>

      {/* 刪除二次確認（GDD §3.2：避免誤刪農三天的神角） */}
      {confirming && (
        <Modal onClose={() => setConfirmIdx(null)}>
          <p className="text-center text-base font-black text-[#B5503E]">
            真的要刪掉「{confirming.character.name}」嗎？
          </p>
          <p className="mt-1 text-center text-xs font-bold text-[#7A6850]">
            Lv{confirming.character.level}{' '}
            {CLASSES[confirming.character.classId].name}・背包裡的東西會一起消失！
            <br />
            （倉庫的東西會留下）
          </p>
          <div className="mt-3 flex gap-2">
            <button
              onClick={() => setConfirmIdx(null)}
              className="flex-1 rounded-xl bg-[#EFE3CC] p-2.5 text-sm font-bold text-[#7A6850] active:scale-95"
            >
              手滑了，不要
            </button>
            <button
              onClick={() => {
                deleteSlot(confirmIdx!)
                setConfirmIdx(null)
              }}
              className="flex-1 rounded-xl bg-[#E8604A] p-2.5 text-sm font-black text-white active:scale-95"
            >
              確定刪除 💀
            </button>
          </div>
        </Modal>
      )}

      {saveOpen && <SaveManager onClose={() => setSaveOpen(false)} />}
    </div>
  )
}
