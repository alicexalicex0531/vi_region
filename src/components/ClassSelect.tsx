import { useState } from 'react'
import type { ClassId } from '../types'
import { CLASSES } from '../data/classes'
import { useGameStore } from '../store/gameStore'

export default function ClassSelect() {
  const createCharacter = useGameStore((s) => s.createCharacter)
  const cancelCreate = useGameStore((s) => s.cancelCreate)
  const hasRoster = useGameStore((s) => s.roster.length > 0)
  const [classId, setClassId] = useState<ClassId | null>(null)
  const [name, setName] = useState('')

  const canStart = classId !== null && name.trim().length > 0

  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-5 py-8">
      {hasRoster && (
        <button
          onClick={cancelCreate}
          className="self-start rounded-full bg-white px-3 py-1.5 text-xs font-bold text-[#7A6850] shadow-sm active:scale-95"
        >
          ← 回選角列表
        </button>
      )}
      <div className="text-center">
        <div className="text-5xl">🎒</div>
        <h1 className="mt-2 text-3xl font-black text-[#7A5C3D]">背包又滿了</h1>
        <p className="mt-1 text-sm text-[#A08A6F]">一個專治背包焦慮的奇幻可愛地下城農農樂</p>
      </div>

      <div className="flex w-full flex-col gap-3">
        {Object.values(CLASSES).map((c) => (
          <button
            key={c.id}
            onClick={() => setClassId(c.id)}
            className={`flex items-center gap-4 rounded-2xl border-4 bg-white p-4 text-left transition-all ${
              classId === c.id
                ? 'border-[#F5A623] shadow-md'
                : 'border-transparent shadow-sm hover:border-[#F5D9A6]'
            }`}
          >
            <span className="text-4xl">{c.emoji}</span>
            <span className="flex-1">
              <span className="block text-lg font-bold text-[#5C4A36]">
                {c.name}
                <span className="ml-2 rounded-full bg-[#FFF0D4] px-2 py-0.5 text-xs font-semibold text-[#B8862F]">
                  {c.mainStatName}
                </span>
              </span>
              <span className="block text-xs text-[#A08A6F]">{c.desc}</span>
              <span className="mt-1 block text-[11px] text-[#B8A488]">
                HP {c.baseHp}・ATK {c.baseAtk}・DEF {c.baseDef}・{c.mainStatName} {c.baseMain}
              </span>
            </span>
            {classId === c.id && <span className="text-2xl">✅</span>}
          </button>
        ))}
      </div>

      <input
        value={name}
        maxLength={8}
        onChange={(e) => setName(e.target.value)}
        placeholder="幫冒險者取個名字（最多8字）"
        className="w-full rounded-2xl border-4 border-[#F5D9A6] bg-white p-3 text-center text-base font-bold text-[#5C4A36] outline-none placeholder:font-normal placeholder:text-[#C9B89D] focus:border-[#F5A623]"
      />

      <button
        disabled={!canStart}
        onClick={() => classId && createCharacter(classId, name.trim())}
        className="w-full rounded-2xl bg-[#F5A623] p-4 text-lg font-black text-white shadow-md transition-all enabled:active:scale-95 disabled:opacity-40"
      >
        出發進地下城！⛏️
      </button>

      <p className="text-center text-[11px] leading-relaxed text-[#C9B89D]">
        ⚠️ 資料儲存在本機，清除瀏覽記錄會遺失角色
      </p>
    </div>
  )
}
