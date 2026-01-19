import notifier from 'mail-notifier'

const n = notifier({
  user: 'opteacher@qq.com',
  password: 'xudbhwcwkbecbggb',
  host: 'imap.qq.com',
  port: 993, // imap port
  tls: true,
  tlsOptions: { rejectUnauthorized: false }
})
  .on('mail', mail => {
    console.log('You have a new email:', mail)
  })
  .on('end', () => n.start())
  .start()

process.on('SIGINT', () => {
  console.log('接收到 SIGINT 信号，正在关闭服务...')
  n.stop()
  process.exit(0)
})
