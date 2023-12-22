import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BoardSelectorComponent } from './board-selector.component';

describe('BoardSelectorComponent', () => {
  let component: BoardSelectorComponent;
  let fixture: ComponentFixture<BoardSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BoardSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BoardSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
