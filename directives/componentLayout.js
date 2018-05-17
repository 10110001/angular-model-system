define(['../modelSystemModule', 'angular'],
  function(modelSystemModule, angular) {

    modelSystemModule.directive('componentLayout', ['$compile', '$injector', '$state', '$rootScope',
      function($compile, $injector, $state, $rootScope) {
        return {
          restrict: 'A',
          scope: {
            layoutConfig : "="
          },
          link: function(scope, element, attrs) {
            var tpl = '';

            var makeColHtml = function(col, span){
              return '<div class="col-sm-'+(12/span)+'"><div biz-component biz-component-model="components[\''+col+'\']" ></div></div>';
            }
            var makeLayoutHtml = function(){
              var components = [];
              angular.forEach(scope.components, function(d, i){
                components[d.id || i] = d;
              });
              scope.components = components;
              var html = '';
              angular.forEach(scope.layout, function(row){
                html += '<div class="row">';
                if(angular.isArray(row)){
                  angular.forEach(row, function(col){
                    html += makeColHtml(col, (row.length > 2 ? 3 : row.length || 1));
                  });
                }else{
                  html += makeColHtml(row, 1);
                }
                html += '</div>';
              });
              return html;
            }
            var makeComponentsHtml = function(){
              var html = '';
              angular.forEach(scope.components, function(row,i){
                html += '<div class="row">';
                if(angular.isArray(row)){
                  angular.forEach(row, function(col,n){
                    html += '<div class="col-sm-'+(12/(row.length > 2 ? 3 : row.length || 1))+'"><div biz-component biz-component-model="components[\''+i+'\'][\''+n+'\']" ></div></div>';
                  });
                }else{
                  html += makeColHtml(i, 1);
                }
                html += '</div>';
              });
              return html;
            }

            var compileElement = function(){
              scope.layout = scope.layoutConfig.layout;
              scope.components = scope.layoutConfig.components;
              tpl = scope.layout ? makeLayoutHtml() : makeComponentsHtml();
              element.html('');
              element.append(tpl);
              $compile(element.contents())(scope);
            }

            // console.log(tpl);
            // var tpl = '<div ng-repeat="component in components"><div biz-component biz-component-model="component" ></div></div>';
            scope.$watch('layoutConfig',function(val){
              if(val && val.components && val.components.length>0) compileElement();
            });

          }
        }
      }
    ])
  })
