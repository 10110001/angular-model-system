define(['angular', './modelSystemModule', './modelSystemBaseController'], function(angular, modelSystemModule, modelSystemBaseControllerService) {
  var appProviders = null;

  modelSystemModule.config(['$compileProvider', '$filterProvider', '$controllerProvider', '$provide', function($compileProvider, $filterProvider, $controllerProvider, $provide) {
    lazy.init({
      $compileProvider: $compileProvider,
      $filterProvider: $filterProvider,
      $controllerProvider: $controllerProvider,
      $provide: $provide
    }, true);
  }]);

  function isBoolean(value) {
    return Object.prototype.toString.call(value) === "[object Boolean]";
  }

  function wrapRegister(module, originRegister, newRegistor) {
    return function(isOrigin) {
      var isOrigin = arguments[0];
      var args = null;
      if (isBoolean(isOrigin) && isOrigin === true) {
        args = Array.prototype.slice.call(arguments, 1);
        originRegister.apply(module, args);
        return module;
      } else {
        args = Array.prototype.slice.call(arguments, 0);
        newRegistor.apply(module, args);
        return module;
      }
    }
  }
  var lazy = {
    init: function(providers) {
      appProviders = providers;
      lazy.isInLazyMod = true;
    },
    makeLazy: function(module) {
      var providers = appProviders;
      module.directive = wrapRegister(module, module.directive, providers.$compileProvider.directive);
      module.filter = wrapRegister(module, module.filter, providers.$filterProvider.register);
      module.controller = wrapRegister(module, module.controller, providers.$controllerProvider.register);
      module.provider = wrapRegister(module, module.provider, providers.$provide.provider);
      module.service = wrapRegister(module, module.service, providers.$provide.service);
      module.factory = wrapRegister(module, module.factory, providers.$provide.factory);
      module.value = wrapRegister(module, module.value, providers.$provide.value);
      module.constant = wrapRegister(module, module.constant, providers.$provide.constant);
      module.$$isInLazyMod = true;
      //支持动态注册的controller自动支持Controller的继承
      module.controller = modelSystemBaseControllerService.wrapController(module);
      return module;
    }
  }
  return lazy;
})
