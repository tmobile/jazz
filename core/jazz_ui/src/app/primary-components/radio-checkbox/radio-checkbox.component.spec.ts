import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { RadioCheckboxComponent } from './radio-checkbox.component';

describe('RadioCheckboxComponent', () => {
  let component: RadioCheckboxComponent;
  let fixture: ComponentFixture<RadioCheckboxComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ RadioCheckboxComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(RadioCheckboxComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
