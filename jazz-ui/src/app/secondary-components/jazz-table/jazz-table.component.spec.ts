import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { JazzTableComponent } from './jazz-table.component';

describe('JazzTableComponent', () => {
  let component: JazzTableComponent;
  let fixture: ComponentFixture<JazzTableComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ JazzTableComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(JazzTableComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
