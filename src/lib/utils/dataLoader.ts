import { cacheAsyncFn } from "./cacheAsyncFn"

type DataLoaderFunction<T> = () => Promise<T>

/**
 * Loads data from multiple asynchronous functions and caches the results.
 *
 * @param loaders An array of tuples, each containing a unique identifier and the asynchronous function to be cached
 * @returns A promise that resolves to an array of the results from the cached functions
 *
 * @example
 * const [ethPrice, totalEthStaked, totalValueLocked] = await dataLoader([
 *   ['ethPrice', fetchEthPrice],
 *   ['totalEthStaked', fetchTotalEthStaked],
 *   ['totalValueLocked', fetchTotalValueLocked],
 * ]);
 */

export async function dataLoader<T extends unknown[]>(
  loaders: {
    [K in keyof T]: [string, DataLoaderFunction<T[K]>]
  },
  cacheTimeout: number = 1000 * 60 * 60 // 1 hour
): Promise<T> {
  const cachedLoaders = loaders.map(([key, loader]) => {
    const cachedLoader = cacheAsyncFn(key, loader, {
      cacheTimeout,
    })
    return async () => {
      try {
        return await cachedLoader()
      } catch (error) {
        console.error(`Error in dataLoader for key "${key}":`, error)
        throw error
      }
    }
  })

  const results = await Promise.all(cachedLoaders.map((loader) => loader()))
  return results as T
}