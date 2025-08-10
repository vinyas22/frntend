import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BillEntriesComponent } from './bill-entries.component';

describe('BillEntriesComponent', () => {
  let component: BillEntriesComponent;
  let fixture: ComponentFixture<BillEntriesComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BillEntriesComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(BillEntriesComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
