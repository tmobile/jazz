import {Injectable} from '@angular/core';
declare let Promise;
declare let Object;
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

  setTimeoutPromise(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
  }

  clone(object) {
    return JSON.parse(JSON.stringify(object));
  }

  unique(array, callback) {
    let object = {};
    array.forEach((element, index, array) => {
      object[callback(element, index, array)] = element;
    });
    return Object.values(object)
  }



}
