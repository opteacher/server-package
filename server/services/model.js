/* eslint-disable @typescript-eslint/no-explicit-any */

/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import axios from 'axios'
import _ from 'lodash'

import Dep from '../models/dep.js'
import Model from '../models/model.js'
import Project from '../models/project.js'
import Service from '../models/service.js'
import { db, genDefault, pickOrIgnore } from '../utils/index.js'
import { rmv as rmvSvc } from './service.js'

const typeMapper = {
  Any: 'any',
  String: 'string',
  LongStr: 'string',
  Number: 'number',
  Boolean: 'boolean',
  DateTime: 'Date',
  Array: 'any[]',
  Object: '{ [prop: string]: any }'
}

/**
 *
 * @param {*} mid
 * @param {*} options name: string
                      expType: 'typescript' | 'javascript'
                      genCopy: boolean
                      genReset: boolean
 * @returns
 */
export async function exportClass(mid, options) {
  if (!options) {
    options = {}
  }
  if (!options.expType) {
    options.expType = 'typescript'
  }
  if (typeof options.genCopy === 'undefined') {
    options.genCopy = true
  }
  if (typeof options.genReset === 'undefined') {
    options.genReset = true
  }
  const model = await db.select(Model, { _index: mid })
  const suffix = options.expType === 'typescript' ? 'ts' : 'js'
  const fileName = `${model.name}.${suffix}`
  const genAnno = (prop, indents = '  ') => {
    let ret = `${indents}// ${prop.label}\n`
    if (prop.remark) {
      ret += `${indents}// ${prop.remark}\n`
    }
    return ret
  }
  if (!options.name) {
    options.name = _.upperFirst(model.name)
  }
  let writeData = `export default class ${options.name} {\n`
  if (options.expType === 'typescript') {
    writeData += '  key: string\n'
    for (const prop of model.props) {
      writeData += genAnno(prop)
      const type = prop.ptype
      writeData += `  ${prop.name}: ${prop.ptype in typeMapper ? typeMapper[type] : type}\n`
    }
  }
  writeData += '\n  constructor() {\n'
  writeData += "    this.key = ''\n"
  for (const prop of model.props) {
    if (options.expType === 'javascript') {
      writeData += genAnno(prop, '    ')
    }
    writeData += `    this.${prop.name} = ${genDefault(prop.ptype)}\n`
  }
  writeData += '  }\n'
  if (options.genReset) {
    writeData += '\n  reset() {\n'
    writeData += "    this.key = ''\n"
    for (const prop of model.props) {
      writeData += `    this.${prop.name} = ${genDefault(prop.ptype)}\n`
    }
    writeData += '  }\n'
  }
  if (options.genCopy) {
    if (options.expType === 'typescript') {
      writeData += `\n  static copy(src: any, tgt?: ${options.name}, force = false): ${options.name} {\n`
    } else {
      writeData += `\n  static copy(src, tgt, force = false) {\n`
    }
    writeData += `    tgt = tgt || new ${options.name}()\n`
    writeData +=
      '    tgt.key = force ? (src.key || src.id || src._id) : (src.key || src.id || src._id || tgt.key)\n'
    for (const prop of model.props) {
      writeData += `    tgt.${prop.name} = force ? src.${prop.name} : (src.${prop.name} || tgt.${prop.name})\n`
    }
    writeData += '    return tgt\n  }\n'
  }
  writeData += '}\n'
  return {
    fileName,
    content: writeData
  }
}

export async function getData(ctx) {
  const project = await db.select(Project, { _index: ctx.params.pid })
  const model = await db.select(Model, { _index: ctx.params.mid })
  const host = process.env.NODE_ENV === 'prod' ? project.name : '127.0.0.1'
  const resp = await axios.get(
    `http://${host}:${project.port}/${project.name}/mdl/v1/${model.name}/s`,
    { headers: ctx.headers }
  )
  if (resp.status !== 200) {
    return { error: '访问不到目标项目，请确认项目正常运行！' }
  }
  return resp.data.data
}

export async function create(data) {
  const model = await db.save(Model, pickOrIgnore(data, ['project']))
  await db.save(Dep, {
    _id: model.id,
    name: _.upperFirst(model.name),
    exports: [_.upperFirst(model.name)],
    from: `../models/${model.name}.js`,
    default: true
  })
  if (data.pid) {
    const project = await db.select(Project, { _index: data.pid })
    await db.saveOne(Dep, model.id, { belong: project.name })
    let service = await db.save(Service, {
      name: model.name,
      emit: 'api',
      model: model.id,
      method: 'POST',
      path: `/mdl/v1/${model.name}`,
      needRet: true
    })
    await db.saveOne(Project, data.pid, { services: service.id }, { updMode: 'append' })

    service = await db.save(Service, {
      name: model.name,
      emit: 'api',
      model: model.id,
      method: 'DELETE',
      path: `/mdl/v1/${model.name}/:index`,
      needRet: true
    })
    await db.saveOne(Project, data.pid, { services: service.id }, { updMode: 'append' })

    service = await db.save(Service, {
      name: model.name,
      emit: 'api',
      model: model.id,
      method: 'PUT',
      path: `/mdl/v1/${model.name}/:index`,
      needRet: true
    })
    await db.saveOne(Project, data.pid, { services: service.id }, { updMode: 'append' })

    service = await db.save(Service, {
      name: model.name,
      emit: 'api',
      model: model.id,
      method: 'GET',
      path: `/mdl/v1/${model.name}/:index`,
      needRet: true
    })
    await db.saveOne(Project, data.pid, { services: service.id }, { updMode: 'append' })
  }
  await genForm(model.id)
  await genTable(model.id)
  return db.select(Model, { _index: model.id })
}

export async function rmv(key) {
  console.log(key)
  await db.remove(Dep, { _index: key })
  const msvcs = await db.select(Service, { model: key })
  await Promise.all(msvcs.map(sid => rmvSvc(sid)))
  return db.remove(Model, { _index: key })
}

function baseToCompoType(type) {
  switch (type) {
    case 'String':
      return 'Input'
    case 'LongStr':
      return 'Textarea'
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

function initField(prop) {
  return {
    label: prop.label,
    ftype: baseToCompoType(prop.ptype),
    refer: prop.name
  }
}

function initColumn(prop) {
  return {
    title: prop.label,
    dataIndex: prop.name
  }
}

function initCell(prop) {
  return {
    color: '#000000',
    prefix: '',
    suffix: '',
    cdCell: {},
    refer: prop.name
  }
}

export async function genForm(mid) {
  const model = await db.select(Model, { _index: mid })
  return db.saveOne(Model, mid, {
    form: {
      title: '新增/编辑',
      width: 50,
      labelWidth: 4,
      fields: model.props.map(prop => initField(prop))
    }
  })
}

export async function genTable(mid) {
  const model = await db.select(Model, { _index: mid })
  return db.saveOne(Model, mid, {
    table: {
      title: '数据表',
      operaStyle: 'button',
      size: 'default',
      hasPages: true,
      columns: model.props.map(prop => initColumn(prop)),
      cells: model.props.map(prop => initCell(prop))
    }
  })
}

/**
 *
 * @param {*} mid
 * @param {*} fid
 * @param {*} istPos field: string; pos: 'before' | 'after'
 * @returns
 * @description 该方法不新增field，只是将已经存在的field（fid指代），插入到istPos中的field附近
 */
export async function insertField(mid, fid, istPos) {
  const model = await db.select(Model, { _index: mid })
  const fields = model.form.fields
  if (!istPos) {
    istPos = { field: fields[fields.length - 1]._id, pos: 'after' }
  }
  const dragIdx = fields.findIndex(field => field._id == fid)
  let dropIdx = fields.findIndex(field => field._id == istPos.field)
  if (dragIdx === dropIdx) {
    return
  }
  if (istPos.pos === 'after') {
    dropIdx++
  }
  ;[fields[dragIdx], fields[dropIdx]] = [fields[dropIdx], fields[dragIdx]]
  return db.saveOne(Model, mid, { 'form.fields': fields.filter(field => field) })
}

export async function saveProp(data, mid, pid) {
  if (!pid) {
    const model = await db.select(Model, { _index: mid })
    if (!model.form || !model.form.title) {
      await genForm(mid)
    }
    if (!model.table || !model.table.title) {
      await genTable(mid)
    }
    await db.saveOne(
      Model,
      mid,
      {
        props: data,
        'form.fields': initField(data),
        'table.columns': initColumn(data)
      },
      { updMode: 'append' }
    )
    if (model.table.cells.find(cell => cell.refer === data.name)) {
      return db.saveOne(Model, mid, { [`table.cells[refer:${data.name}]`]: initCell(data) })
    } else {
      return db.saveOne(Model, mid, { 'table.cells': initCell(data) }, { updMode: 'append' })
    }
  } else {
    return db.saveOne(Model, mid, { [`props[{_id:${pid}}]`]: data })
  }
}

export async function delProp(mid, pid) {
  const model = await db.select(Model, { _index: mid })
  if (typeof pid !== 'string') {
    pid = pid.toString()
  }
  const prop = model.props.find(prop => prop.id.toString() == pid)
  return db.saveOne(
    Model,
    mid,
    {
      [`props[{_id:${pid}}]`]: null,
      [`form.fields[{refer:${prop.name}}]`]: null,
      [`table.columns[{dataIndex:${prop.name}}]`]: null,
      [`table.cells[{refer:${prop.name}}]`]: null
    },
    { updMode: 'delete' }
  )
}
