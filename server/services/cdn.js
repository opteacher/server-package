import Path from 'path'
import { uploadToQiniu } from '../lib/backend-library/utils/index.js'
import { v4 as uuidv4 } from 'uuid'
import { createReadStream } from 'fs'

export function uploadImage(tmpPath) {
  return uploadToQiniu(Path.resolve('configs', 'qiniu'), uuidv4(), createReadStream(tmpPath))
}
