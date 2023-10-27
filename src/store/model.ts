/* eslint-disable @typescript-eslint/explicit-module-boundary-types */

/* eslint-disable @typescript-eslint/no-explicit-any */
import router from '@/router'
import Form from '@/types/form'
import { methods } from '@/types/index'
import Model from '@/types/model'
import Project from '@/types/project'
import Property from '@/types/property'
import Table from '@/types/table'
import { reqPut } from '@/utils'
import { svcEmitter } from '@/views/Project'
import Column from '@lib/types/column'
import Field from '@lib/types/field'
import { Modal } from 'ant-design-vue'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import { Dispatch } from 'vuex'

import { mdlAPI } from '../apis'

type ModelState = {
  emitter: Emitter
  model: Model
  dataset: any[]
  dragOn: string
  divider: string
}

export default {
  namespaced: true,
  state: {
    emitter: new Emitter(),
    model: new Model(),
    dataset: [] as any[],
    dragOn: '',
    divider: ''
  },
  mutations: {
    SET_DRAG_ON(state: ModelState, payload: string) {
      state.dragOn = payload
    },
    SET_DIVIDER(state: ModelState, payload: string) {
      state.divider = payload
    },
    SET_CELL_COND(state: ModelState, payload: { refer: string; cond: string }) {
      const cell = state.model.table.cells.find((cell: any) => cell.refer === payload.refer)
      if (cell) {
        cell.selCond = payload.cond
      }
    }
  },
  actions: {
    async refresh(
      { state, dispatch, rootGetters }: { state: ModelState; dispatch: Dispatch; rootGetters: any },
      options?: { reqDataset?: boolean }
    ) {
      await dispatch('project/refresh', undefined, { root: true })
      const mid = router.currentRoute.value.params.mid
      Model.copy(await mdlAPI.detail(mid), state.model)
      const hasRelProp = state.model.props.reduce(
        (prev: boolean, prop: Property) =>
          prev ||
          (prop.relative &&
            typeof prop.relative.model !== 'undefined' &&
            prop.relative.model !== ''),
        false
      )
      svcEmitter.emit('update:mprop', {
        'method.options': methods
          .concat(hasRelProp ? 'LINK' : [])
          .map(mthd => ({ label: mthd, value: mthd }))
      })
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
        useReal ? state.dataset : state.model.table.demoData ? [state.model.table.demoData] : [],
    dataset: (state: ModelState): any[] => state.dataset,
    table: (state: ModelState): Table => state.model.table,
    columns: (state: ModelState): Column[] => state.model.table.columns,
    column:
      (state: ModelState) =>
      (key: any): Column | undefined =>
        state.model.table.columns.find((column: Column) => column.key === key),
    cells: (state: ModelState) => state.model.table.cells,
    dragOn: (state: ModelState): string => state.dragOn,
    divider: (state: ModelState): string => state.divider
  }
}
