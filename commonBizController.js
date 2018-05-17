define(['angular', './modelSystemModule','./moduleManager'], function(angular , modelSystemModule,ModuleManager) {

  modelSystemModule.controller("commonBizController", ['$scope', '$injector','$state', '$q', '_currentModule', '_pageInitializer', '_moduleLoader', '_pageModelLoader',
    function($scope, $injector,$state , $q, _currentModule, _pageInitializer, _moduleLoader, _pageModelLoader) {
      var module = _currentModule,
        pageInitializer = _pageInitializer,
        moduleLoader = _moduleLoader,
        pageModelLoader = _pageModelLoader,
        moduleManager = ModuleManager.getInstance();
      $scope.loadingState = true;
      var loadModules = function() {
        var deffered = $q.defer();
        moduleLoader.loadResources($scope, $injector, function(data){
          deffered.resolve(data);
        });
        return deffered.promise
      }

      var loadComponents = function() {
        var deffered = $q.defer();
        pageModelLoader.loadResources($scope, $injector, function(data){
          deffered.resolve(data);
        });
        return deffered.promise
      }
      $q.all([loadModules(), loadComponents()]).then(function(datas) {
        var moduleResources = datas[0],
          pageModel = datas[1];
        //注册模块
        moduleManager.registModules(moduleResources);

        //加载业务组件
        module = moduleManager.getModules(module.nameSpace)[0];
        pageInitializer.initPageModel($scope, $injector, $state, module, pageModel);
        $scope.loadingState = false;
      }, function() {

      });
    }
  ])
})
