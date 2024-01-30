import { ComponentFixture, TestBed } from '@angular/core/testing';

import { OverlayMessageComponent } from './overlay-message.component';

describe('OverlayMessageComponent', () => {
  let component: OverlayMessageComponent;
  let fixture: ComponentFixture<OverlayMessageComponent>;

  beforeEach(() => {
    TestBed.configureTestingModule({
      declarations: [OverlayMessageComponent]
    });
    fixture = TestBed.createComponent(OverlayMessageComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
