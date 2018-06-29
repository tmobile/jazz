import {Injectable} from '@angular/core';

@Injectable()
export class UtilsService {

  constructor() {
  }

  debounce(func, wait, immediate) {
    let timeout;
    return function () {
      const context = this;
      const args = arguments;
      const later = function () {
        timeout = null;
        if (!immediate) {
          func.apply(context, args);
        }
      };
      const callNow = immediate && !timeout;
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
      if (callNow) {
        func.apply(context, args);
      }
    };
  };

  hyphenToSpace(input) {
    return input ? input.replace(/-/g, ' ') : '';
  }


  queryString(params) {
    return '?' + Object.keys(params).map(key => key + '=' + params[key]).join('&');
  }
}
