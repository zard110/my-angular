/* jshint globalstrict: true */
/* global Scope: false */

'use strict'

describe('Scope-->', function () {

  it('can be constructed and used as an object', function () {
    var scope = new Scope()
    scope.aProperty = 1

    expect(scope.aProperty).toBe(1)
  })

  describe('digest:', function () {
    var scope

    beforeEach(function () {
      scope = new Scope()
    })

    it('calls the listener function of a watch on first $digest', function () {
      var watchFn = function () { return 'wat' }
      var listenerFn = jasmine.createSpy()

      scope.$watch(watchFn, listenerFn)
      scope.$digest()

      expect(listenerFn).toHaveBeenCalled()
    })

    it('calls this watch function with the scope as the arguments', function () {
      var watchFn = jasmine.createSpy()
      var listenFn = function () {}

      scope.$watch(watchFn, listenFn)
      scope.$digest()

      expect(watchFn).toHaveBeenCalledWith(scope)
    })

    it('calls the listener function when the watched value changes', function () {
      scope.counter = 0
      scope.someValue = 'a'

      scope.$watch(function () {
        return scope.someValue
      }, function (newValue, oldValue, scope) {
        scope.counter++
      })

      expect(scope.counter).toBe(0)

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.someValue = 'b'
      expect(scope.counter).toBe(1)

      scope.$digest()
      expect(scope.counter).toBe(2)
    })

    it('calls listener with new value as old value the first time', function () {
      scope.someValue = 123
      var oldValueGiven

      scope.$watch(function (scope) {
        return scope.someValue
      }, function (newValue, oldValue) {
        oldValueGiven = oldValue
      })

      scope.$digest()
      expect(oldValueGiven).toBe(123)
    })

    it('may have watchers that omit the listener function', function () {
      var watchFn = jasmine.createSpy().and.returnValue('something')
      scope.$watch(watchFn)

      scope.$digest()
      expect(watchFn).toHaveBeenCalled()
    })

    it('triggers chained watchers in the same digest', function () {
      scope.name = 'joe'

      scope.$watch(function (scope) {
        return scope.nameUpper
      }, function (newValue, oldValue, scope) {
        if (newValue) {
          scope.initial = newValue.substring(0, 1) + '.'
        }
      })

      scope.$watch(function (scope) {
        return scope.name
      }, function (newValue, oldValue, scope) {
        if (newValue) {
          scope.nameUpper = newValue.toUpperCase()
        }
      })

      scope.$digest()
      expect(scope.initial).toBe('J.')

      scope.name = 'bob'
      scope.$digest()
      expect(scope.initial).toBe('B.')
    })

    it('gives up on the watches after 10 iterations', function () {
      scope.counterA = 0
      scope.counterB = 0

      scope.$watch(
        function (scope) { return scope.counterA },
        function (newValue, oldValue, scope) {
          scope.counterB++
        }
      )

      scope.$watch(
        function (scope) { return scope.counterB },
        function (newValue, oldValue, scope) {
          scope.counterA++
        }
      )

      expect(function () { scope.$digest() }).toThrow()
    })

    it('ends the digest when the last watch is clean', function () {
      scope.array = _.range(100)
      var watchExecutions = 0

      _.times(100, function (i) {
        scope.$watch(
          function (scope) {
            watchExecutions++
            return scope.array[i]
          },

          function (newValue, oldValue, scope) {}
        )
      })

      scope.$digest()
      expect(watchExecutions).toBe(200)

      scope.array[0] = 250
      scope.$digest()
      expect(watchExecutions).toBe(301)
    })

    it('dose not end digest so that new watches are not run', function () {
      scope.aValue = 'abc'
      scope.counter = 0

      scope.$watch(
        function (scope) { return scope.aValue },
        function (newValue, oldValue, scope) {

          scope.$watch(
            function (scope) { return scope.aValue },
            function (newValue, oldValue, scope) {
              scope.counter++
            }
          )
        }
      )

      scope.$digest()
      expect(scope.counter).toBe(1)
    })

    it('compares based on value (array length) if enabled', function () {
      scope.aValue = [1, 2, 3]
      scope.counter = 0;

      scope.$watch(
        function (scope) { return scope.aValue },
        function (newValue, oldValue, scope) {
          scope.counter++
        },
        true
      )

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.aValue.push(4)
      scope.$digest()
      expect(scope.counter).toBe(2)
    })

    it('compares based on value (object property) if enabled', function () {
      scope.aValue = {
        id: 1,
        name: 'zk'
      }
      scope.counter = 0;

      scope.$watch(
        function (scope) { return scope.aValue },
        function (newValue, oldValue, scope) {
          scope.counter++
        },
        true
      )

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.aValue.name = 'pyq'
      scope.$digest()
      expect(scope.counter).toBe(2)
    })

    it('compares based on value (object property in array) if enabled', function () {
      scope.aValue = [
        {id: 1, name: 'zk'},
        {id: 2, name: 'pay'}
      ]
      scope.counter = 0;

      scope.$watch(
        function (scope) { return scope.aValue },
        function (newValue, oldValue, scope) {
          scope.counter++
        },
        true
      )

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.aValue[1].name = 'pyq'
      scope.$digest()
      expect(scope.counter).toBe(2)
    })

    it('correctly handles NaNs', function () {
      scope.number = 0 / 0;
      scope.counter = 0;

      scope.$watch(
        function (scope) { return scope.number },
        function (newValue, oldValue, scope) {
          scope.counter++
        }
      )

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.$digest()
      expect(scope.counter).toBe(1)
    })
  })

  describe('eval:', function () {
    var scope

    beforeEach(function () {
      scope = new Scope()
    })

    it('executes $eval function and return result', function () {
      scope.aValue = 423

      var result = scope.$eval(function (scope) {
        return scope.aValue
      })

      expect(result).toBe(423)
    })

    it('passes the second $eval argument straight through', function () {
      scope.aValue = 99

      var result = scope.$eval(function (scope, arg) {
        return scope.aValue + arg
      }, 1)

      expect(result).toBe(100)
    })

  })

  describe('apply:', function () {
    var scope

    beforeEach(function () {
      scope = new Scope()
    })

    it('executes $apply function and starts the digest', function () {
      scope.aValue = 423
      scope.counter = 0

      scope.$watch(
        function (scope) { return scope.aValue },
        function () { scope.counter++ }
      )

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.$apply(function (scope) {
        scope.aValue = 100
      })
      expect(scope.counter).toBe(2)
    })
  })

  describe('evalAsync:', function () {
    var scope

    beforeEach(function () {
      scope = new Scope()
    })

    it('executes $evalAsync function later in the same cycle', function () {
      scope.aValue = 100
      scope.asyncEvaluated = false
      scope.asyncEvaluatedImmediately = false


      scope.$watch(
        function (scope) { return scope.aValue },
        function (newValue, oldValue, scope) {
          scope.$evalAsync(function (scope) {
            scope.asyncEvaluated = true
          })

          scope.asyncEvaluatedImmediately = scope.asyncEvaluated
        }
      )

      scope.$digest()
      expect(scope.asyncEvaluated).toBe(true)
      expect(scope.asyncEvaluatedImmediately).toBe(false)
    })

    it('executes $evalAsync functions added by watch function', function () {
      scope.aValue = 100
      scope.asyncEvaluated = false

      scope.$watch(
        function (scope) {
          if (!scope.asyncEvaluated) {
            scope.$evalAsync(function (scope) {
              scope.asyncEvaluated = true
            })
          }

          return scope.aValue
        },
        function (newValue, oldValue, scope) {}
      )

      scope.$digest()
      expect(scope.asyncEvaluated).toBe(true)
    })

    it('executes $evalAsync functions even when not dirty', function () {
      scope.aValue = 99
      scope.asyncEvaluatedTimes = 0

      scope.$watch(
        function (scope) {
          if (scope.asyncEvaluatedTimes < 2) {
            scope.$evalAsync(function (scope) {
              scope.asyncEvaluatedTimes++
            })

            return scope.aValue
          }
        },
        function (oldValue, newValue, scope) {}
      )

      scope.$digest()
      expect(scope.asyncEvaluatedTimes).toBe(2)
    })

    it('eventually halts $eventAsync added by watchers', function () {
      scope.aValue = 99

      scope.$watch(
        function (scope) {
          scope.$evalAsync(function (scope) { })
          return scope.aValue
        },
        function (oldValue, newValue, scope) {}
      )

      expect(function () { scope.$digest() }).toThrow()
    })

    it('schedules a digest in $evalAsync', function (done) {
      scope.aValue = 100
      scope.counter = 0

      scope.$watch(
        function (scope) { return scope.aValue },
        function (newValue, oldValue, scope) { scope.counter++ }
      )

      scope.$evalAsync(function (scope) { })

      expect(scope.counter).toBe(0)
      setTimeout(function () {
        expect(scope.counter).toBe(1)
        done()
      }, 50)
    })
  })

  describe('applyAsync:', function () {
    var scope

    beforeEach(function () {
      scope = new Scope()
    })

    it('allows async $apply with $applyAsync', function (done) {



      scope.aValue = 100
      scope.counter = 0

      scope.$watch(
        function (scope) {
          return scope.aValue
        },
        function (newValue, oldValue, scope) {
          scope.counter++
        }
      )

      scope.$digest()
      expect(scope.counter).toBe(1)

      scope.$applyAsync(function () {
        scope.aValue = 250
      })
      expect(scope.counter).toBe(1)



      setTimeout(function () {
        expect(scope.counter).toBe(2)

        done()
      }, 50)
    })

    it('never executes $applyAsync function in the same cycle', function (done) {
      scope.aValue = 100
      scope.asyncApplied = false

      console.log('\nnever executes $applyAsync function in the same cycle')

      scope.$watch(
        function (scope) {
          return scope.aValue
        },
        function (newValue, oldValue, scope) {
          scope.$applyAsync(function (scope) {
            scope.asyncApplied = true
          })
        }
      )

      scope.$digest()
      expect(scope.asyncApplied).toBe(false)

      setTimeout(function () {
        console.log('\n')
        expect(scope.asyncApplied).toBe(true)
        done()
      }, 50)
    })

    it('coalesces many calls to $applyAsync', function (done) {
      scope.counter = 0

      scope.$watch(
        function (scope) {
          scope.counter++
          return scope.aValue
        },
        function () {}
      )

      scope.$applyAsync(function (scope) {
        scope.aValue = 123
      })

      scope.$applyAsync(function (scope) {
        scope.aValue = 456
      })

      setTimeout(function () {
        expect(scope.counter).toBe(2)
        done()
      }, 50)
    })

    it('cancels and flushes $applyAsync if digested first', function (done) {
      scope.counter = 0

      scope.$watch(
        function (scope) {
          scope.counter++
          return scope.aValue
        },
        function () {}
      )

      scope.$applyAsync(function (scope) {
        scope.aValue = 123
      })

      scope.$applyAsync(function (scope) {
        scope.aValue = 456
      })

      scope.$digest()
      expect(scope.counter).toBe(2)
      expect(scope.aValue).toBe(456)


      setTimeout(function () {
        expect(scope.counter).toBe(2)
        done()
      }, 50)
    })
  })

  describe('phase:', function () {
    var scope

    beforeEach(function () {
      scope = new Scope()
    })

    it('has a $$phase field whose value is the current digest phase', function () {
      scope.aValue = 100

      scope.$watch(
        function (scope) {
          scope.phaseInWatchFunction = scope.$$phase
          return scope.aValue
        },
        function (newValue, oldValue, scope) {
          scope.phaseInListenerFunction = scope.$$phase
        }
      )

      scope.$apply(function () {
        scope.phaseInApplyFunction = scope.$$phase
      })

      expect(scope.phaseInWatchFunction).toBe('$digest')
      expect(scope.phaseInListenerFunction).toBe('$digest')
      expect(scope.phaseInApplyFunction).toBe('$apply')
    })
  })
})
