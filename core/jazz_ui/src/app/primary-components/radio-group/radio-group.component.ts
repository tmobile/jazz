import { Component, OnInit ,Input, Output, EventEmitter} from '@angular/core';

@Component({
  selector: 'radio-group',
  templateUrl: './radio-group.component.html',
  styleUrls: ['./radio-group.component.scss']
})
export class RadioGroupComponent implements OnInit {
  @Input() radioContent;
  @Input() selected;
  @Output() onSelected:EventEmitter<boolean> = new EventEmitter<boolean>();
  constructor() { }
  

  ngOnInit() {
  }
  onRadioClick(selected){
    this.onSelected.emit(selected)
    this.selected = selected;
  }

}
