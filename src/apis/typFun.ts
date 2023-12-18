import Typo, { Func } from '@/types/typo'
import { pickOrIgnore, reqGet, reqPut } from '@/utils'

export default (typo: Typo) => ({
  all: () => reqGet('typo', typo.key, { copy: Typo.copy }).then(typ => typ.funcs),
  add: (func: Func) =>
    reqPut(
      'typo',
      typo.key,
      { funcs: pickOrIgnore(func, ['flow']) },
      { axiosConfig: { params: { updMode: 'append' } } }
    ),
  update: (func: Func) =>
    reqPut('typo', typo.key, { [`funcs[{id:${func.key}}]`]: pickOrIgnore(func, ['flow']) }),
  remove: (func: Func) =>
    reqPut(
      'typo',
      typo.key,
      { [`funcs[{id:${func.key}}]`]: null },
      { axiosConfig: { params: { updMode: 'delete' } } }
    )
})
