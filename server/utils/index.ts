import Path from 'path'
import { readConfig } from '../lib/backend-library/utils/index.js'
import { getDbByName } from '../lib/backend-library/databases/index.js'

export const cfgPath = Path.resolve('configs')
const mdlCfgPath = Path.join(cfgPath, 'models')
const dbCfgPath = Path.join(cfgPath, 'db')

export const db = await getDbByName(readConfig(mdlCfgPath).type, dbCfgPath)

export function skipIgnores (obj: { [key: string]: any }, ignores: string[]): any {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !ignores.includes(key)))
}
