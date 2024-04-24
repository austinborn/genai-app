class Node {
  next?: Node
  previous?: Node
  id: string

  constructor(id: string, previous?: Node, next?: Node) {
    this.id = id
    this.previous = previous
    this.next = next
  }
}

export class MappedLinkedList {
  nodes: { [id: string]: Node }
  length: number
  head?: string
  tail?: string

  constructor() {
    this.nodes = {}
    this.length = 0
  }

  fetchNode(id?: string) {
    return id ? this.nodes[id] : undefined
  }

  prepend(id: string) {
    const node = new Node(id)
    this.nodes[id] = node

    const headNode = this.fetchNode(this.head)
    if (headNode) {
      headNode.previous = node
      node.next = headNode
    } else {
      this.tail = id
    }

    this.head = id
    this.length++
  }

  append(id: string) {
    const node = new Node(id)
    this.nodes[id] = node

    const tailNode = this.fetchNode(this.tail)
    if (tailNode) {
      tailNode.next = node
      node.previous = tailNode
    } else {
      this.head = id
    }

    this.tail = id
    this.length++
  }

  insertAfter(id: string, refId?: string) {
    const node = new Node(id)
    this.nodes[id] = node

    const refNode = this.fetchNode(refId ?? this.tail)
    if (refNode) {
      const nextNode = refNode.next
      if (nextNode) {
        nextNode.previous = node
        node.next = nextNode
      } else {
        this.tail = id
      }

      refNode.next = node
      node.previous = refNode
    } else {
      this.head = id
      this.tail = id
    }
    this.length++
  }

  remove(id: string) {
    const node = this.nodes[id]
    if (!node) return

    if (node.next) node.next.previous = node.previous
    if (node.previous) node.previous.next = node.next

    if (this.head === id) this.head = node.next?.id
    if (this.tail === id) this.tail = node.previous?.id

    delete this.nodes[id]
    this.length--
  }

  list(n?: number, start?: string) {
    const list: string[] = []
    let i = 0

    let node = this.fetchNode(start ?? this.head)
    while (node && (n === undefined || i < n)) {
      list.push(node.id)
      node = node.next
      i++
    }

    return list
  }

  getHead() {
    return this.fetchNode(this.head)
  }

  getTail() {
    return this.fetchNode(this.tail)
  }
}
