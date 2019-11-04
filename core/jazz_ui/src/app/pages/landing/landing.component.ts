import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthenticationService } from '../../core/services/index';
import { ToasterService } from 'angular2-toaster';
import { DataCacheService } from '../../core/services/index';
import { environment } from './../../../environments/environment';

import { environment as env_internal } from './../../../environments/environment.internal';


@Component({
    selector: 'landing',
    templateUrl: 'landing.component.html',
    styleUrls: ['landing.component.scss']
})

export class LandingComponent implements OnInit {

    buttonText: string = 'GET STARTED NOW';
    serverless_slack:string = env_internal.urls.serverless_slack;

    goToLogin: boolean = false;
    safeTransformX: number=0;
    min: boolean=true;
    max: boolean=false;
    json:any;
    cardActive:boolean=true;
    title = 'Create. Manage. Self-Service.';
    subtitle = 'Our API Services system allows you to seamlessly create, deploy, and manage all you API needs.';
    override = false;
    private IDLE_TIMEOUT = 60*10; //seconds

    public getStartedNow(){

        if(this.authenticationservice.isLoggedIn()){
            this.router.navigateByUrl('/services');
        } else {
            this.goToLogin = true;
            this.onLoginClicked(true);
        }

    }
    public onLoginClicked (goToLogin) {
        this.goToLogin = goToLogin;
        this.closed = false;
    }
    closed:boolean=true;
    public closeSidebar (eve){
        this.goToLogin = false;
        this.closed = true;
    }
    privacyPolicy:string = env_internal.urls.privacyPolicy;
    jazz_int_docs:string = env_internal.urls.docs;
    onNavigate(event){
        if(event.target.innerText === "Privacy"){
            window.open(this.privacyPolicy);
        } else if(event.target.innerText === "Docs"){
            window.open(this.jazz_int_docs);

        }
    }
    public shiftLeft(){
        var visibleWindow = document.getElementById('scroll-me').offsetLeft;
        var width = document.getElementById('scrollable-cards').offsetWidth;
        var noOfChildren = document.getElementById('scroll-me').children.length;
        var innerwidth = document.getElementById("first-card").offsetWidth+3;
        this.min=false;
        if(noOfChildren>0){
            if(document.body.clientWidth>840 && noOfChildren>4){
                if(this.safeTransformX>=(-(noOfChildren-5)*innerwidth)){
                    this.safeTransformX = this.safeTransformX - innerwidth;
                    if(this.safeTransformX==(-(noOfChildren-4)*innerwidth)){
                        this.max=true;
                    }
                }
            } else if(document.body.clientWidth<840){
                if(this.safeTransformX>(-(noOfChildren-1)*innerwidth)){
                    this.safeTransformX = this.safeTransformX - innerwidth;
                    if(this.safeTransformX==(-(noOfChildren-1)*innerwidth)){
                        this.max=true;
                    }
                }
            }
        }else{
            this.max=true;
        }
    }
     public shiftRight(){
        var visibleWindow = document.getElementById('scroll-me').offsetLeft;
        var width = document.getElementById('scrollable-cards').offsetWidth;
        var noOfChildren = document.getElementById('scroll-me').children.length;
        var innerwidth = document.getElementById("first-card").offsetWidth+3;
        this.max=false;
        if(noOfChildren>0){
            if(this.safeTransformX!=0){
                this.min=false;
                this.safeTransformX = this.safeTransformX + innerwidth;
                if(this.safeTransformX==0){
                    this.min=true;
                }
            }
        } else{
            this.min=true;
        }
    }

    constructor(
        private route: ActivatedRoute,
        private router: Router,
        private authenticationservice:AuthenticationService,
        private toasterservice:ToasterService,
        private cache: DataCacheService
    ) {

    };
    isOSS:boolean=false
    ngOnInit() {
      if(environment.envName == "oss") this.isOSS = true;
        if(this.authenticationservice.isLoggedIn()){
            this.buttonText ='GO TO SERVICES' ;
        } else{
            this.buttonText = "GET STARTED NOW";
        }
         if(this.authenticationservice.isLoggedIn() && this.router.url == "/"){
            this.router.navigateByUrl('/services');
        }

        var scroll_flag = this.cache.get('scroll_flag');
        var scroll_id = this.cache.get('scroll_id');

        var x = this.cache.get('json');
        this.json = JSON.stringify(x);

        if(scroll_flag == true)
        {
            var top = document.getElementById(scroll_id).offsetTop ;
            scrollTo(top,600);
        }
        setTimeout(function(){
            try{
              const ref = document.getElementById("head-text");
              if (ref) ref.className += " no-padding";
            } catch(e){
                console.log(e)
            }

        },700)

         this.run(4000, 4);
    };
    reportEmail:string;

    sendmail(){
        window.open('mailto:'+this.reportEmail+'?body='+this.json);
    }

    public run(interval, frames) {
        var int = 2;

        function func() {
            var el = document.getElementsByClassName("parallax-2");
            if (el[0] !== undefined) {
                el[0].id = "bg"+int;
                int++;
                if(int === frames) { int = 1; }
            }
        }

        var swap = window.setInterval(func, interval);
    }
}

export function scrollTo(to, duration) {
    var el = document.getElementsByTagName("main")[0];
    if (el.scrollTop == to) return;
    let direction = true;
    if(el.scrollTop > to)
        direction = false;

  let start = el.scrollTop;
  let diff = to - start;
  let scrollStep = Math.PI / (duration / 10);
  let count = 0, currPos = start;


  let scrollInterval = setInterval(function(){

    if (el.scrollTop !== to) {
      let prevVal = diff * (0.5 - 0.5 * Math.cos(count * scrollStep));
      count = count + 1;
      let val = diff * (0.5 - 0.5 * Math.cos(count * scrollStep));
      if((direction && (val - prevVal) < 0) || (!direction && (val - prevVal) > 0))
      {
        el.scrollTop = to;
        clearInterval(scrollInterval);
      }
      else {
        currPos = start + diff * (0.5 - 0.5 * Math.cos(count * scrollStep));
        el.scrollTop = currPos;
      }

    } else{
      clearInterval(scrollInterval);
    }
  },10);
};
