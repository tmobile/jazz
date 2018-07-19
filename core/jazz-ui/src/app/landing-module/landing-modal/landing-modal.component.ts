import { Component, OnInit } from '@angular/core';

@Component({
  selector: 'landing-modal',
  templateUrl: './landing-modal.component.html',
  styleUrls: ['./landing-modal.component.scss']
})
export class LandingModalComponent implements OnInit {
  public modalOpen = false;
  public item = null;

  constructor() { }

  ngOnInit() {
  }

  open(carouselItem) {
    this.item = carouselItem;
    this.modalOpen = true;
  }

  close() {
    this.modalOpen = false;
    this.item = null;
  }


}
