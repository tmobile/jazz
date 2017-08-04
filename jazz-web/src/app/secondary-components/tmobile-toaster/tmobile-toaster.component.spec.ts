import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TmobileToasterComponent } from './tmobile-toaster.component';

describe('TmobileToasterComponent', () => {
  let component: TmobileToasterComponent;
  let fixture: ComponentFixture<TmobileToasterComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TmobileToasterComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TmobileToasterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should be created', () => {
    expect(component).toBeTruthy();
  });
});
