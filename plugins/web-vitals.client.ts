import { onCLS, onFCP, onLCP, onTTFB } from 'web-vitals'
import type { Metric } from 'web-vitals'

export default defineNuxtPlugin(() => {
  const buffer: Array<{ name: string; value: number }> = []

  function collect(metric: Metric) {
    buffer.push({ name: metric.name, value: metric.value })
  }

  onCLS(collect)
  onFCP(collect)
  onLCP(collect)
  onTTFB(collect)

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden' && buffer.length) {
      const payload = buffer.splice(0)
      navigator.sendBeacon('/api/vitals', JSON.stringify(payload))
    }
  })
})
