import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { ChartjsLinegraphComponent } from './chartjs-linegraph.component';

describe('ChartjsLinegraphComponent', () => {
  let component: ChartjsLinegraphComponent;
  let fixture: ComponentFixture<ChartjsLinegraphComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ ChartjsLinegraphComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(ChartjsLinegraphComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
