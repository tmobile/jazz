import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { BtnPrimaryWithIconComponent } from './btn-primary-with-icon.component';

describe('BtnPrimaryWithIconComponent', () => {
  let component: BtnPrimaryWithIconComponent;
  let fixture: ComponentFixture<BtnPrimaryWithIconComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ BtnPrimaryWithIconComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(BtnPrimaryWithIconComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
