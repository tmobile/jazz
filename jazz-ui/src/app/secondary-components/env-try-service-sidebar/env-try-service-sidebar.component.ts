import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {JsonPipe} from "@angular/common";

declare var output;

@Component({
  selector: 'env-try-service-sidebar',
  templateUrl: './env-try-service-sidebar.component.html',
  styleUrls: ['./env-try-service-sidebar.component.scss']
})
export class EnvTryServiceSidebarComponent implements OnInit, OnChanges {

  public contentTypeMenu = ['application/json'];
  public contentTypeSelected = this.contentTypeMenu[0];
  public lineNumberCount: any = new Array(5).fill('');
  public inputValue = '';
  public outputValue = '';
  public valid = true;
  public validityMessage = '';
  public savingPayload = true;
  public sessionStorageKey = 'jazz-function-payload';
  public loading;

  @Input() service;
  @Output() onClose = new EventEmitter();

  constructor(private jsonPipe: JsonPipe) {
  }

  ngOnInit() {
    let saved = window.sessionStorage.getItem(this.sessionStorageKey);
    if (saved) {
      this.inputValue = JSON.parse(saved);
    }
  }


  ngOnChanges(changes) {
  }


  startTest() {
    this.inputIsValid();
    if (this.valid) {
      this.loading = true;
      setTimeout(() => {
        this.loading = false;
        let payload = JSON.parse(this.inputValue);
        console.log('start test', payload);
        let outputObject = {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            message: 'success'
          }
        };
        this.outputValue = this.stringToPrettyString(JSON.stringify(outputObject));
      }, 2000);

    }
  }

  inputIsValid() {
    try {
      let payload = JSON.parse(this.inputValue);
    } catch (error) {
      this.validityMessage = 'Input is invalid JSON';
      this.valid = false;
    }
  }

  toggleSavePayload(flag) {
    this.savingPayload = flag;
    if (this.savingPayload) {
      window.sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(this.inputValue));
    } else {
      window.sessionStorage.removeItem(this.sessionStorageKey);
    }
  }

  formatJSON() {
    try {
      let jsonString = this.stringToPrettyString(this.inputValue);
      this.valid = true;
      this.toggleSavePayload(this.savingPayload);
      this.inputValue = jsonString;
    } catch (error) {
      this.validityMessage = 'Could not format JSON';
      this.valid = false;
    }
  }

  stringToPrettyString(input) {
    let parser = output.tv.twelvetone.rjson.RJsonParserFactory.Companion.getDefault().createParser();
    let objectValue = parser.stringToValue(input);
    let PrettyPrinter = output.tv.twelvetone.rjson.PrettyPrinter;
    let opts = new PrettyPrinter.Options();
    opts.useQuotes = true;
    opts.useArrayCommas = true;
    opts.useObjectCommas = true;
    opts.objectItemNewline = true;
    opts.arrayItemNewline = true;

    let prettyPrinter = new PrettyPrinter(opts);
    let jsonString = prettyPrinter.valueToString(objectValue);
    return jsonString;
  }

}
