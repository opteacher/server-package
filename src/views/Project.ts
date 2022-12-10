/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Mapper from '@/types/mapper'
import Transfer from '@/types/transfer'
import type { UploadChangeParam, UploadFile } from 'ant-design-vue'

export const tsEmitter = new Emitter()

export const tsMapper = new Mapper({
  file: {
    label: '上传传送文件',
    type: 'Upload',
    onChange: (_record: Transfer, info: UploadChangeParam) => {
      tsEmitter.emit(
        'editable',
        info.fileList.reduce(
          (prev: boolean, curr: UploadFile) => prev && curr.status === 'done',
          true
        )
      )
    }
  },
  dest: {
    label: '投放位置',
    desc: '基于容器/app位置（注意：文件名不能修改，所以这里只能填写目录！）',
    type: 'Input'
  }
})
