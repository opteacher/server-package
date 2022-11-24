import '../../../cypress/support/component'
import ColorSelect from './ColorSelect.vue'

const imgPath = '/Users/Tallty/Projects/server-package/src/components/com/resources/images/'
const ColSel = '.color-select'
const ColValHexIpt = '.color-value .hex input'
const ColValRedIpt = '.color-value .rgba-r input'
const ColValGreenIpt = '.color-value .rgba-g input'
const ColValBlueIpt = '.color-value .rgba-b input'
const SatVal = '.saturation-value'
const SatValPoi = '.saturation-value .point'
const HueSld = '.hue-slider'
const MaxColValDiffThreshold = 255 / 5

function cmpColVal(input: JQuery<HTMLElement>, tgt: number = 255) {
  expect(Math.abs(tgt - (input.val() as number))).lessThan(MaxColValDiffThreshold)
}

describe('<ColorSelect style/>', () => {
  it('renders', () => {
    // see: https://test-utils.vuejs.org/guide/
    cy.mount(ColorSelect, { attrs: { style: 'width: 500px' } })
    cy.get(ColValHexIpt)
      .clear()
      .type('#CDCDCD')
      .get(ColSel)
      .matchImage({
        matchAgainstPath: `${imgPath}grey_color.png`
      })
  })
})

describe('<ColorSelect opera/>', () => {
  beforeEach(() => {
    cy.mount(ColorSelect, { attrs: { style: 'width: 500px' } })
  })

  it('select color', () => {
    const satVal = cy.$$(SatVal)
    const width = satVal.width() || 0
    const height = satVal.height() || 0
    // #FFFFFF
    cy.get(SatVal)
      .click(0, 0)
      .get(ColValRedIpt)
      .then(cmpColVal)
      .get(ColValGreenIpt)
      .then(cmpColVal)
      .get(ColValBlueIpt)
      .then(cmpColVal)
      .get(ColSel)
      .matchImage({
        matchAgainstPath: `${imgPath}white_color.png`
      })
    // #FF0000
    cy.get(SatVal)
      .click(width - 1, 0)
      .get(ColValRedIpt)
      .then(cmpColVal)
      .get(ColValGreenIpt)
      .then(input => cmpColVal(input, 0))
      .get(ColValBlueIpt)
      .then(input => cmpColVal(input, 0))
      .get(ColSel)
      .matchImage({
        matchAgainstPath: `${imgPath}red_color.png`
      })
    // #000000
    cy.get(SatVal)
      .click(Math.random() * width, height - 1)
      .get(ColValRedIpt)
      .then(input => cmpColVal(input, 0))
      .get(ColValGreenIpt)
      .then(input => cmpColVal(input, 0))
      .get(ColValBlueIpt)
      .then(input => cmpColVal(input, 0))
      .get(ColSel)
      .matchImage({
        matchAgainstPath: `${imgPath}black_color.png`
      })
  })

  it('change saturation color', () => {
    const hueSlider = cy.$$(HueSld)
    const hueWid = hueSlider.width() || 0
    const hueHgt = hueSlider.height() || 0
    cy.get(SatVal).then(saturation => cy.get(SatVal).click((saturation.width() || 0) - 1, 0))
    cy.get(HueSld)
      .click(hueWid * 0.17, hueHgt >> 1)
      .get(ColValRedIpt)
      .then(input => cmpColVal(input, 238))
      .get(ColValGreenIpt)
      .then(input => cmpColVal(input, 255))
      .get(ColValBlueIpt)
      .then(input => cmpColVal(input, 0))
      .get(ColSel)
      .matchImage({
        matchAgainstPath: `${imgPath}yellow_green_color.png`
      })
  })

  it('change color inputs', () => {
    const point = cy.$$(SatValPoi)
    const orgCss = point.attr('style')
    cy.get(ColValHexIpt)
      .clear()
      .type('#00FF00')
      .get(SatValPoi)
      .should('not.have.attr', 'style', orgCss)
      .get(ColSel)
      .matchImage({
        matchAgainstPath: `${imgPath}green_color.png`
      })
  })
})

describe('<ColorSelect vue/>', () => {
  it('color synchronized', () => {
    cy.mount(ColorSelect, { props: { color: '#FFFFFF' } }).then(({ wrapper }) => {
      expect(wrapper.props('color')).to.eq('#FFFFFF')
      wrapper.setProps({ 'onUpdate:color': (e: string) => wrapper.setProps({ color: e }) })
      cy.get(ColValHexIpt)
        .clear()
        .type('#00FF00')
        .then(() => {
          expect(wrapper.props('color')).to.eq('#00FF00')
        })
    })
  })

  it('identify preset', () => {
    cy.mount(ColorSelect, { props: { preset: ['#EEFF00'] } })
    cy.get('.preset li')
      .should('have.length', 1)
      .first()
      .should('have.css', 'background-color', 'rgb(238, 255, 0)')
  })
})
