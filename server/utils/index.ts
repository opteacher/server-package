/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Path from 'path'
import { readConfig } from '../lib/backend-library/utils/index.js'
import { getDbByName } from '../lib/backend-library/databases/index.js'
import axios, { Method } from 'axios'

export const cfgPath = Path.resolve('configs')
const mdlCfgPath = Path.join(cfgPath, 'models')
const dbCfgPath = Path.join(cfgPath, 'db')

export const db = await getDbByName(readConfig(mdlCfgPath).type, dbCfgPath)

export function skipIgnores(obj: Record<string, any>, ignores: string[]): any {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => !ignores.includes(key)))
}

export async function makeRequest(method: Method, path: string) {
  const resp = await axios({
    method,
    url: path
  })
  if (resp.status !== 200) {
    return { error: resp.data ? JSON.stringify(resp.data) : resp.statusText }
  } else if (!resp.data) {
    return { error: '无返回体！' }
  } else {
    return resp.data.result || resp.data.data
  }
}

export function genDefault(type: string, dftVal?: any) {
  switch (type) {
    case 'Any':
      return dftVal || 'null'
    case 'String':
      return `'${dftVal || ''}'`
    case 'Number':
      return dftVal || '0'
    case 'Boolean':
      return typeof dftVal === 'undefined' ? 'false' : dftVal ? 'true' : 'false'
    case 'DateTime':
      return dftVal ? new Date(dftVal) : 'new Date()'
    case 'Array':
      return dftVal || '[]'
    case 'Object':
      return dftVal || '{}'
  }
}
