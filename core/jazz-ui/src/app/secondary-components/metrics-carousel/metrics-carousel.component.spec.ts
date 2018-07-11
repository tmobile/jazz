import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { MetricsCarouselComponent } from './metrics-carousel.component';

describe('MetricsCarouselComponent', () => {
  let component: MetricsCarouselComponent;
  let fixture: ComponentFixture<MetricsCarouselComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ MetricsCarouselComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(MetricsCarouselComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
