/** 
  * @type Component 
  * @desc Generic button element
  * @author
*/

import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'btn-primary-with-icon',
  templateUrl: './btn-primary-with-icon.component.html',
  styleUrls: ['./btn-primary-with-icon.component.scss']
})
export class BtnPrimaryWithIconComponent implements OnInit {

   // Inputs supplied from the parent (custom attribute values)
    @Input() text: string = 'DEFAULT TEXT';
    // @Input() path: string = '../assets/images/icons/icon-add@3x.png';
    // @Input() public action: Function;

    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) {};
    action(x:string){
        
    }
    ngOnInit() {};

}
