import { Component, OnInit, Input } from '@angular/core';

@Component({
  selector: 'env-codequality-section',
  templateUrl: './env-codequality-section.component.html',
  styleUrls: ['./env-codequality-section.component.scss']
})
export class EnvCodequalitySectionComponent implements OnInit {
  @Input() service: any = {};
  constructor() { }


  public lineChartData:Array<any> = [
    {data: [0,0,0,20,0], label: 'Major',lineTension:0},
    {data: [0,10,10,10,0], label: 'Unresolved',lineTension:0},
    {data: [20,20,10,20,20], label: 'Fixed',lineTension:0}
    
  ];

 
  public lineChartLabels:Array<any> = ['Jan', 'Feb', 'Mar', 'Apr', 'May'];
  public lineChartOptions:any = {
    legend: {position: 'bottom'},
    scales : {
      yAxes: [{
         ticks: {
            // steps : 2,
            // stepValue : 10,
            // max : 20,
            // min : 0
          }
      }] 
    },
    responsive: false
  };
  public lineChartColors:Array<any> = [
    { //pink
      backgroundColor: 'rgba(237,0,140,0)',
      borderColor: 'rgba(237,0,140,1)',      
       pointBorderColor: 'transparent',      
    },
    { //blue
      backgroundColor: 'rgba(31,166,206,0)',
      borderColor: 'rgba(31,166,206,1)',       
       pointBorderColor: 'transparent',       
    },
    { //green
      backgroundColor: 'rgba(92,174,1,0)',
      borderColor: 'rgba(92,174,1,1)',       
       pointBorderColor: 'transparent',       
    }
  ];
  
  public lineChartLegend:boolean = true;
  public lineChartType:string = 'line';
 

  model:any = {
    qualityProfile:'JavaScript',
    sonar:'abcdefgujkl',
    lines:'480(xs)',
    files:'147',
    activities:'9'
  }
  ngOnInit() {
  }

}