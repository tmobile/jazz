import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {SessionStorageService} from "../../core/helpers/session-storage.service";
import {RelaxedJsonService} from "../../core/helpers/relaxed-json.service";
import {HttpModule} from '@angular/http';
import {RequestService} from "../../core/services";


declare var Promise;

@Component({
  selector: 'env-try-service-sidebar',
  templateUrl: './env-try-service-sidebar.component.html',
  styleUrls: ['./env-try-service-sidebar.component.scss'],
  providers: [RequestService],
})
export class EnvTryServiceSidebarComponent implements OnInit {

  public contentTypeMenu = ['application/json'];
  public contentTypeSelected = this.contentTypeMenu[0];
  public lineNumberCount: any = new Array(5).fill('');
  public lineNumberCount_op: any = new Array(5).fill('');
  public inputValue = '';
  public outputValue = '';

  public outputHeader = null;
  public valid = true;
  public validityMessage = '';
  public savingPayload = true;
  public sessionStorageKey = 'jazz-function-payload';
  public loading;
  private subscription: any;
  private http: any;
  api_status: string = "default";
  success:boolean = true;
  error:boolean = false;
  reponse_code;


  @Input() service;
  @Input() environment;
  @Output() onClose = new EventEmitter();

  constructor(private sessionStorage: SessionStorageService,
              private relaxedJson: RelaxedJsonService,
              private request: RequestService,
  ) {
    this.http = request;

  }

  ngOnInit() {
    let saved = this.sessionStorage.getItem(this.sessionStorageKey);
    this.savingPayload = !!saved;
    if (saved) {
      this.inputValue = saved;
    }
  }


  startTest() {
    this.inputIsValid();
    if (this.valid) {
      this.loading = true;
      let payload = {
        "functionARN": this.environment.endpoint,
        "inputJSON": this.inputValue
      };
      this.subscription = this.http.post('/jazz/test-lambda', payload).subscribe((response) => {
        this.loading = false;
        this.outputHeader = {
          statusCode: response.data.payload.StatusCode|| '',
          statusText: response.data.execStatus
        }
        this.reponse_code = response.data.payload.StatusCode;
        if(response.data.payload.StatusCode == 200){
          this.success=true;
          this.error=false;
        }
        if(response.data.execStatus == 'HandledError'){
          this.success=true;
          this.error=true;
        }
        if(response.data.execStatus == 'UnhandledError'){
          this.success=true;
          this.error=true;
        }
        if(response.data.execStatus == 'TimeoutError'){
          this.success=false;
          this.error=true;
        }
        if(this.outputHeader.statusCode != ''){
          this.outputHeader.statusCode+=' : ';
        }

        this.outputValue = this.stringToPrettyString(response.data.payload.Payload);
        this.lineNumbers('op');
      }, (error) => {
        this.loading = false;
        this.outputHeader = {
          statusCode: error.status,
          statusText: error.statusText || 'Error'
        };
        this.outputValue = 'Error'
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

  lineNumbers(event) {
    var lines;
    if (event == "op") {
      lines = this.outputValue.split(/\r*\n/);
    }
    else {
      lines = this.inputValue.split(/\r*\n/);
    }
    var line_numbers = lines.length;
    if (event == "op") {
      this.lineNumberCount_op = new Array(line_numbers).fill('');
    }
    else {
      this.lineNumberCount = new Array(line_numbers).fill('');
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
      this.toggleSavePayload(this.savingPayload);
      this.lineNumbers('ip');
    } catch (error) {
      console.log('parse error', error);
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
    this.outputHeader = null;
    this.onClose.emit();
  }

}
