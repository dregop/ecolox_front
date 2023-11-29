import { TestBed } from '@angular/core/testing';

import { LineDataApiService } from './line-data-api.service';

describe('LineDataApiService', () => {
  let service: LineDataApiService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(LineDataApiService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
