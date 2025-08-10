import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateMonthlySalaryComponent } from './create-monthly-salary.component';

describe('CreateMonthlySalaryComponent', () => {
  let component: CreateMonthlySalaryComponent;
  let fixture: ComponentFixture<CreateMonthlySalaryComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateMonthlySalaryComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(CreateMonthlySalaryComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
