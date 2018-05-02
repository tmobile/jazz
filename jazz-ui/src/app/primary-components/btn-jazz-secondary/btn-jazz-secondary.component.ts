import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector : 'btn-jazz-secondary',
    templateUrl: 'btn-jazz-secondary.component.html',
    styleUrls: ['btn-jazz-secondary.component.scss']
})

export class BtnJazzSecondaryComponent implements OnInit {

    // Inputs supplied from the parent (custom attribute values)
    @Input() text: string = 'DEFAULT TEXT';
    // @Input() public action: Function;
     @Input() newclass : string = '';
     @Input() clickLink: any;
     @Input() disablebtn:boolean;


    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) {};
    action(x:any){
        if(this.clickLink){
            location.href=this.clickLink;
        } else{
            return this.clickLink = false;
        }
        
    }
    ngOnInit() {
        
    }
}
