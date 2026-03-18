const STYLES = {
  success: 'bg-emerald-500 dark:bg-emerald-600',
  error:   'bg-red-500 dark:bg-red-600',
  info:    'bg-slate-700 dark:bg-slate-600',
  delete:  'bg-red-500 dark:bg-red-600',
}

export default function ToastContainer({ toasts }) {
  if (!toasts.length) return null
  return (
    <div className="fixed top-4 left-1/2 -translate-x-1/2 z-50 flex flex-col gap-2 pointer-events-none items-center">
      {toasts.map((t) => (
        <div
          key={t.id}
          className={`animate-toast px-4 py-2.5 rounded-lg shadow-lg text-sm font-medium text-white ${STYLES[t.type] ?? STYLES.info}`}
        >
          {t.message}
        </div>
      ))}
    </div>
  )
}
