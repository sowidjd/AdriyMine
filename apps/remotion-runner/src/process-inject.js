// process versi peramban untuk pustaka polyfill (util, assert, stream) yang memerlukannya saat dimuat.
import p from 'process/browser.js';
export { p as process };
