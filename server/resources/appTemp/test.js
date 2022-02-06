import puppeteer from 'puppeteer'

const browser = await puppeteer.launch({
  executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
  headless: true
})
const page = await browser.newPage()
page.setDefaultNavigationTimeout(3600000)

console.log(`将跳转到：${'https://www.jiucaigongshe.com/'}`)
const resp = await page.goto('https://www.jiucaigongshe.com/', {
  waitUntil: 'networkidle2' // 等待网络状态为空闲的时候才继续执行
})
await page.waitForTimeout(1000)

const rank = await page.waitForSelector('.asideStyle:nth-child(6)')
console.log('获取最后一个.asideStyle')
const rankTitle = await rank.$eval('.fs17-bold', el => el.textContent)
console.log(rankTitle)

for (const rkTab of await rank.$$('.tab .tab-top .tab-item')) {
  const tabTtl = (await (await rkTab.getProperty('textContent')).jsonValue()).trim()
  console.log(`* ${tabTtl}`)
  if (tabTtl === '工分十日榜') {
    break
  }
  await rkTab.tap()
  for (const rkItm of await rank.$$('.tab .tab-content .item')) {
    const itmTtl = await rkItm.$eval('.item-content', el => el.textContent.trim())
    console.log(`  - ${itmTtl}`)
    await rkItm.tap()
    await page.waitForTimeout(1000)
    const subPage = (await browser.pages()).pop()
    switch (tabTtl) {
      case '搜索关键字':
        {
          console.log(await subPage.$eval('.name_stock', el => el.nextElementSibling.innerText))
        }
        break
      case '月度热帖':
        {
          await subPage.waitForSelector('section')
          const datetime = await subPage.$eval('.date', el => el.textContent.trim())
          const relStocks = await subPage.$$eval(
            '.h_source-box .hsh-flex-many-center .h_source .text',
            els => els.map(el => el.textContent.trim())
          )
          const valuable = (
            await subPage.$eval('.actionBtnGroup .btn:nth-child(1) .fs15-ash', el => el.textContent)
          ).trim()
          const ttlCmt = (
            await subPage.$eval('#jcComment', el => el.nextElementSibling.children[0].innerText)
          ).trim()
          const link = subPage.url()
          console.log({
            title: itmTtl,
            time: new Date(datetime),
            relStocks,
            valuable: parseInt(/\d+/.exec(valuable)[0]),
            commant: parseInt(/\d+/.exec(ttlCmt)[0]),
            link
          })
        }
        break
    }
    await subPage.close()
  }
}

await browser.close()
