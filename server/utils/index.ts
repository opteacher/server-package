import path from 'path'
import { readConfig } from '../lib/backend-library/utils/index.js'
import { getDbByName } from '../lib/backend-library/databases/index.js'

export const cfgPath = path.resolve('..', 'configs')
const mdlCfgPath = path.resolve(cfgPath, 'models')
const dbCfgPath = path.resolve(cfgPath, 'db')

export const db = await getDbByName(readConfig(mdlCfgPath).type, dbCfgPath)
