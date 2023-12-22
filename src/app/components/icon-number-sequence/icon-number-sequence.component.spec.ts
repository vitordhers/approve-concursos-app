import { ComponentFixture, TestBed } from '@angular/core/testing';

import { IconNumberSequenceComponent } from './icon-number-sequence.component';

describe('IconNumberSequenceComponent', () => {
  let component: IconNumberSequenceComponent;
  let fixture: ComponentFixture<IconNumberSequenceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [IconNumberSequenceComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(IconNumberSequenceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
