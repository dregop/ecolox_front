import { TestBed } from '@angular/core/testing';

import { GraphService } from './shopping.service';

describe('GraphService', () => {
  let service: GraphService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(GraphService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});
