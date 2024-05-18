import Property from '@/types/property'
import Typo from '@/types/typo'
import { reqGet, reqPut } from '@/utils'

export default (typo: Typo) => ({
  all: () => reqGet('typo', typo.key, { copy: Typo.copy }).then(typ => typ.props),
  add: (prop: Property) =>
    reqPut('typo', typo.key, { props: prop }, { axiosConfig: { params: { _updMode: 'append' } } }),
  update: (prop: Property) => reqPut('typo', typo.key, { [`props[{id:${prop.key}}]`]: prop }),
  remove: (prop: Property) =>
    reqPut(
      'typo',
      typo.key,
      { [`props[{id:${prop.key}}]`]: null },
      { axiosConfig: { params: { _updMode: 'delete' } } }
    )
})
