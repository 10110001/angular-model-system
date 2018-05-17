define(['../modelSystemModule', 'angular', '../lib/template', '../../cons/aliyunCons', '../../helper/responsePreHandler', '../../services/i18nService'],
  function(modelSystemModule, angular, TP, cons, responsePreHandler, i18nService) {
    var i18nInstance = i18nService.getI18n('modelSystem.itemGrid');
    var successText = i18nInstance.i18n('successText');

    function paginationHelper(pageDef) {
      return {
        total: pageDef.total || 0,
        page: pageDef.page || 0,
        pageSize: pageDef.pageSize || 0
      }
    }


    function getGridData($scope, params) {
      if (angular.isFunction($scope.gridModel.getGridData)) {
        return $scope.gridModel.getGridData(params, $scope.gridData)
      }
      if (angular.isArray($scope.gridData)) {
        return $scope.gridData;
      }
      if (angular.isObject($scope.gridData)) {
        if (angular.isArray($scope.gridData.items)) {
          return $scope.gridData.items;
        } else if (angular.isObject($scope.gridData.items)) {
          return [$scope.gridData.items];
        } else {
          return [$scope.gridData];
        }
      }
      return []
    }

    modelSystemModule.directive("itemGrid", ['$compile', '$injector', 'aliyunDialog',
      function($compile, $injector, aliyunDialog) {
        return {
          restrict: "A",
          scope: {
            bizType: "@",
            bizModel: "=",
            modelType: "@",
            gridsModel: "=",
            selectedData: "=",
            /**
             * 元数据，用来外界传递给表格作为初始化元数据使用
             * 开发者可以传入任意的数据，然后可以通过业务模型的injectController方法读取到scope.rawData的数据
             */
            rawData: "=",
            /**
             * 列表数据，推荐数据格式：
             * {
             * items:[{},{}],
             * pageInfo:{
             *     total:10,
             *     page:1,
             *     pageSize:10
             *   }
             * }
             *
             * 如果不要分页，则直接绑定一个数组即可。
             * @type {String}
             */
            gridData: "=",
            renderTable:"&",
            refreshEventName: "="
          },
          controller: ['$scope', '$rootScope', '$attrs', '$injector', '$state', '$stateParams',
            function($scope, $rootScope, $attrs, $injector, $state, $stateParams) {

              function defaultCallback(response, gridModel) {
                $scope.itemList = response.data || [];
                $scope.loadingState = false;
                $scope.pageInfo = angular.isFunction(gridModel.getPagination) ? gridModel.getPagination(response) : paginationHelper(response.pageInfo || response);
              }

              var modelFactory = $injector.get('modelFactory'),
                bizType = $attrs.bizType,
                refreshEventName = $scope.refreshEventName || (bizType + ":actionExecuted"),
                modelType = $attrs.modelType || bizType,
                bizAction = $attrs.bizAction,
                bizModel = $scope.bizModel || modelFactory.getModel(bizType, "BizModel"),
                actionModel = "",
                gridModel = $scope.gridsModel || modelFactory.getModel(modelType, "GridModel");
              if (bizModel) {
                actionModel = bizModel.getActionModel(bizAction);
                if (actionModel) {
                  actionModel.injectController(gridModel, $scope);
                  $scope.gridModel = gridModel;
                  var token = $rootScope.$on(refreshEventName, actionModel.actionExecutedEventHandler || function() {
                    $scope.refreshTableList();
                  })
                  $scope.$on("$destroy", function() {
                    token && token();
                  })
                  $scope.refreshTableList = function() {
                    $scope.gridModel.config.refreshCurrentView();
                  };

                  var updateList = function(options, isRefreshClick) {
                    var options = options || {};
                    if (isRefreshClick) {
                      options.successMessage = actionModel.name + successText; // '完成。';
                    }

                    $scope.loadingState = true;
                    var params = actionModel.getActionParam($scope, $attrs, options);
                    options.params = angular.extend(options.params, params);

                    //如果显示定义了隐藏默认错误弹框信息，则使用actionModel中的配置；如果没有显示定义，则判断是否定义了responseHandler,如果定义了，则隐藏，如果没有定义，则显示
                    var hideDefaultErroDialog = actionModel.hideDefaultErroDialog !== undefined ? actionModel.hideDefaultErroDialog : (actionModel.responseHandler ? true : false);
                    var responseHandler = actionModel.responseHandler || responsePreHandler.responsePreHandler;


                    bizModel.bizService[actionModel.handler](options).then(function(result) {
                      var response = responsePreHandler.responsePreHandler(result, $injector, true);
                      if (response && angular.isFunction(response.then) == false) {
                        if (angular.isFunction(actionModel.afterActionExecuted)) {
                          actionModel.afterActionExecuted(response, $scope);
                        }
                        defaultCallback(response, gridModel);
                      }
                    });
                  };

                  $scope.updateTableData = function(options) {
                    updateList(options, !options.isInitTableRequest)
                  }
                }
              } else {
                $scope.gridModel = gridModel;
                $scope.loadingState = true;
                $scope.updateTableData = function(params) {
                  if(params && $scope.renderTable){
                    $scope.renderTable({"data":params});
                    return
                  }
                  if ($scope.gridData) {
                    $scope.itemList = getGridData($scope, params);
                    $scope.loadingState = false;
                    $scope.pageInfo = angular.isFunction(gridModel.getPagination) ? gridModel.getPagination($scope.gridData) : paginationHelper($scope.gridData.pageInfo || $scope.gridData);
                  }
                }
              }

              $scope.onSelectionChange = function(selectedItems) {
                $scope.selectedData && ($scope.selectedData = selectedItems);
              }

              $scope.onBeforeSearch = function(data) {
                angular.isFunction($scope.gridModel.onBeforeSearch) && $scope.gridModel.onBeforeSearch(data);
              }
            }
          ],
          templateUrl: "scripts/template/itemGrid.html",
          link: function(scope, elem, attrs) {
            scope.$watch("gridData", function(data) {
              if (data) {
                scope.updateTableData();
              }
            })
          }
        }
      }
    ]);
  });
