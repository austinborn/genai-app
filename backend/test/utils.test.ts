import { decodeMultiArray, getRandomSeed } from "../src/utils"

describe('getRandomSeed', () => {
  it('Generates a random seed correctly', () => {
    const seed1 = getRandomSeed()
    const seed2 = getRandomSeed()
    const seed3 = getRandomSeed()

    for (const seed of [seed1, seed2, seed3]) {
      expect(typeof seed).toEqual("string")
      expect(/-?\d+$/.test(seed)).toEqual(true)
    }

    expect(seed1).not.toEqual(seed2)
    expect(seed1).not.toEqual(seed3)
    expect(seed2).not.toEqual(seed3)
  })
})

describe('decodeMultiArray', () => {
  it('Decodes an array of lengths and an index into multiple indices', () => {
    const paramLengths = [3, 2, 3, 4, 5]

    expect(decodeMultiArray(0, paramLengths)).toEqual([0, 0, 0, 0, 0])
    expect(decodeMultiArray(3, paramLengths)).toEqual([0, 0, 0, 0, 3])
    expect(decodeMultiArray(5, paramLengths)).toEqual([0, 0, 0, 1, 0])
    expect(decodeMultiArray(33, paramLengths)).toEqual([0, 0, 1, 2, 3])
    expect(decodeMultiArray(67, paramLengths)).toEqual([0, 1, 0, 1, 2])
    expect(decodeMultiArray(99, paramLengths)).toEqual([0, 1, 1, 3, 4])
    expect(decodeMultiArray(119, paramLengths)).toEqual([0, 1, 2, 3, 4])
    expect(decodeMultiArray(219, paramLengths)).toEqual([1, 1, 1, 3, 4])
    expect(decodeMultiArray(239, paramLengths)).toEqual([1, 1, 2, 3, 4])
  })
})
