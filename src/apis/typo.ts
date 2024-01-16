import store from '@/store'
import Typo from '@/types/typo'
import { reqDelete, reqGet, reqLink, reqPost, reqPut } from '@/utils'

export default {
  all: (): Promise<Typo[]> =>
    store.dispatch('project/refresh').then(() => store.getters['project/ins'].typos),
  get: (key: string): Promise<Typo> => reqGet('typo', key, { copy: Typo.copy }),
  add: (typo: Typo) =>
    reqPost('typo', typo, { copy: Typo.copy }).then(({ key }) =>
      reqLink({ parent: ['project', store.getters['project/key']], child: ['typos', key] })
    ),
  update: (typo: Typo) => reqPut('typo', typo.key, typo),
  remove: (typo: Typo) =>
    reqDelete('typo', typo.key).then(({ key }) =>
      reqLink({ parent: ['project', store.getters['project/key']], child: ['typos', key] }, false)
    )
}
