/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { db, genDefault } from '../utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'
import Dep from '../models/dep.js'
import axios from 'axios'
import _ from 'lodash'

const typeMapper = {
  Any: 'any',
  String: 'string',
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
    options.name = _.capitalize(model.name)
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

export async function getData(pid, mid) {
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

export async function create(data) {
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
  return db.select(Model, { _index: model.id })
}

export async function del(key) {
  await db.remove(Dep, { _index: key })
  return db.remove(Model, { _index: key })
}

function baseToCompoType(type) {
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
      cells: Object.fromEntries(model.props.map(prop => [prop.name, genDefault(prop.ptype)]))
    }
  })
}

/**
 *
 * @param {*} mid
 * @param {*} field
 * @param {*} istPos idx: number; pos: 'before' | 'after'
 * @returns
 */
export async function insertField(mid, field, istPos) {
  if (!istPos) {
    return db.saveOne(Model, mid, { 'form.fields': field }, { updMode: 'append' })
  }
  const model = await db.select(Model, { _index: mid })
  const fields = model.form.fields
  let index = istPos.idx
  if (istPos.pos === 'after') {
    index++
  }
  fields.splice(index, 0, field)
  return db.saveOne(Model, mid, { 'form.fields': fields }, { updMode: 'cover' })
}

export async function saveProp(data, mid, pname) {
  if (!pname) {
    return db.saveOne(
      Model,
      mid,
      {
        props: data,
        'form.fields': initField(data),
        'table.columns': initColumn(data)
      },
      { updMode: 'append' }
    )
  } else {
    return db.saveOne(Model, mid, { [`props[{name:${pname}}]`]: data })
  }
}

export function delProp(pname, mid) {
  return db.saveOne(
    Model,
    mid,
    {
      [`props[{name:${pname}}]`]: null,
      [`form.fields[{refer:${pname}}]`]: null,
      [`table.columns[{dataIndex:${pname}}]`]: null
    },
    { updMode: 'delete' }
  )
}
