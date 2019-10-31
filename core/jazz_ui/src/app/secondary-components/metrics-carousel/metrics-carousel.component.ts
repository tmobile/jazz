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
import {UtilsService} from "../../core/services/utils.service";
import {RenameFieldService} from '../../core/services/rename-field.service';

@Component({
  selector: 'metrics-carousel',
  templateUrl: './metrics-carousel.component.html',
  styleUrls: ['./metrics-carousel.component.scss']
})
export class MetricsCarouselComponent implements OnInit {
  @Input() metrics;
  //nameProperty -> refers to name of each metric on this.metrics
  //listProperty -> refers to list of data points on this.metrics
  // valueProperty -> refers to the data value (y coordinate) of each datapoint in the this.metrics[listProperty]
  // footerProperty -> refers to value shown below valueProperty data
  @Input() options = {
    nameProperty: 'name',
    listProperty: 'values',
    valueProperty: 'value',
    footerProperty: null
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
    this.selectedChange.emit(this._selected);
  }

  get selected() {
    return this._selected;
  }

  private _index;
  @Output() indexChange = new EventEmitter();

  @Input()
  set index(value) {
    this._index = value;
    this.indexChange.emit(this._index);
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


  constructor(public utils: UtilsService,
    public renameFieldService: RenameFieldService) {
  }

  ngOnInit() {

  }

  selectCard(metric) {
    this.selected = metric;
  }

  getRecentValue(metric) {
    if (!metric[this.options.listProperty].length) return;
    let _metricObj = metric[this.options.listProperty].slice(-1).pop();
    let _metric = _metricObj[this.options.valueProperty.toLocaleLowerCase()] || _metricObj[this.options.valueProperty]
    if (_metric && typeof _metric === 'string') {
      return _metric;
    } else if (_metric && typeof _metric === 'number') {
      return Number(_metric.toFixed()).toLocaleString();
    }

  }

  metricName(metric) {
    return this.renameFieldService.getDisplayNameOfKey(metric[this.options.nameProperty].toLowerCase()) || metric[this.options.nameProperty];
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
