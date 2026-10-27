import { useEffect, useRef, type ReactNode } from 'react';
export function Dialog({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  const ref = useRef<HTMLDialogElement>(null);
  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    ref.current?.showModal();
    return () => { ref.current?.close(); previous?.focus(); };
  }, []);
  return <dialog ref={ref} className={wide ? 'dialog wide' : 'dialog'} aria-label={title} onCancel={e => { e.preventDefault(); onClose(); }}>
    <div className="dialog-top"><span className="eyebrow">THE ROAD & THE LETTERS</span><button onClick={onClose} aria-label="关闭窗口" className="icon-button">×</button></div>
    <h2>{title}</h2>{children}
  </dialog>;
}
