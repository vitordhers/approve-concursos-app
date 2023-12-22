import { ComponentFixture, TestBed } from '@angular/core/testing';

import { InstitutionSelectorComponent } from './institution-selector.component';

describe('InstitutionSelectorComponent', () => {
  let component: InstitutionSelectorComponent;
  let fixture: ComponentFixture<InstitutionSelectorComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [InstitutionSelectorComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(InstitutionSelectorComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
