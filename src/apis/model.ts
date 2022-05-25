import store from '@/store'
import { reqGet, reqDelete, reqPost, reqPut, skipIgnores } from '@/utils'
import Model from '@/types/model'
import ExpCls from '@/types/expCls'

const expDft = {
  add: async (data: any) => {
    const model = Model.copy(
      await reqPost('model', Object.assign(data, { pid: store.getters['project/ins'].key }), {
        type: 'api'
      })
    )
    await reqPut(`project/${store.getters['project/ins'].key}`, `models/${model.key}`)
    return model
  },
  remove: async (key: any) => {
    await reqDelete(`project/${store.getters['project/ins'].key}`, `models/${key}`)
    return reqDelete('model', key, { type: 'api' })
  },
  update: (data: any) => reqPut('model', data.key, data),
  all: async () => {
    await store.dispatch('project/refresh')
    return store.getters['project/ins'].models
  },
  detail: (key: any) => reqGet('model', key).then((mdl: any) => Model.copy(mdl)),
  export: async (expCls: ExpCls) => {
    const result = await reqPost(
      `project/${store.getters['project/ins'].key}/model/${expCls.key}/export`,
      expCls,
      {
        type: 'api'
      }
    )

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
  dataset: () =>
    reqGet(
      `project/${store.getters['project/ins'].key}`,
      `model/${store.getters['model/ins'].key}/data`,
      { type: 'api' }
    ),
  form: {
    save: async (form: any) => {
      await reqPut(
        'model',
        store.getters['model/ins'].key,
        { form: skipIgnores(form, ['fields']) },
        {
          messages: { notShow: true },
          query: { updMode: 'merge' }
        }
      )
      await store.dispatch('model/refresh')
    },
    fields: {
      add: async (payload: {
        compoType: string
        insertPos?: { field: string; pos: 'before' | 'after' }
      }) => {
        const field = await reqPut(
          'model',
          store.getters['model/ins'].key,
          { 'form.fields': { type: payload.compoType } },
          { query: { updMode: 'append' } }
        )
        await expDft.form.fields.insert({
          dragField: field._id,
          insertPos: payload.insertPos
        })
      },
      save: async (field: any) => {
        const mid = store.getters['model/ins'].key
        if (field.key) {
          await reqPut(
            'model',
            mid,
            {
              [`form.fields[{id:${field.key}}]`]: skipIgnores(field, ['key'])
            },
            {
              messages: { notShow: true },
              query: { updMode: 'merge' }
            }
          )
        } else {
          await reqPut(
            'model',
            mid,
            { 'form.fields': field },
            {
              messages: { notShow: true },
              query: { updMode: 'append' }
            }
          )
        }
        await store.dispatch('model/refresh')
      },
      insert: async (payload: {
        dragField: string
        insertPos?: { field: string; pos: 'before' | 'after' }
      }) => {
        await reqPost(
          `model/${store.getters['model/ins'].key}/field/${payload.dragField}`,
          payload.insertPos,
          {
            type: 'api'
          }
        )
        await store.dispatch('model/refresh')
      },
      remove: async (key: any) => {
        await reqPut(
          'model',
          store.getters['model/ins'].key,
          { [`form.fields[{id:${key}}]`]: null },
          { query: { updMode: 'delete' } }
        )
        await store.dispatch('model/refresh')
      }
    }
  },
  table: {
    record: {
      set: async (record: any) => {
        await reqPut('model', store.getters['model/ins'].key, { 'table.demoData': record })
        await store.dispatch('model/refresh')
      }
    },
    save: async (table: any) => {
      await reqPut(
        'model',
        store.getters['model/ins'].key,
        { table: skipIgnores(table, ['columns']) },
        {
          query: { updMode: 'merge' }
        }
      )
      await store.dispatch('model/refresh')
    },
    columns: {
      save: async (column: any) => {
        const mid = store.getters['model/ins'].key
        if (column.key) {
          await reqPut(
            'model',
            mid,
            {
              [`table.columns[{id:${column.key}}]`]: column
            },
            { query: { updMode: 'merge' } }
          )
        } else {
          await reqPut('model', mid, { 'table.columns': column }, { query: { updMode: 'append' } })
        }
        await store.dispatch('model/refresh')
      }
    },
    cells: {
      save: async (cell: any) => {
        await reqPut(
          'model',
          store.getters['model/ins'].key,
          {
            [`table.cells.${cell.key}`]: skipIgnores(cell, ['key'])
          },
          { query: { updMode: 'merge' } }
        )
        await store.dispatch('model/refresh')
      }
    }
  }
}

export default expDft
