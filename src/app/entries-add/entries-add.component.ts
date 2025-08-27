import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormArray, Validators, ReactiveFormsModule, FormGroup } from '@angular/forms';
import { BillsService } from '../services/bills.service';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-entries-add',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  styleUrls: ['./entries-add.component.scss'],
  templateUrl: './entries-add.component.html'
})
export class EntriesAddComponent implements OnInit {
  entryForm = this.fb.group({
    billId: [null, Validators.required],
    entry_date: ['', Validators.required],
    items: this.fb.array([
      this.createItemGroup()
    ])
  });

  availableCategories: string[] = [];
  categoriesLoading = false;
  categoriesError = '';
  bills: any[] = [];
  submitting = false;
  error = '';

  // Dropdown UI state for custom dropdown
  dropdownOpen = false;
  selectedBill: any = null;

  constructor(
    private fb: FormBuilder,
    private billsService: BillsService,
    private router: Router
  ) {}

  ngOnInit() {
    // Load bills
    this.billsService.getBills().subscribe(bills => {
      this.bills = bills;

      // If form has a billId initially set, sync selectedBill for UI display
      const currentBillId = this.entryForm.get('billId')?.value;
      if (currentBillId) {
        this.selectedBill = this.bills.find(b => b.id === currentBillId) || null;
      }
    });

    // Sync selectedBill whenever billId form control value changes
    this.entryForm.get('billId')?.valueChanges.subscribe(billId => {
      this.selectedBill = this.bills.find(b => b.id === billId) || null;
    });

    // Load categories
    this.categoriesLoading = true;
    this.billsService.getCategories().subscribe({
      next: (categories) => {
        this.availableCategories = categories;
        this.categoriesLoading = false;
      },
      error: () => {
        this.categoriesError = 'Could not load categories.';
        this.categoriesLoading = false;
      }
    });
  }

  get items(): FormArray {
    return this.entryForm.get('items') as FormArray;
  }

  createItemGroup(): FormGroup {
    return this.fb.group({
      category: ['', Validators.required],
      customCategory: [''],
      description: ['', Validators.required],
      amount: [0, [Validators.required, Validators.min(1)]],
      proof_url: ['']
    });
  }

  addItem() {
    this.items.push(this.createItemGroup());
  }

  removeItem(i: number) {
    if (this.items.length > 1) this.items.removeAt(i);
  }

  // Toggle custom dropdown open/close state
  toggleDropdown() {
    this.dropdownOpen = !this.dropdownOpen;
  }

  // Handler to select a bill from the dropdown
  selectBill(bill: any) {
    this.selectedBill = bill;
    this.entryForm.get('billId')?.setValue(bill.id);
    this.dropdownOpen = false;
  }

  submit() {
    const { billId, entry_date, items } = this.entryForm.value;
    const entryDate: string = entry_date ?? '';
    const safeItems: any[] = Array.isArray(items) ? items : [];

    if (!billId || !entryDate || safeItems.length === 0) {
      this.error = 'Please fill all required fields.';
      return;
    }

    // Normalize categories: use custom if "__custom__" is selected
    const preparedItems = safeItems.map((item, i) => {
      let category = item.category === '__custom__' ? (item.customCategory || '').trim() : item.category;
      if (!category) {
        this.error = `Please enter a category for entry ${i + 1}`;
      }
      return {
        ...item,
        category
      };
    });

    if (this.error) return;

    this.submitting = true;
    this.error = '';

    this.billsService.addEntryGroup(Number(billId), {
      entry_date: entryDate,
      items: preparedItems
    }).subscribe({
      next: () => {
        this.submitting = false;
        this.router.navigate(['/dashboard/bills', billId, 'entries']);
      },
      error: err => {
        this.submitting = false;
        this.error = err?.error?.error || 'Failed to add entry';
      }
    });
  }
}
