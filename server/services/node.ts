import Node from '../models/node.js'
import { db, skipIgnores } from '../utils/index.js'

export function tempNodes () {
  return db.select(Node, { isTemp: true }, { ext: true })
}

export function newTemp (node: any): Promise<any> {
  return db.save(Node, skipIgnores(node, ['previous', 'nexts']))
}

export function tempByGrpAndTtl (group: string, title: string): Promise<any> {
  return db.select(Node, { group, title, isTemp: true }, { ext: true })
}
