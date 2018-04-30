/** 
  * @type Component 
  * @desc Generic button element
  * @author
*/


import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'btn-jazz-primary',
    templateUrl: 'btn-jazz-primary.component.html',
    styleUrls: ['btn-jazz-primary.component.scss']
})

export class BtnJazzPrimaryComponent implements OnInit {

    // Inputs supplied from the parent (custom attribute values)
    @Input() text: string = 'DEFAULT TEXT';
    // @Input() public action: Function;
      @Input() newclass : string = '';
      @Input() disablePrimaryBtn:boolean;
      action(){
        
      }



    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) {};
    ngOnInit() {
    };
}
