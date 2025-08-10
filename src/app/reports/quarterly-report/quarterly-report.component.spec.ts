import { ComponentFixture, TestBed } from '@angular/core/testing';

import { QuarterlyReportComponent } from './quarterly-report.component';

describe('QuarterlyReportComponent', () => {
  let component: QuarterlyReportComponent;
  let fixture: ComponentFixture<QuarterlyReportComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [QuarterlyReportComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(QuarterlyReportComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
