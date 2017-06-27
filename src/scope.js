(function (global) {
  'use strict';

  global.Scope = Scope;

  function Scope () {
    this.$$watchers = [];
    this.$$phase = undefined
  }

  var _initialValue = function () {};

  Scope.prototype.$watch = function $watch(watchFn, listenerFn, equalValue) {
    var watcher = {
      watchFn: watchFn,
      listenerFn: listenerFn ? listenerFn : _initialValue,
      lastValue: _initialValue,
      isInitial: true,
      equalValue: equalValue
    };

    this.$$lastChangedWatcher = null;
    this.$$watchers.push(watcher);
  };

  Scope.prototype.$digest = function $digest() {
    var vm = this;
    var dirty;
    var ttl = 10;
    var digestCounter = 0;
    this.$$lastChangedWatcher = null;

    do {
      dirty = false;
      var length = vm.$$watchers.length;

      for (var watchIndex = 0; watchIndex < length; watchIndex++) {
        var watcher = vm.$$watchers[watchIndex];
        var value = watcher.watchFn.call(vm, vm);
        var equalValue = watcher.equalValue;
        var lastValue = watcher.lastValue;
        var isInitial = watcher.isInitial;

        if ((!equalValue && value !== lastValue && !(_.isNaN(value) && _.isNaN(lastValue)))
          || (equalValue === true && !_.isEqual(value, lastValue))) {
          dirty = true;
          vm.$$lastChangedWatcher = watcher;
          watcher.lastValue = equalValue ? _.cloneDeep(value) : value;
          watcher.listenerFn.call(vm, value, isInitial ? value : lastValue, vm);

          if (isInitial) {
            // 改变首次监听状态
            watcher.isInitial = false;
          }
        } else if (vm.$$lastChangedWatcher === watcher) {
          // 如果上次循环中最后一个改变的watcher没有发生变化，则跳出循环
          return false;
        }
      }

      // 单次循环超过10次抛异常，防止死循环
      if (digestCounter++ >= ttl) {
        throw Error('$digest is 10 iterations');
      }
    } while (dirty);
  };

  Scope.prototype.$eval = function $eval() {

  };

  Scope.prototype.$apply = function $apply() {

  };

  Scope.prototype.$evalAsync = function $evalAsync() {

  };

  Scope.prototype.$applyAsync = function $applyAsync() {

  };
})(window);

