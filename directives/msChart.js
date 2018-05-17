/*
                   chart model

                  {
                    seriesConfig:[
                      {label: 'pv曲线', value: 'pv'}
                    ],
                    chartConfig:
                    {
                      //normal chart config,such as line type...
                    },
                    isDynamic:false, //default false.
                    dynamicConfig:
                    {
                      period: 60 * 20,
                      interval: 60   //second
                    },
                    formatter:function  () {

                    }
                  }
                  */
//TODO:后期需要重构
define(['../modelSystemModule', 'angular', '../../helper/responsePreHandler', '../../services/i18nService'],
  function(modelSystemModule, angular, responsePreHandler, i18nService) {

    modelSystemModule.directive("msChart", ['$compile', '$injector',
      function($compile, $injector) {
        var i18nDateFormat = i18nService.getI18n('modelSystem.msChart').i18n('dateFormat');
        return {
          restrict: "A",
          scope: {
            bizType: "@",
            bizModel: "=",
            chartData: "=",
            chartModel: "=",
            appendWatch: "=",
            reloadWatch: "="
          },
          controller: ['$scope', '$rootScope', '$attrs', '$injector',
            function($scope, $rootScope, $attrs, $injector) {
              $scope.responseDataHandler = function(response) {
                if (angular.isFunction(chartModel.getXAxis)) {
                  $scope.chart.xAxis[0].setCategories(chartModel.getXAxis(response));
                }
                return angular.isFunction(chartModel.dataFormatter) && chartModel.dataFormatter(response, bizType, bizAction) || response;
              }

              function makeRequest(resFn, options) {
                var options = options || {
                  params: {}
                };

                var params = actionModel.getActionParam($scope);
                options.params = angular.extend(options.params, params);

                //如果显示定义了隐藏默认错误弹框信息，则使用actionModel中的配置；如果没有显示定义，则判断是否定义了responseHandler,如果定义了，则隐藏，如果没有定义，则显示
                var hideDefaultErroDialog = actionModel.hideDefaultErroDialog !== undefined ? actionModel.hideDefaultErroDialog : (actionModel.responseHandler ? true : false);
                var responseHandler = actionModel.responseHandler != angular.emptyFunction ? actionModel.responseHandler : responsePreHandler.responsePreHandler;

                bizModel.bizService[actionModel.handler](options).then(function(result) {
                  var response = responsePreHandler.responsePreHandler(result, $injector, true);
                  if (response && angular.isFunction(response.then) == false) {

                    response = $scope.responseDataHandler(response);
                    resFn(response);
                  }
                });

              }

              $scope.showData = function(data) {
                var type = data.type || "all";
                var callBack = function() {}
                switch (type) {
                  case "all":
                    callBack = updateChartCallback;
                    break;
                  case "append":
                    callBack = appendChartDataCallback;
                    break;
                  default:
                    callBack = updateChartCallback;
                }
                var response = $scope.responseDataHandler(data);
                callBack(response);
              }

              function updateChart(options) {
                if (bizModel) {
                  makeRequest(updateChartCallback, options);
                }
              }

              function updateChartCallback(result) {
                var series = $scope.chart.series;
                for (var i = 0; i < series.length; i++) {
                  var key = series[i].options.id;
                  var value = result.data[key];
                  var data = angular.isFunction(chartModel.seriesFormatter) && chartModel.seriesFormatter(key, value, bizType, bizAction) || value;
                  series[i].setData(data);
                }
              }

              function appendChartData(options) {
                makeRequest(appendChartDataCallback, options);
              }

              function appendChartDataCallback(result) {
                var series = $scope.chart.series;
                var removePrevisPoint = chartModel.dynamicConfig.removePrevisPoint;
                var point = [];
                for (var i = 0; i < series.length; i++) {
                  var key = series[i].options.id;
                  var value = result.data[key];
                  var tmpPoint = value[0];
                  point = (angular.isFunction(chartModel.seriesFormatter) && chartModel.seriesFormatter(key, result, bizType, bizAction)) || tmpPoint
                  if (angular.isFunction(chartModel.beforeAppendData) && chartModel.beforeAppendData(key, result, bizType, bizAction) === false) {
                    return;
                  }
                  point && series[i].addPoint(point, true, (removePrevisPoint === false ? false : true));
                }
              }


              var modelService = $injector.get('modelFactory'),
                bizType = $attrs.bizType,
                modelType = $attrs.modelType || bizType,
                bizAction = $attrs.bizAction;
              var bizModel = $scope.bizModel || modelService.getModel(bizType, "BizModel"),
                actionModel = "",
                chartModel = $scope.chartModel || modelService.getModel(modelType, "ChartModel");
              if (bizModel && chartModel) {
                actionModel = bizModel.getActionModel(bizAction);
                if (actionModel) {
                  actionModel.injectController(chartModel, $scope);
                }
              }
              // $scope.chartModel = chartModel;

              if (chartModel) {
                var chartConfig = chartModel.chartConfig || {};

                chartConfig.tooltip = angular.extend({
                  // xDateFormat: '%Y-%m-%d',
                  formatter: function(option) {

                    var tip = Highcharts.dateFormat(i18nDateFormat /*'%Y年%m月%d日 %H:%M:%S'*/ , this.x);
                    //return '<strong>'+ this.series.name +'</strong><br />'+ this.x + ': ' + this.y;
                    return '<strong>' +
                      (tip === "Invalid date" ? this.x : tip) +
                      '</strong><br />' +
                      this.series.name +
                      ': ' + this.y + (option.options && option.options.valueSuffix || "");
                  }
                }, (chartConfig.tooltip || {}));
                var series = [];
                chartModel.seriesConfig = angular.isFunction(chartModel.setSeriesConfig) && chartModel.setSeriesConfig(bizType, bizAction) || chartModel.seriesConfig;
                if (!chartModel.seriesConfig) {
                  throw 'chart series is undefined';
                } else {
                  if (chartModel.seriesConfig.length == 0) {
                    throw 'chart series is empty';
                  } else {
                    var sc = chartModel.seriesConfig;
                    var data = [];
                    if (chartModel.isDynamic) {
                      var dc = chartModel.dynamicConfig;
                      var dataInterval = dc.interval || 60;
                      var dataNum = dc.perild / dc.interval || 20;
                      var time = (new Date()).getTime();

                      for (var j = 0 - dataNum; j < 0; j++) {
                        data.push({
                          x: time + j * dataInterval * 1000,
                          y: null
                        });
                      }

                    }
                    for (var i = 0; i < sc.length; i++) {
                      series.push({
                        name: sc[i].label,
                        id: sc[i].value,
                        data: data
                      })
                    }
                  }
                  chartConfig.series = series;
                }
                $scope.chartConfig = chartConfig;
              }

              $scope.chartCreated = function(chart) {
                $scope.chart = chart;
              }
              $scope.$on(bizType + "Chart:update", function(e, data) {
                updateChart(data);
              })

              $scope.$on(bizType + "Chart:appendData", function(e, data) {
                appendChartData(data);
              })
              updateChart();
            }
          ],
          template: '<div aliyun-console-chart chart-created="chartCreated(chart)" config="chartConfig"></div>',
          link: function(scope, elem, attrs) {
            scope.$watchCollection("[chartData,chart]", function(data) {
              var chartData = data[0];
              var chart = data[1];
              if (chartData && chart) {
                scope.showData(chartData)
              }
            })
          }
        }
      }
    ]);
  });
