import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { TmobileTableComponent } from './tmobile-table.component';

describe('TmobileTableComponent', () => {
  let component: TmobileTableComponent;
  let fixture: ComponentFixture<TmobileTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ TmobileTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(TmobileTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
