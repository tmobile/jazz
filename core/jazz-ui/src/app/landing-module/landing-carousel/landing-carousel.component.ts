import {AfterViewInit, Component, OnInit, ViewChild, ViewChildren} from '@angular/core';
import {LandingService} from "../landing.service";
import * as _ from "lodash";
@Component({
  selector: 'landing-carousel',
  templateUrl: './landing-carousel.component.html',
  styleUrls: ['./landing-carousel.component.scss']
})
export class LandingCarouselComponent implements OnInit {
  @ViewChildren('card') cards;
  public carouselItems;
  public translateDistance = 0;
  public cardWidth;

  constructor(private landingService: LandingService) { }

  ngOnInit() {
    this.landingService.getCarouselData()
      .then((data) => {
          this.carouselItems = data;
      })
  }

  scrollLeft() {
    let width = this.cards.first.nativeElement.getBoundingClientRect().width;
    let lastCard = this.carouselItems[this.carouselItems.length - 1];
    this.translateDistance += width;
  }

  scrollRight() {
    let width = this.cards.first.nativeElement.getBoundingClientRect().width;
    this.translateDistance += width;
  }



}
