import { db } from '../utils/index.js'
import Project from '../models/project.js'
import Model from '../models/model.js'
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
  for (const prop of model.props) {
    if (options.expType === 'javascript') {
      writeData += genAnno(prop, '    ')
    }
    writeData += `    this.${prop.name} = ${genDft(prop.type)}\n`
  }
  writeData += '  }\n'
  if (options.genReset) {
    writeData += '\n  reset() {\n'
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
