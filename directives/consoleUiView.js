define(['../modelSystemModule', 'angular'],
  function(modelSystemModule, angular) {

    modelSystemModule.directive('consoleUiView', ['$compile', '$injector',
      function($compile, $injector) {
        return {
          restrict: 'A',
          replace:true,
          link: function(scope, element, attrs) {
            element.html("<div ui-view='"+attrs.consoleUiView+"'><div>")
             $compile(element.contents())(scope);
          }
        }
      }
    ])
  })
