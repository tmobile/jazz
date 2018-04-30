import { TestBed, inject } from '@angular/core/testing';

import { AdvancedFilterService } from './advanced-filter.service';

describe('AdvancedFilterService', () => {
  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [AdvancedFilterService]
    });
  });

  it('should be created', inject([AdvancedFilterService], (service: AdvancedFilterService) => {
    expect(service).toBeTruthy();
  }));
});
