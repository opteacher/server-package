/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { db } from '../utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'
import MdlType from '../types/model.js'
import Dep from '../models/dep.js'
import Form from '../models/form.js'
import Field from '../models/field.js'
import Table from '../models/table.js'
import Column from '../models/column.js'
import Service from '../models/service.js'
import axios from 'axios'
import { MdlInf } from '../lib/backend-library/databases/index.js'
import { run } from './project.js'

const typeMapper = {
  Any: 'any',
  String: 'string',
  Number: 'number',
  Boolean: 'boolean',
  DateTime: 'Date',
  Array: 'any[]',
  Object: '{ [prop: string]: any }'
}

export async function exportClass(
  mid: string,
  options: {
    name: string
    expType: 'typescript' | 'javascript'
    genCopy: boolean
    genReset: boolean
  }
) {
  const model = await db.select(Model, { _index: mid }, { ext: true })
  const suffix = options.expType === 'typescript' ? 'ts' : 'js'
  const fileName = `${model.name}.${suffix}`
  const genAnno = (prop: any, indents = '  ') => {
    let ret = `${indents}// ${prop.label}\n`
    if (prop.remark) {
      ret += `${indents}// ${prop.remark}\n`
    }
    return ret
  }
  let writeData = `export default class ${options.name} {\n`
  if (options.expType === 'typescript') {
    writeData += '  key: string\n'
    for (const prop of model.props) {
      writeData += genAnno(prop)
      const type = prop.type as keyof typeof typeMapper
      writeData += `  ${prop.name}: ${prop.type in typeMapper ? typeMapper[type] : prop.type}\n`
    }
  }
  const genDft = (type: string, dftVal?: any) => {
    switch (type) {
      case 'Any':
        return dftVal || 'null'
      case 'String':
        return `'${dftVal || ''}'`
      case 'Number':
        return dftVal || '0'
      case 'Boolean':
        return typeof dftVal === 'undefined' ? 'false' : dftVal ? 'true' : 'false'
      case 'DateTime':
        return dftVal ? new Date(dftVal) : 'new Date()'
      case 'Array':
        return dftVal || '[]'
      case 'Object':
        return dftVal || '{}'
    }
  }
  writeData += '\n  constructor() {\n'
  writeData += "    this.key = ''\n"
  for (const prop of model.props) {
    if (options.expType === 'javascript') {
      writeData += genAnno(prop, '    ')
    }
    writeData += `    this.${prop.name} = ${genDft(prop.type)}\n`
  }
  writeData += '  }\n'
  if (options.genReset) {
    writeData += '\n  reset() {\n'
    writeData += "    this.key = ''\n"
    for (const prop of model.props) {
      writeData += `    this.${prop.name} = ${genDft(prop.type)}\n`
    }
    writeData += '  }\n'
  }
  if (options.genCopy) {
    if (options.expType === 'typescript') {
      writeData += `\n  static copy(src: any, tgt?: ${options.name}): ${options.name} {\n`
    } else {
      writeData += `\n  static copy(src, tgt) {\n`
    }
    writeData += `    tgt = tgt || new ${options.name}()\n`
    writeData += '    tgt.key = src.key || src.id || src._id || tgt.key\n'
    for (const prop of model.props) {
      writeData += `    tgt.${prop.name} = src.${prop.name} || tgt.${prop.name}\n`
    }
    writeData += '    return tgt\n  }\n'
  }
  writeData += '}\n'
  return {
    fileName,
    content: writeData
  }
}

export async function getData(pid: string, mid: string) {
  const project = await db.select(Project, { _index: pid })
  const model = await db.select(Model, { _index: mid })
  const resp = await axios.get(
    `http://${process.env.ENV === 'prod' ? project.name : '127.0.0.1'}:${project.port}/${
      project.name
    }/mdl/v1/${model.name}s`
  )
  if (resp.status !== 200) {
    return { error: '访问不到目标项目，请确认项目正常运行！' }
  }
  return resp.data.data
}

export async function create(data: any) {
  const model = await db.save(Model, data)
  await db.save(Dep, {
    _id: model.id,
    name: model.name,
    exports: [model.name],
    from: `../models/${model.name}.js`,
    default: true
  })
  await genForm(model.id)
  await genTable(model.id)
  return db.select(Model, { _index: model.id }, { ext: true })
}

export async function del(key: string) {
  await db.del(Dep, { _index: key })
  const model = await db.select(Model, { _index: key })
  if (model.form) {
    const form = await db.select(Form, { _index: model.form })
    for (const fldkey of form.fields) {
      await db.del(Field, { _index: fldkey })
    }
    await db.del(Form, { _index: model.form })
  }
  if (model.table) {
    const table = await db.select(Table, { _index: model.table })
    for (const colKey of table.columns) {
      await db.del(Column, { _index: colKey })
    }
    await db.del(Table, { _index: model.table })
  }
  return db.del(Model, { _index: key })
}

function baseToCompoType(type: string) {
  switch (type) {
    case 'String':
      return 'Input'
    case 'Number':
      return 'Number'
    case 'Boolean':
      return 'Checkbox'
    case 'DateTime':
      return 'DateTime'
    case 'Array':
      return 'EditList'
    default:
      return 'Text'
  }
}

async function generate(
  mid: string,
  propName: 'form' | 'table',
  propModel: MdlInf,
  create: (model: MdlType) => Promise<any>
) {
  const key = (await db.select(Model, { _index: mid }))[propName]
  if (key) {
    return db.select(propModel, { _index: key }, { ext: true })
  }
  const model = MdlType.copy(await db.select(Model, { _index: mid }, { ext: true }))
  const prop = await db.save(propModel, await create(model))
  await db.save(Model, { [propName]: prop.id }, { _index: mid })
  return db.select(propModel, { _index: prop.id }, { ext: true })
}

export async function genForm(mid: string) {
  return generate(mid, 'form', Form, async (model: MdlType) => {
    const fields = []
    for (const prop of model.props) {
      const res = await db.save(Field, {
        label: prop.label,
        type: baseToCompoType(prop.type),
        refer: `@${prop.name}`
      })
      fields.push(res.id)
    }
    return { width: 50, labelWidth: 4, fields }
  })
}

export async function genTable(mid: string) {
  return generate(mid, 'table', Table, async (model: MdlType) => {
    const columns = []
    for (const prop of model.props) {
      const res = await db.save(Column, {
        title: prop.label,
        dataIndex: prop.name
      })
      columns.push(res.id)
    }
    return { size: 'default', columns }
  })
}

export async function insertField(
  formField: [string, string],
  istPos: { field: string; pos: 'before' | 'after' }
) {
  const form = await db.select(Form, { _index: formField[0] })
  const fields = form.fields as string[]
  let index = fields.indexOf(formField[1])
  if (index !== -1) {
    fields.splice(index, 1)
  }
  index = fields.indexOf(istPos.field)
  if (index === -1) {
    return { error: '没有找到插入关联field！' }
  }
  if (istPos.pos === 'after') {
    index++
  }
  fields.splice(index, 0, formField[1])
  return db.save(Form, { fields }, { _index: formField[0] }, { updMode: 'cover' })
}

export async function newRecord(mid: string, body: any) {
  // 检测模型是否具有POST模型接口
  const model = MdlType.copy(await db.select(Model, { _index: mid }, { ext: true }))
  let project: any = null
  for (const pjt of await db.select(Project)) {
    if (pjt.models.includes(model.key)) {
      await run(pjt)
      project = pjt
      break
    }
  }
  if (!project) {
    return { error: `未找到模型${model.name}所在的项目！` }
  }
  const baseURL = `http://${project.name}:${project.port}/${project.name}/mdl/v1`
  if (
    !model.svcs
      .map(svc => svc.isModel && svc.method === 'POST')
      .reduce((a: boolean, b: boolean) => a || b)
  ) {
    await db.save(Service, {
      model: model.name,
      emit: 'api',
      method: 'POST',
      isModel: true,
      path: `/mdl/v1/${model.name}`
    })
    let countdown = 0
    const h = setInterval(async () => {
      if (countdown > 60) {
        clearInterval(h)
      }
      try {
        const resp = await axios.get(baseURL)
        if (resp.status === 404) {
          throw new Error()
        }
        clearInterval(h)
      } catch (e) {
        console.log('等待项目启动中……')
      } finally {
        countdown++
      }
    }, 5000)
  }
  return axios.post(`${baseURL}/${model.name}`, body)
}
