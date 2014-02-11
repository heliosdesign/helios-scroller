(function(window, angular, TWEEN, undefined) {'use strict';
    angular.module('heliosScroller', ['ng', 'heliosFrameRunner'])
        .directive('scrollerMaster', ['frameRunner', function(raf){
            return {
                restrict: 'A',
                link: function($scope, $elem, attr) {

                    /**
                     * Set all the initial scroll variables within
                     * the $scope of the scroller-master element.
                     */
                    var windowHeight = window.innerHeight || document.documentElement.clientHeight|| document.getElementsByTagName('body')[0].clientHeight;
                    var elemHeight = $elem[0].offsetHeight;
                    var scrollableHeight = elemHeight - windowHeight;

                    $scope.tween = null;
                    $scope.scrollTotal = 0;
                    $scope.percentComplete = 0;
                    $scope.direction = {
                        last: 0,
                        current: 0
                    };
                    $scope.progress = {
                        last: {y: 0},
                        current: {y: 0}
                    };

                    /**
                     * All the Utility functions that can be called within
                     * the directive at any time.
                     */
                    var Utils = {
                        tween: {
                            set: function(delta) {
                                if ($scope.direction.last !== 0 && $scope.direction.last !== $scope.direction.current) {
                                    // Terminating the current tween due to change in direction;
                                    Utils.tween.terminate();
                                }
                                if (!$scope.tween) {
                                    $scope.tween = new TWEEN.Tween( $scope.progress.last ).to( $scope.progress.current, 1500 )
                                        .easing(TWEEN.Easing.Cubic.Out)
                                        .onUpdate( function() {
                                            angular.element($elem).css('top', this.y + 'px');
                                            $scope.direction.last = $scope.direction.current;
                                            $scope.progress.rendered = this.y;
                                            Utils.calculatePercent(this.y);
                                        })
                                        .onComplete(function(){
                                            $scope.tween = null;
                                            $scope.direction.current = 0;
                                            $scope.direction.last = 0;
                                        })
                                        .start();
                                }
                            },
                            terminate: function() {
                                if ($scope.tween) { 
                                    $scope.tween.stop();
                                    $scope.tween = null;
                                }
                            }
                        },
                        calculatePercent: function(cur) {
                            $scope.percentComplete = (Math.abs(cur)/scrollableHeight)*100;
                        },
                        checkRange: function() {
                            if ($scope.scrollTotal > 0) {
                                $scope.scrollTotal = 0;
                            } else if ($scope.scrollTotal < -(scrollableHeight)) {
                                $scope.scrollTotal = -scrollableHeight;
                            }
                        }
                    }

                    /**
                     * Event handler functions.
                     * These get fired when a scroll or touch event happens.
                     * This is also where the delta normalization happens.
                     */
                    var Handle = {
                        wheel: function(event) {
                            var e = event || window.event;

                            var o = e,
                                d = o.detail, 
                                w = o.wheelDeltaY || o.deltaY*-40 || (e.wheelDeltaY===undefined && e.wheelDelta) || e.detail || 0,
                                n = 225, 
                                n1 = n-1;
                        
                            // Normalize delta
                            d = d ? w && (f = w/d) ? d/f : -d/1.35 : w/120;
                            // Quadratic scale if |d| > 1
                            d = d < 1 ? d < -1 ? (-Math.pow(d, 2) - n1) / n : d : (Math.pow(d, 2) + n1) / n;
                            // Delta *should* not be greater than 2 (before being multiplied)...
                            var delta = (Math.min(Math.max(d / 2, -1), 1))*100;

                            $scope.direction.current = (delta > 0) ? 1 : -1;
                            $scope.scrollTotal += delta;

                            Utils.checkRange();
                            Utils.tween.set(delta);                        

                            if (e.preventDefault) e.preventDefault();
                            if (e.stopPropagation) e.stopPropagation();
                            e.cancelBubble = true;  // IE events
                            e.returnValue = false;  // IE events
                            return false;
                        }
                    }

                    $elem[0].onwheel = Handle.wheel;
                    $elem[0].onmousewheel = Handle.wheel;

                    raf.add('tween', 'everyFrame', function() {
                        TWEEN.update();
                    });

                    raf.add('masterScrollTween', 'everyFrame', function(){
                        if ($scope.paused) return;
                        if (!$scope.tween) return;

                        if (Math.ceil($scope.progress.current.y) !== Math.floor($scope.scrollTotal)) {                            
                            $scope.progress.current.y += ($scope.scrollTotal - $scope.progress.current.y)/2;                            
                        }
                    });
                    raf.start();
                }
            }
        }]);
})(window, window.angular, TWEEN);