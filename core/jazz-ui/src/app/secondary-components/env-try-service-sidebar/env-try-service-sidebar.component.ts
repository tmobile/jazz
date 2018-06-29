import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';
import {SessionStorageService} from "../../core/helpers/session-storage.service";
import {RelaxedJsonService} from "../../core/helpers/relaxed-json.service";
import { HttpModule } from '@angular/http';
import { RequestService } from "../../core/services";



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
  public lineNumberCount_op  : any = new Array(5).fill('');
  public inputValue = '';
  public outputValue = '';
  public valid = true;
  public validityMessage = '';
  public savingPayload = true;
  public sessionStorageKey = 'jazz-function-payload';
  public loading;
  private subscription:any;
  private http:any;
  api_status:string="default";



  @Input() service;
  @Input() environment;
  @Output() onClose = new EventEmitter();

  constructor(private sessionStorage: SessionStorageService,
              private relaxedJson: RelaxedJsonService,
              private request:RequestService,
            ) {
              this.http = request;

  }

  ngOnInit() {
    let saved = this.sessionStorage.getItem(this.sessionStorageKey);
    if (saved) {
      this.inputValue = saved;
    }
  }


 
  startTest() {
    this.inputIsValid();
    if (this.valid) {
      this.loading = true;

      var promise = new Promise((resolve, reject) => {
        var payload = {} ;
        let outputObject = {};
        console.log('serv',this.environment);
        payload["functionARN"]= this.environment.endpoint;
        // "arn:aws:lambda:us-east-1:192006145812:function:gitlab180627-jazztest-lambda-prod:1";
        payload["inputJSON"] = JSON.parse(this.inputValue);
        this.subscription = this.http.post('https://p1cgv1qy3c.execute-api.us-east-1.amazonaws.com/prod/jazz/test-lambda', payload).subscribe(
        (response) => {        
          response.data.execStatus = "error";
          if(response.data.execStatus == "Success"){
            this.api_status = "success";
          }            
          else this.api_status = "error";

          console.log('response =>',response);
          console.log('ss',response.data.payload.Payload);
          console.log('sss',response.data.payload.StatusCode);
          outputObject["data"]=JSON.parse(response.data.payload.Payload);
          outputObject["status"]=response.data.payload.StatusCode;
          setTimeout(() => { 
            resolve(outputObject);
          }, 500)


        },
        (error) => {
          this.api_status = "error";
          console.log('error =>',error);
    
        
        })
      });

      promise.then((response) => {
        this.loading = false;
        this.outputValue = this.stringToPrettyString(JSON.stringify(response));
        this.lineNumbers('op');

        console.log('this.out',this.outputValue)
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

  lineNumbers(event){
    var lines;
    if(event == "op"){
      lines = this.outputValue.split(/\r*\n/);
    }
    else{
      lines = this.inputValue.split(/\r*\n/);
    } 
    var line_numbers = lines.length;
    if(event == "op"){
      this.lineNumberCount_op = new Array(line_numbers).fill('');
    }
    else{
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
      this.lineNumbers('ip');
    } catch (error) {
      console.log('parse error',error);
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
