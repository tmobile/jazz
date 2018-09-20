import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateServiceRowComponent } from './create-service-row.component';

describe('CreateServiceRowComponent', () => {
  let component: CreateServiceRowComponent;
  let fixture: ComponentFixture<CreateServiceRowComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ CreateServiceRowComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(CreateServiceRowComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
