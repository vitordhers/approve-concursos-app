import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerableQuestionComponent } from './answerable-question.component';

describe('AnswerableQuestionComponent', () => {
  let component: AnswerableQuestionComponent;
  let fixture: ComponentFixture<AnswerableQuestionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [AnswerableQuestionComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(AnswerableQuestionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
