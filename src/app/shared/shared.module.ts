// src/app/shared/shared.module.ts
import { NgModule } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { NgxEchartsModule } from 'ngx-echarts';
// ✅ Removed all ng-icons imports

@NgModule({
  imports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NgxEchartsModule
    // ✅ Removed NgIconsModule completely
  ],
  exports: [
    CommonModule,
    FormsModule,
    HttpClientModule,
    NgxEchartsModule
    
  ]
})
export class SharedModule {}
