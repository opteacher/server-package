import Node from '../models/node.js'
import { db } from '../utils/index.js'

export async function temps () {
  const groups = {} as { [key: string]: any }
  for (const temp of await db.select(Node, {
    previous: { $exists: false },
    nexts: { $size: 0 },
  })) {
    if (!temp.group) {
      continue
    }
    if (!(temp.group in groups)) {
      groups[temp.group] = [temp]
    } else {
      groups[temp.group].push(temp)
    }
  }
  return groups
}

function skipIgnores (obj: { [key: string]: any }, ignores: string[]): any {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !ignores.includes(key)))
}

export async function newTemp (node: any): Promise<any> {
  const temp = await db.select(Node, {
    group: node.group,
    previous: { $exists: false },
    nexts: { $size: 0 },
  })
  if (temp.length) {
    return db.save(Node, skipIgnores(node, ['previous', 'nexts']), { _index: temp[0]._id })
  } else {
    return db.save(Node, skipIgnores(node, ['previous', 'nexts']), { group: node.group })
  }
}

export function temp (group: string): Promise<any> {
  return db.select(Node, {
    group,
    previous: { $exists: false },
    nexts: { $size: 0 },
  })
}
