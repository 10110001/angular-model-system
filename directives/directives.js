/**
 * 模型系统公共指令模块
 */
define(['angular', '../modelSystemBaseController'], function(angular, baseController) {
  var module = angular.module('modelsystem.directives', []);
  module.controller = baseController.wrapController(module);
  return module;
})
