import Property from '@/types/property'
import Typo from '@/types/typo'
import { reqPut } from '@/utils'

export default (typo: Typo) => ({
  all: () => typo.props,
  add: (prop: Property) =>
    reqPut('typo', typo.key, { props: prop }, { axiosConfig: { params: { updMode: 'append' } } }),
  update: (prop: Property) => reqPut('typo', typo.key, { [`props[${prop.key}]`]: prop }),
  remove: (prop: Property) =>
    reqPut(
      'typo',
      typo.key,
      { [`props[${prop.key}]`]: null },
      { axiosConfig: { params: { updMode: 'delete' } } }
    )
})
