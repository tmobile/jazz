import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {SessionStorageService} from "../../core/helpers/session-storage.service";
import {RelaxedJsonService} from "../../core/helpers/relaxed-json.service";

declare var Promise;
@Component({
  selector: 'env-try-service-sidebar',
  templateUrl: './env-try-service-sidebar.component.html',
  styleUrls: ['./env-try-service-sidebar.component.scss']
})
export class EnvTryServiceSidebarComponent implements OnInit {

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

  constructor(private sessionStorage: SessionStorageService,
              private relaxedJson: RelaxedJsonService) {
  }

  ngOnInit() {
    let saved = this.sessionStorage.getItem(this.sessionStorageKey);
    if (saved) {
      this.inputValue = saved;
    }
  }


  //Starts testing lamda function
  //Current output is stubbed and will be replaced
  startTest() {
    this.inputIsValid();
    if (this.valid) {
      this.loading = true;

      var promise = new Promise((resolve, reject) => {
        let payload = JSON.parse(this.inputValue);

        let outputObject = {
          status: 200,
          headers: {
            'Content-Type': 'application/json'
          },
          data: {
            message: 'success'
          }
        };

        setTimeout(() => { resolve(outputObject)}, 500)
      });

      promise.then((response) => {
        this.loading = false;
        this.outputValue = this.stringToPrettyString(JSON.stringify(response));
      });
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
      this.sessionStorage.setItem(this.sessionStorageKey, this.inputValue);
    } else {
      this.sessionStorage.removeItem(this.sessionStorageKey);
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
    let parser = this.relaxedJson.getParser();
    let objectValue = parser.stringToValue(input);
    let PrettyPrinter = this.relaxedJson.getPrinter();
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

  closeSideMenu() {
    this.outputValue = '';
    this.onClose.emit();
  }

}
