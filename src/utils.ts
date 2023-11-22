/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export * from '@lib/utils'

export function downloadFile(resp: any) {
  const link = document.createElement('a')
  // 创建对象url
  let data = resp.data
  if (resp.headers['content-type'].startsWith('application/json')) {
    data = JSON.stringify(data)
  }
  link.href = window.URL.createObjectURL(
    new Blob([data], { type: resp.headers['content-type'] })
  )
  const filename = window.decodeURI(resp.headers['content-disposition'].split('=')[1])
  link.download = filename.substring(
    filename.startsWith('"') ? 1 : 0,
    filename.endsWith('"') ? filename.length - 1 : undefined
  )
  link.style.display = 'none'
  link.click()
  link.remove()
}

export function newOne<T>(t: { new (): T }): T {
  return new t()
}