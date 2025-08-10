import { Component, OnDestroy, OnInit } from '@angular/core';
import { LayoutService } from '../layout.service';
import { Subscription } from 'rxjs';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { HeaderComponent } from '../header/header.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule, SidebarComponent, HeaderComponent],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.scss']
})
export class DashboardComponent implements OnInit, OnDestroy {
  isCollapsed = false;
  private sidebarSub?: Subscription;

  constructor(private layoutService: LayoutService) {}

  ngOnInit() {
    this.sidebarSub = this.layoutService.sidebarCollapsed$.subscribe(
      collapsed => (this.isCollapsed = collapsed)
    );
  }
  ngOnDestroy() {
    this.sidebarSub?.unsubscribe();
  }
}
