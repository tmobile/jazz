import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { DaterangePickerComponent } from './daterange-picker.component';

describe('DaterangePickerComponent', () => {
  let component: DaterangePickerComponent;
  let fixture: ComponentFixture<DaterangePickerComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ DaterangePickerComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(DaterangePickerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
