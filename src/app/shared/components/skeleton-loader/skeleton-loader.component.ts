import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-skeleton-loader',
  standalone: true,
  imports: [CommonModule],
  template: `
    @if (type === 'stat') {
      <div class="bg-white rounded-2xl p-6 border border-gray-100 shadow-sm animate-pulse">
        <div class="flex items-center justify-between mb-4">
          <div class="w-12 h-12 bg-gray-200 rounded-xl"></div>
          <div class="w-16 h-5 bg-gray-200 rounded-full"></div>
        </div>
        <div class="w-24 h-4 bg-gray-200 rounded mb-2"></div>
        <div class="w-32 h-8 bg-gray-300 rounded"></div>
      </div>
    } @else if (type === 'card') {
      <div class="bg-white rounded-2xl border border-gray-100 shadow-sm overflow-hidden animate-pulse">
        <div class="w-full h-44 bg-gray-200"></div>
        <div class="p-5 space-y-3">
          <div class="flex justify-between items-center">
            <div class="w-36 h-6 bg-gray-300 rounded"></div>
            <div class="w-16 h-6 bg-gray-200 rounded-full"></div>
          </div>
          <div class="w-48 h-4 bg-gray-200 rounded"></div>
          <div class="pt-3 border-t border-gray-100 flex justify-between">
            <div class="w-20 h-4 bg-gray-200 rounded"></div>
            <div class="w-24 h-4 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    } @else if (type === 'table-row') {
      <div class="p-4 border-b border-gray-100 flex items-center justify-between gap-4 animate-pulse">
        <div class="flex items-center gap-3 flex-1">
          <div class="w-10 h-10 rounded-full bg-gray-200"></div>
          <div class="space-y-1.5 flex-1">
            <div class="w-1/3 h-4 bg-gray-300 rounded"></div>
            <div class="w-1/4 h-3 bg-gray-200 rounded"></div>
          </div>
        </div>
        <div class="w-20 h-6 bg-gray-200 rounded-full"></div>
        <div class="w-24 h-5 bg-gray-200 rounded"></div>
      </div>
    } @else {
      <!-- Default generic block skeleton -->
      <div class="w-full bg-gray-200 rounded-xl animate-pulse" [ngStyle]="{ height: height || '120px' }"></div>
    }
  `
})
export class SkeletonLoaderComponent {
  @Input() type: 'card' | 'stat' | 'table-row' | 'generic' = 'card';
  @Input() height?: string;
}
