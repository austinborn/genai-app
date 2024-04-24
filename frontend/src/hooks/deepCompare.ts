import { useMemo } from 'react'

const deepCompMemoize = (value: any) => {
  console.log({value})
  return JSON.stringify(value)
}

export const useMemoDeepComp = <T>(factory: () => T, deps?: React.DependencyList) => useMemo<T>(
  factory,
  deps?.map(deepCompMemoize)
)

export default {
  useMemoDeepComp
}
