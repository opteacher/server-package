/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { db } from '../utils/index.js'
import Property from '../models/property.js'
import Field from '../models/field.js'

export async function genField(pid: string, data: { model: string; label: string; type: string }) {
  const res = await db.select(Property, { _index: pid })
  if (res.field) {
    return db.select(Field, { _index: res.field })
  }
  return db.save(Field, {
    index: await db.max(Field, 'index', { model: data.model }),
    label: data.label,
    type: (() => {
      switch (data.type) {
        case 'String':
          return 'Input'
        case 'Number':
          return 'Number'
        case 'Boolean':
          return 'Checkbox'
        case 'DateTime':
          return 'DateTime'
        case 'Array':
          return 'EditList'
        default:
          return 'Text'
      }
    })()
  })
}
