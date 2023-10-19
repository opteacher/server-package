import Path from 'path'
import axios from 'axios'
import { readConfig } from '../lib/backend-library/utils/index.js'
import { getDbByName } from '../lib/backend-library/databases/index.js'

export const cfgPath = Path.resolve('configs')

export const db = await getDbByName(
  process.env['models_type'] || readConfig(Path.join(cfgPath, 'models')).type,
  Path.join(cfgPath, 'db')
)

export async function makeRequest(method, path) {
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

export function pickOrIgnore(obj, attrs, ignore = true) {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => ignore ? !attrs.includes(key) : attrs.includes(key)))
}

export function genDefault(type, dftVal) {
  switch (type) {
    case 'Any':
      return dftVal || 'null'
    case 'String':
    case 'LongStr':
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
