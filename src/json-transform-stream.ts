import { Transform } from 'stream'
import { Buffer } from 'buffer'

export default class JsonTransformStream extends Transform {
    private buffer: Buffer // internal buffer to hold json file in memory
    private jsonMeta: Object // meta data about the resource
    private transform: Function // the transform function

    constructor(options: Object, config: any) {
        super(options)
        this.buffer = Buffer.from([])
        this.jsonMeta = config.fileMeta
        this.transform = config.transform
    }

    _transform(chunk: any, encoding: string, done: Function) {
        this.buffer = Buffer.concat([this.buffer, chunk])
        done()
    }

    async _flush(callback: Function) {
        try {
            const json = JSON.parse(this.buffer.toString('utf-8'))
            const transformedJson = await this.transform(json, this.jsonMeta)
            const outputBuffer = Buffer.from(JSON.stringify(transformedJson), 'utf-8')
            callback(null, outputBuffer)
        } catch (error) {
            callback(error)
        }
    }
}
