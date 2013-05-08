(function( $ ) {

$.fn.Croper = function( options ) {

    var settings = $.extend({
        CSS_CLASS: 'js-croper',
        zoomStep: {zoomIn: 1.1, zoomOut: 0.9 },
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

          // Проверки 
          , isIE = '\v'=='v'
          , visibleGUI = true
          , startCoords
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

            // после загрузки отрисовываем картинку            
            $img.load(function(){
                drawImg();
            });
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
                x: $crope.data('x')*1 || $img.css('left'),
                y: $crope.data('y')*1 || $img.css('top')
            };
            
            scale = $crope.data('zoom') || 1;

            // Если координаты не передали, центрируем рисунок
            if ( coords.x === 'auto' && coords.y === 'auto' ) {
                coords.x = 0;
                coords.y = 0;
            }


            // Заменяем картинки на canvas
            replaceImgOnCanvas();

            
            // Устанавливаем зум и координаты
            zooming(scale);
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

            
            ctx = canvas.getContext('2d');
            IEfixed();
            drawImg();
            return ctx;
        }

        function IEfixed () {
            if (!isIE) {return false}

            // Эти координаты нужны для эмулирования координатной сетки.
            startCoords = {
                x : 0,
                y : 0
            }

            // Заменяем нерабочие функции excanvas в IE
            ctx.setTransform = function (scaleX, offsetX, offsetY, scaleY, x, y) {
                startCoords = {x: x,y: y};
                
                zoomWidth = $img.width()*scaleX;
                zoomHeight = $img.height()*scaleY;

                return false;
            }
            
            /**
             * Этот метод немного отличаетсмя от стандартного scale.
             */
            ctx.scale = function (x,y,increase) {
                
            // Этот очень грязный хак для IE.
            // При setSize() метод scale увеличивает картинку относительно ее начальных размеров
            // , а не относительно уже измененных.
            // Я не смог понять причину такого странного поведения =С
                if ( increase ) {
                    zoomWidth = width*x;
                    zoomHeight = height*y;
                    return false;
                }

                zoomWidth *= x;
                zoomHeight *= y;

                return false;
            }
            ctx.translate = function ( x,y ) {
                console.log('startCoords.x: ', startCoords.x);
                startCoords.x += x;
                startCoords.y += y;
                return false;
            }


            zoomWidth = $img.width()*scale;
            zoomHeight = $img.height()*scale;
        }

        /**
         * Перерисовывает холст
         * @method drawImg
         */
        function drawImg () {            
            if ( isIE ) {
                // Координаты с учетом зума для эмулиции scale
                console.log(startCoords.x);
                var x = (startCoords.x*scale)
                  , y = (startCoords.y*scale);

                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.drawImage($img.get(0), x, y, zoomWidth, zoomHeight);
            }else{
                ctx.save();
                ctx.setTransform( 1, 0, 0, 1, 0, 0 );
                ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
                ctx.restore();
                ctx.drawImage($img.get(0), 0, 0);
            }
        }

        /**
         * Постепенно зумит изображение к определенным координатам.
         * Метод нужен для скролла мышкой
         * @param x {Number} координата X
         * @param y {Number} координата Y
         * @param z {Number} то, на сколько увеличивается картинка
         */
        function zoomTo (x,y,z) {
            var x = -( x / scale + coords.x - x / ( scale * z ) )
              , y = -( y / scale + coords.y - y / ( scale * z ) );

            move(coords.x, coords.y);
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
            ctx.scale(scale, scale, 'increase');
            if (!isIE) {ctx.translate(-coords.x, -coords.y);} // Для IE не нужно смещать координаты, что бы выровнять картинку
            drawImg();
        }   

        /**
         * Устанавливает зум
         * @param z {Number} новое значение зума
         */
        function zooming (z) {
            scale = z;
            ctx.scale(z,z);
            ctx.translate(-coords.x, -coords.y);
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
            // Когда отпускаем мышку - перестаем двигать картинку
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
              ;

            // IE берет кординаты не canvas, а div-a кординатыорый вложен в canvas
            // По этому нужно рассчитат координаты c четом отступа div-a
            if (  isIE ) {
                var offsetX = parseInt($(e.currentTarget).find('group').css('left'), 10)
                  , offsetY = parseInt($(e.currentTarget).find('group').css('top'), 10);
                x += offsetX;
                y += offsetY;
            }

            if ( e.shiftKey ) {
                if ( willDir ) {
                    zoomTo(x, y, settings.zoomStep.zoomIn);
                }else{
                    zoomTo(x, y, settings.zoomStep.zoomOut);
                }
                return false;
            }
            
        }

        function scollIn () {
            zoomTo(wrapWidth/2, wrapHeight/2, settings.zoomStep.zoomIn);
            return false;
        }

        function scollOut () {
            zoomTo(wrapWidth/2, wrapHeight/2, settings.zoomStep.zoomOut);
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
                    x : coords.x,
                    y : coords.y
                },
                originalSize:{
                    w: width,
                    h: height
                },
                size  : {
                    w: wrapWidth,
                    h: wrapHeight
                },
                img: $img,
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
            if ( wrapWidth === w && wrapHeight === h ) {
                return false;
            }

            var diff = w/ctx.canvas.width;
            wrapWidth = w;
            wrapHeight = h;

            toggleGUI();

            if ( settings.animate ) {
                $crope.animate({
                    width : w,
                    height: h
                }, function () {
                    ctx.canvas.width = w;
                    ctx.canvas.height = h;

                    zoomer(diff);
                });

                return this;
            }

            $crope.css({
                width : w,
                height: h
            });

            ctx.canvas.width = w;
            ctx.canvas.height = h;

            zoomer(diff);

            return this;
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
            $img.show();

            return this;
        }

        /**
         * Сбрасывает координаты окна и зум
         */ 
        function restore () {
            coords.x = 0;
            coords.y = 0;
            ctx.setTransform( 1, 0, 0, 1, 0, 0 );
            ctx.clearRect(0, 0, ctx.canvas.width, ctx.canvas.height);
            ctx.drawImage($img.get(0), 0, 0);
            return this;
        }


        

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
            restore  : restore,
            init     : init
        }
    }

    var setOfCroper = []; // Массив из возвращаемых 

    // Проходимся по всем элементам
    this.each(function () {
        var croper = new Croper( $(this) );
        setTimeout(croper.init, 500);
        setOfCroper.push( croper );
    });

    // Возвращаем объекты слайдера для использония их API ( Пример: $('#slider').jSlider().stopAutoRatating() )
    return setOfCroper.length === 1? setOfCroper[0] : setOfCroper;
}

})(jQuery);