define([
  'angular',
  './modelSystemModule',
  'require'
], function(angular, modelSystemModule, require) {
  modelSystemModule.provider('modelSystem.scriptLoader', [
    function() {
      var defaultLoader = {
        load: require
      };

      return {
        setLoader: function(loader) {
          angular.extend(defaultLoader, {
            load: loader
          });
        },
        $get: function() {
          return defaultLoader;
        }
      };
    }
  ]);
});
