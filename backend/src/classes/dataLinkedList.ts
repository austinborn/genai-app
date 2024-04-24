import { MappedLinkedList } from "./mappedLinkedList"

export class DataLinkedList<DataType extends any> {
  nodeData: { [id: string]: DataType }
  mappedLinkedList: MappedLinkedList

  constructor() {
    this.nodeData = {}
    this.mappedLinkedList = new MappedLinkedList()
  }

  fetchData(id: string ) {
    return this.nodeData[id]
  }

  fetchNodeWithData(id: string) {
    return { id, data: this.fetchData(id) }
  }

  prepend(id: string, data: DataType) {
    this.nodeData[id] = data
    this.mappedLinkedList.prepend(id)
  }

  append(id: string, data: DataType) {
    this.nodeData[id] = data
    this.mappedLinkedList.append(id)
  }

  insertAfter(id: string, data: DataType, refId?: string) {
    this.nodeData[id] = data
    this.mappedLinkedList.insertAfter(id, refId)
  }

  remove(id: string) {
    delete this.nodeData[id]
    this.mappedLinkedList.remove(id)
  }

  list(n?: number, start?: string) {
    const nodeList = this.mappedLinkedList.list(n, start)

    return nodeList.map(this.fetchNodeWithData.bind(this))
  }

  getHead() {
    const node = this.mappedLinkedList.getHead()
    return node && this.fetchNodeWithData(node.id)
  }

  getTail() {
    const node = this.mappedLinkedList.getTail()
    return node && this.fetchNodeWithData(node.id)
  }

  getLength() {
    return this.mappedLinkedList.length
  }
}
