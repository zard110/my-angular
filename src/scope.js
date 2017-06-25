(function (global) {
  'use strict';

  global.Scope = Scope;

  function Scope () {
    this.$$watchers = [];
  }

  var _initialValue = function () {};

  Scope.prototype.$watch = function (watchFn, listenerFn) {



    var watcher = {
      watchFn: watchFn,
      listenerFn: listenerFn ? listenerFn : _initialValue,
      lastValue: _initialValue,
      isInitial: true
    };

    console.log('push watcher', watcher, this.$$lastChangedWatcher)

    this.$$lastChangedWatcher = null;
    this.$$watchers.unshift(watcher);
  };

  Scope.prototype.$digest = function () {
    var vm = this;
    var changed;
    var ttl = 10;
    var digestCounter = 0;
    this.$$lastChangedWatcher = null;

    do {
      changed = false;

      console.log(vm.$$watchers.length, vm.$$lastChangedWatcher)

      _.forEach(vm.$$watchers, function loop (watcher) {
        var value = watcher.watchFn.call(vm, vm);

        console.log('compare: ', value, watcher.lastValue)

        if (value !== watcher.lastValue) {
          changed = true;

          watcher.listenerFn.call(vm, value, watcher.isInitial ? value : watcher.lastValue, vm);

          vm.$$lastChangedWatcher = watcher;
          watcher.lastValue = value;

          if (watcher.isInitial) {
            // 改变首次监听状态
            watcher.isInitial = false;
          }



        } else if (vm.$$lastChangedWatcher === watcher) {
          // 如果上次循环中最后一个改变的watcher没有发生变化，则跳出循环
          return false;
        }
      });

      // 单次循环超过10次抛异常，防止死循环
      if (digestCounter++ >= ttl) {
        throw Error('$digest is 10 iterations');
      }
    } while (changed);

    console.log('###################################\n\n')
  };
})(window);

