(function( $ ) {

$.fn.Croper = function( options ) {

    var settings = $.extend({
        CSS_CLASS: 'js-croper',
        zoomStep: 0.05,
        animate: false,
        maxWidthSizeMenu: 170,
        ctxmenu: false
    }, options);
    
    var Croper = function ( $crope ) {

        var $img
          , $canvas
          , width
          , height
          , coords
          , zoom
          , ctx

          // Размеры картинки с учетом зума
          , zoomWidth
          , zoomHeight

          // Размеры враппера
          , wrapWidth
          , wrapHeight

          // Элементы управления
          , $zoomer
          , $zoomerIn
          , $zoomerOut

          , $sizeList
          , $sizeItem

          , $ctxmenu
          , $dropdownBtn

          , isIE = '\v'=='v'
          , visibleGUI = true
          ;

        function init ( update ) {
            updateVars();
            drawImg();

            if ( !update ) {
                bindEvents();
                $crope.css({overflow: 'visible'}); // Убираем overflow для нормальной работы контекстного меню
                toggleGUI();
            }
        }

        function bindEvents () {
            $crope.bind('mousedown.cropper', mouseMove);
            $crope.bind('mousewheel.cropper', scroll);

            $zoomerIn.bind('click.cropper', scollIn);
            $zoomerOut.bind('click.cropper', scollOut);

            $sizeItem.bind('click.cropper', changeSize);

            if (settings.ctxmenu) {
                $crope.bind('contextmenu.cropper', ctxmenu);
            }

            $dropdownBtn.bind('click.cropper', dropdown);
        }

        function unbindEvents () {
            $crope.unbind('mousedown.cropper');
            $crope.unbind('mousewheel.cropper');

            $zoomerIn.unbind('click.cropper');
            $zoomerOut.unbind('click.cropper');

            $sizeItem.unbind('click.cropper');
            
            $crope.unbind('contextmenu.cropper');
            $dropdownBtn.unbind('click.cropper');
        }

        function updateVars () {
            $img = $crope.find('.'+settings.CSS_CLASS+'-image');

            $ctxmenu = $crope.find('.'+settings.CSS_CLASS+'-ctxmenu');
            
            width = $img.width();
            height = $img.height();

            wrapWidth = $crope.width();
            wrapHeight = $crope.height();

            $dropdownBtn = $crope.find('.'+settings.CSS_CLASS+'-dropdown-btn');

            
            /**
             * Если координаты и зум уже были установленны, то не перезаписываем их
             * Это нужно для повторной инициализации канваса при изменении размеров.
             */
            if ( !coords && !zoom ) {
                // Получаем координаты рисунка (если нет data-атребутов и нет значений left и top, то x = y = 0)
                coords = {
                    x: $crope.data('x') || $img.css('left'),
                    y: $crope.data('y') || $img.css('top')
                };

                // Если координаты не передали, центрируем рисунок
                if ( coords.x === 'auto' && coords.y === 'auto' ) {
                    coords.x = -(width/2-wrapWidth/2);
                    coords.y = -(height/2-wrapHeight/2);
                    console.log(coords);
                }

                zoom = $crope.data('zoom') || 1;

            }

            zoomWidth = width*zoom;
            zoomHeight = height*zoom;

            // Заменяем картинки на canvas
            replaceImgOnCanvas();

            $zoomer = $crope.find('.'+settings.CSS_CLASS+'-zoomer');
            $zoomerIn = $crope.find('.'+settings.CSS_CLASS+'-zoomer-in');
            $zoomerOut = $crope.find('.'+settings.CSS_CLASS+'-zoomer-out');

            $sizeList = $crope.find('.'+settings.CSS_CLASS+'-sizes');
            $sizeItem = $crope.find('.'+settings.CSS_CLASS+'-size');
        }

        /**
         * Заменяет картинку на canvas
         * @method replaceImgOnCanvas
         */
        function replaceImgOnCanvas () {
            var canvas = document.createElement('canvas');

            $canvas = $( canvas );
            $canvas
                .attr({
                    width: wrapWidth,
                    height: wrapHeight
                })
                .addClass(settings.CSS_CLASS+'-canvas');

            $crope.append($canvas);
            $img.hide();
            
            if ( isIE ) {
                canvas = G_vmlCanvasManager.initElement( $canvas.get(0) ); // Fix для IE
            }

            return ctx = canvas.getContext('2d');
        }

        /**
         * Перерисовывает холст
         * @method drawImg
         */
        function drawImg () {
            var z = Math.abs(zoom);
            ctx.clearRect( 0, 0, ctx.canvas.width, ctx.canvas.height ); // Отчищаем канвас с учетом смещения осей
            ctx.drawImage($img.get(0), coords.x, coords.y, zoomWidth, zoomHeight);
        }

        /**
         * Зумит изображение
         * @param z {Number} то, на сколько увеличивается zoom
         * @param e {Object} координаты мыши {x,y}
         */
        function zoomer (z, c) {
            // Зум не может быть отрицательным
            if ( zoom > 0 ) {
                // Кешируем размеры с учетом зума
                var w = zoomWidth
                  , h = zoomHeight;

                zoomWidth = width * Math.abs(zoom);
                zoomHeight = height * Math.abs(zoom);

                
                // Смещаем картинку для цетрирования при зуме
                if (!c) {
                    move(  -((zoomWidth-w)/2), -((zoomHeight-h)/2)  );
                }else{
                    move(  -((zoomWidth-w)/2), -((zoomHeight-h)/2)  );
                    //move(  -((zoomWidth-w)/2)+(c.x-(zoomWidth-w)/2), -((zoomHeight-h)/2)+(c.y-(zoomHeight-h)/2)  );
                }
            }
            drawImg();
        }

        /**
         * Перемещает картинку на переданное колличество пикселей
         * @param x,y {Number} то, на сколько смещается картинка
         */
        function move (x,y) {
            coords.x += x;
            coords.y += y;
        }

        /*============================ Обработка событий =============================*/

        function ctxmenu (e) {
            var $target = $(e.target);
            $ctxmenu.css({
                top : e.offsetY,
                left: e.offsetX
            }).show();

            // Закрываем меню
            $(document).bind('click.cropper', function (e) {
                var $target = $(e.target);
                if ( !$target.closest('.'+settings.CSS_CLASS+'-ctxmenu').length ) {
                    $ctxmenu.hide();
                }
            });

            return false;
        }

        function mouseMove (e) {
            // Когда отпускаем мышку - перестаем 
            $(document).bind('mouseup.cropper', function () {
                $(document).unbind('mousemove.cropper');
                $(document).unbind('mouseup.cropper');
            });

            //Сохроняем координаты нажатия
            var oldX = e.clientX
              , oldY = e.clientY;

            // Перемещаем все объекты по карте вместе с мышью
            $(document).bind('mousemove.cropper', function (e) {
                var x = e.clientX
                  , y = e.clientY
                  , newX = (oldX - x)*-1
                  , newY = (oldY - y)*-1
                  ;

                // Перемещаем объект
                move(newX, newY);

                // Перерисовываем картинку
                drawImg();

                // Обновляем координаты
                oldX = x;
                oldY = y;
                return false;
            });
            return false;
        }

        function scroll (e) {
            var willDir = e.originalEvent.wheelDelta > 0
              , c = {
                    x: -e.originalEvent.offsetX,
                    y: -e.originalEvent.offsetY
                };

            if ( e.shiftKey ) {
                if ( willDir ) {
                    zoom += settings.zoomStep;
                    zoomer(zoom,c);
                }else{
                    zoom -= settings.zoomStep;
                    zoomer(zoom,c);
                }
                return false;
            }
            
        }

        function scollIn () {
            zoomer(zoom += settings.zoomStep);
            return false;
        }

        function scollOut () {
            zoomer(zoom -= settings.zoomStep);
            return false;
        }

        function changeSize () {
            var newSize = $(this).data('size').split('x')
              , menuWidth = 0;

            setSize(newSize[0], newSize[1]);
            
            $sizeItem.removeClass('active');
            $sizeItem.eq( $(this).index() ).addClass( 'active' );
            $ctxmenu.find('li').eq( $(this).index() ).addClass( 'active' );

            $ctxmenu.hide();

            return false;
        }

        function dropdown () {
            $ctxmenu.toggle();
        }

        /*================ API ==================*/

        /**
         * Возвращает параметры картинки
         * @method getParams
         * @returns {Object} параметры картинки 
         * @public
         */
        function getParams () {
            return {
                coords: coords,
                size  : {
                    w: zoomWidth,
                    h: zoomHeight
                },
                zoom  : zoom
            }
        }

        /**
         * Возвращает ссылку на jQuery объект картинки
         * @method getImage
         * @returns {Object} jQuery объект картинки
         * @public
         */
        function getImage () {
            return $img;
        }

        /**
         * Меняет размеры canvas
         * @method setSize
         * @returns {Object} jQuery объект canvas
         * @public
         */
        function setSize (w,h) {
            var diff = {
                w: (wrapWidth-w)/2,
                h: (wrapHeight-h)/2,
            };
            
            coords.x += -diff.w;
            coords.y += -diff.h;

            zoom = wrapWidth/w

            wrapWidth = w;
            wrapHeight = h;
            ctx.canvas.width = w;
            ctx.canvas.height = w;

            toggleGUI();

            if ( typeof settings.animate === 'function' ) {
                settings.animate( $crope, $canvas );
                update();
                return this;
            }

            if ( settings.animate ) {
                $crope.animate({
                    width : w,
                    height: h
                }, function () {
                    update();
                });

                return this;
            }

            $crope.css({
                width : w,
                height: h
            });
            
            update();
        }

        /**
         * Меняет размеры canvas
         * @method setCoords
         * @returns {Object} jQuery объект canvas
         * @public
         */
        function setCoords (x,y) {
            coords.x = -x;
            coords.y = -y;
            drawImg();
            return this;
        }

        function setZoom (z) {
            zoom = z;
            zoomer(zoom);
            return this;
        }

        function toggleGUI () {
            if ( settings.maxWidthSizeMenu > wrapWidth ) {
                hideGUI();
            }else{
                showGUI();
            }

            return this;
        }

        function hideGUI () {
            $sizeList.fadeOut();
            $zoomer.fadeOut();
            $dropdownBtn.fadeIn();
            visibleGUI = false;

            return this;
        }

        function showGUI () {
            $sizeList.fadeIn();
            $zoomer.fadeIn();
            $dropdownBtn.fadeOut();
            visibleGUI = true;

            return this;
        }

        function destroy () {
            unbindEvents();
            $canvas.remove();

            return this;
        }

        function update () {
            $canvas.remove();
            init('update');

            return this;
        }


        init();

        return{
            getParams: getParams,
            getImage : getImage,

            setSize  : setSize,
            setCoords: setCoords,
            setZoom  : setZoom,

            toggleGUI: toggleGUI,
            hideGUI  : hideGUI,
            showGUI  : showGUI,

            destroy  : destroy,
            update   : update
        }
    }

    var setOfCroper = []; // Массив из возвращаемых 

    // Проходимся по всем элементам
    this.each(function () {
        var croper = new Croper( $(this) );
        
        setOfCroper.push( croper );
    });

    // Возвращаем объекты слайдера для использония их API ( Пример: $('#slider').jSlider().stopAutoRatating() )
    return setOfCroper.length === 1? setOfCroper[0] : setOfCroper;
}

})(jQuery);