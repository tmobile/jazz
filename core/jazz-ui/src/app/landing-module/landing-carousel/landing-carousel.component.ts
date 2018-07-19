import {AfterViewInit, Component, OnInit, ViewChild, ViewChildren} from '@angular/core';
import {LandingService} from "../landing.service";
import * as _ from "lodash";

@Component({
  selector: 'landing-carousel',
  templateUrl: './landing-carousel.component.html',
  styleUrls: ['./landing-carousel.component.scss']
})
export class LandingCarouselComponent implements OnInit, AfterViewInit {
  @ViewChild('scrollContainer') scrollContainer;
  @ViewChild('scrollFloater') scrollFloater;
  @ViewChild('modal') modal;
  public carouselItems;
  public scrollable = false;
  public translateIndex = 0;
  public maxShown;
  public cardWidth = 220;
  public cardBuffer = 5;

  constructor(private landingService: LandingService) {
  }

  ngAfterViewInit() {
    this.landingService.getCarouselData()
      .then((data) => {
        this.carouselItems = data;
        this.setShownCards();
      })
  }

  ngOnInit() {

  }

  setShownCards() {
    this.translateIndex = 0;
    let containerWidth = this.scrollContainer.nativeElement.getBoundingClientRect().width;
    this.maxShown = Math.floor(containerWidth / (this.cardWidth + 10));
    if (this.maxShown >= this.carouselItems.length) {
      this.scrollable = false;
      this.cardBuffer = 0;
    } else {
      this.scrollable = true;
      let extraSpace = containerWidth - (this.maxShown * this.cardWidth);
      this.cardBuffer = extraSpace / (2 * this.maxShown);
    }
  }

  getOffset() {
    return this.translateIndex * (this.cardWidth + (this.cardBuffer * 2)) + 'px';
  }

  scrollRight() {
    this.translateIndex -= 1;
  }

  scrollLeft() {
    this.translateIndex += 1;
  }

  canScrollRight() {
    if(!this.scrollContainer || !this.scrollFloater) return;
    let flag = this.translateIndex > (this.maxShown - this.carouselItems.length);
    return flag;
  }

  canScrollLeft() {
    if(!this.scrollContainer || !this.scrollFloater) return;
    let flag = this.translateIndex < 0;
    return flag;
  }
}
