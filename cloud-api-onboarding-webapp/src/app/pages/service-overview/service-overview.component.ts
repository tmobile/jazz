/** 
  * @type Component 
  * @desc Service overview page
  * @author
*/

import { Component, OnInit, Input } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
    selector: 'service-overview',
    templateUrl: './service-overview.component.html',
    styleUrls: ['../service-detail/service-detail.component.scss','./service-overview.component.scss']
})
export class ServiceOverviewComponent implements OnInit {

    @Input() service: any = {};

    constructor(
        private router: Router
    ) { }

    activeEnv:string = 'dev';
    environments = [
        {
            stage : 'dev',
            serviceHealth : 'good',
            lastSuccess : {
                value: 1,
                unit: 'Day'
            },
            lastError : {
                value: 2,
                unit: 'Days'
            },
            deploymentsCount : {
                'value':'15',
                'duration':'Last 24 hours'
            },
            cost : {
                'value': '$30.4',
                'duration': 'Per Day',
                'status': 'bad'
            },
            codeQuality : {
                'value': '83%',
                'status': 'good'
            }
        },
        {
            stage : 'stg',
            serviceHealth : 'good',
            lastSuccess : {
                value: 3,
                unit: 'Days'
            },
            lastError : {},
            deploymentsCount : {
                'value':'5',
                'duration':'Last 24 hours'
            },
            cost : {
                'value': '$2.94',
                'duration': 'Per Day',
                'status': 'good'
            },
            codeQuality : {
                'value': '83%',
                'status': 'good'
            }
        },
        {
            stage : 'prd',
            serviceHealth : 'bad',
            lastSuccess : {},
            lastError : {
                value: 5,
                unit: 'Days'
            },
            deploymentsCount : {
                'value':'5',
                'duration':'Last 24 hours'
            },
            cost : {
                'value': '$2.94',
                'duration': 'Per Day',
                'status': 'good'
            },
            codeQuality : {
                'value': '43%',
                'status': 'bad'
            }
        }
    ];

    stageClicked(stg){
        if (this.activeEnv != stg) {
            this.activeEnv = stg
        } else{
            let url = '/services/' + this.service['id'] + '/' + stg
            this.router.navigateByUrl(url);
        }
    }

    ngOnInit(
    ) {
    }

}
