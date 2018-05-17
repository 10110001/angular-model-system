/**
 *  加载类型的itemGrid
 *  bizId 模型Id， 用于获取业务模型和视图模型
 *  bizModel 业务模型，如果未定义，将使用bizId获取BizModel
 *  viewModel 视图模型，如果未定义，将使用bizId获取GridModel
 *  config 配置
 *  config.bizActions 定义列表操作
 *  config.bizActions.loadItem 定义loadItem的业务操作
 *  config.events 定义事件回掉
 *  config.events.refreshEventName 刷新的回掉函数名称
 *  config.response 定义返回值信息
 *  config.response.itemListName 数据列表名称，默认为 'items'
 *  config.response.hasMoreName 是否还有更多数据名称，默认为 'hasMore'
 *  config.response.currentLoadTokenName 记在当前位置token， 默认为 'currentLoadToken'
 *  @see http://gtms01.alicdn.com/tps/i1/TB1bKgnHFXXXXXYXVXXE3AJ0pXX-848-408.png
 */
define([
  '../modelSystemModule',
  'angular', 
  '../lib/template', 
  '../../cons/aliyunCons', 
  '../../helper/responsePreHandler',
  '../../services/i18nService'
  ],
  function(modelSystemModule, angular, TP, cons, responsePreHandler, i18nService) {


    var i18nInstance = i18nService.getI18n('modelSystem.itemGrid');
    var successText = i18nInstance.i18n('successText');
    var getResponseItems = function(response, config){
      var data = response?response.data:undefined;
      var itemListName = config?(config.response?config.response.itemListName:'items') :'items';
      if(data == undefined ) return [];
      return data[itemListName];
    };
    var getResponseHasMore = function(response, config){
      var data = response?response.data:undefined;
      var hasMoreName = config?(config.response?config.response.hasMoreName:'items') :'items';
      if(data == undefined ) return false;
      return data[hasMoreName];
    };
    var getResponseToken = function(response, config){
      var data = response?response.data:undefined;
      var currentLoadTokenName = config?(config.response?config.response.currentLoadTokenName:'items') :'items';
      if(data == undefined ) return undefined;
      return data[currentLoadTokenName];
    };

    var getCurrentLoadTokenName = function(config){
      var currentLoadTokenName = config?(config.response?config.response.currentLoadTokenName:'items') :'items';
      return currentLoadTokenName;
    };

    modelSystemModule.directive("loadItemGrid", ['$compile', '$injector', 'aliyunDialog',
      function($compile, $injector, aliyunDialog) {
        return {
          restrict: "A",
          scope: {
            bizId: "@",
            bizModel: '=',
            viewModel: "=",
            config: "="
          },
          controller: ['$scope', '$rootScope', '$attrs', '$injector', '$state', '$stateParams',
            function($scope, $rootScope, $attrs, $injector, $state, $stateParams) {
              // 初始化组件使用的参数
              var bizId = $attrs.bizId;
              var modelFactory = $injector.get('modelFactory');
              
              var bizModel = $scope.bizModel || modelFactory.getModel(bizId, 'BizModel');
              $scope.gridModel = $scope.viewModel || modelFactory.getModel(bizId, 'GridModel');
              $scope.itemList = [];

              var currentLoadToken = undefined;
              var hasMore = true;
              var searchParams = {}; //是否有搜索参数
              var getFromRemoteActioning = false;
              $scope.pageInfo = angular.extend({}, $scope.gridModel.config.paginationInfo, {
                total: undefined,
                page: 1,
                pageSize: 20
              });
              $scope.allItemList = [];
              $scope.maxSize=$scope.gridModel.config.paginationInfo.maxSize||5;

              // 定义action 获取数据给组件使用
              var loadItemBizAction = $scope.config? ($scope.config.bizActions? $scope.config.bizActions.loadItem: undefined):undefined;
              var loadItemBizActionModel = bizModel.getActionModel(loadItemBizAction);
              loadItemBizActionModel.injectController($scope.gridModel, $scope);

              var setCurrentPageFromCache = function(){
                $scope.itemList = $scope.allItemList.slice(($scope.pageInfo.page-1)*20, $scope.pageInfo.page*20);
              };
              var setCurrentPageFromRemote = function(){
                $scope.loadingState = true;
                var options = options || {};
                options.successMessage = loadItemBizActionModel.name + ' ' + successText;
                var params = loadItemBizActionModel.getActionParam($scope, $attrs, options);
                options.params = angular.extend({}, options.params, params);
                options.params[getCurrentLoadTokenName($scope.config)] = currentLoadToken;
                angular.extend(options.params, searchParams);

                bizModel.bizService[loadItemBizActionModel.handler](options).then(function(result) {
                  var response = responsePreHandler.responsePreHandler(result, $injector, true);
                  if (response && angular.isFunction(response.then) == false) {
                    if (angular.isFunction(loadItemBizActionModel.afterActionExecuted)) {
                      loadItemBizActionModel.afterActionExecuted(response, $scope);
                    }
                    $scope.allItemList = $scope.allItemList.concat(getResponseItems(response,  $scope.config));
                    $scope.itemList = $scope.allItemList.slice(($scope.pageInfo.page-1)*20, $scope.pageInfo.page*20);
                    hasMore = getResponseHasMore(response,  $scope.config);
                    currentLoadToken = getResponseToken(response,  $scope.config);

                    $scope.loadingState = false;
                    $scope.pageInfo = angular.extend($scope.pageInfo, {
                      total: $scope.allItemList.length
                    });
                  }
                  getFromRemoteActioning = false;
                });
              };
              
              var loadItemFunc = function(options){
                if(!loadItemBizAction) return;
                //如果没翻到最后一页,不需要加载数据,从当前总数据列表中获取
                var currentPage = $scope.pageInfo.page;
                var total = $scope.pageInfo.total;
                var pageSize = $scope.pageInfo.pageSize || 20;
                if(total != undefined && currentPage < Math.floor(total/pageSize)+((total%pageSize==0)?0:1)){
                  setCurrentPageFromCache();
                }else{
                  //如果没有更多数据，停止加载
                  if(!hasMore){
                    setCurrentPageFromCache();
                    return;
                  }else{
                    setCurrentPageFromRemote();
                  }
                }
              };
              
              var refreshCurrentView = function(options){
                if(getFromRemoteActioning == true) return;
                getFromRemoteActioning = true;
                $scope.allItemList = [];
                $scope.pageInfo = angular.extend({}, $scope.pageInfo, {
                  total: undefined,
                  page: 1,
                  pageSize: 20
                });
                currentLoadToken = undefined;
                setCurrentPageFromRemote();
              };
              
              // 定义执行流程
              $scope.updateTableData = function(options) {
                if(options.actionType == 'pageChanged'){
                  loadItemFunc();
                }else if(options.actionType == 'search'){
                  var tempSearchParams = {};
                  searchParams = {};
                  if(options.orginalParams && options.orginalParams.searchParams){
                    tempSearchParams = options.orginalParams.searchParams;
                  }
                  if(tempSearchParams.key && tempSearchParams.value){
                    searchParams[tempSearchParams.key] = tempSearchParams.value;
                  }
                  refreshCurrentView(options)
                }else{
                  searchParams = {};
                  refreshCurrentView(options)
                }
              }

              // 绑定事件
              //绑定刷新事件
              var refreshEventName = $scope.config? ($scope.config.events? $scope.config.events.refreshEventName: undefined):undefined;
              var bindRefreshEvent = function(){
                var token = $rootScope.$on(refreshEventName, function() {
                  $scope.gridModel.config.refreshCurrentView();
                })
                $scope.$on("$destroy", function() {
                  token && token();
                })
              };
              bindRefreshEvent();
              
            }
          ],
          templateUrl: "scripts/template/loadItemGrid.html",
          link: function(scope, elem, attrs) {
          }
        }
      }
    ]);
  });
