/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

import { TinyEmitter } from 'tiny-emitter'
import { BaseTypes } from './types'
import dayjs from 'dayjs'

/* eslint-disable @typescript-eslint/no-explicit-any */
export * from '@lib/utils'

export function downloadFile(resp: any) {
  const link = document.createElement('a')
  // 创建对象url
  let data = resp.data
  if (resp.headers['content-type'].startsWith('application/json')) {
    data = JSON.stringify(data)
  }
  link.href = window.URL.createObjectURL(
    new Blob([data], { type: resp.headers['content-type'] })
  )
  const filename = window.decodeURI(resp.headers['content-disposition'].split('=')[1])
  link.download = filename.substring(
    filename.startsWith('"') ? 1 : 0,
    filename.endsWith('"') ? filename.length - 1 : undefined
  )
  link.style.display = 'none'
  link.click()
  link.remove()
}

export function newOne<T>(t: { new (): T }): T {
  return new t()
}

export function updDftByType(typ: BaseTypes, emitter: TinyEmitter, options?: { prefix?: string; dftVal?: any }) {
  const prefix = options?.prefix || ''
  switch (typ) {
    case 'Number':
      emitter.emit('update:dprop', { dftVal: options?.dftVal || 0 })
      emitter.emit('update:mprop', { [`${prefix}dftVal.type`]: 'Number' })
      break
    case 'String':
    case 'Unknown':
    case 'Id':
    case 'Any':
      emitter.emit('update:dprop', { dftVal: options?.dftVal || '' })
      emitter.emit('update:mprop', { [`${prefix}dftVal.type`]: 'Input' })
      break
    case 'LongStr':
      emitter.emit('update:dprop', { dftVal: options?.dftVal || '' })
      emitter.emit('update:mprop', { [`${prefix}dftVal.type`]: 'Textarea' })
      break
    case 'Array':
      emitter.emit('update:dprop', { dftVal: options?.dftVal || [] })
      emitter.emit('update:mprop', {
        [`${prefix}dftVal.type`]: 'EditList',
        [`${prefix}dftVal.mapper`]: {
          value: {
            type: 'Input'
          }
        },
        [`${prefix}dftVal.inline`]: true,
        [`${prefix}dftVal.flatItem`]: true
      })
      break
    case 'Boolean':
      emitter.emit('update:dprop', { dftVal: options?.dftVal || false })
      emitter.emit('update:mprop', { [`${prefix}dftVal.type`]: 'Checkbox' })
      break
    case 'DateTime':
      emitter.emit('update:dprop', { dftVal: options?.dftVal || dayjs() })
      emitter.emit('update:mprop', { [`${prefix}dftVal.type`]: 'DateTime' })
      break
    case 'Object':
      emitter.emit('update:dprop', { dftVal: options?.dftVal || {} })
      emitter.emit('update:mprop', { [`${prefix}dftVal.type`]: 'JsonEditor' })
      break
    case 'Function':
      emitter.emit('update:dprop', { dftVal: options?.dftVal || 'return () => {}' })
      emitter.emit('update:mprop', { [`${prefix}dftVal.type`]: 'CodeEditor' })
      break
  }
}