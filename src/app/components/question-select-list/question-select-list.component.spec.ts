import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuestionSelectListComponent } from './question-select-list.component';

describe('QuestionSelectListComponent', () => {
  let component: QuestionSelectListComponent;
  let fixture: ComponentFixture<QuestionSelectListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuestionSelectListComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuestionSelectListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
