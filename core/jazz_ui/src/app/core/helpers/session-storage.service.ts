import { Injectable } from '@angular/core';

declare let window;

export class SessionStorageService {

  public setItem(key, value) {
    return window.sessionStorage.setItem(key, value);
  }

  public removeItem(key) {
    return window.sessionStorage.removeItem(key);
  }

  public clear() {
    return window.sessionStorage.clear();
  }

  public getItem(key) {
    return window.sessionStorage.getItem(key)
  }
}