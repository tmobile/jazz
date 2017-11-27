import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'registered',
  templateUrl: './registered.component.html',
  styleUrls: ['./registered.component.scss']
})
export class RegisteredComponent implements OnInit {

  goToLogin:boolean = false;
  closed:boolean=true;
  noLink:boolean = true;
 
  constructor() { }

  public onLoginClicked (goToLogin) {
    this.goToLogin = goToLogin;
    this.closed = false;
  }
  
  public closeSidebar (eve){
      this.goToLogin = false;
      this.closed = true;
  }
  ngOnInit() {
  }

}
