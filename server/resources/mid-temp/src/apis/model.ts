import { reqGet } from '@/utils'
import Model from '../types/model'

const expDft = {
  detail: (key: any) => reqGet('model', key).then((mdl: any) => Model.copy(mdl))
}

export default expDft
