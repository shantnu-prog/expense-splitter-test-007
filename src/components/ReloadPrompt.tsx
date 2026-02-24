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
      className="fixed bottom-20 left-4 right-4 z-50 flex items-center justify-between rounded-lg bg-gray-800 px-4 py-3 shadow-lg"
    >
      <p className="text-sm text-white">
        {offlineReady ? 'App ready to work offline.' : 'New version available.'}
      </p>
      <div className="flex shrink-0 gap-2">
        {needRefresh && (
          <button
            onClick={() => updateServiceWorker(true)}
            className="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white"
          >
            Update
          </button>
        )}
        <button
          onClick={close}
          className="rounded border border-gray-600 px-3 py-1.5 text-sm text-gray-300"
        >
          Close
        </button>
      </div>
    </div>
  )
}
