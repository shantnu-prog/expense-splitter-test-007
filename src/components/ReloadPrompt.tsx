import { useRegisterSW } from 'virtual:pwa-register/react'

export function ReloadPrompt() {
  const {
    offlineReady: [offlineReady, setOfflineReady],
    needRefresh: [needRefresh, setNeedRefresh],
    updateServiceWorker,
  } = useRegisterSW()

  const close = () => {
    setOfflineReady(false)
    setNeedRefresh(false)
  }

  if (!offlineReady && !needRefresh) return null

  return (
    <div
      role="alert"
      className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between rounded-xl glass-card px-4 py-3 shadow-lg"
    >
      <p className="text-sm text-white">
        {offlineReady ? 'App ready to work offline.' : 'New version available.'}
      </p>
      <div className="flex shrink-0 gap-2">
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="rounded-lg gradient-primary px-3 py-1.5 text-sm font-medium text-white press-scale"
          >
            Update
          </button>
        )}
        <button
          onClick={close}
          className="rounded-lg border border-white/10 px-3 py-1.5 text-sm text-gray-300 press-scale"
        >
          Close
        </button>
      </div>
    </div>
  )
}
