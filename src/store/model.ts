/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Model from '@/types/model'
import router from '@/router'
import { reqAll, reqGet, reqPost } from '@/utils'
import { ExpClsForm } from '../views/Project'
import Compo from '@/types/compo'
import Field from '@/types/field'

type ModelState = {
  model: Model
  dataset: any[]
  compos: Compo[]
  fields: Record<string, Field>
  dragOn: string
  divider: string
}

export default {
  namespaced: true,
  state: {
    model: new Model(),
    dataset: [] as any[],
    compos: [] as Compo[],
    fields: {} as Record<string, Field>,
    dragOn: '',
    divider: ''
  },
  mutations: {
    SET_DRAG_ON(state: ModelState, payload: string) {
      state.dragOn = payload
    },
    SET_DIVIDER(state: ModelState, payload: string) {
      state.divider = payload
    }
  },
  actions: {
    async refresh({ state }: { state: ModelState }, options?: { reqDataset?: boolean }) {
      const mid = router.currentRoute.value.params.mid
      Model.copy(await reqGet('model', mid), state.model)
      state.compos = (await reqAll('component')).map((compo: any) => Compo.copy(compo))
      const fields = await Promise.all(
        state.model.props.map(prop =>
          reqPost(`property/${prop.key}/field`, prop).then(res => Field.copy(res))
        )
      )
      state.fields = Object.fromEntries(fields.map(field => [field.key, field]))
      state.dragOn = ''
      if (options && options.reqDataset) {
        const pid = router.currentRoute.value.params.pid
        state.dataset = await reqGet('project', `${pid}/model/${mid}/data`, { type: 'api' })
      }
    },
    async export(_store: { state: ModelState }, expCls: ExpClsForm) {
      const pid = router.currentRoute.value.params.pid
      const result = await reqPost(`project/${pid}/model/${expCls.key}/export`, expCls, {
        type: 'api'
      })

      const link = document.createElement('a')
      const body = document.querySelector('body')

      // 创建对象url
      link.href = window.URL.createObjectURL(new Blob([result.content]))
      link.download = result.fileName

      // fix Firefox
      link.style.display = 'none'
      body?.appendChild(link)

      link.click()
      body?.removeChild(link)

      // 通过调用 URL.createObjectURL() 创建的 URL 对象
      window.URL.revokeObjectURL(link.href)
    }
  },
  getters: {
    ins: (state: ModelState): Model => state.model,
    dataset: (state: ModelState): any[] => state.dataset,
    compos: (state: ModelState): Compo[] => state.compos,
    fields: (state: ModelState): Record<string, Field> => state.fields,
    dragOn: (state: ModelState): string => state.dragOn,
    divider: (state: ModelState): string => state.divider
  }
}
