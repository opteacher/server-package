import { Node, Mapper } from '../common'

export class EditNodeFormDlg {
  show: boolean
  mapper: Mapper
  current: Node

  constructor () {
    this.show = false
    this.mapper = new Mapper({
      type: {
        label: '节点类型',
        type: 'Select',
        options: [{
          title: '普通',
          value: 'normal'
        }, {
          title: '条件',
          value: 'condition'
        }, {
          title: '遍历',
          value: 'traversal'
        }]
      },
      code: {
        label: '代码',
        type: 'Textarea'
      }
    })
    this.current = new Node()
  }
}
