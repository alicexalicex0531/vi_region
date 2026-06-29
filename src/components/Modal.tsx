import type { ReactNode } from 'react'

export default function Modal({
  children,
  onClose,
}: {
  children: ReactNode
  onClose?: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
      onClick={onClose}
    >
      <div
        className="pop-in max-h-[85vh] w-full max-w-sm overflow-y-auto rounded-2xl bg-[#FFFBF0] p-4 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {children}
      </div>
    </div>
  )
}
