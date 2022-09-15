import { Cond } from "@/types"

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
