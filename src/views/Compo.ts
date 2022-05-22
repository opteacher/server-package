import Column from '@/types/column'
import Mapper from '@/types/mapper'

export const columns = [new Column('组件名', 'name'), new Column('封面', 'cover')]

export const mapper = new Mapper({
  name: {
    label: '组件名',
    type: 'Input'
  },
  cover: {
    label: '封面',
    type: 'Upload'
  }
})
