import IconField from './IconField.vue'
import { Button, Input, Col, Row, Divider, Pagination, TabPane, Tabs, Modal } from 'ant-design-vue'
import 'ant-design-vue/dist/antd.css'

const components = {
  'a-button': Button,
  'a-input': Input,
  'a-col': Col,
  'a-row': Row,
  'a-divider': Divider,
  'a-pagination': Pagination,
  'a-tab-pane': TabPane,
  'a-tabs': Tabs,
  'a-modal': Modal
}

describe('<IconField /> - 渲染', () => {
  it('按钮', () => {
    // see: https://test-utils.vuejs.org/guide/
    cy.mount(IconField, {
      global: {
        components
      }
    })
  })

  it('对话框', () => {
    // 1152 × 677
    cy.mount(IconField, {
      global: {
        components
      }
    }).then(() => {
      cy.get('button.w-100').click()
    })
  })
})
