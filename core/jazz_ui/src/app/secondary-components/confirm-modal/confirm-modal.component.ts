import {
  Component,
  EventEmitter,
  Input,
  Output } from '@angular/core';


@Component({
  selector:     'confirm-modal',
  templateUrl:  './confirm-modal.component.html',
  styleUrls:    ['./confirm-modal.component.scss']
})
export class ConfirmModalComponent {

  @Input()      content: string;
  @Input()      title: string;
  @Input()      visible: boolean;
  @Input()      secondaryBtn: boolean;
  @Input()      primaryBtnContent: string;
  @Input()      details: string;
  @Input()      dateValue: string;
  @Input()      subContent: string;
  @Input()      contentPart: string;
  @Input()      applicationName: string;
  @Output()     onConfirm: EventEmitter<any> = new EventEmitter();


  /**
   * Handle confirm event
   */
  handleConfirm (isConfirm: boolean) {
    this.onConfirm.emit(isConfirm);
  }

}
