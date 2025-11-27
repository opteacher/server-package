<template>
  <a-page-header title="自定义类" subTitle="点击方法进入方法流程设计">
    <template #extra>
      <a-button type="primary" @click="() => emitter.emit('update:visible', true)">添加</a-button>
    </template>
  </a-page-header>
  <a-row class="w-full p-2" :gutter="{ lg: 16, xl: 24, xxl: 32 }">
    <a-col
      v-for="typo of typos"
      :key="typo.key"
      :lg="{ span: 12 }"
      :xl="{ span: 9 }"
      :xxl="{ span: 6 }"
    >
      <a-card
        hoverable
        :headStyle="{ backgroundColor: '#f0f0f0' }"
        @click="() => emitter.emit('update:visible', { show: true, object: typo })"
      >
        <template #title>
          {{ typo.name }}{{ typo.super ? ': ' + getSupName(typo) : '' }}
          <span class="float-right">{{ typo.label }}</span>
        </template>
        <div>
          <b>@</b>
          constructor({{
            (typo.params || [])
              .concat(typo.props.filter(prop => prop.index).map(prop => prop.name))
              .join(', ')
          }})
        </div>
        <a-divider v-if="typo.props.length" class="my-3" />
        <ul class="pl-0 mb-0 list-none">
          <li v-for="prop of typo.props" :key="prop.key" class="px-1 pb-0.5">
            <b>-</b>
            {{ prop.name }}:&nbsp;{{ prop.ptype }}&nbsp;({{ prop.dftVal }})
            <span class="float-right">{{ prop.label }}</span>
          </li>
        </ul>
        <a-divider v-if="typo.funcs.length" class="my-3" />
        <ul class="pl-0 mb-0 list-none">
          <li
            v-for="func of typo.funcs"
            :key="func.key"
            class="px-1 pb-0.5 hover:bg-gray-200"
            @click.stop="() => onFuncClick(typo, func)"
          >
            <b>+</b>
            {{ (func.isAsync ? 'async ' : '') + func.name }}&nbsp;(
            <span v-for="(arg, idx) of func.args" :key="arg.key">
              {{ arg.name }}:&nbsp;{{ arg.ptype }}{{ idx === func.args.length - 1 ? '' : ', ' }}
            </span>
            )
            <span class="float-right">{{ func.label }}</span>
          </li>
        </ul>
      </a-card>
    </a-col>
  </a-row>
  <FormDialog
    title="自定义类"
    :emitter="emitter"
    :mapper="mapper"
    :new-fun="() => newOne(Typo)"
    @submit="onTypoSubmit"
  />
</template>

<script setup lang="ts">
import Mapper from '@lib/types/mapper'
import Typo, { Func } from '@/types/typo'
import { TinyEmitter } from 'tiny-emitter'
import { PropType, reactive } from 'vue'
import { newOne, pickOrIgnore, setProp } from '@lib/utils'
import { typAPI } from '@/apis'
import { useStore } from 'vuex'
import { Modal } from 'ant-design-vue'
import { Cond, typeOpns } from '@/types'
import Column from '@lib/types/column'
import { depExp, updDftByType } from '@/utils'
import Project from '@/types/project'
import Property from '@/types/property'
import Dep from '@/types/dep'
import { useRoute, useRouter } from 'vue-router'

defineProps({
  typos: { type: Array as PropType<Typo[]>, required: true }
})
const store = useStore()
const route = useRoute()
const router = useRouter()
const propCols = [
  new Column('字段名', 'name'),
  new Column('标签', 'label'),
  new Column('类型', 'ptype'),
  new Column('默认值', 'dftVal'),
  new Column('构造导入', 'index'),
  new Column('备注', 'remark')
]
const propEmitter = new TinyEmitter()
const propMapper = genVarMapper(propEmitter)
const funcCols = [
  new Column('函数名', 'name'),
  new Column('简介', 'label'),
  new Column('参数', 'args'),
  new Column('Async', 'isAsync'),
  new Column('备注', 'remark')
]
const funcEmitter = new TinyEmitter()
const funcMapper = new Mapper({
  name: {
    label: '函数名',
    type: 'Input',
    rules: [{ required: true, message: '必须给出函数名！' }]
  },
  label: {
    label: '简介',
    type: 'Input'
  },
  args: {
    label: '参数',
    type: 'EditList',
    mapper: genVarMapper(funcEmitter, 'args.mapper.'),
    inline: false,
    flatItem: false,
    lblProp: 'name',
    subProp: 'label',
    onAdded: () => updDftByType('String', funcEmitter, { prefix: 'args.mapper.' })
  },
  isAsync: {
    label: 'Async前缀',
    type: 'Checkbox'
  },
  isStatic: {
    label: '静态函数',
    type: 'Checkbox'
  },
  remark: {
    label: '备注',
    type: 'Textarea'
  },
  design: {
    label: '流程',
    type: 'Button',
    inner: '流程设计',
    display: [new Cond({ prop: 'key', compare: '!=', value: '' })],
    onClick: (func: Func) => {
      const project = store.getters['project/ins'] as Project
      const typo = project.typos.find(typo => typo.funcs.find(fun => fun.key === func.key)) as Typo
      router.push(`/server-package/project/${project.key}/typo/${typo.key}/func/${func.key}`)
    }
  }
})
const emitter = new TinyEmitter()
const mapper = reactive(
  new Mapper({
    name: {
      label: '类名',
      type: 'Input',
      rules: [{ required: true, message: '必须给出类名！' }]
    },
    label: {
      label: '类标签',
      type: 'Input'
    },
    desc: {
      label: '描述',
      type: 'Textarea'
    },
    super: {
      label: '父类',
      type: 'Select',
      options: []
    },
    params: {
      label: '构造参数',
      type: 'EditList',
      flatItem: true,
      mapper: new Mapper({
        pname: {
          type: 'Input',
          placeholder: '填入参数名'
        }
      }),
      newFun: () => ({ pname: '' })
    },
    deps: {
      label: '依赖',
      type: 'TagList',
      subProp: 'subTitle',
      flatItem: true,
      mapper: new Mapper({
        data: {
          type: 'ListSelect',
          height: 300,
          options: []
        }
      }),
      emitter: new TinyEmitter(),
      newFun: () => ({ data: [] }),
      onSaved: (form: any) => form,
      onAdded: (form: any, data: any) => setProp(form, 'data', data)
    },
    props: {
      label: '字段',
      type: 'Table',
      columns: propCols,
      mapper: propMapper,
      emitter: propEmitter,
      newFun: () => new Property()
    },
    funcs: {
      label: '方法',
      type: 'Table',
      columns: funcCols,
      mapper: funcMapper,
      emitter: funcEmitter,
      newFun: () => new Func()
    },
    opera: {
      label: '操作',
      type: 'Button',
      inner: '删除',
      danger: true,
      display: [new Cond({ prop: 'key', compare: '!=', value: '' })],
      onClick: (typo: Typo) => {
        Modal.confirm({
          title: '确定删除适配器',
          content: 'abcd',
          onOk: async () => {
            await typAPI.remove(typo)
            emitter.emit('update:visible', false)
            await store.dispatch('project/refresh')
          }
        })
      }
    }
  })
)

emitter.on('show', () => {
  const deps = store.getters['project/deps']
  emitter.emit('update:mprop', {
    'super.options': deps.map(({ key, name }) => ({
      label: name,
      value: key
    })),
    'deps.lblMapper': Object.fromEntries(deps.map((dep: Dep) => [dep.key, dep.name])),
    'deps.mapper.data.options': deps.map((dep: Dep) => ({
      key: dep.key,
      title: dep.name,
      subTitle: `import ${depExp(dep)} from '${dep.from}'`
    }))
  })
})
propEmitter.on('show', (prop: Property) =>
  updDftByType(prop.ptype, propEmitter, pickOrIgnore(prop, ['dftVal'], false))
)

async function onTypoSubmit(typo: Typo, next: Function) {
  if (typo.key) {
    await typAPI.update(typo)
  } else {
    await typAPI.add(typo)
  }
  next()
  await store.dispatch('project/refresh')
}
function genVarMapper(emitter: TinyEmitter, prefix = '') {
  return new Mapper({
    name: {
      label: '名称',
      type: 'Input',
      rules: [{ required: true, message: '必须填写名称！' }]
    },
    label: {
      label: '标签',
      type: 'Input'
    },
    ptype: {
      label: '类型',
      type: 'Select',
      rules: [{ required: true, message: '必须选择类型！' }],
      options: typeOpns.filter(({ value }) => value !== 'Id' && value !== 'Unknown'),
      onChange: (prop: Property) => updDftByType(prop.ptype, emitter, { prefix })
    },
    dftVal: {
      label: '默认值',
      type: 'Unknown'
    },
    index: {
      label: '构造导入',
      type: 'Checkbox',
      placeholder: '为真则表示该字段通过构造函数的参数初始化'
    },
    remark: {
      label: '备注',
      type: 'Textarea'
    }
  })
}
function getSupName(typo: Typo) {
  for (const dep of store.getters['project/deps'] as Dep[]) {
    if (dep.key === typo.super) {
      return dep.name
    }
  }
  return ''
}
function onFuncClick(typo: Typo, func: Func) {
  router.push(`/server-package/project/${route.params.pid}/typo/${typo.key}/func/${func.key}`)
}
</script>
