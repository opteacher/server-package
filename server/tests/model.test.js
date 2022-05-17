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
    const dep = await db.select(Dep, { _index: mid })
    expect(dep).not.toBeNull()
  })

  describe('# prop', () => {
    let pid = ''
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
      let prop1 = model.props.find(prop => prop.name === 'prop1')
      prop1.remark += '，这是后修改的'
      await saveProp(prop1, mid, prop1.id)
      model = await db.select(Model, { _index: mid })
      expect(model.props.length).toBeGreaterThan(0)
      expect(model.props.map(prop => prop.name)).toContain('prop1')
      prop1 = model.props.find(prop => prop.name === 'prop1')
      expect(prop1.remark).toEqual('测试测试字段，这是后修改的')
      pid = prop1.id.toString()
    })

    test('# 删', async () => {
      await delProp(mid, pid)
      const model = await db.select(Model, { _index: mid })
      expect(model.props.map(prop => prop.name)).not.toContain('prop1')
      expect(model.form.fields.map(field => field.refer)).not.toContain('prop1')
      expect(model.table.columns.map(column => column.dataIndex)).not.toContain('prop1')
    })
  })

  describe('# field', () => {
    let iptId1 = ''
    test('# 新增', async () => {
      await db.saveOne(
        Model,
        mid,
        {
          'form.fields': {
            label: '测试输入框1',
            desc: '测试测试测试',
            ftype: 'Input',
            refer: 'input1'
          }
        },
        { updMode: 'append' }
      )
      const model = await db.select(Model, { _index: mid })
      expect(model.form.fields.map(field => field.refer)).toContain('input1')
      iptId1 = model.form.fields.find(field => field.refer === 'input1').id
    })
    describe('# 插入', () => {
      let numId1 = ''
      beforeAll(async () => {
        // 再新增一条用于insert
        const model = await db.saveOne(
          Model,
          mid,
          {
            'form.fields': {
              label: '测试数字输入框1',
              desc: '测试测试测试',
              ftype: 'Number',
              refer: 'num1'
            }
          },
          { updMode: 'append' }
        )
        numId1 = model.form.fields.find(field => field.refer === 'num1').id
      })
      test('# 将新增的num1插入到input1之前', async () => {
        let model = await db.select(Model, { _index: mid })
        let refers = model.form.fields.map(field => field.refer)
        const fnum = refers.length
        expect(refers).toContain('input1')
        let ipt1Idx = model.form.fields.findIndex(field => field.refer === 'input1')
        expect(refers).toContain('num1')
        let num1Idx = model.form.fields.findIndex(field => field.refer === 'num1')
        expect(num1Idx).toBeGreaterThan(ipt1Idx)
        await insertField(mid, numId1, {
          field: iptId1,
          pos: 'before'
        })
        model = await db.select(Model, { _index: mid })
        refers = model.form.fields.map(field => field.refer)
        expect(refers).toContain('input1')
        ipt1Idx = model.form.fields.findIndex(field => field.refer === 'input1')
        expect(refers).toContain('num1')
        num1Idx = model.form.fields.findIndex(field => field.refer === 'num1')
        expect(refers.length).toEqual(fnum)
        expect(ipt1Idx).toBeGreaterThan(num1Idx)
      })
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
      const result = await exportClass(mid, { expType: 'javascript' })
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
