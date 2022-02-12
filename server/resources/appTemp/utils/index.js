import Path from 'path'
import axios from 'axios'
import { readConfig } from '../lib/backend-library/utils/index.js'
import { getDbByName } from '../lib/backend-library/databases/index.js'
export const cfgPath = Path.resolve('configs')
const mdlCfgPath = Path.join(cfgPath, 'models')
const dbCfgPath = Path.join(cfgPath, 'db')
export const db = await getDbByName(readConfig(mdlCfgPath).type, dbCfgPath)
export async function makeRequest(method, path) {
  const resp = await axios({
    method,
    url: path
  })
  if (resp.status !== 200) {
    return { error: resp.data ? JSON.stringify(resp.data) : resp.statusText }
  } else {
    return resp.data.result || resp.data.data
  }
}

