import 'core-js/stable'
import 'regenerator-runtime/runtime'
import { beforeAll, beforeEach, afterAll, expect, test, jest } from '@jest/globals'
import { db } from '../utils/index.js'
import { create, saveProp, delProp, del, insertField, exportClass } from '../services/model.js'
import Model from '../models/model.js'
import Dep from '../models/dep.js'

describe('# 模型服务', () => {
  let mid = ''
  beforeAll(async () => {
    await db.sync(Model)
  })
  test('# create', async () => {
    const model = await create({
      name: 'abcd',
      desc: 'cctv',
      logTime: true
    })
    expect(model.id).not.toBeUndefined()
    mid = model.id
  })

  describe('# prop', () => {
    test('# 增', async () => {
      await saveProp(
        {
          name: 'prop1',
          label: '字段1',
          ptype: 'String',
          index: true,
          unique: true,
          visible: true,
          remark: '测试测试字段'
        },
        mid
      )
      const model = await db.select(Model, { _index: mid })
      expect(model.props.length).toBeGreaterThan(0)
      expect(model.props.map(prop => prop.name)).toContain('prop1')
      expect(model.form.fields.map(field => field.refer)).toContain('prop1')
      expect(model.table.columns.map(column => column.dataIndex)).toContain('prop1')
    })

    test('# 改，修改子文档必须给出全字段数据，不能只给出需要修改的字段', async () => {
      let model = await db.select(Model, { _index: mid })
      const prop1 = model.props.find(prop => prop.name === 'prop1')
      prop1.remark += '，这是后修改的'
      await saveProp(prop1, mid, 'prop1')
      model = await db.select(Model, { _index: mid })
      expect(model.props.length).toBeGreaterThan(0)
      expect(model.props.map(prop => prop.name)).toContain('prop1')
      expect(model.props.find(prop => prop.name === 'prop1').remark).toEqual(
        '测试测试字段，这是后修改的'
      )
    })

    test('# 删', async () => {
      await delProp('prop1', mid)
      const model = await db.select(Model, { _index: mid })
      expect(model.props.map(prop => prop.name)).not.toContain('prop1')
      expect(model.form.fields.map(field => field.refer)).not.toContain('prop1')
      expect(model.table.columns.map(column => column.dataIndex)).not.toContain('prop1')
    })
  })

  describe('# field', () => {
    test('# 新增', async () => {
      await insertField(mid, {
        label: '测试输入框1',
        desc: '测试测试测试',
        ftype: 'Input',
        refer: 'input1'
      })
      const model = await db.select(Model, { _index: mid })
      expect(model.form.fields.map(field => field.refer)).toContain('input1')
    })
    test('# 插入', async () => {
      await insertField(
        mid,
        {
          label: '测试数字输入框1',
          desc: '测试测试测试',
          ftype: 'Number',
          refer: 'num1'
        },
        { idx: 0, pos: 'after' }
      )
      const model = await db.select(Model, { _index: mid })
      expect(model.form.fields.map(field => field.refer)).toContain('num1')
      expect(model.form.fields.findIndex(field => field.refer === 'num1')).toBeGreaterThan(
        model.form.fields.findIndex(field => field.refer === 'input1')
      )
    })
    test('# 删', async () => {
      await db.saveOne(Model, mid, { 'form.fields[{refer:input1}]': null }, { updMode: 'delete' })
      const model = await db.select(Model, { _index: mid })
      expect(model.form.fields.map(field => field.refer)).not.toContain('input1')
    })
  })

  describe('# exportClass', () => {
    beforeAll(async () => {
      await db.saveOne(
        Model,
        mid,
        {
          props: [
            {
              name: 'prop1',
              label: '字段1',
              ptype: 'String',
              index: true,
              unique: true,
              visible: true,
              remark: '测试字符串字段'
            },
            {
              name: 'prop2',
              label: '字段2',
              ptype: 'Number',
              index: false,
              unique: false,
              visible: true,
              remark: '测试数字字段'
            },
            {
              name: 'prop3',
              label: '字段3',
              ptype: 'Boolean',
              index: false,
              unique: false,
              visible: true,
              remark: '测试布尔字段'
            }
          ]
        },
        { updMode: 'append' }
      )
    })
    test('# 无参数', async () => {
      const result = await exportClass(mid)
      const model = await db.select(Model, { _index: mid })
      expect(result).toHaveProperty('fileName', `${model.name}.ts`)
      expect(result).toHaveProperty('content')
      expect(result.content).not.toEqual('')
    })


    test('# javascript', async () => {
      const result = await exportClass(mid, { expType: 'javascript'})
      const model = await db.select(Model, { _index: mid })
      expect(result).toHaveProperty('fileName', `${model.name}.js`)
      expect(result).toHaveProperty('content')
      expect(result.content).not.toEqual('')
    })
  })

  test('# 删除', async () => {
    await del(mid)
    const dep = await db.select(Dep, { _index: mid })
    expect(dep).toBeNull()
    const mdl = await db.select(Model, { _index: mid })
    expect(mdl).toBeNull()
  })
})
