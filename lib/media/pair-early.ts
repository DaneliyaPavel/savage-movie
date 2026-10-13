/**
 * Ранний старт пары первого экрана: короткий инлайн-скрипт сразу после <video> в HTML.
 *
 * Без него ролики hero начинали качаться только после гидратации и события load страницы: на
 * телефоне это секунды, когда на экране один постер. Скрипт ставит адрес так же, как хук
 * (lib/media/use-pair-playback.ts), — десктопный или мобильный по MOBILE_MEDIA_QUERY, — и
 * не трогает ни reduced-motion, ни Save-Data, ни 2g: там остаются постеры. Воспроизведением,
 * синхронизацией и показом поверх постера по-прежнему занимается хук: он видит уже заданный
 * src и берёт загрузку как есть. Корень пары помечен data-pair-early.
 */
import { MOBILE_MEDIA_QUERY } from './config'

const SELECTOR = '[data-pair-early]'

export const PAIR_EARLY_SCRIPT = `(function(){try{var r=document.querySelector(${JSON.stringify(
  SELECTOR
)});if(!r)return;var c=navigator.connection;if(matchMedia('(prefers-reduced-motion: reduce)').matches||c&&(c.saveData||/(^|-)2g$/.test(c.effectiveType||'')))return;var m=matchMedia(${JSON.stringify(
  MOBILE_MEDIA_QUERY
)}).matches;var v=r.querySelectorAll('video[data-pair-side]');if(v.length!==2)return;var s=[];for(var i=0;i<2;i++){var u=v[i].getAttribute(m?'data-src-m':'data-src-d');if(!u)return;s.push(u)}for(i=0;i<2;i++){v[i].preload='auto';v[i].src=s[i]}}catch(e){}})()`
