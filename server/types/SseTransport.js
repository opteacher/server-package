import Transport from 'winston-transport'


export default class SseTransport extends Transport {
  /**
  * SSE流定制日志
  * @param {stream} [Any]: SSE流
  */
  constructor(opts) {
    super(opts)
    this.stream = opts.stream
  }

  /**
  * 记录日志
  * 
  * @param {info} [String]: 信息
  * @param {callback} [Function]: 回调
  */
  log (info, callback) {
    /** 激活logged事件
     * @param {Any} info 
    **/
    setImmediate(() => {
      this.emit('logged', info)
    })

    /** 将消息输出到SSE流
     * @param {Unknown} info 
    **/
    if (this.stream) {
      this.stream.write('event: message\n')
      this.stream.write(`data: ${info.message}\n\n`)
    }

    /** 调用回调
     * @param {Any} callback 
    **/
    callback()
  }

  close () {
    if (this.stream) {
      this.stream.write('event: stop\n')
      this.stream.write('data: \n\n')
    }
  }

}