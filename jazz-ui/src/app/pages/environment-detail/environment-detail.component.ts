import { Component, OnInit } from '@angular/core';
import { RequestService, DataCacheService, MessageService, AuthenticationService } from '../../core/services/index';
import { ToasterService} from 'angular2-toaster';
import { Router, ActivatedRoute } from '@angular/router';
import{ ConfigService } from '../../app.config'

@Component({
  selector: 'environment-detail',
  templateUrl: './environment-detail.component.html',
  styleUrls: ['./environment-detail.component.scss']
})
export class EnvironmentDetailComponent implements OnInit {

	breadcrumbs = [];
  selectedTab = 0; 
  service: any= {};
  isLoadingService: boolean = true;
  tabData = ['Overview','logs','deployments','Code quality','Assets'];//,'deployments','Code quality'
  envSelected:string='';
  environment = {
  	name: 'dev'
  }
  api_doc_name:string='';
  swaggerUrl:string='';
  copylinkmsg: any = "COPY LINK TO CLIPBOARD";
  copyapi: any;


  private sub: any;
  private subscription:any;

  constructor(
    private toasterService: ToasterService,
    private messageservice: MessageService,
    private route: ActivatedRoute,
    private http: RequestService,
    private cache: DataCacheService,
    private router: Router,
    private configService:ConfigService
  ) {
      this.api_doc_name = configService.getConfiguration().api_doc_name;
  }

  // Disabled other tabs
  onSelectedDr(selected){
    if(selected == 4 || selected == 3 || selected == 2 || selected == 1)
       return;
   else
       this.selectedTab = selected;
}

  onTabSelected (i) {
    
    this.selectedTab = i;
  };


  processService(service){
      if (service === undefined) {
          return {};
      } else{
          return {
              id: service.id,
              name: service.service,
              serviceType: service.type,
              runtime: service.runtime,
              status: service.status,
              domain: service.domain,
              endpoints: service.endpoints
          }
      }
  };


  onDataFetched(service) {

    if (service !== undefined && service !== "") {
      this.service = this.processService(service);

      // Update breadcrumbs
      this.breadcrumbs = [{
          'name' : this.service['name'],
          'link' : 'services/' + this.service['id']
      },
      {
        'name' : this.envSelected,
        'link' : ''
      }]
      this.isLoadingService = false;
    } else{
      this.isLoadingService = false;
      let errorMessage = this.messageservice.successMessage(service,"serviceDetail");
     this.toast_pop('error', 'Error', errorMessage)
    }
  }

  fetchService(id: string){
      
      this.isLoadingService = true;

      let cachedData = this.cache.get(id);

      if (cachedData) {
          this.onDataFetched(cachedData)
      } else{
         if ( this.subscription ) {
      this.subscription.unsubscribe();
    }
    this.subscription = this.http.get('/platform/services/'+id).subscribe(
            response => {
                  let service = response.data;
                  this.cache.set(id, service);
                  this.onDataFetched(service);
              },
              err => {
                  this.isLoadingService = false;
                  let errorMessage = this.messageservice.errorMessage(err,"serviceDetail");
                  this.toast_pop('error', 'Oops!', errorMessage)
              }
          )
      }

  };

 testApi(type)
    {
        switch(type){
            case 'api':          
            this.swaggerUrl="http://editor.swagger.io/?url="+this.api_doc_name+"/"+this.service.domain +"/"+ this.service.name +"/"+this.envSelected+"/swagger.json"
            window.open(this.swaggerUrl);
            break;

            case 'website' :
            window.open(this.service.endpoints[this.envSelected]);
            break;
        }

    
  
    }
   

  
 toast_pop(error,oops,errorMessage)
  {
     var tst = document.getElementById('toast-container');
         tst.classList.add('toaster-anim');                            
        this.toasterService.pop(error,oops,errorMessage);        
        setTimeout(() => {
            tst.classList.remove('toaster-anim');
          }, 3000);
  }

  ngOnInit()
  {
    this.sub = this.route.params.subscribe(params => {
      let id = params['id'];
      this.envSelected = params['env'];
      this.fetchService(id);
  });

    this. breadcrumbs = [
	    {
	      'name' : this.service['name'],
	      'link' : 'services/' + this.service['id']
	    },
	    {
	      'name' : this.envSelected,
	      'link' : ''
	    }
    ];
    
  }

}
