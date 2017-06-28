(function (global) {
  'use strict';

  global.Scope = Scope;

  function Scope () {
    this.$$watchers = [];
    this.$$phase = undefined;
    this.$$asyncQueue = [];
    this.$$applyAsyncQueue = [];
    this.$$applyAsyncTaskId = null;
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

    this.$$beginPhase('$digest')

    if (this.$$applyAsyncTaskId) {
      this.$$applyAsyncTaskId = clearTimeout(this.$$applyAsyncTaskId)
      while (this.$$applyAsyncQueue.length) {
        this.$$applyAsyncQueue.shift()(this)
      }
    }

    do {
      dirty = false;
      var length = vm.$$watchers.length;

      while(vm.$$asyncQueue.length) {
        var evalAsyncTask = vm.$$asyncQueue.shift()
        evalAsyncTask()
      }

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
          break;
        }
      }

      // 单次循环超过10次抛异常，防止死循环
      if (digestCounter++ >= ttl) {
        vm.$$clearPhase();
        throw Error('$digest is 10 iterations');
      }


    } while (dirty || vm.$$asyncQueue.length);

    this.$$clearPhase();
  };

  Scope.prototype.$eval = function $eval(expr, locals) {
    return expr(this, locals)
  };

  Scope.prototype.$apply = function $apply(expr) {
    var scope = this
    try {
      scope.$$beginPhase('$apply');
      return scope.$eval(expr)
    } finally {
      scope.$$clearPhase();
      scope.$digest()
    }
  };

  Scope.prototype.$evalAsync = function $evalAsync(expr, locals) {
    var scope = this;
    var evalFn = function () {
      return scope.$eval(expr, locals)
    }

    if (!scope.$$phase && !this.$$asyncQueue.length) {
      setTimeout(function () {
        if (scope.$$asyncQueue.length) {
          scope.$digest()
        }
      }, 0)
    }

    this.$$asyncQueue.push(evalFn)
  };

  Scope.prototype.$applyAsync = function $applyAsync(expr) {
    var scope = this;
    var applyFn = function (scope) {

      scope.$eval(expr)
    }

    scope.$$applyAsyncQueue.push(applyFn)

    if (!this.$$applyAsyncTaskId) {
      this.$$applyAsyncTaskId = setTimeout(function () {
        scope.$apply(function (scope) {
          while (scope.$$applyAsyncQueue.length) {
            scope.$$applyAsyncQueue.shift()(scope)
          }

          scope.$$applyAsyncTaskId = null;
        })
      }, 0)
    }
  };

  Scope.prototype.$$beginPhase = function $$beginPhase(phase) {
    if (this.$$phase) {
      throw Error('already in ' + this.$$phase + ' phase')
    }

    this.$$phase = phase;
  }

  Scope.prototype.$$clearPhase = function $$clearPhase() {
    this.$$phase = null;
  }
})(window);

