import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { DataCacheService } from '../../core/services/index';


@Component({
  selector: 'filter-tags-services',
  templateUrl: './filter-tags-services.component.html',
  styleUrls: ['./filter-tags-services.component.scss']
})
export class FilterTagsServicesComponent implements OnInit {
    constructor(){}
    @Output() OnCancel:EventEmitter<any> = new EventEmitter<any>();
    areTagsDefault:boolean;
    filterTagsServices:Array<any>=[
        {
            key:'Name',
            value:''
        },
        {
            key:'Namespace',
            value:''
        },
        {
            key:'Status',
            value:''
        },
        {
            key:'Search',
            value:''
        }
    ]  

    filter_Name_default:any = '';
    filter_Domain_default:any= '';
    filter_Status_default:any = '';
    filter_Search_default:any='';

    notifyServices(key,value){
      switch(key){
        case 'name':this.filterTagsServices[0].value=value;
                    break;
        case 'domain':this.filterTagsServices[1].value=value;
                    break;
        case 'status':{
                        this.filterTagsServices[2].value=value;
                        var a = this.filterTagsServices[2].value;
                        a=a.replace("_"," ");
                        this.filterTagsServices[2].value=a;
                        break;
                      } 
        case 'search':{
            this.filterTagsServices[3].value=value;
            break;

        }
      }
      
  }
  clearall(value){
      this.OnCancel.emit(value);
      
  }
    ngOnInit(){

    }
}