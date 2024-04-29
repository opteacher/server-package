import { db } from '../utils/index.js'

export default db.defineModel(
  'func',
  {
    name: db.PropTypes.String,
    label: db.PropTypes.String,
    args: [
      {
        name: db.PropTypes.String,
        label: db.PropTypes.String,
        ptype: db.PropTypes.String,
        remark: db.PropTypes.String,
        dftVal: db.PropTypes.Any
      }
    ],
    isAsync: db.PropTypes.Boolean,
    isStatic: db.PropTypes.Boolean,
    remark: db.PropTypes.String,
    flow: { type: db.PropTypes.Id, ref: 'node' }
  },
  {
    router: {
      methods: ['POST', 'DELETE', 'GET', 'LINK', 'PUT']
    }
  }
)
