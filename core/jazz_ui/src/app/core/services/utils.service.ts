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

  getAWSIcon() {
    let icon =
    `<span class="path1"></span><span class="path2"></span><span class="path3"></span><span class="path4"></span><span class="path5"></span><span class="path6"></span><span class="path7"></span><span class="path8"></span><span class="path9"></span><span class="path10"></span><span class="path11"></span><span class="path12"></span><span class="path13"></span><span class="path14"></span><span class="path15"></span><span class="path16"></span><span class="path17"></span><span class="path18"></span><span class="path19"></span><span class="path20"></span><span class="path21"></span><span class="path22"></span><span class="path23"></span><span class="path24"></span><span class="path25"></span><span class="path26"></span><span class="path27"></span><span class="path28"></span><span class="path29"></span><span class="path30"></span><span class="path31"></span><span class="path32"></span><span class="path33"></span>`;
    return icon;
  }

}
