'use strict'

function Scope () {
  this.$$watchers = []
}

Scope.prototype.$watch = function (watchFn, listenerFn) {
  var watcher = {
    watchFn: watchFn,
    listenerFn: listenerFn
  }

  this.$$watchers.push(watcher)
}

Scope.prototype.$digest = function () {
  var vm = this

  _.forEach(this.$$watchers, function (watcher) {
    var value = watcher.watchFn()
    watcher.listenerFn(value, vm)
  })
}
