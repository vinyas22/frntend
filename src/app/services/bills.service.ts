import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../environments/environment';

@Injectable({ providedIn: 'root' })
export class BillsService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  // Bills endpoints
createMonthlySalary(payload: { title: string; total_balance: number; bill_month: string }) {
  return this.http.post(`${this.api}/bills`, payload);
}

getBills() {
  return this.http.get<any[]>(`${this.api}/bills`);
}

updateTotalBalance(billId: number, total_balance: number) {
  return this.http.put(`${this.api}/bills/${billId}`, { total_balance });
}


  // Entries endpoints
  getBillEntries(billId: number) {
    return this.http.get<any[]>(`${this.api}/entries/${billId}`);
  }

addEntryGroup(billId: number, payload: { entry_date: string; items: any[] }) {
  return this.http.post(`${this.api}/entries/${billId}`, payload);
}
getCategories() {
  return this.http.get<string[]>(`${this.api}/entries/categories`);
}
}
