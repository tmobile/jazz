import { Component, Input, OnInit } from '@angular/core';
import { Router, ActivatedRoute } from '@angular/router';


@Component({
    selector: 'landing',
    templateUrl: 'landing.component.html',
    styleUrls: ['landing.component.scss']
})

export class LandingComponent implements OnInit {

    buttonText: string = 'GET STARTED NOW';
    goToLogin: boolean = false;
    safeTransformX: number=0;
    min: boolean=true;
    max: boolean=false;
    cardActive:boolean=true;
    title = 'Create. Manage. Self-Service.';
    subtitle = 'Our API Services system allows you to seamlessly create, deploy, and manage all you API needs.';

    features = [
        {
            'title' : 'Create',
            'description' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit, dolore magna aliqua.',
            'imageSrc' : 'assets/images/icons/icon-create.png'
        }, {
            'title' : 'Deploy',
            'description' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit,',
            'imageSrc' : 'assets/images/icons/icon-deploy.png'
        }, {
            'title' : 'Manage',
            'description' : 'Lorem ipsum dolor sit amet, consectetur adipiscing elit.',
            'imageSrc' : 'assets/images/icons/icon-manage.png'
        }
      ];
        
    public getStartedNow(){
        this.router.navigateByUrl('/services');
    }
    public onLoginClicked (goToLogin) {
        this.goToLogin = goToLogin;
    }
    public closeSidebar (eve){
        this.goToLogin = false;
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
        private router: Router
    ) {
        
    };
    ngOnInit() {
        setTimeout(function(){
            document.getElementById("head-text").className += " no-padding";
        },700)

         this.run(4000, 4); 
        
    };

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

    
//     $('.multi-item-carousel').carousel({
//   interval: false
// });
// $('.multi-item-carousel .item').each(function(){
//   var next = $(this).next();
//   if (!next.length) {
//     next = $(this).siblings(':first');
//   }
//   next.children(':first-child').clone().appendTo($(this));
  
//   if (next.next().length>0) {
//     next.next().children(':first-child').clone().appendTo($(this));
//   } else {
//   	$(this).siblings(':first').children(':first-child').clone().appendTo($(this));
//   }
// });



    
}
