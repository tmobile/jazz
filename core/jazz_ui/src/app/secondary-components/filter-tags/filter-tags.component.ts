import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DataCacheService } from '../../core/services/index';


@Component({
  selector: 'filter-tags',
  templateUrl: './filter-tags.component.html',
  styleUrls: ['./filter-tags.component.scss']
})
export class FilterTagsComponent implements OnInit {
    @Input() filtersApplied: any = {};
    @Input() selected ;
    @Output() OnCancel:EventEmitter<any> = new EventEmitter<any>();
    areTagsDefault:boolean;

    filterTags:Array<any>=[
        {
            key:'Time Range',
            value:'Day'
        },
        {
            key:'Time Period',
            value:1
        },
        {
            key:'Period',
            value:'15 Minutes'
        },
        {
            key:'Statistics',
            value:'Average'
        },
        {
            key:'Account',
            value:'Acc 1'
        },
        {
            key:'Region',
            value:'reg 1'
        },
        {
            key:'Environment',
            value:'prod'
        },
        {
            key:'Method',
            value:'POST'
        },
        {
            key:'Asset Type',
            value:'all'
        },
        {
            key:'Asset Name',
            value: 'all'
        }

    ];
        filter_TimeRange:any;
        filter_TimeRangeSlider:any;
        filter_Period:any;
        filter_Statistic:any;
        filter_Account:any;
        filter_Region:any;
        filter_Env:any;
        filter_Method:any;
        filter_Asset:any;
        filter_AssetIden:any;



        filter_TimeRange_default:any = 'Day';
        filter_TimeRangeSlider_default:any= 1;
        filter_Period_default:any = '15 Minutes';
        filter_Statistic_default:any= 'Average';
        filter_Account_default:any='Acc 1';
        filter_Region_default:any='reg 1';
        filter_Env_default:any='prod';
        filter_Method_default:any='POST';
        filter_Asset_default:any = 'all';
        filter_AssetIden_default:any = "all"


    constructor(private cache: DataCacheService){

    }

    setDefaults(){
        switch(this.filterTags[0].value){
            case 'Day':{   this.filter_Period_default = '15 Minutes';
                break;
            }
            case 'Week':{   this.filter_Period_default = '1 Hour';
                break;
            }
            case 'Month':{  this.filter_Period_default = '6 Hours';
                break;
            }
            case 'Year':{   this.filter_Period_default = '7 Days';
                break;
            }
        }
    }

    notify(key,value){
        this.setDefaults();

        switch(key){
            case 'filter-TimeRange':{
                this.filterTags[0].value=this.filter_TimeRange=value;
                break;
            }
            case 'filter-TimeRangeSlider':{
                this.filterTags[1].value=this.filter_TimeRange=value;
                break;
            }
            case 'filter-Period':{
                this.filterTags[2].value=this.filter_TimeRange=value;
                break;
            }
            case 'filter-Statistic':{
                this.filterTags[3].value=this.filter_TimeRange=value;
                break;
            }
            case 'filter-Account':{
                this.filterTags[4].value=this.filter_Account=value;
                break;
            }
            case 'filter-Region':{
                this.filterTags[5].value=this.filter_Region=value;
                break;
            }
            case 'filter-Environment':{
                this.filterTags[6].value=this.filter_Env=value;
                break;
            }
            case 'filter-Method':{
                // alert('in method case')
                this.filterTags[7].value=this.filter_Method=value;
                break;
            }
            case 'filter-Asset':{
                this.filterTags[8].value = this.filter_Asset=value;
                break;
             }
             case 'filter-Asset-Name':{
                this.filterTags[9].value = this.filter_AssetIden=value;
                break;
             }
        }
    }

    notifyLogs(key,value){

        this.setDefaults();
        switch(key){
            case 'filter-TimeRange':{
                this.filterTags[0].value=this.filter_TimeRange=value;
                break;
            }
            case 'filter-TimeRangeSlider':{
                this.filterTags[1].value=this.filter_TimeRange=value;
                break;
            }
            case 'filter-Environment':{
                this.filterTags[6].value=this.filter_Env=value;
                break;
            }
            case 'filter-Asset':{
                this.filterTags[8].value = this.filter_Asset=value;
                break;
            }
            case 'filter-Asset-Name':{
                this.filterTags[9].value = this.filter_AssetIden=value;
                break;
            }

        }
    }
    notifyServices(key){
    }
    clearall(value){
        this.OnCancel.emit(value);
    }
    ngOnChanges(x:any){
        this.filtersApplied='month';




    }
    ngOnInit(){
        this.areTagsDefault=true;
    }
}
