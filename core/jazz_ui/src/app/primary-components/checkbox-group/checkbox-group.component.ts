/**
  * @type Component
  * @desc Generic dropdowns element
  * @author
*/

import { Component, OnInit, Input, Output, EventEmitter  } from '@angular/core';


@Component({
  selector: 'checkbox-group',
  templateUrl: './checkbox-group.component.html',
  styleUrls: ['./checkbox-group.component.scss']
})
export class CheckboxGroupComponent implements OnInit {

  @Input() IsEnvList:boolean=true;
  @Input() checkboxContent;
  @Input() filterObject;


  @Input() selected;
  @Input() public statusFilter: Function;
  @Output() onCheckBoxSelected:EventEmitter<boolean> = new EventEmitter<boolean>();

  selectionObj: any = {};
  displayCount: number = 0;
  allselected: boolean = true;
  isopen:boolean = false;
  keepitOPEN:boolean = false;
  keepitopen(){
    this.keepitOPEN = true
  }

  drpBtnClick(){
    this.isopen?this.isopen = false:this.isopen = true;
  }

  onAllSelected(){
    if(this.allselected){
      this.displayCount = this.checkboxContent.length;
      for(let i=0;i<this.checkboxContent.length;i++){
        setTimeout(()=>{
          this.selectionObj[this.checkboxContent[i]] = true;
        });

      }
      this.onCheckBoxSelected.emit(this.selectionObj);
    }
    else{
      this.displayCount = 0;
      for(let i=1;i<this.checkboxContent.length;i++){
        setTimeout(()=>{
          this.selectionObj[this.checkboxContent[i]] = false;
        });
      }
    }
  }

  onCheckboxSelect(item){

    if(this.allselected){
      for(let i=0; i<this.checkboxContent.length; i++){
          this.selectionObj[this.checkboxContent[i]] = false;
        }
    }
    this.selectionObj[item] = !this.selectionObj[item];
    this.countSelected()
    if(this.displayCount < this.checkboxContent.length){
      this.allselected = false;
    }
    else{
      // this.allselected = true;
      // this.onAllSelected();
    }
    console.log('this.selectionObj',this.selectionObj)
    this.onCheckBoxSelected.emit(this.selectionObj);


  }

  countSelected(){
    this.displayCount = 0;
    for(let i = 0; i < this.checkboxContent.length; i++){
      if(this.selectionObj[this.checkboxContent[i]] == true)
      {
        this.displayCount++;
      }
    }
  }
  onDropdownOpen(){
  }
  onDropdownClose(){
  }

  clearFilter(){
    for(let i = 0; i < this.checkboxContent.length; i++){
      this.selectionObj[this.checkboxContent[i]] = false;
      let ele = document.getElementById(this.checkboxContent[i]);
      ele['checked'] = false;
    }
    this.onCheckBoxSelected.emit(this.selectionObj);
    this.countSelected();


  }


  reset(value,content){
    this.selectionObj = value;
    this.checkboxContent = content
    for(let i = 0; i < this.checkboxContent.length; i++){
      let ele = document.getElementById(this.checkboxContent[i]);
      if(ele){
        if(this.selectionObj[this.checkboxContent[i]]){
          ele['checked'] = true;
        }
        else{
          ele['checked'] = false;
        }
      }

    }
    this.countSelected();
    console.log('this.selectionObj account',this.selectionObj);


  }
  constructor() { }

  ngOnInit() {
    if(this.checkboxContent)
    {
      for(let i=0;i<this.checkboxContent.length;i++){
        this.selectionObj[this.checkboxContent[i]] = false;
      }
      // this.paintCheckboxes();
      this.onCheckBoxSelected.emit(this.selectionObj);
    }
  }

}
