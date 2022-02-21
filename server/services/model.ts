/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
import { db } from '../utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'
import MdlType from '../types/model.js'
import Dep from '../models/dep.js'
import Form from '../models/form.js'
import Field from '../models/field.js'
import axios from 'axios'

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
  return db.select(Model, { _index: model.id }, { ext: true })
}

export async function del(key: string) {
  await db.del(Dep, { _index: key })
  const model = await db.select(Model, { _index: key })
  if (model.form) {
    await db.del(Form, { _index: model.form })
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

export async function genForm(mid: string) {
  const fKey = (await db.select(Model, { _index: mid })).form
  if (fKey) {
    return db.select(Form, { _index: fKey }, { ext: true })
  }
  const model = MdlType.copy(await db.select(Model, { _index: mid }, { ext: true }))
  const fields = []
  for (const prop of model.props) {
    const res = await db.save(Field, {
      label: prop.label,
      type: baseToCompoType(prop.type),
      refer: `@${prop.name}`
    })
    fields.push(res.id)
  }
  const form = await db.save(Form, { width: 50, labelWidth: 4, fields })
  await db.save(Model, { form: form.id }, { _index: mid })
  return db.select(Form, { _index: form.id }, { ext: true })
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
