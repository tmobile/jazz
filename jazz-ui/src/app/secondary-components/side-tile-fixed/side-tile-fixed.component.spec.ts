import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { SideTileFixedComponent } from './side-tile-fixed.component';

describe('SideTileFixedComponent', () => {
  let component: SideTileFixedComponent;
  let fixture: ComponentFixture<SideTileFixedComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ SideTileFixedComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(SideTileFixedComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
