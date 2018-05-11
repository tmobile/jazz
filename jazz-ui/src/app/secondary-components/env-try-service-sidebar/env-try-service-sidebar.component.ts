import {Component, EventEmitter, Input, OnChanges, OnInit, Output} from '@angular/core';

@Component({
  selector: 'env-try-service-sidebar',
  templateUrl: './env-try-service-sidebar.component.html',
  styleUrls: ['./env-try-service-sidebar.component.scss']
})
export class EnvTryServiceSidebarComponent implements OnInit, OnChanges {

  public contentTypeMenu = ['application/json'];
  public contentTypeSelected = this.contentTypeMenu[0];
  public lineNumberCount = new Array(5).fill('');
  public inputValue = '';
  public outputValue = '';
  public valid = true;
  public savingPayload = true;
  public sessionStorageKey = 'jazz-function-payload';
  @Input() service;
  @Output() onClose = new EventEmitter();

  constructor() { }

  ngOnInit() {
  }

  ngOnChanges(changes) {
  }


  startTest() {
    console.log('start test', this.inputValue);
  }

  inputIsValid() {
    try {
      let inputString = JSON.parse(this.inputValue);
      this.valid = true;
      return
    } catch(error) {
      this.valid = false;
    }
  }

  onSavePayloadChange() {
    this.savingPayload = !this.savingPayload;
    if(this.savingPayload) {
      window.sessionStorage.setItem(this.sessionStorageKey, JSON.stringify(this.inputValue));
    } else {
      window.sessionStorage.removeItem(this.sessionStorageKey);

    }
  }

}
