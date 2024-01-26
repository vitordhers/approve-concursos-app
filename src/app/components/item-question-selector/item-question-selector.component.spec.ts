import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ItemQuestionSelectorComponent } from './item-question-selector.component';

describe('ItemQuestionSelectorComponent', () => {
  let component: ItemQuestionSelectorComponent;
  let fixture: ComponentFixture<ItemQuestionSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [ItemQuestionSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(ItemQuestionSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
