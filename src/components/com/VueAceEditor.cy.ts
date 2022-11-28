import VueAceEditor from './VueAceEditor.vue'

const imgPath = '/Users/Tallty/Projects/server-package/src/components/com/resources/images/'
const options = { force: true }

describe('<VueAceEditor /> - 样式', () => {
  it('渲染', () => {
    // see: https://test-utils.vuejs.org/guide/
    cy.mount(VueAceEditor, { attrs: { style: 'width: 1264px; height: 300px' }, props: { value: '' } })
    cy.get('div[data-cy-root]').matchImage({
      matchAgainstPath: `${imgPath}code_editor.png`
    })
  })

  it('输入文本', () => {
    cy.mount(VueAceEditor, { attrs: { style: 'width: 1167px; height: 300px' }, props: { value: '' } })
    cy.get('textarea.ace_text-input').clear(options).type('console.log()', options)
    cy.get('div[data-cy-root]').matchImage({
      matchAgainstPath: `${imgPath}ace_csllog.png`
    })
  })

  it.skip('输入多行复杂文本', () => {
    cy.mount(VueAceEditor, { attrs: { style: 'width: 1167px; height: 300px' }, props: { value: '' } }).then(({ wrapper }) => {
      cy.get('textarea.ace_text-input')
        .clear(options)
        .type('for (let i = 0; i < 10; ++i) {\n', options)
        .then(() => {
          console.log(wrapper.props('value'))
        })
    })
  })
})

describe('<VueAceEditor /> - Vue状态', () => {
  it('输入文本，检查是否双向同步', () => {
    cy.mount(VueAceEditor, { props: { value: 'abcd' } }).then(({ wrapper }) => {
      wrapper.setProps({ 'onUpdate:value': (value: string) => wrapper.setProps({ value }) })
      expect(wrapper.props('value')).to.eq('abcd')
      cy.get('textarea.ace_text-input')
        .clear(options)
        .wait(1000)
        .type('const a = 12\nconsole.log(a)', options)
        .then(() => {
          expect(wrapper.props('value')).to.eq('const a = 12\nconsole.log(a)')
        })
    })
  })

  it('禁用，检查输入', () => {
    cy.mount(VueAceEditor, { props: { value: 'abcd', disabled: true } }).then(({ wrapper }) => {
      wrapper.setProps({ 'onUpdate:value': (value: string) => wrapper.setProps({ value }) })
      expect(wrapper.props('value')).to.eq('abcd')
      cy.get('textarea.ace_text-input')
        .type('\nconsole.log("123")', options)
        .then(() => {
          expect(wrapper.props('value')).not.to.eq('abcd\nconsole.log("123")')
        })
    })
  })
})
