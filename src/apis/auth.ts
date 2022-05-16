import store from '@/store'
import { reqPut } from '@/utils'

export default {
  save: (data: { model: string; skips?: string[] }) =>
    reqPut(
      'project',
      store.getters['project/ins'].key,
      { auth: data },
      { query: { updMode: 'merge' } }
    )
}
