import Path from 'path'
import { readConfig } from '../lib/backend-library/utils/index.js'
import Mongo from '../lib/backend-library/databases/mongo.js'
import axios from 'axios'

export const cfgPath = Path.resolve('configs')

export const db = new Mongo(readConfig(Path.join(cfgPath, 'db'), true).mongo)

export function pickOrIgnore(obj, attrs, ignore = true) {
  return Object.fromEntries(Object.entries(obj).filter(([key]) => ignore ? !attrs.includes(key) : attrs.includes(key)))
}

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
