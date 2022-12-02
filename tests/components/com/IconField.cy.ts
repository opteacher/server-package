import IconField from '@/components/com/IconField.vue'
import {
  Button,
  Input,
  Col,
  Row,
  Divider,
  Pagination,
  TabPane,
  Tabs,
  Modal
} from 'ant-design-vue'
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
const imgPath = '/Users/Tallty/Projects/server-package/src/components/com/resources/images/'

describe('<IconField /> - 样式', () => {
  it('按钮', () => {
    // see: https://test-utils.vuejs.org/guide/
    cy.mount(IconField, { global: { components } })
  })

  it('对话框', () => {
    // 1152 × 677
    cy.mount(IconField, { global: { components } })
    cy.get('button.w-100').click()
    cy.get('.ant-modal')
      .then($el => {
        $el.width('1152px')
        $el.height('677px')
      })
      .matchImage({
        matchAgainstPath: `${imgPath}icon_dialog.png`
      })
  })

  it.only('搜索图标', () => {
    cy.mount(IconField, { global: { components } })
    cy.get('button.w-100').click().get('.ant-modal-body input').first().type('user')
  })
})
