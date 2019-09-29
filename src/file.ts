import { Readable, Duplex, PassThrough } from 'stream'
import { Buffer } from 'buffer'

import JsonTransformStream from './json-transform-stream'

export default class File {
    private _buffer?: Buffer
    private _stream?: Readable

    constructor(
        public name: string,
        public contentType: string,
        options: {
            stream?: Readable,
            buffer?: Buffer
        }
    ) {
        if (!options.stream && !options.buffer) throw new Error('construct using either stream or buffer')

        if (options.stream) this._stream = options.stream

        if (options.buffer) this._buffer = options.buffer
    }

    async getBuffer(): Promise<Buffer> {
        if (!this._buffer && this._stream) {
            const chunks = []
            for await (let chunk of this._stream) {
                chunks.push(chunk)
            }
            this._buffer = Buffer.concat(chunks)
        }

        if (!this._buffer) throw new Error('no buffer')

        return this._buffer
    }

    getStream(): Readable {
        if (!this._stream && this._buffer) {
            this._stream = new Duplex()
            this._stream.push(this._buffer)
            this._stream.push(null)
        }

        if (!this._stream) throw new Error('no stream')

        return this._stream
    }

    clone(
        options?: {
            replaceWith?: Readable,
            transform?: {
                fileMeta: any,
                transform: any
            }
        }
    ): File {
        if (!this._stream) throw new Error('no stream in this file')

        let pass

        if (options && options.replaceWith) {

            pass = options.replaceWith

        } else {

            if (options && options.transform) {
                pass = new JsonTransformStream({}, options.transform)
            } else {
                pass = new PassThrough()
            }

            this._stream.pipe(pass)

        }

        return new File(
            this.name,
            this.contentType,
            { stream: pass }
        )
    }
}
