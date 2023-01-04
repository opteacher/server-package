/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import store from '@/store'
import Service from './types/service'
import Property from './types/property'

export * from '@lib/utils'

export function genMdlPath(svc: Service): string {
  const model = store.getters['model/ins']
  const relProp = model.props.find((prop: Property) => prop.relative && prop.relative.model)
  const mname = model.name
  switch (svc.method) {
    case 'LINK':
      return relProp ? `/mdl/v1/${mname}/:index/${relProp.name}/:propIdx` : ''
    case 'POST':
      return `/mdl/v1/${mname}`
    case 'DELETE':
    case 'PUT':
    case 'GET':
      return `/mdl/v1/${mname}/:index`
    default:
      return ''
  }
}
