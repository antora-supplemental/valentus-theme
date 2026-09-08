import { copyFileSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const packageRoot = resolve('node_modules/@dev-centr/themed-svg')
const metadata = JSON.parse(readFileSync(resolve(packageRoot, 'package.json'), 'utf8'))
if (metadata.version !== '0.1.1') {
  throw new Error(`Expected @dev-centr/themed-svg 0.1.1, found ${metadata.version}`)
}

copyFileSync(
  resolve(packageRoot, 'browser/themed-svg-element.js'),
  resolve('supplemental-ui/js/themed-svg-element.js'),
)
