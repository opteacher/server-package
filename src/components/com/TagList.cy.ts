import TagList from './TagList.vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { Button, Tag } from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'

const emitter = new Emitter()

describe('<TagList />', () => {
  it('renders', () => {
    // see: https://test-utils.vuejs.org/guide/
    cy.mount(TagList, {
      global: {
        components: { 'a-button': Button, 'a-tag': Tag }
      },
      props: {
        field: {
          type: 'TagList',
          emitter,
          lvMapper: {}
        },
        value: []
      }
    })
  })
})
