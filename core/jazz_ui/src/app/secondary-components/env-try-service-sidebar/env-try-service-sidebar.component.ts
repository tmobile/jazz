import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {SessionStorageService} from "../../core/helpers/session-storage.service";
import {RelaxedJsonService} from "../../core/helpers/relaxed-json.service";
import {HttpModule} from '@angular/http';
import {RequestService} from "../../core/services";
import { ActivatedRoute } from '@angular/router';


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
  public lineNumberCount: any = new Array(7).fill('');
  public lineNumberCount_op: any = new Array(7).fill('');
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
  FunctionInvocationError:boolean = false;
  reponse_code;
  selectedServiceId: string = "";


  @Input() service;
  @Input() environment;
  @Output() onClose = new EventEmitter();

  constructor(private sessionStorage: SessionStorageService,
              private relaxedJson: RelaxedJsonService,
              private request: RequestService,
              private route: ActivatedRoute
  ) {
    this.http = request;

  }

  ngOnInit() {
    this.route.params.subscribe(params => {
      this.selectedServiceId = params['id'];
    });
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
        "inputJSON": JSON.parse(this.inputValue)
      };
      this.subscription = this.http.post('/jazz/test-lambda', payload, this.selectedServiceId).subscribe((response) => {
        this.loading = false;
        this.outputHeader = {
          statusCode: response.data.payload.StatusCode|| '',
          statusText: response.data.execStatus
        }
        this.reponse_code = response.data.payload.StatusCode;
        if(response.data.payload.StatusCode === 200){
          this.success=true;
        }
        else{
          this.success=false;
        }
        if(response.data.execStatus === 'FunctionInvocationError'){
          this.FunctionInvocationError = true;
          this.success=false;
        }
        if(this.outputHeader.statusCode != ''){
          this.outputHeader.statusCode+=' : ';
        }
        if(this.FunctionInvocationError){
          this.outputValue = response.data.payload.message;
        }
        this.outputValue = this.stringToPrettyString(response.data.payload.Payload);
        this.lineNumbers('op');
      }, (error) => {
        let errorObj;
        try{
          errorObj = JSON.parse(error._body);
        }
        catch(e){
          console.log('Error in parsing JSON',e)
        }
        this.loading = false;
        this.outputHeader = {
          statusCode: error.status,
          statusText: error.statusText || 'Error'
        };
        if(errorObj.errorType === "BadRequest"){
          this.success=false;
          this.error=false;
          this.outputHeader.statusText='Bad Request';
        }
        this.outputValue = 'Error';
      });
    }
  }

  clearInputbox(){
    this.inputValue='';
    this.lineNumbers("ip");
    this.outputValue="";
    this.lineNumbers("op");
    this.valid = true;
    this.outputHeader=false;
  }

  inputIsValid() {
    try {
      let payload = JSON.parse(this.inputValue);
      this.validityMessage = '';
      this.valid = true;
    } catch (error) {
      this.validityMessage = 'Input is invalid JSON';
      this.valid = false;
    }
  }

  lineNumbers(event) {
    let lines;
    if (event == "op") {
      lines = this.outputValue.split(/\r*\n/);
    }
    else{
      lines = this.inputValue.split(/\r*\n/);
    }
    let line_numbers = lines.length;
    if(line_numbers < 7){
      line_numbers = 7;
    }
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
