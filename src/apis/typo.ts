import store from '@/store'
import Typo, { Func } from '@/types/typo'
import { reqDelete, reqGet, reqLink, reqPost, reqPut } from '@/utils'

export default {
  all: (): Promise<Typo[]> =>
    store.dispatch('project/refresh').then(() => store.getters['project/ins'].typos),
  get: (key: string): Promise<Typo> => reqGet('typo', key, { copy: Typo.copy }),
  add: async (typo: Typo) => {
    const { key } = await reqPost('typo', typo, { copy: Typo.copy, ignores: ['funcs'] })
    await reqLink({ parent: ['project', store.getters['project/key']], child: ['typos', key] })
    for (const func of typo.funcs) {
      const { key } = await reqPost('func', func, { copy: Func.copy })
      await reqLink({ parent: ['typo', key], child: ['funcs', key] })
    }
  },
  update: async (typo: Typo) => {
    await reqPut('typo', typo.key, typo, { ignores: ['funcs'] })
    const exsFunKeys = store.getters['project/ins'].typos
      .find((typ: Typo) => typ.key === typo.key)
      ?.funcs.map((func: Func) => func.key)
    for (const funKey of exsFunKeys) {
      if (!typo.funcs.map(fun => fun.key).includes(funKey)) {
        await reqDelete('func', funKey)
        await reqLink({ parent: ['typo', typo.key], child: ['funcs', funKey] }, false)
      }
    }
    const fids = new Set(exsFunKeys)
    for (const func of typo.funcs) {
      if (fids.has(func.key)) {
        await reqPut('func', func.key, func, { ignores: ['flow'] })
      } else {
        const { key } = await reqPost('func', func, { copy: Func.copy, ignores: ['flow'] })
        await reqLink({ parent: ['typo', typo.key], child: ['funcs', key] })
      }
    }
  },
  remove: async (typo: Typo) => {
    await Promise.all(typo.funcs.map(func => reqDelete('func', func.key)))
    await reqLink(
      { parent: ['project', store.getters['project/key']], child: ['typos', typo.key] },
      false
    )
  }
}
