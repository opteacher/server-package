import store from '@/store'
import Typo from '@/types/typo'
import { reqDelete, reqLink, reqPost, reqPut } from '@/utils'

export default {
  all: () => store.dispatch('project/refresh').then(() => store.getters['project/ins'].typos),
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
