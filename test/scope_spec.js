/* jshint globalstrict: true */
/* global Scope: false */

'use strict'

describe('Scope', function () {

  it('can be constructed and used as an object', function () {
    var scope = new Scope()
    scope.aProperty = 1

    expect(scope.aProperty).toBe(1)
  })

  describe('digest', function () {
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

      $scope.$watch(watchFn, listenFn)
      $scope.$digest()

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
        function (scope) { return scope.counterA },
        function (newValue, oldValue, scope) {
          scope.counterB++
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
      expect(watchExecutions).toBe(200)
    })
  })

})