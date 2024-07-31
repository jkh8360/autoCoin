import { Component, OnInit, OnDestroy } from '@angular/core';
import { Subscription } from 'rxjs';
import { ToastService, ToastMessage } from './toast.service';

@Component({
  selector: 'app-toast',
  template: `
    <div *ngIf="toast" class="toast-container" [ngClass]="toast.type">
      {{ toast.message }}
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      bottom: 20px;
      left: 50%;
      transform: translateX(-50%);
      padding: 10px 20px;
      border-radius: 5px;
      z-index: 1000;
      color: white;
    }
    .success { background-color: #4CAF50; }
    .error { background-color: #F44336; }
    .info { background-color: #6572E6; }
  `]
})
export class ToastComponent implements OnInit, OnDestroy {
  toast: ToastMessage | null = null;
  private subscription: Subscription | undefined;

  constructor(private toastService: ToastService) {}

  ngOnInit() {
    this.subscription = this.toastService.toast$.subscribe(toast => {
      this.toast = toast;
      setTimeout(() => this.toast = null, toast.duration || 3000);
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }
}