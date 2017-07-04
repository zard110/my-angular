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

  var _initialWatchValue = function () {};

  Scope.prototype.$watch = function $watch(watchFn, listenerFn, equalValue) {
    var watcher = {
      watchFn: watchFn,
      listenerFn: listenerFn ? listenerFn : function () {},
      lastValue: _initialWatchValue,
      isInitial: true,
      equalValue: equalValue
    };

    this.$$lastChangedWatcher = null;
    this.$$watchers.push(watcher);
  };

  Scope.prototype.$digest = function $digest() {
    var self = this;
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

      while(self.$$asyncQueue.length) {
        var evalAsyncTask = self.$$asyncQueue.shift()
        evalAsyncTask()
      }

      dirty = this.$$digestOnce()

      // 单次循环超过10次抛异常，防止死循环
      if (digestCounter++ >= ttl) {
        self.$$clearPhase();
        throw Error('$digest is 10 iterations');
      }


    } while (dirty || self.$$asyncQueue.length);

    this.$$clearPhase();
  };

  Scope.prototype.$$digestOnce = function () {
    var self = this
    var value, lastValue
    var isEqualValue, isInitial, isDirty

    _.forEach(this.$$watchers, function (watcher) {
      value = watcher.watchFn.call(null, self);
      isEqualValue = watcher.equalValue;
      lastValue = watcher.lastValue;
      isInitial = watcher.isInitial;

      if ((!isEqualValue && value !== lastValue && !(_.isNaN(value) && _.isNaN(lastValue)))
        || (isEqualValue === true && !_.isEqual(value, lastValue))) {
        isDirty = true;
        self.$$lastChangedWatcher = watcher;
        watcher.lastValue = isEqualValue ? _.cloneDeep(value) : value;
        watcher.listenerFn.call(self, value, isInitial ? value : lastValue, self);

        if (isInitial) {
          // 改变首次监听状态
          watcher.isInitial = false;
        }
      } else if (self.$$lastChangedWatcher === watcher) {
        // 如果上次循环中最后一个改变的watcher没有发生变化，则跳出循环
        return false;
      }
    })

    return isDirty
  }

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

