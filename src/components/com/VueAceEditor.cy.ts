import VueAceEditor from './VueAceEditor.vue'

const imgPath = '/Users/Tallty/Projects/server-package/src/components/com/resources/images/'

describe('<VueAceEditor style />', () => {
  it('renders', () => {
    // see: https://test-utils.vuejs.org/guide/
    cy.mount(VueAceEditor, { attrs: { style: 'width: 1167.83px' } })
    cy.get('div[data-cy-root]').matchImage({
      matchAgainstPath: `${imgPath}code_editor.png`
    })
  })
})

describe('<VueAceEditor opera />', () => {
  it('input something', () => {
    cy.mount(VueAceEditor, { attrs: { style: 'width: 1167.83px' } })
    cy.get('textarea.ace_text-input').clear().type('console.log()')
  })
})
