import { db } from '../../utils/index.js'

export default db.defineModel('model1',
  {
    username: db.PropTypes.String,
    password: db.PropTypes.String,
    role: db.PropTypes.String
  },
  {
    router: {
      methods: ['ALL', ]
    }
  }
)
