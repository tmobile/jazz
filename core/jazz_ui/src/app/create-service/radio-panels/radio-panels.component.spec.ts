import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RadioPanelsComponent } from './radio-panels.component';

describe('RadioPanelsComponent', () => {
  let component: RadioPanelsComponent;
  let fixture: ComponentFixture<RadioPanelsComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RadioPanelsComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RadioPanelsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
