import childProcess from 'child_process'
import fs from 'fs'
import log from './log'
import moment from 'moment'
import path from 'path'

function mkdirP (path) {
  return new Promise((resolve, reject) => {
    childProcess.exec(`mkdir -p ${path}`, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function echo (path, str) {
  return new Promise((resolve, reject) => {
    fs.writeFile(path, str, err => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function addCommitPush (recordDir, filename) {
  return new Promise((resolve, reject) => {
    childProcess.exec(`cd ${recordDir} && git add ${filename} && git commit -m '${filename}' && git push origin master`, (err, stdout, stderr) => {
      if (err) {
        reject(err)
      } else {
        resolve()
      }
    })
  })
}

function dirExists (filename) {
  return new Promise((resolve, reject) => {
    fs.stat(filename, (err, stat) => {
      if (err == null) {
        resolve(true)
      } else if (err.code === 'ENOENT') {
        resolve(false)
      } else {
        reject(err)
      }
    })
  })
}

module.exports = function (recordDir) {
  return function (type, data, occurred = moment()) {
    const dateStr = occurred.format('YYYY-MM-DD-hh-mm-ss')
    const filename = `${dateStr}-${type}.json`
    const fullPath = path.resolve(recordDir, filename)
    log(`recording '${type}' action to ${fullPath}`)

    return mkdirP(recordDir).then(() => {
      return echo(fullPath, JSON.stringify(data, function (k, v) {
        if (k === 'parent' || k === 'group') {
          return v.id
        } else if (k === 'fromName' && typeof this === 'object' && !this.isMod) {
          return 'Anonymous'
        } else {
          return v
        }
      }, 2))
    }).then(() => {
      return dirExists(path.resolve(recordDir, '.git'))
    }).then(isGit => {
      if (isGit) {
        return addCommitPush(recordDir, filename)
      }
    })
  }
}
