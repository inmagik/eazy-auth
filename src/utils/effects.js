import { fork, cancel, take } from 'redux-saga/effects'
// TODO: Check polyfill
const arrayze = a => (Array.isArray(a) ? a : [a])

const mergePatterns = (...patterns) =>
  patterns.reduce((finalPattern, pattern) => {
    return [...finalPattern, ...arrayze(pattern)]
  }, [])

const matchPattern = (action, pattern) =>
  pattern === '*' || arrayze(pattern).indexOf(action.type) !== -1

export function* takeEveryAndCancel(pattern, cancelPattern, saga, ...args) {
  const task = yield fork(function*() {
    let pendingTasks = []
    while (true) {
      const action = yield take(mergePatterns(pattern, cancelPattern))

      if (matchPattern(action, cancelPattern)) {
        // Cancel all pending tasks
        for (let i = 0; i < pendingTasks.length; i++) {
          const task = pendingTasks[i]
          yield cancel(task)
        }
        pendingTasks = []
      } else {
        // Fork saga and remove handled tasks
        const task = yield fork(saga, ...args.concat(action))
        pendingTasks.push(task)
        pendingTasks = pendingTasks.filter(task => !task.isRunning())
      }
    }
  })
  return task
}

export function* takeLatestAndCancel(pattern, cancelPattern, saga, ...args) {
  const task = yield fork(function*() {
    let lastTask
    while (true) {
      const action = yield take(mergePatterns(pattern, cancelPattern))

      // Cancel previous task
      if (lastTask) {
        yield cancel(lastTask)
      }
      // Fork saga only
      if (!matchPattern(action, cancelPattern)) {
        lastTask = yield fork(saga, ...args.concat(action))
      }
    }
  })
  return task
}

// Difficult: Perfect Master
export function* takeLatestAndCancelGroupBy(
  pattern,
  cancelPattern,
  groupBy,
  saga,
  ...args
) {
  const task = yield fork(function*() {
    const pendingTasks = {}
    while (true) {
      const action = yield take(mergePatterns(pattern, cancelPattern))
      const key = groupBy(action)

      // Cancel previous task by key
      if (pendingTasks[key]) {
        yield cancel(pendingTasks[key])
      }

      // Fork saga only
      if (!matchPattern(action, cancelPattern)) {
        pendingTasks[key] = yield fork(saga, ...args.concat(action))
      }
    }
  })
  return task
}
