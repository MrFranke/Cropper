(function( $ ) {

$.fn.Croper = function( options ) {

    var settings = $.extend({
        CSS_CLASS: 'js-croper',
        zoomStep: {in: 1.1, out: 0.9 },
        animate: true,
        maxWidthSizeMenu: 170,
        ctxmenu: false
    }, options);
    
    var Croper = function ( $crope ) {

        var $img
          , $canvas
          , width
          , height
          , coords
          , scale
          , ctx

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

        function init () {
            updateVars();
            bindEvents();
            $crope.css({overflow: 'visible'}); // Убираем overflow для нормальной работы контекстного меню
            toggleGUI();    // Проверяем нужно ли скрывать интерфейс
            drawImg();
        }

        function bindEvents () {
            $crope.bind('mousedown.cropper', mouseMove);
            $crope.bind('mousewheel.cropper', scroll);

            $zoomerIn.bind('click.cropper', scollIn);
            $zoomerOut.bind('click.cropper', scollOut);

            $sizeItem.bind('click.cropper', changeSize);

            if (settings.ctxmenu) {
                $crope.bind('ctxmenu.cropper', ctxmenu);
            }

            $dropdownBtn.bind('click.cropper', dropdown);
        }

        function unbindEvents () {
            $crope.unbind('mousedown.cropper');
            $crope.unbind('mousewheel.cropper');

            $zoomerIn.unbind('click.cropper');
            $zoomerOut.unbind('click.cropper');

            $sizeItem.unbind('click.cropper');
            
            $crope.unbind('ctxmenu.cropper');
            $dropdownBtn.unbind('click.cropper');
        }

        function updateVars () {
            $img = $crope.find('.'+settings.CSS_CLASS+'-image');
            
            $ctxmenu = $crope.find('.'+settings.CSS_CLASS+'-ctxmenu');

            $zoomer = $crope.find('.'+settings.CSS_CLASS+'-zoomer');
            $zoomerIn = $crope.find('.'+settings.CSS_CLASS+'-zoomer-in');
            $zoomerOut = $crope.find('.'+settings.CSS_CLASS+'-zoomer-out');

            $sizeList = $crope.find('.'+settings.CSS_CLASS+'-sizes');
            $sizeItem = $crope.find('.'+settings.CSS_CLASS+'-size');

            $dropdownBtn = $crope.find('.'+settings.CSS_CLASS+'-dropdown-btn');
            
            width = $img.width();
            height = $img.height();

            wrapWidth = $crope.width();
            wrapHeight = $crope.height();
            
            // Получаем координаты из data-* аттребутов или из позиционирования рисунка
            coords = {
                x: $crope.data('x') || $img.css('left'),
                y: $crope.data('y') || $img.css('top')
            };
            
            scale = $crope.data('zoom') || 1;

            // Заменяем картинки на canvas
            replaceImgOnCanvas();

            // Если координаты не передали, центрируем рисунок
            if ( coords.x === 'auto' && coords.y === 'auto' ) {
                coords.x = 0;
                coords.y = 0;
            }

            // Устанавливаем зум
            zooming(scale);
            move(-coords.x, -coords.y);
        }

        /**
         * Заменяет картинку на canvas
         * @method replaceImgOnCanvas
         */
        function replaceImgOnCanvas () {
            var canvas = document.createElement('canvas');

            $crope.append(canvas);
            $img.hide();
            
            if ( isIE ) {
                canvas = G_vmlCanvasManager.initElement( canvas ); // Fix для IE
            }

            $canvas = $( canvas )
                        .attr({
                            width: wrapWidth,
                            height: wrapHeight
                        })
                        .addClass(settings.CSS_CLASS+'-canvas');

            return ctx = canvas.getContext('2d');
        }

        /**
         * Перерисовывает холст
         * @method drawImg
         */
        function drawImg () {
            ctx.save();
            ctx.setTransform( 1, 0, 0, 1, 0, 0 );
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.restore();
            ctx.drawImage($img.get(0), 0, 0);
        }

        /**
         * Зумит изображение к определенным координатам
         * @param x {Number} координата X
         * @param y {Number} координата Y
         * @param z {Number} то, на сколько увеличивается scale
         */
        function zoomTo (x,y,z) {
            var x = -( x / scale + coords.x - x / ( scale * z ) )
              , y = -( y / scale + coords.y - y / ( scale * z ) );

            move(coords.x,coords.y);
            ctx.scale(z,z);
            move(x,y);
            scale *= z;
        }

        /**
         * Увеличивает или уменьшает зум на переданное число
         * @param z {Number} то, на сколько увеличиваем или уменьшаем зум
         */
        function zoomer (z) {
            scale *= z;
            ctx.scale(scale, scale);
            drawImg();
        }

        /**
         * Устанавливает зум
         * @param z {Number} новое значение зума
         */
        function zooming (z) {
            scale = z;
            ctx.scale(z,z);
            drawImg();
        }

        /**
         * Перемещает картинку на переданное колличество пикселей
         * @param x,y {Number} то, на сколько смещается картинка
         */
        function move (x,y) {
            ctx.translate(x,y);
            coords.x += -x;
            coords.y += -y;
            drawImg();
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
                  , newX = -(oldX - x)
                  , newY = -(oldY - y)
                  ;

                // Перемещаем объект
                move(newX/scale, newY/scale);
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
              , x = e.originalEvent.offsetX
              , y = e.originalEvent.offsetY
            if ( e.shiftKey ) {
                if ( willDir ) {
                    zoomTo(x, y, settings.zoomStep.in)
                }else{
                    zoomTo(x, y, settings.zoomStep.out)
                }
                return false;
            }
            
        }

        function scollIn () {
            zoomTo(wrapWidth/2, wrapHeight/2, settings.zoomStep.in)
            return false;
        }

        function scollOut () {
            zoomTo(wrapWidth/2, wrapHeight/2, settings.zoomStep.out)
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
                coords: {
                    x : -coords.x,
                    y : -coords.y
                },
                originalSize:{
                    w: width,
                    h: height
                },
                size  : {
                    w: wrapWidth,
                    h: wrapHeight
                },
                zoom  : scale
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
            wrapWidth = w;
            wrapHeight = h;
            toggleGUI();

            if ( typeof settings.animate === 'function' ) {
                settings.animate( $crope, $canvas, update );
                return this;
            }

            if ( settings.animate ) {
                $crope.animate({
                    width : w,
                    height: h
                }, function () {
                    var diff = w/ctx.canvas.width
                      , oldWidth = ctx.canvas.width
                      , oldHeight = ctx.canvas.height;

                    ctx.canvas.width = w;
                    ctx.canvas.height = h;

                    zoomer(diff);
                    
                    // Я не знаю как это работает, но если после увелицения сместить координаты на самих себя,
                    // то картинка центрируется 
                    ctx.translate(-coords.x,-coords.y);
                    drawImg();
                });

                return this;
            }

            $crope.css({
                width : w,
                height: h
            });

            
        }

        /**
         * Меняет размеры canvas
         * @method setCoords
         * @returns {Object} jQuery объект canvas
         * @public
         */
        function setCoords (x,y) {
            ctx.setTransform( scale, 0, 0, scale, -x, -y );
            coords.x = -x;
            coords.y = -y;
            drawImg();
            return this;
        }

        function setZoom (z) {
            zooming(z);
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

        // Сбрасывает координаты окна и зум
        function update () {
            coords.x = 0;
            coords.y = 0;
            ctx.setTransform( 1, 0, 0, 1, 0, 0 );
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.drawImage($img.get(0), 0, 0);
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