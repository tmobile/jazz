import { async, ComponentFixture, TestBed } from '@angular/core/testing';

import { EnvTryServiceSidebarComponent } from './env-try-service-sidebar.component';

describe('EnvTryServiceSidebarComponent', () => {
  let component: EnvTryServiceSidebarComponent;
  let fixture: ComponentFixture<EnvTryServiceSidebarComponent>;

  beforeEach(async(() => {
    TestBed.configureTestingModule({
      declarations: [ EnvTryServiceSidebarComponent ]
    })
    .compileComponents();
  }));

  beforeEach(() => {
    fixture = TestBed.createComponent(EnvTryServiceSidebarComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
