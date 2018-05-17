define(['angular'],
  function(angular) {
    var modelSystemModule = angular.module(['aliyunConsoleModelSystem'], []);
    modelSystemModule.constant('aliyunConsoleDefaultModelConfig', {
      bizTypes: [],
      modelTypes: [],
      moduleModel: {

      },
      pageModel: {

      },
      bizComponentModel: {

      },
      bizModel: {

      },
      formModel: {},
      gridModel: {},
      toolBarModel: {}
    }).provider("aliyunConsoleModelSetting", ['aliyunConsoleDefaultModelConfig',
      function(defaultModelConfig) {
        var defaultConfig = defaultModelConfig;
        return {
          setProviderOptions: function(options) {
            angular.extend(defaultConfig, options);
          },
          setBizTypes: function(bizTypes) {
            if (defaultConfig && angular.isArray(bizTypes)) {
              defaultConfig.bizTypes = bizTypes;
            }
          },
          setModelTypes: function(modelTypes) {
            if (defaultConfig && angular.isArray(modelTypes)) {
              defaultConfig.modelTypes = modelTypes;
            }
          },
          $get: function() {
            return defaultConfig;
          }
        }
      }
    ]).run(['controllerInheritService', function(controllerInheritService) {
      controllerInheritService.init();
    }]);

    return modelSystemModule;
  })
