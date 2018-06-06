import { Injectable } from '@angular/core';

declare let output;

export class RelaxedJsonService {

  public  getParser() {
    return output.tv.twelvetone.rjson.RJsonParserFactory.Companion.getDefault().createParser();
  }

  public getPrinter() {
    return output.tv.twelvetone.rjson.PrettyPrinter;
  }
}