Cropper
=======

Виджет для обработки фото.
Позволяет просмотреть то, как будет выглядеть фотографии в разных разрешениях и пропорциях.
Можно зумить и перемещать фото.

```javascript
var croper = $('.js-croper').Croper();  // Инициализируем плагин
croper.setZoom(0.5);  // Уменьшаем картинку на половину
```
**Пример разметки:**
```html
<div class="js-croper" data-size="630x270"> <!--Обертка для Cropper, в ней указываются размеры видимой области--->
    <!--Панель с зумом (не обязательна)--->
    <ul class="js-croper-zoomer">
        <li class="js-croper-zoomer-in">+</li>
        <li class="js-croper-zoomer-out">&ndash;</li>
    </ul>
    
    <!--Картинка, которую необходимо обрезать--->
    <img src="http://cdn.voboyah.com/img/33590-1920x1200.jpg" alt="" class="js-croper-image">
    
    <!--Список доступных размеров в данной пропорции. Не обязателен-->
    <ul class="js-croper-sizes">
        <li class="js-croper-size active" data-size="630x270">
            <span>630x270</span>
        </li>
    </ul>
</div>

```

**Опции Cropper и их значения по умолчанию:**

```javascript
{
  CSS_CLASS: 'js-croper', // Префикс для класса. Можно изменить для более удобной работы с  версткой
  zoomStep: {in: 1.1, out: 0.9 }, // Параментры зума. in - на сколько увеличивем, out - на сколько уменьшаем
  animate: true,    // Анимация при изменении размеров картинки, {Boolian} или {Function} в функцию передаются $crope - область в кторой лежит канвас, $canvas
  maxWidthSizeMenu: 170, // Максимальная ширина меню с размерами фото. Когда Cropper станет меньше этого размера, меню скроется
}
```
Так же можно передавать некоторые значения через data-* атрибуты:
data-zoom="1.5" - Начальный зум картинки
data-x="100" data-y="150" - Начальные координаты картинки




**TODO:**
 - Починить контекстное меню
 - Рефакторинг кода
 - Покрыть тестами

