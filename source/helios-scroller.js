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

                    // The elements
                    var el = $elem;
                    var $el = angular.element($elem);

                    // The heights
                    var windowHeight = window.innerHeight || document.documentElement.clientHeight|| document.getElementsByTagName('body')[0].clientHeight;
                    var elemHeight = el[0].offsetHeight;
                    var scrollableHeight = elemHeight - windowHeight;

                    // The prefixes
                    var transformPrefix;

                    // The current info
                    var data = {
                        tween: null,
                        direction: {
                            last: 0,
                            current: 0
                        },
                        progress: {
                            last: {y:0},
                            current: {y:0},
                            rendered: 0
                        }
                    }

                    // The outputs
                    // $scope.tween = null;
                    $scope.scrollTotal = 0;
                    $scope.percentComplete = 0;
                    // $scope.direction = {
                    //     last: 0,
                    //     current: 0
                    // };
                    // $scope.progress = {
                    //     last: {y: 0},
                    //     current: {y: 0},
                    //     rendered: 0
                    // };

                    /**
                     * All the Utility functions that can be called within
                     * the directive at any time.
                     */
                    var Utils = {
                        getPrefix: function(prefixes) {
                            var tmp = document.createElement('div');
                            var result = '';

                            for (var i = 0; i < prefixes.length; ++i) {
                                if (typeof tmp.style[prefixes[i]] != 'undefined') {
                                    result = prefixes[i];
                                    break;
                                } else {
                                    result = null;
                                }
                            }

                            return result;
                        },
                        render: function(value) {
                            //console.log(value - $scope.progress.rendered);
                            if (transformPrefix) {
                                // Browser supports transform.
                                el[0].style[transformPrefix] = 'translateY(' + value + 'px)';
                            } else {
                                $el.css('top', value + 'px');
                            }
                            
                            data.direction.last = data.direction.current;
                            data.progress.rendered = value;
                            Utils.calculatePercent(value);
                        },
                        tween: {
                            set: function(to, from, time) {
                                if (data.direction.last !== 0 && data.direction.last !== data.direction.current) {
                                    // Terminating the current tween due to change in direction;
                                    Utils.tween.terminate();
                                }
                                if (!data.tween) {
                                    var tm = time || 1500;
                                    var t = to || data.progress.current;
                                    var f = from || data.progress.last;

                                    data.tween = new TWEEN.Tween(f).to(t, tm)
                                        .easing(TWEEN.Easing.Cubic.Out)
                                        .onUpdate( function() {
                                            Utils.render(this.y);
                                        })
                                        .onComplete(function(){
                                            data.tween = null;
                                            data.direction.current = 0;
                                            data.direction.last = 0;
                                        })
                                        .start();
                                }
                            },
                            terminate: function() {
                                if (data.tween) { 
                                    data.tween.stop();
                                    data.tween = null;
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
                        },
                        checkLimit: function(delta) {
                            var dif = $scope.scrollTotal - data.progress.last.y;
                            //console.log(dif);
                            var limit = 300;
                            if (dif > limit || dif < -limit) {
                                console.log('limiting');
                                var limiter = dif - (limit*data.direction.current);
                                $scope.scrollTotal -= (limiter/2);
                            }
                        }
                    }

                    /**
                     * Event handler functions.
                     * These get fired when a scroll or touch event happens.
                     * This is also where the delta normalization happens.
                     */
                    var Handle = {
                        /**
                         * A mousewhel scroll.
                         */
                        wheel: function(event) {
                            var e = event || window.event;

                            var o = e,
                                d = o.detail, 
                                w = o.wheelDeltaY || o.deltaY*-10 || (e.wheelDeltaY===undefined && e.wheelDelta) || e.detail || 0,
                                n = 225, 
                                n1 = n-1;
                        
                            // Normalize delta
                            // d = d ? w && (f = w/d) ? d/f : -d/1.35 : w/120;
                            // Quadratic scale if |d| > 1
                            // d = d < 1 ? d < -1 ? (-Math.pow(d, 2) - n1) / n : d : (Math.pow(d, 2) + n1) / n;
                            // Delta *should* not be greater than 2 (before being multiplied)...
                            //var delta = (Math.min(Math.max(d / 2, -1), 1));

                            var delta = w;

                            data.direction.current = (delta > 0) ? 1 : -1;

                            $scope.scrollTotal += delta;

                            //Utils.checkLimit(delta);
                            Utils.checkRange();
                            Utils.tween.set();                        

                            if (e.preventDefault) e.preventDefault();
                            if (e.stopPropagation) e.stopPropagation();
                            e.cancelBubble = true;  // IE events
                            e.returnValue = false;  // IE events
                            return false;
                        },
                        /**
                         * Touchscreen events.
                         */
                        touch: {
                            startY: 0,
                            cur: 0,
                            lastDelta: 0,
                            start: function(e) {
                                Handle.touch.startY = Handle.touch.cur = e.pageY;
                                Utils.tween.terminate();
                            },
                            move: function(e) {
                                var delta = (e.pageY - Handle.touch.cur) * 1.75;

                                if (e.pageY !== 0) { Handle.touch.lastDelta = delta; }

                                Handle.touch.cur = e.pageY;

                                data.direction.current = (delta > 0) ? 1 : -1;
                                $scope.scrollTotal += delta;
                                data.progress.current.y = data.progress.last.y = $scope.scrollTotal;

                                Utils.checkRange();
                                Utils.render($scope.scrollTotal);

                                if (e.preventDefault) e.preventDefault();
                                if (e.stopPropagation) e.stopPropagation();
                            },
                            end: function(e) {
                                $scope.scrollTotal = data.progress.rendered + (Handle.touch.lastDelta * 3);
                                Utils.checkRange();
                                Utils.tween.set({y:$scope.scrollTotal}, {y:data.progress.rendered});
                            }
                        },
                        /**
                         * Keyboard events.
                         */
                        key: function(e) {
                            var down = 40;
                            var up = 38
                            var space = 32;

                            if (e.keyCode === 40 || e.keyCode === 32) {
                                data.direction.current = -1;
                                var delta = e.keyCode === 32 ? -100 : -20;
                            } else if (e.keyCode === 38 ) {
                                data.direction.current = 1;
                                var delta = 20;
                            } else {    
                                return;
                            }

                            $scope.scrollTotal += delta;
                            data.progress.current.y = data.progress.last.y = $scope.scrollTotal;

                            Utils.checkRange();

                            if (e.keyCode === 32) {
                                Utils.tween.set({y:$scope.scrollTotal}, {y:data.progress.rendered}, 500);
                            } else {
                                Utils.render($scope.scrollTotal);
                            }
                        }
                    }

                    transformPrefix = Utils.getPrefix(['transform', 'msTransform', 'MozTransform', 'WebkitTransform', 'OTransform']);

                    el[0].onwheel = Handle.wheel;
                    el[0].onmousewheel = Handle.wheel;

                    el[0].addEventListener('touchstart', Handle.touch.start, false);
                    el[0].addEventListener('touchmove', Handle.touch.move, false);
                    el[0].addEventListener('touchend', Handle.touch.end, false);

                    window.onkeydown = Handle.key;

                    raf.add('tween', 'everyFrame', function() {
                        TWEEN.update();
                    });

                    raf.add('masterScrollTween', 'everyFrame', function(){
                        if ($scope.paused) return;
                        if (!data.tween) return;

                        if (Math.ceil(data.progress.current.y) !== Math.floor($scope.scrollTotal)) {

                            data.progress.current.y += ($scope.scrollTotal - data.progress.current.y)/2;                            
                        }
                    });
                    raf.start();
                }
            }
        }]);
})(window, window.angular, TWEEN);