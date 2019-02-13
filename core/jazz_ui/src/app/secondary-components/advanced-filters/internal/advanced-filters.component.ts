import { Component,ViewContainerRef, OnInit, Input, Output, EventEmitter,ViewChild } from '@angular/core';
import { DataCacheService } from '../../../core/services/index';
import { environment as env_internal } from './../../../../environments/environment.internal';


@Component({
  selector: '[advanced_filters]',
  templateUrl: './advanced-filters.component.html',
  styleUrls: ['./advanced-filters.component.scss']
})
export class AdvancedFiltersComponent implements OnInit {
   

    constructor(public viewContainerRef: ViewContainerRef , private cache: DataCacheService) { }
    data: any;
    @Input() advanced_filter_input:any = {};
    @Input() logs:boolean = false;
    @Input() assets:boolean = false;

    @Input() service: any = {};
    @Output() onFilterSelect:EventEmitter<any> = new EventEmitter<any>();


    slider:any;
    sliderFrom = 1;
    sliderPercentFrom = 0;
    sliderMax:number = 7;


    filterSelected:boolean;

    selectFilter:any={}
    periodList: Array<string> = ['15 Minutes','1 Hour','6 Hours','1 Day','7 Days','30 Days'];
    periodSelected:string= this.periodList[0];

    timePeriodList: Array<number> = [1,2,3,4,5,6,7];
    selectedTimePeriod: number = 1;


    rangeList: Array<string> = ['Day', 'Week', 'Month', 'Year'];
    selectedTimeRange:string= this.rangeList[0];

    statisticList: Array<string> = ['Average', 'Sum', 'Maximum','Minimum'];
    statisticSelected:string= this.statisticList[0];

    methodList:Array<string>  = ['POST','GET','DELETE','PUT'];
    methodSelected:string = this.methodList[0];

    pathList:Array<string>=[];
    pathSelected:string = '';

    
    accList=env_internal.urls.accounts;
	regList=env_internal.urls.regions;
	  accSelected:string = this.accList[0];
	regSelected:string=this.regList[0];

    envList:any=['prod','stg'];
    envSelected:string=this.envList[0];
  
    getRange(e){
        this.selectFilter["key"]='slider';
        this.selectFilter["value"]=e;
        this.onFilterSelect.emit(this.selectFilter);

        this.sliderFrom =e.from;
        this.sliderPercentFrom=e.from_percent;
    }

    resetslider(e){
        this.sliderPercentFrom=0;
        this.sliderFrom=e;
    }
      
    onPeriodSelected(period){
        this.periodSelected=period;
        this.selectFilter["key"]='period';
        this.selectFilter["value"]=period;
        this.onFilterSelect.emit(this.selectFilter);
        
    }
    resetPeriodList(event){
        this.periodList=event;
        this.periodSelected=this.periodList[0];
    }
    setSlider(event){
        this.sliderMax=event;
        var timePeriodList = [];
        for (var i = this.sliderFrom; i <= this.sliderMax; i ++){
            timePeriodList.push(i);
        }
        this.timePeriodList = timePeriodList;
        this.sliderFrom=1;
        this.sliderPercentFrom=0;
    }

    onTimePeriodSelected(period){
        this.selectedTimePeriod = period;
        this.selectFilter["key"]='slider';
        this.sliderFrom = period;
        this.sliderPercentFrom = this.sliderMax > 1 ? (period - 1) / (this.sliderMax - 1) : 1;
        var event = {
            value: period,
            from: period,
            from_percent: this.sliderPercentFrom
        };

        this.selectFilter["value"] = event;
        this.onFilterSelect.emit(this.selectFilter);
    }
    onRangeListSelected(range){
    
        this.selectedTimeRange = range;
        this.selectFilter["key"]='range';
        this.selectFilter["value"]=range;
        this.onFilterSelect.emit(this.selectFilter);
        
    }
    onEnvSelected(envt){
        
        this.envSelected = envt;
        var index = this.envList.indexOf(envt);
        envt = this.environment_object.env[index];
        this.selectFilter["key"]='environment';
        this.selectFilter["value"]=envt;
        this.onFilterSelect.emit(this.selectFilter);
        
    }
    onStatisticSelected(statistics){
   
    this.statisticSelected = statistics;
    this.selectFilter["key"]='statistics';
    this.selectFilter["value"]=statistics;
    this.onFilterSelect.emit(this.selectFilter);
   
    }

    onMethodListSelected(method){

        this.methodSelected=method;
        this.selectFilter["key"]='method';
        this.selectFilter["value"]=method;
        this.onFilterSelect.emit(this.selectFilter);
        
    }
    
    onPathListicSelected(path){
        this.pathSelected=path;
        this.selectFilter["key"]='path';
        this.selectFilter["value"]=path;
        this.onFilterSelect.emit(this.selectFilter);
    }
   onaccSelected(event){
    this.accSelected=event;
    this.selectFilter["key"]='account';
    this.selectFilter["value"]=event;
    this.onFilterSelect.emit(this.selectFilter);

   }

	onregSelected(event){
    this.regSelected=event;
    this.selectFilter["key"]='region';
    this.selectFilter["value"]=event;
    this.onFilterSelect.emit(this.selectFilter);
   }
    isAPI:boolean = false;
   hideleft:boolean=false;
   changeCss:boolean = false;
   environment_object:any;
    ngOnInit(){
        var env_list=this.cache.get('envList')
        this.environment_object=env_list;
        if(env_list != undefined)
            this.envList=env_list.friendly_name;

     
       
        setTimeout(() => {
            
                    if(this.service.serviceType == 'api')this.isAPI=true;
                    this.changeCss = this.service.ismetrics;
                    if(this.changeCss){
                        document.getElementById('icon-filter-unselected').setAttribute('style','box-shadow: 0 2px 4px 0 rgba(0, 0, 0, 0.15)');

                    }
    
                    
                },10)
                
        this.advanced_filter_input = this.data.advanced_filter_input;
        this.service = this.data.service;
        this.pathList = ['/'+this.service.domain+'/'+this.service.name];
        this.pathSelected = this.pathList[0];

        if(this.service.ismetrics){
            this.statisticSelected=this.statisticList[1];
        }

        
    }
    ngOnChanges(x:any){
       this.pathList = ['/'+this.service.domain+'/'+this.service.name];
        this.pathSelected = this.pathList[0];

        }
}
