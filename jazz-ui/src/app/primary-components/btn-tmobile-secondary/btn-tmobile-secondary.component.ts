import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector : 'btn-tmobile-secondary',
    templateUrl: 'btn-tmobile-secondary.component.html',
    styleUrls: ['btn-tmobile-secondary.component.scss']
})

export class BtnTmobileSecondaryComponent implements OnInit {

    // Inputs supplied from the parent (custom attribute values)
    @Input() text: string = 'DEFAULT TEXT';
    @Input() public action: Function;
     @Input() newclass : string = '';

    constructor(
        private route: ActivatedRoute,
        private router: Router
    ) {};
    ngOnInit() {

    }
}
