import store from '@/store'
import { mdlAPI as api } from '../apis'

export async function onFieldDropDown(e: DragEvent) {
  e.preventDefault()
  const instPos = (
    store.getters['model/dragOn'].startsWith('divider')
      ? store.getters['model/dragOn']
      : store.getters['model/divider']
  ).split('_')
  if (instPos.length !== 3) {
    return
  }
  const dragField = e.dataTransfer?.getData('text/plain') as string
  const insertPos = {
    field: instPos[2],
    pos: instPos[1] === 'top' ? 'before' : ('after' as 'before' | 'after')
  }
  if (dragField?.startsWith('compo_')) {
    api.form.fields.add({
      compoType: dragField.substring('compo_'.length),
      insertPos
    })
  } else {
    api.form.fields.insert({ dragField, insertPos })
  }
}
