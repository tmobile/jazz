import { TestBed, inject } from '@angular/core/testing';

import { AdminUtilsService } from './admin-utils.service';

describe('AdminUtilsService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdminUtilsService]
    });
  });

  it('should be created', inject([AdminUtilsService], (service: AdminUtilsService) => {
    expect(service).toBeTruthy();
  }));
});
