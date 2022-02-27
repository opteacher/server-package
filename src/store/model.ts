/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import Model from '@/types/model'
import router from '@/router'
import { reqAll, reqDelete, reqGet, reqPost, reqPut, skipIgnores } from '@/utils'
import { ExpClsForm } from '../views/Project'
import Compo from '@/types/compo'
import Field from '@/types/field'
import Form from '@/types/form'
import { Dispatch } from 'vuex'
import Column from '@/types/column'
import Table from '@/types/table'
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Project from '@/types/project'
import { Modal } from 'ant-design-vue'

type ModelState = {
  emitter: Emitter
  model: Model
  form: Form
  table: Table
  dataset: any[]
  compos: Compo[]
  fields: Record<string, Field>
  dragOn: string
  divider: string
  dsgnMod: string
}

export default {
  namespaced: true,
  state: {
    emitter: new Emitter(),
    model: new Model(),
    form: new Form(),
    table: new Table(),
    dataset: [] as any[],
    compos: [] as Compo[],
    fields: {} as Record<string, Field>,
    dragOn: '',
    divider: '',
    dsgnMod: 'form'
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
      { state, rootGetters }: { state: ModelState; rootGetters: any },
      options?: { reqDataset?: boolean }
    ) {
      const mid = router.currentRoute.value.params.mid
      state.compos = (await reqAll('component')).map((compo: any) => Compo.copy(compo))
      Model.copy(await reqGet('model', mid), state.model)
      Form.copy(await reqPost(`model/${state.model.key}/form`, {}, { type: 'api' }), state.form)
      Table.copy(await reqPost(`model/${state.model.key}/table`, {}, { type: 'api' }), state.table)
      state.fields = Object.fromEntries(state.form.fields.map(field => [field.key, field]))
      state.dragOn = ''
      state.divider = ''
      state.dsgnMod = router.currentRoute.value.path.split('/').at(-2) as string
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
        state.dataset = await reqGet(`project/${project.key}`, `model/${mid}/data`, { type: 'api' })
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
    },
    async saveForm({ state, dispatch }: { state: ModelState; dispatch: Dispatch }, form: any) {
      await reqPut('form', state.form.key, form, {
        messages: { notShow: true },
        ignores: ['fields']
      })
      await dispatch('refresh')
    },
    async saveField({ dispatch }: { dispatch: Dispatch }, field: any) {
      await reqPut('field', field.key, field, {
        messages: { notShow: true },
        ignores: ['key']
      })
      await dispatch('refresh')
    },
    async newField(
      { dispatch }: { dispatch: Dispatch },
      payload: {
        compoType: string
        insertPos?: { field: string; pos: 'before' | 'after' }
      }
    ) {
      await dispatch('insertField', {
        dragField: (await reqPost('field', { type: payload.compoType }))._id,
        insertPos: payload.insertPos
      })
    },
    async insertField(
      { state, dispatch }: { state: ModelState; dispatch: Dispatch },
      payload: {
        dragField: string
        insertPos?: { field: string; pos: 'before' | 'after' }
      }
    ) {
      await reqPost(`form/${state.form.key}/field/${payload.dragField}`, payload.insertPos, {
        type: 'api'
      })
      await dispatch('refresh')
    },
    async delField({ dispatch }: { dispatch: Dispatch }, fldKey: string) {
      await reqDelete('field', fldKey)
      await dispatch('refresh')
    },
    async newRecord({ state, dispatch }: { state: ModelState; dispatch: Dispatch }, record: any) {
      await reqPut('table', state.table.key, { demoData: record })
      await dispatch('refresh')
    },
    async saveTable({ state, dispatch }: { state: ModelState; dispatch: Dispatch }, table: any) {
      await reqPut('table', state.table.key, table)
      await dispatch('refresh')
    },
    async saveColumn({ dispatch }: { dispatch: Dispatch }, column: any) {
      await reqPut('column', column.key, column)
      await dispatch('refresh')
    },
    async saveEntry({ state, dispatch }: { state: ModelState; dispatch: Dispatch }, entry: any) {
      await reqPut('table', state.table.key, {
        entries: Object.assign(state.table.entries, {
          [entry.key]: Object.assign(state.table.entries[entry.key], skipIgnores(entry, ['key']))
        })
      })
      await dispatch('refresh')
    }
  },
  getters: {
    emitter: (state: ModelState): Emitter => state.emitter,
    ins: (state: ModelState): Model => state.model,
    form: (state: ModelState): Form => state.form,
    table: (state: ModelState): Table => state.table,
    demoRecord: (state: ModelState): any[] => (state.table.demoData ? [state.table.demoData] : []),
    dataset: (state: ModelState): any[] => state.dataset,
    compos: (state: ModelState): Compo[] => state.compos,
    fields: (state: ModelState): Record<string, Field> => state.fields,
    columns: (state: ModelState): Column[] => state.table.columns,
    dragOn: (state: ModelState): string => state.dragOn,
    divider: (state: ModelState): string => state.divider,
    dsgnMod: (state: ModelState): string => state.dsgnMod
  }
}
