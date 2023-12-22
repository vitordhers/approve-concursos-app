import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerformanceCardsComponent } from './performance-cards.component';

describe('PerformanceCardsComponent', () => {
  let component: PerformanceCardsComponent;
  let fixture: ComponentFixture<PerformanceCardsComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerformanceCardsComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(PerformanceCardsComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
