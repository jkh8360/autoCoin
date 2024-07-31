import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

export interface ToastMessage {
  message: string;
  type: 'success' | 'error' | 'info';
  duration?: number;
}

@Injectable({
  providedIn: 'root'
})
export class ToastService {
  private toastSubject = new Subject<ToastMessage>();
  toast$ = this.toastSubject.asObservable();

  showToast(message: string, type: 'success' | 'error' | 'info' = 'info', duration: number = 3000) {
    this.toastSubject.next({ message, type, duration });
  }

  showSuccess(message: string, duration: number = 2000) {
    this.showToast(message, 'success', duration);
  }

  showError(message: string, duration: number = 2000) {
    this.showToast(message, 'error', duration);
  }

  showInfo(message: string, duration: number = 2000) {
    this.showToast(message, 'info', duration);
  }
}