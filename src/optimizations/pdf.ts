import fs from 'fs'
import { promisify } from 'util'
import { exec } from 'child_process'

import File from '../file'
import TmpDir from '../tmp-dir'

const execAsync = promisify(exec)

export default async (pdf: File, tmpWorkspace: TmpDir): Promise<File> => {
    const compressedFile = `${tmpWorkspace.path}/compressed.pdf`

    const inputFile = await tmpWorkspace.addFile(pdf)

    await execAsync(`gs -sDEVICE=pdfwrite -o ${compressedFile} -dPDFSETTINGS=/ebook -dNOPAUSE -dBATCH -sDEVICE=pdfwrite ${inputFile}`)

    return pdf.clone({ replaceWith: fs.createReadStream(compressedFile) })
}
