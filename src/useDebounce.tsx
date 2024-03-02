import { useEffect, useMemo, useRef } from 'react'

// https://javascript.info/task/debounce
export function debounce(func: Function, ms: number) {
  let timeout: number | undefined
  return function () {
    clearTimeout(timeout)
    timeout = setTimeout(() => func(...arguments), ms)
  }
}

// https://www.developerway.com/posts/debouncing-in-react
export function useDebounce(callback: Function) {
  const ref = useRef<Function>()

  useEffect(() => {
    ref.current = callback
  }, [callback])

  const debouncedCallback = useMemo(() => {
    const func = () => {
      ref.current?.()
    }

    return debounce(func, 1000)
  }, [])

  return debouncedCallback
}
