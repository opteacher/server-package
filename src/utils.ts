/* eslint-disable @typescript-eslint/explicit-module-boundary-types */
/* eslint-disable @typescript-eslint/no-explicit-any */
export * from '@lib/utils'

export function downloadFile(resp: any) {
  const link = document.createElement('a')
  // 创建对象url
  link.href = window.URL.createObjectURL(
    new Blob([resp.data], { type: resp.headers['content-type'] })
  )
  const filename = window.decodeURI(resp.headers['content-disposition'].split('=')[1])
  link.download = filename.substring(
    filename.startsWith('"') ? 1 : 0,
    filename.endsWith('"') ? filename.length - 1 : undefined
  )
  link.style.display = 'none'
  document.body.appendChild(link)
  link.click()
  link.remove()
}
