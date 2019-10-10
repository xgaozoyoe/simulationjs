/*
 * This function initialize the drag and drop directive for angular js
 * Import: utils.js
 */

var initialize_dragdrop_directive = function(app, univ) {
  var universe = univ;

  app.directive('draggable', function() {
    return function(scope, element, attrs) {
      // Get the native element
      var el = element[0];
      el.draggable = true; // Make dragable
      var sender = get_attr(scope,attrs['draggable']);

      // Add event listeners
      el.addEventListener(
        'dragstart',
        function(e) {
          e.dataTransfer.effectAllowed = 'move';
          var uid = sender.getUID();
          e.dataTransfer.setData('text', uid); 
          return false;
        }, false
      );

      el.addEventListener(
        'dragend',
        function(e) {
          return false;
        },
        false
      );
    }
  });

  app.directive('droppable',function(){
    return function(scope, element, attrs) {
      var el = element[0];
      var receiver = get_attr(scope,attrs['droppable']);
      el.addEventListener('dragover', function(e){
          e.preventDefault(); // Allow the drop
          return false;
      }, false);

      el.addEventListener('dragenter', function(e){
          return false;
      }, false);

      el.addEventListener('dragleave', function(e){
          return false;
      }, false);

      el.addEventListener('drop', function(e,src){
          var obj_id = e.dataTransfer.getData('text');
          var object = universe.getAgent(obj_id);
          object.deliverEvent(receiver, "UI_DROP")
          return false;
      }, false);
    }
  });
};
