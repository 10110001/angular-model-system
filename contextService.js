define(['angular', './modelSystemModule', './modelSystemBaseController'], function(angular, modelSystemModule, modelSystemBaseControllerService) {
  modelSystemModule.factory('modelSystemScopeContextService', ['$injector', '$rootScope', function($injector, $rootScope) {
    var cacheObj = {}
    return {
      setContext: function(controllerName, scopeContext) {
        if (cacheObj[controllerName]) {
          throw new Error(controllerName + ' has been registed, should not regist again.please check your code');
        }
        if (!(scopeContext instanceof $rootScope.constructor)) {
          throw new Error('scopeContextService only can regist angular scope object, if you want to cache something else, please use $cacheProver or $rootScope');
        }
        cacheObj[controllerName] = scopeContext;
        scopeContext.$on('$destroy', function() {
          delete cacheObj[controllerName];
        })
      },
      getContext: function(controllerName) {
        var scopeContext = cacheObj[controllerName]
        return {
          get: function(key) {
            if (angular.isString(key)) {
              var keys = key.split('.');
              var currentKey = "";
              var obj = scopeContext;

              do {
                currentKey = keys.shift();
                obj = obj[currentKey];
              } while (obj && keys.length > 0)
              return obj != null && obj != undefined && !angular.isFunction(obj) ? angular.copy(obj) : undefined;
            } else {
              throw new Error('param "key" must be a string, other typeof value is not supported;');
            }
          }
        }
      }
    }
  }]);
})
