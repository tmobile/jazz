import {
  AfterViewChecked,
  AfterViewInit,
  Component,
  EventEmitter,
  Input,
  OnChanges,
  OnInit, Output,
  ViewChild
} from '@angular/core';
import {UtilsService} from "../core/services/utils.service";

@Component({
  selector: 'metrics-carousel',
  templateUrl: './metrics-carousel.component.html',
  styleUrls: ['./metrics-carousel.component.scss']
})
export class MetricsCarouselComponent implements OnInit {
  @Input() metrics;
  private _selected;
  @Output() selectedChange = new EventEmitter();
  @Input()
  set selected(value) {
      this._selected = value;
      this. selectedChange.emit(this._selected);
  }
  get selected() {
      return this._selected;
  }

  @ViewChild('metricCards') metricCards;
  public metricCardsScroller;
  @ViewChild('metricCardsScroller') set _metricCardsScroller(input) {
    this.metricCardsScroller = input;
    if (this.metricCards && this.metricCardsScroller) {
      setTimeout(() => {
        this.metricCardsOversized = this.metricCardsScroller.nativeElement.scrollWidth >
          this.metricCards.nativeElement.getBoundingClientRect().width;
      });
    }
  };
  public metricCardsOversized;
  public metricCardOffset = 0;


  constructor(public utils: UtilsService) {
  }

  ngOnInit() {}

  selectCard(metric) {
    this.selected = metric;
  }

  offsetLeft() {
    if (this.metricCardsScroller.nativeElement.getBoundingClientRect().right > this.metricCards.nativeElement.getBoundingClientRect().right) {
      this.metricCardOffset -= 1;
    }
  }

  offsetRight() {
    if (this.metricCardOffset < 0) {
      this.metricCardOffset += 1;
    }
  }

}
