import { db } from '../utils/index.js'

export default db.defineModel(
  'component',
  {
    name: db.PropTypes.String,
    ctype: db.PropTypes.String, // String-input/Number-Number/String-Select/Array-Cascader/String-Textarea/Boolean|Array-Checkbox/Boolean-Switch/String-Radio/Array-List/String-Color/String-Icon
    category: db.PropTypes.String, // field/display/container
    extra: [
      {
        label: db.PropTypes.String,
        desc: db.PropTypes.String,
        ftype: db.PropTypes.String, // Button/Input/Number/Select/Cascader/Textarea/Checkbox/Switch/Radio/EditList/Color/Icon
        refer: db.PropTypes.String,
        placeholder: db.PropTypes.String,
        extra: db.PropTypes.Object
      }
    ]
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'GET', 'PUT']
    }
  }
)
