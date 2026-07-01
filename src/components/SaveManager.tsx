import { useRef, useState } from 'react'
import { SAVE_KEY } from '../store/gameStore'
import Modal from './Modal'

// 匯出/匯入存檔（GDD §13.3）：localStorage 存本機，清瀏覽記錄會蒸發 → 讓玩家自行備份到雲端
// 兩種方式：檔案（電腦/安卓）＋ 文字（iPhone 也 100% 可用）

function todayStamp() {
  const d = new Date()
  const p = (n: number) => String(n).padStart(2, '0')
  return `${d.getFullYear()}${p(d.getMonth() + 1)}${p(d.getDate())}`
}

// 檢查貼上/選到的內容確實是本遊戲的存檔（避免匯入亂七八糟的東西）
function validateSave(text: string): { ok: true; data: string } | { ok: false; reason: string } {
  let parsed: unknown
  try {
    parsed = JSON.parse(text)
  } catch {
    return { ok: false, reason: '這段內容不是有效的存檔格式（JSON 壞掉了）' }
  }
  const obj = parsed as Record<string, unknown>
  const state = obj?.state as Record<string, unknown> | undefined
  if (!state || (!('roster' in state) && !('character' in state))) {
    return { ok: false, reason: '這不像是《背包又滿了》的存檔（找不到角色資料）' }
  }
  return { ok: true, data: text }
}

export default function SaveManager({ onClose }: { onClose: () => void }) {
  const fileRef = useRef<HTMLInputElement>(null)
  const [tab, setTab] = useState<'export' | 'import'>('export')
  const [pasteText, setPasteText] = useState('')
  const [msg, setMsg] = useState<string | null>(null)
  const [pending, setPending] = useState<string | null>(null) // 待確認覆蓋的存檔內容
  const [copied, setCopied] = useState(false)

  const currentSave = () => localStorage.getItem(SAVE_KEY)

  // ── 匯出 ──
  const downloadFile = () => {
    const save = currentSave()
    if (!save) {
      setMsg('目前沒有存檔可以匯出～先建個角色玩玩吧！')
      return
    }
    const blob = new Blob([save], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `背包又滿了_存檔_${todayStamp()}.json`
    document.body.appendChild(a)
    a.click()
    a.remove()
    URL.revokeObjectURL(url)
    setMsg('📥 已下載存檔檔案！記得上傳到妳的雲端空間備份～')
  }

  const copyText = async () => {
    const save = currentSave()
    if (!save) {
      setMsg('目前沒有存檔可以複製～')
      return
    }
    try {
      await navigator.clipboard.writeText(save)
      setCopied(true)
      setMsg('📋 已複製！貼到記事本 / 雲端筆記存起來就好～')
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setMsg('複製失敗，請改用下方的「全選文字」手動複製 👇')
    }
  }

  // ── 匯入 ──
  const tryImport = (text: string) => {
    const result = validateSave(text)
    if (!result.ok) {
      setMsg('❌ ' + result.reason)
      return
    }
    setPending(result.data) // 進入二次確認（會覆蓋現有進度）
    setMsg(null)
  }

  const onFilePicked = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    const reader = new FileReader()
    reader.onload = () => tryImport(String(reader.result ?? ''))
    reader.onerror = () => setMsg('❌ 讀取檔案失敗，換個檔案試試？')
    reader.readAsText(file)
    e.target.value = '' // 允許重選同一個檔
  }

  const confirmImport = () => {
    if (!pending) return
    localStorage.setItem(SAVE_KEY, pending)
    // 重新整理讓遊戲重新讀取存檔（zustand persist 在載入時 rehydrate）
    window.location.reload()
  }

  const currentSaveText = currentSave() ?? ''

  return (
    <Modal onClose={onClose}>
      <h3 className="text-center text-base font-black text-[#5C4A36]">💾 存檔備份</h3>
      <p className="mt-1 text-center text-[11px] leading-relaxed text-[#A08A6F]">
        存檔放在<b>這台裝置的瀏覽器</b>裡，清除瀏覽記錄會不見。
        <br />
        匯出備份到妳的雲端（Google 雲端硬碟 / 記事本…），換裝置或清資料後就能匯回來！
      </p>

      <div className="mt-3 flex gap-1.5">
        <button
          onClick={() => {
            setTab('export')
            setMsg(null)
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-black ${
            tab === 'export' ? 'bg-[#7A5C3D] text-white' : 'bg-[#FFF4DC] text-[#7A6850]'
          }`}
        >
          📤 匯出（備份）
        </button>
        <button
          onClick={() => {
            setTab('import')
            setMsg(null)
          }}
          className={`flex-1 rounded-xl py-2 text-xs font-black ${
            tab === 'import' ? 'bg-[#7A5C3D] text-white' : 'bg-[#FFF4DC] text-[#7A6850]'
          }`}
        >
          📥 匯入（還原）
        </button>
      </div>

      {tab === 'export' ? (
        <div className="mt-3 space-y-2">
          <button
            onClick={downloadFile}
            className="w-full rounded-xl bg-[#6FBF73] p-3 text-sm font-black text-white active:scale-95"
          >
            📥 下載存檔檔案（電腦 / 安卓）
          </button>
          <button
            onClick={copyText}
            className="w-full rounded-xl bg-[#4A9FE8] p-3 text-sm font-black text-white active:scale-95"
          >
            {copied ? '✓ 已複製！' : '📋 複製存檔文字（iPhone 推薦）'}
          </button>
          <details className="rounded-xl bg-[#FFF4DC] p-2">
            <summary className="cursor-pointer text-[11px] font-bold text-[#B8862F]">
              複製鈕沒反應？點這裡手動全選複製
            </summary>
            <textarea
              readOnly
              value={currentSaveText}
              onFocus={(e) => e.target.select()}
              className="mt-2 h-24 w-full rounded-lg border border-[#E0D3B8] bg-white p-2 text-[10px] text-[#7A6850]"
            />
          </details>
        </div>
      ) : (
        <div className="mt-3 space-y-2">
          <button
            onClick={() => fileRef.current?.click()}
            className="w-full rounded-xl bg-[#6FBF73] p-3 text-sm font-black text-white active:scale-95"
          >
            📂 選擇存檔檔案匯入
          </button>
          <input
            ref={fileRef}
            type="file"
            accept=".json,.txt,application/json,text/plain"
            onChange={onFilePicked}
            className="hidden"
          />
          <div className="text-center text-[11px] font-bold text-[#B8A488]">— 或貼上存檔文字 —</div>
          <textarea
            value={pasteText}
            onChange={(e) => setPasteText(e.target.value)}
            placeholder="把之前複製 / 備份的存檔文字貼在這裡…"
            className="h-24 w-full rounded-lg border-2 border-[#E0D3B8] bg-white p-2 text-[11px] text-[#5C4A36] outline-none focus:border-[#F5A623]"
          />
          <button
            onClick={() => tryImport(pasteText.trim())}
            disabled={pasteText.trim().length === 0}
            className="w-full rounded-xl bg-[#4A9FE8] p-3 text-sm font-black text-white active:scale-95 disabled:opacity-40"
          >
            📥 貼上並匯入
          </button>
          <p className="text-center text-[10px] text-[#C9B89D]">
            ⚠️ 匯入會覆蓋目前的進度，記得先把現在的存檔匯出備份！
          </p>
        </div>
      )}

      {msg && (
        <div className="mt-3 rounded-xl bg-[#FFF4DC] p-2.5 text-center text-[11px] font-bold text-[#7A6850]">
          {msg}
        </div>
      )}

      <button
        onClick={onClose}
        className="mt-3 w-full rounded-xl bg-[#EFE3CC] p-2.5 text-sm font-bold text-[#7A6850] active:scale-95"
      >
        關閉
      </button>

      {/* 匯入二次確認（覆蓋現有進度） */}
      {pending && (
        <div
          className="fixed inset-0 z-[60] flex items-center justify-center bg-black/50 p-4"
          onClick={() => setPending(null)}
        >
          <div
            className="pop-in w-full max-w-xs rounded-2xl border-4 border-[#E8604A] bg-[#FFFBF0] p-4"
            onClick={(e) => e.stopPropagation()}
          >
            <p className="text-center text-sm font-black text-[#B5503E]">
              確定要匯入這份存檔嗎？
              <br />
              <span className="text-xs font-bold">目前這台裝置的進度會被覆蓋掉！</span>
            </p>
            <div className="mt-3 flex gap-2">
              <button
                onClick={() => setPending(null)}
                className="flex-1 rounded-xl bg-[#EFE3CC] p-2.5 text-xs font-bold text-[#7A6850] active:scale-95"
              >
                先不要
              </button>
              <button
                onClick={confirmImport}
                className="flex-1 rounded-xl bg-[#E8604A] p-2.5 text-xs font-black text-white active:scale-95"
              >
                確定匯入並重載 🔄
              </button>
            </div>
          </div>
        </div>
      )}
    </Modal>
  )
}
