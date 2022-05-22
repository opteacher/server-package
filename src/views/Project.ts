/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { TinyEmitter as Emitter } from 'tiny-emitter'
import Mapper from '@/types/mapper'
import Transfer from '@/types/transfer'

export const tsEmitter = new Emitter()

export const tsMapper = new Mapper({
  file: {
    label: '上传传送文件',
    type: 'Upload',
    onChange: (_record: Transfer, info: any) => {
      for (const file of info.fileList) {
        if (file.status !== 'done') {
          tsEmitter.emit('editable', false)
          return
        }
      }
      tsEmitter.emit('editable', true)
    }
  },
  dest: {
    label: '投放位置',
    desc: '基于容器/app位置（注意：文件名不能修改，所以这里只能填写目录！）',
    type: 'Input'
  }
})
