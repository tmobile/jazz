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
  @Input() options = {
    nameProperty: 'name',
    listProperty: 'values',
    valueProperty: 'value',
  };

  private _selected;
  @Output() selectedChange = new EventEmitter();
  @Input()
  set selected(object) {
      let i = this.metrics.findIndex((metric) => {
        return object[this.options.nameProperty] === metric[this.options.nameProperty];
      });
      this.index = i;
      this._selected = object;
      this. selectedChange.emit(this._selected);
  }
  get selected() {
      return this._selected;
  }
  private _index;
  @Output() indexChange = new EventEmitter();
  @Input()
  set index(value) {
      this._index = value;
      this. indexChange.emit(this._index);
  }
  get index() {
      return this._index;
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
  public metricCardSize = 135 + 12;
  public metricCardOffset = 0;


  constructor(public utils: UtilsService) {
  }

  ngOnInit() {

  }

  selectCard(metric) {
    this.selected = metric;
  }

  getRecentValue(metric) {
    if(!metric[this.options.listProperty].length) return;
    return metric[this.options.listProperty].slice(-1).pop()[this.options.valueProperty];
  }

  metricName(metric) {
    return this.utils.hyphenToSpace(metric[this.options.nameProperty])
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
