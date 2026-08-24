import type { ReactNode } from "react";

interface Props {
  title: string;
  onClose: () => void;
  children: ReactNode;
}

export default function Modal({ title, onClose, children }: Props) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="scrollbar-thin max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-surface p-6"
      >
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-lg font-semibold text-text">{title}</h3>
          <button onClick={onClose} className="text-text-dim hover:text-text">
            ✕
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}
