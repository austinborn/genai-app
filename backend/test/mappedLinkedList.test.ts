import { MappedLinkedList } from "../src/classes/mappedLinkedList"

describe('MappedLinkedList', () => {
  it('Appends correctly', () => {
    const linkedList = new MappedLinkedList()

    const nodes = ['1', '2', '3']

    for (const node of nodes) linkedList.append(node)

    expect(linkedList.list()).toEqual(nodes)
  })

  it('Prepends correctly', () => {
    const linkedList = new MappedLinkedList()

    const nodes = ['1', '2', '3']

    for (const node of nodes) linkedList.prepend(node)

    expect(linkedList.list()).toEqual(nodes.reverse())
  })

  it('Removes correctly from beginning', () => {
    const linkedList = new MappedLinkedList()

    const nodes = ['1', '2', '3']

    for (const node of nodes) linkedList.append(node)

    linkedList.remove('1')

    expect(linkedList.list()).toEqual(['2', '3'])
  })

  it('Removes correctly from center', () => {
    const linkedList = new MappedLinkedList()

    const nodes = ['1', '2', '3']

    for (const node of nodes) linkedList.append(node)

    linkedList.remove('2')

    expect(linkedList.list()).toEqual(['1', '3'])
  })

  it('Removes correctly from end', () => {
    const linkedList = new MappedLinkedList()

    const nodes = ['1', '2', '3']

    for (const node of nodes) linkedList.append(node)

    linkedList.remove('3')

    expect(linkedList.list()).toEqual(['1', '2'])
  })

  it('Inserts correctly after first element', () => {
    const linkedList = new MappedLinkedList()

    const nodes = ['1', '2', '3']

    for (const node of nodes) linkedList.append(node)

    linkedList.insertAfter('4', '1')

    expect(linkedList.list()).toEqual(['1', '4', '2', '3'])
  })

  it('Inserts correctly after last element', () => {
    const linkedList = new MappedLinkedList()

    const nodes = ['1', '2', '3']

    for (const node of nodes) linkedList.append(node)

    linkedList.insertAfter('4', '3')

    expect(linkedList.list()).toEqual(['1', '2', '3', '4'])
  })

  it('Inserts correctly if no reference element given', () => {
    const linkedList = new MappedLinkedList()

    const nodes = ['1', '2', '3']

    for (const node of nodes) linkedList.append(node)

    linkedList.insertAfter('4')

    expect(linkedList.list()).toEqual(['1', '2', '3', '4'])
  })
})
