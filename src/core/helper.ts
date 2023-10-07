import fsp from 'fs/promises'
import fs from 'fs'
import fsExtra from 'fs-extra'
import path from 'path'
import { Merge, UseOptions, Options } from '../types'

export let plusOptions: UseOptions = {} as UseOptions


export function mergeInsertExport(merge: Merge, sourceDirName: string, sourceFileName: string) {
  // 源文件的完整路径
  const sourceFilePath = path.join(merge.inputDir, sourceFileName)
  // 目标目录的完整路径
  const targetFilePath = path.join(process.cwd(), plusOptions.mergeOutput, sourceFileName)
  // 先推入依赖
  merge.dependencies.push(sourceFilePath)
  // 进行切分为数组形式
  const sourceFilePathSplit = sourceFilePath.split(path.sep)
  const targetFilePathSplit = targetFilePath.split(path.sep)
  // 找出相同部分
  const diffIndex = sourceFilePathSplit.findIndex((item, index) => targetFilePathSplit[index] !== item)
  // 去除相同部分
  sourceFilePathSplit.splice(0, diffIndex)
  targetFilePathSplit.splice(0, diffIndex)
  // 去除最后的文件名
  targetFilePathSplit.pop()
  // 拼接返回
  targetFilePathSplit.forEach(item => sourceFilePathSplit.unshift(`..`))
  const exportName = normalizeFileName(sourceFileName.split('.')[0] + '-' + sourceDirName)
  const exportStr = `export * as  ${exportName} from '${sourceFilePathSplit.join('/')}'`
  merge.exports.push(exportStr)
}

export function clearAndCreateAutoDir(dirPath: string) {
  if (fs.existsSync(dirPath)) {
    fsExtra.emptyDirSync(dirPath)
  } else {
    fsExtra.mkdirSync(dirPath)
  }
}

/**
 * .gitignore内容追加
 * @param mergeDir 聚合文件存放的目录
 */
export async function gitignoreAddAutoImport(mergeDir: string) {
  const gitignorePath = path.join(process.cwd(), '.gitignore')
  const dirName = mergeDir.split(path.sep).pop() as string

  try {
    if (fs.existsSync(gitignorePath)) {
      const gitignoreContent = await fsp.readFile(gitignorePath, 'utf-8')
      if (!gitignoreContent) return
      const gitignoreContentLine = gitignoreContent.split('\n')
      if (gitignoreContentLine.includes(dirName)) return
      fs.appendFileSync(gitignorePath, `\n${dirName}`)
    } else {
      fs.writeFile(gitignorePath, dirName, () => { })
    }
  } catch (error) {
    console.log(error);

  }
}

/**
 * 格式化插件选项
 * @param options plus的选项
 * @returns
 */
export function normalizeOptions(options: Options): UseOptions {
  plusOptions = {
    mergeDirs: options.mergeDirs ? options.mergeDirs.map(path.normalize) : [],
    mergeOutput: options.mergeOutput ? path.normalize(options.mergeOutput) : path.join(process.cwd(), 'src', 'export-merge')
  }
  return plusOptions
}

export function normalizeFileName(fileName: string) {
  return fileName
    .split('-')
    .map((item, index) => {
      if (index === 0) return item
      return item.slice(0, 1).toUpperCase() + item.slice(1)
    })
    .join('')
}