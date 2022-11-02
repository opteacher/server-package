import { Cond } from '@/types'

export function validConds(
  formState: any,
  value: boolean | Cond[] | { [cmpRel: string]: Cond[] }
): boolean {
  if (typeof value === 'boolean') {
    return value as boolean
  } else if (value && value.length) {
    return (value as Cond[])
      .map((cond: Cond) => cond.isValid(formState))
      .reduce((a: boolean, b: boolean) => a && b)
  } else {
    let ret = 'OR' in value ? true : false
    for (const [cmpRel, conds] of Object.entries(value)) {
      ret =
        ret &&
        (conds as Cond[])
          .map((cond: Cond) => cond.isValid(formState))
          .reduce((a: boolean, b: boolean) => {
            switch (cmpRel) {
              case 'OR':
                return a || b
              case 'AND':
              default:
                return a && b
            }
          })
    }
    return ret
  }
}

export function getProp(obj: any, prop: string) {
  if (!prop) {
    return obj
  }
  if (prop.indexOf('.') === -1 && prop in obj) {
    prop += '.'
  }
  for (const p of prop.split('.')) {
    if (p === '') {
      continue
    } else if (p.endsWith(']')) {
      if (p.endsWith('}]')) {
        const result = /^(\w+)\[\{(\w+):("?\w+"?)\}\]$/.exec(p)
        if (!result || result.length < 4) {
          throw new Error()
        }
        const sub = result[1]
        const key = result[2]
        const val = result[3]
        obj = obj[sub].find((itm: any) => itm[key] == val)
      } else {
        const result = /^(\w+)\[(\d+)\]$/.exec(p)
        if (!result || result.length < 3) {
          throw new Error()
        }
        const sub = result[1]
        const idx = parseInt(result[2])
        obj = obj[sub][idx]
      }
    } else {
      obj = obj[p]
    }
  }
  return obj
}

export function setProp(
  obj: any,
  prop: string,
  value: any,
  callback = (base: any, key: any, value: any) => {
    base[key] = value
  }
) {
  if (!prop) {
    return obj
  }
  if (prop.indexOf('.') === -1 && prop in obj) {
    prop = '.' + prop
  }
  const ret = obj
  const props = prop.split('.')
  const lstIdx = props.length - 1
  for (let i = 0; i < props.length; ++i) {
    const p = props[i]
    if (p === '') {
      continue
    } else if (p.endsWith(']')) {
      if (p.endsWith('}]')) {
        const result = /^(\w+)\[\{(\w+):("?\w+"?)\}\]$/.exec(p)
        if (!result || result.length < 4) {
          throw new Error()
        }
        const sub = result[1]
        const key = result[2]
        const val = result[3]
        const idx = obj[sub].findIndex((itm: any) => itm[key] == val)
        if (idx === -1) {
          throw new Error()
        }
        if (i === lstIdx) {
          callback(obj[sub], idx, value)
        } else {
          obj = obj[sub][idx]
        }
      } else {
        const result = /^(\w+)\[(\d+)\]$/.exec(p)
        if (!result || result.length < 3) {
          throw new Error()
        }
        const sub = result[1]
        const idx = parseInt(result[2])
        if (i === lstIdx) {
          callback(obj[sub], idx, value)
        } else {
          obj = obj[sub][idx]
        }
      }
    } else if (i === lstIdx) {
      callback(obj, p, value)
    } else {
      obj = obj[p]
    }
  }
  return ret
}
