import PocketBase from 'pocketbase'

const pbUrl =
  (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_POCKETBASE_URL) ||
  (typeof process !== 'undefined' &&
    process.env &&
    (process.env.VITE_POCKETBASE_URL || process.env.POCKETBASE_URL)) ||
  'http://127.0.0.1:8090'

const pb = new PocketBase(pbUrl)
pb.autoCancellation(false)

export default pb
