import { Component, OnInit, Input } from '@angular/core';
declare var $:any;


@Component({
  selector: 'env-deployments-section',
  templateUrl: './env-deployments-section.component.html',
  styleUrls: ['./env-deployments-section.component.scss']
})
export class EnvDeploymentsSectionComponent implements OnInit {
  @Input() service: any = {};
  rowclick:boolean = false;
  rot_icon:boolean = true;
  rot_icon2:boolean = true;
  constructor() { }
  move_right:boolean=false;
  move_left:boolean = false;
  show_icon:boolean = true;
  hide_both:boolean = false;
  stageObj:any = [
    {
      stageNum: 'STAGE 1:',
      stage:'Pre-Build Validation',
      progress:'100%',
      status:'Complete'
    },
    {
      stageNum: 'STAGE 2:',
      stage:'Deployment to Dev Env',
      progress:'80%',
      status:'1min 33s' 
    },
    {
      stageNum: 'STAGE 3:',
      stage:'Deployment to Dev Env',
      progress:'10%',
      status:'2min 03s'
    },
  //   },
    {
      stageNum: 'STAGE 4:',
      stage:'Deployment to Dev Env',
      progress:'22%',
      status:'5min 41s'
    },  
    {
    stageNum: 'STAGE 5:',
    stage:'Deployment to Dev Env',
    progress:'22%',
    status:'5min 41s'
    }
  ];

  tableHeader2 = [
    {
      label: 'Name',
      key: 'name',
      sort: true      
    },
    {
      label: 'Commit Details',
      key: 'commitDetails',
      sort: true     
    },
    {
      label: 'Id',
      key: 'id',
      sort: true     
    },
    {
      label: 'Time',
      key: 'time',
      sort: true     
    },
    {
      label: 'Status',
      key: 'status',
      sort: true     
    },
    {
      label:"",
      key:"",
      sort: false

    }
    
  ];

  move(dir)
  {
    if(dir=='right')
    {
      this.move_right=true;
      this.move_left=false;
      this.show_icon=false;
    }
    else
      {
        
      this.move_right=false;
      this.move_left=true;
      this.show_icon=true;
      }
  }

  deployedList:any = [
    {
      name:'Sample Deployment',
      commitDetails:'9909-23-1234',
      id:'9909-23-1234',
      time:'10-10-17,11:59:59',
      status:'Failed'
    },
    {
      name:'Sample Deployment',
      commitDetails:'9909-23-1234',
      id:'9909-23-1234',
      time:'10-10-17,11:59:59',
      status:'Failed'
    },
    {
      name:'Sample Deployment',
      commitDetails:'9909-23-1234',
      id:'9909-23-1234',
      time:'10-10-17,11:59:59',
      status:'Failed'
    },
    {
      name:'Test Deployment',
      commitDetails:'9909-23-1234',
      id:'9909-23-1234',
      time:'10-10-17,11:59:59',
      status:'Deployed'
    },
    {
      name:'Test Deployment',
      commitDetails:'9909-23-1234',
      id:'9909-23-1234',
      time:'10-10-17,11:59:59',
      status:'Deployed'
    },
    {
      name:'Test Deployment',
      commitDetails:'9909-23-1234',
      id:'9909-23-1234',
      time:'10-10-17,11:59:59',
      status:'Deployed'
    },
    {
      name:'Test Deployment',
      commitDetails:'9909-23-1234',
      id:'9909-23-1234',
      time:'10-10-17,11:59:59',
      status:'Deployed'
    },
    {
      name:'Test Deployment',
      commitDetails:'9909-23-1234',
      id:'9909-23-1234',
      time:'10-10-17,11:59:59',
      status:'Deployed'
    },
    {
      name:'Test Deployment',
      commitDetails:'9909-23-1234',
      id:'9909-23-1234',
      time:'10-10-17,11:59:59',
      status:'Deployed'
    },
    {
      name:'Test Deployment',
      commitDetails:'9909-23-1234',
      id:'9909-23-1234',
      time:'10-10-17,11:59:59',
      status:'Deployed'
    }
    
  ];
  

  widgetExpand()
  {
    if(this.rot_icon == true) 
    {
      this.rot_icon = false;
      this.hide_both = true;
      $("#slide-cover").slideUp();

    }
    else{
      this.rot_icon = true;
      $("#slide-cover").slideDown();
      setTimeout(() => {
        this.hide_both = false;
      }, 400);
      
    } 
   
  }

  tableExpand()
  {
    if(this.rot_icon2 == true) this.rot_icon2 = false;
    else this.rot_icon2 = true;
    $("#slid-table").slideToggle();
  }



  onRowClicked()
  {
    this.rowclick=true;
  }

  ngOnInit() {
    
  }


}