import uuidv4 from 'uuid/v4'
import { promisify } from 'util'
import rimraf from 'rimraf'
import mkdirp from 'mkdirp'
import fs from 'fs'
import os from 'os'
import { pipeline } from 'stream'

import File from './file'

const pipelineAsync = promisify(pipeline)
const mkdirpAsync = promisify(mkdirp)

export default class TmpDir {
    path: string

    constructor() {
        this.path = `${os.tmpdir()}/${uuidv4()}`
    }

    async addFile(file: File) {
        const fileStream = fs.createWriteStream(`${this.path}/${file.name}`)
        await pipelineAsync(file.getStream(), fileStream)
        return Promise.resolve(fileStream.path)
    }

    async mk() {
        return mkdirpAsync(this.path)
    }

    async rm() {
        return Promise.resolve(rimraf.sync(this.path))
    }
}
