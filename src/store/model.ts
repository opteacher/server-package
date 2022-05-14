/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Model from '@/types/model'
import router from '@/router'
import { reqAll, reqPut } from '@/utils'
import Compo from '@/types/compo'
import { Dispatch } from 'vuex'
import Column from '@/types/column'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Project from '@/types/project'
import { Modal } from 'ant-design-vue'
import { mdlAPI } from '../apis'
import Form from '@/types/form'
import Field from '@/types/field'
import Table from '@/types/table'
import Cell from '@/types/cell'

type ModelState = {
  emitter: Emitter
  model: Model
  dataset: any[]
  compos: Compo[]
  dragOn: string
  divider: string
}

export default {
  namespaced: true,
  state: {
    emitter: new Emitter(),
    model: new Model(),
    dataset: [] as any[],
    compos: [] as Compo[],
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
    async refresh(
      { state, dispatch, rootGetters }: { state: ModelState; dispatch: Dispatch; rootGetters: any },
      options?: { reqDataset?: boolean }
    ) {
      await dispatch('project/refresh', undefined, { root: true })
      const mid = router.currentRoute.value.params.mid
      state.compos = (await reqAll('component')).map((compo: any) => Compo.copy(compo))
      Model.copy(await mdlAPI.detail(mid), state.model)
      state.dragOn = ''
      state.divider = ''
      state.emitter.emit('refresh')
      if (options && options.reqDataset) {
        const project = rootGetters['project/ins'] as Project
        if (!project.thread) {
          Modal.error({
            title: '错误',
            content: '需要启动项目以显示数据集！'
          })
          state.dataset = []
          return
        }
        state.dataset = await mdlAPI.dataset()
      }
    },
    async publish({ rootGetters, dispatch }: { rootGetters: any; dispatch: Dispatch }) {
      await dispatch('project/refresh', undefined, { root: true })
      const project = rootGetters['project/ins']
      // if (!project.thread) {
      //   Modal.warning({
      //     title: '发布失败',
      //     content: '中台需要依赖项目后台运行，请确保项目运行后在发布中台！'
      //   })
      //   return
      // }
      await reqPut('project', `${project.key}/publish`, undefined, { type: 'api' })
    }
  },
  getters: {
    emitter: (state: ModelState): Emitter => state.emitter,
    ins: (state: ModelState): Model => state.model,
    form: (state: ModelState): Form => state.model.form,
    fields: (state: ModelState): Field[] => state.model.form.fields,
    field:
      (state: ModelState) =>
      (key: any): Field | undefined =>
        state.model.form.fields.find((field: Field) => field.key === key),
    records:
      (state: ModelState) =>
      (useReal: boolean): any[] =>
        useReal ? state.dataset : (state.model.table.demoData ? [state.model.table.demoData] : []),
    dataset: (state: ModelState): any[] => state.dataset,
    compos: (state: ModelState): Compo[] => state.compos,
    table: (state: ModelState): Table => state.model.table,
    columns: (state: ModelState): Column[] => state.model.table.columns,
    column:
      (state: ModelState) =>
      (key: any): Column | undefined =>
        state.model.table.columns.find((column: Column) => column.key === key),
    cells: (state: ModelState) => state.model.table.cells,
    cell:
      (state: ModelState) =>
      (key: any): Cell =>
        state.model.table.cells[key],
    dragOn: (state: ModelState): string => state.dragOn,
    divider: (state: ModelState): string => state.divider
  }
}
