import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private loginStatus = new BehaviorSubject<boolean>(false);

  constructor() { }
  
  loginStatus$ = this.loginStatus.asObservable();

  // 로그인 상태 관리
  setLoginStatus(status: boolean) {
    this.loginStatus.next(status);
  }

  logout() {
    // 로컬 스토리지에서 토큰 제거
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('instanceId');
    
    // 로그인 상태를 false로 설정
    this.setLoginStatus(false);
  }
}
