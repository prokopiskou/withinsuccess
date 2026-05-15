type CacheEntry<T> = {
  value: T
  expiry: number
}

const cache = new Map<string, CacheEntry<any>>()

export function getCached<T>(key: string): T | null {
  const entry = cache.get(key)
  if (!entry) return null
  if (Date.now() > entry.expiry) {
    cache.delete(key)
    return null
  }
  return entry.value as T
}

export function setCached<T>(key: string, value: T, ttlSeconds: number = 300): void {
  cache.set(key, {
    value,
    expiry: Date.now() + ttlSeconds * 1000,
  })
}

export function clearCache(prefix?: string): void {
  if (!prefix) {
    cache.clear()
    return
  }
  for (const key of cache.keys()) {
    if (key.startsWith(prefix)) cache.delete(key)
  }
}
