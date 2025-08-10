import { ComponentFixture, TestBed } from '@angular/core/testing';

import { EntriesAddComponentComponent } from './entries-add.component';

describe('EntriesAddComponentComponent', () => {
  let component: EntriesAddComponentComponent;
  let fixture: ComponentFixture<EntriesAddComponentComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [EntriesAddComponentComponent]
    })
    .compileComponents();
    
    fixture = TestBed.createComponent(EntriesAddComponentComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});
