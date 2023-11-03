import store from '@/store'
import Cell from '@/types/cell'
import ExpCls from '@/types/expCls'
import Model from '@/types/model'
import Project from '@/types/project'
import Service, { Method, methods as Methods } from '@/types/service'
import {
  RequestOptions,
  downloadFile,
  pickOrIgnore,
  reqDelete,
  reqGet,
  reqLink,
  reqPost,
  reqPut
} from '@/utils'

const expDft = {
  add: async (data: any) => {
    const model = await reqPost(
      'model',
      Object.assign(data, { pid: store.getters['project/ins'].key }),
      {
        type: 'api',
        copy: Model.copy
      }
    )
    console.log(model)
    await reqPut(`project/${store.getters['project/ins'].key}`, `models/${model.key}`)
    return model
  },
  remove: async (key: any) => {
    await reqDelete(`project/${store.getters['project/ins'].key}`, `models/${key}`)
    return reqDelete('model', key, { type: 'api' })
  },
  update: async (data: any, next?: () => Promise<any>) => {
    const project = store.getters['project/ins'] as Project
    const model = await reqPut('model', data.key, data)
    const orgMdl = project.models.find(mdl => mdl.key === data.key) as Model
    for (const method of Methods) {
      if (orgMdl.methods.includes(method) && !data.methods.includes(method)) {
        // 删除该模型接口
        const service = project.services.find(
          svc => svc.model === orgMdl.key && svc.method === method
        )
        if (service) {
          await reqDelete('service', service.key)
          await reqLink(
            {
              parent: ['project', project.key],
              child: ['services', service.key]
            },
            false
          )
        }
      } else if (!orgMdl.methods.includes(method) && data.methods.includes(method)) {
        // 新增该模型接口
        const service = await reqPost(
          'service',
          {
            emit: 'api',
            model: data.key,
            method,
            path: `/mdl/v1/${model.name}${method !== 'POST' ? '/:index' : ''}`
          },
          { copy: Service.copy }
        )
        await reqLink({
          parent: ['project', project.key],
          child: ['services', service.key]
        })
      }
    }
    if (next) {
      await next()
    }
  },
  all: async () => {
    await store.dispatch('project/refresh')
    return store.getters['project/ins'].models
  },
  detail: (key: any, options?: RequestOptions) =>
    reqGet('model', key, options).then((mdl: any) => Model.copy(mdl)),
  export: async (expCls: ExpCls) => {
    const result = await reqPost(
      `project/${store.getters['project/ins'].key}/model/${expCls.key}/export`,
      expCls,
      {
        type: 'api'
      }
    )
    downloadFile({
      data: result.content,
      headers: {
        'content-disposition': '=' + window.encodeURI(result.fileName)
      }
    })
  },
  dataset: (key: any) =>
    reqGet(`project/${store.getters['project/ins'].key}`, `model/${key}/data`, { type: 'api' }),
  form: {
    save: async (form: any) => {
      await reqPut(
        'model',
        store.getters['model/ins'].key,
        { form: pickOrIgnore(form, ['fields']) },
        {
          messages: { notShow: true },
          axiosConfig: { params: { updMode: 'merge' } }
        }
      )
      await store.dispatch('model/refresh')
    },
    fields: {
      add: async (payload: {
        compoType: string
        insertPos?: { field: string; pos: 'before' | 'after' }
      }) => {
        const model = Model.copy(
          await reqPut(
            'model',
            store.getters['model/ins'].key,
            { 'form.fields': { ftype: payload.compoType } },
            { axiosConfig: { params: { updMode: 'append' } }, messages: { notShow: true } }
          )
        )
        const field = model.form.fields[model.form.fields.length - 1]
        await expDft.form.fields.insert({
          dragField: field.key,
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
              [`form.fields[{id:${field.key}}]`]: pickOrIgnore(field, ['key'])
            },
            {
              messages: { notShow: true },
              axiosConfig: { params: { updMode: 'merge' } }
            }
          )
        } else {
          await reqPut(
            'model',
            mid,
            { 'form.fields': field },
            {
              messages: { notShow: true },
              axiosConfig: { params: { updMode: 'append' } }
            }
          )
        }
        await store.dispatch('model/refresh')
      },
      extra: {
        save: async (fkey: string, extra: any) => {
          await reqPut(
            'model',
            store.getters['model/ins'].key,
            {
              [`form.fields[{id:${fkey}}].extra`]: extra
            },
            {
              messages: { notShow: true },
              axiosConfig: { params: { updMode: 'merge' } }
            }
          )
          await store.dispatch('model/refresh')
        }
      },
      insert: async (payload: {
        dragField: string
        insertPos?: { field: string; pos: 'before' | 'after' }
      }) => {
        await reqPost(
          `model/${store.getters['model/ins'].key}/field/${payload.dragField}`,
          payload.insertPos,
          {
            type: 'api',
            messages: { notShow: true }
          }
        )
        await store.dispatch('model/refresh')
      },
      remove: async (key: any) => {
        await reqPut(
          'model',
          store.getters['model/ins'].key,
          { [`form.fields[{id:${key}}]`]: null },
          { axiosConfig: { params: { updMode: 'delete' } }, messages: { notShow: true } }
        )
        await store.dispatch('model/refresh')
      }
    }
  },
  table: {
    record: {
      set: async (record: any) => {
        await reqPut(
          'model',
          store.getters['model/ins'].key,
          { 'table.demoData': record },
          { messages: { notShow: true } }
        )
        await store.dispatch('model/refresh')
      },
      clr: async () => {
        await reqPut(
          'model',
          store.getters['model/ins'].key,
          { 'table.demoData': null },
          { axiosConfig: { params: { updMode: 'delete' } }, messages: { notShow: true } }
        )
        await store.dispatch('model/refresh')
      }
    },
    save: async (table: any) => {
      await reqPut(
        'model',
        store.getters['model/ins'].key,
        { table: pickOrIgnore(table, ['columns']) },
        {
          axiosConfig: { params: { updMode: 'merge' } },
          messages: { notShow: true }
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
              [`table.columns[{id:${column.key}}]`]: pickOrIgnore(column, ['key'])
            },
            { axiosConfig: { params: { updMode: 'merge' } }, messages: { notShow: true } }
          )
        } else {
          await reqPut(
            'model',
            mid,
            { 'table.columns': pickOrIgnore(column, ['key']) },
            { axiosConfig: { params: { updMode: 'append' } }, messages: { notShow: true } }
          )
        }
      }
    },
    cells: {
      save: async (cell: any) => {
        await reqPut(
          'model',
          store.getters['model/ins'].key,
          {
            [`table.cells[{refer:${cell.refer}}]`]: pickOrIgnore(cell, ['refer'])
          },
          { axiosConfig: { params: { updMode: 'merge' } }, messages: { notShow: true } }
        )
      },
      saveFmt: async (refer: string, format: any, cond?: string) => {
        await reqPut(
          'model',
          store.getters['model/ins'].key,
          {
            [`table.cells[{refer:${refer}}]${cond ? '.cdCell.' + cond : ''}.format`]: format
          },
          { axiosConfig: { params: { updMode: 'merge' } }, messages: { notShow: true } }
        )
        await store.dispatch('model/refresh')
      },
      cond: {
        save: async (refer: string, cdCell: { [cond: string]: Cell }) => {
          await reqPut(
            'model',
            store.getters['model/ins'].key,
            {
              [`table.cells[{refer:${refer}}].cdCell`]: Object.fromEntries(
                Object.entries(cdCell).map(([cond, cell]) => [cond, pickOrIgnore(cell, ['cdCell'])])
              )
            },
            { axiosConfig: { params: { updMode: 'merge' } }, messages: { notShow: true } }
          )
          await store.dispatch('model/refresh')
        }
      }
    }
  }
}

export default expDft
