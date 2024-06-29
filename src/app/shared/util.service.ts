import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonDialogComponent } from '../common-dialog/common-dialog.component';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  private baseUrl = '/api'; // 실제 API 서버 URL로 변경해주세요
  private intanceId = '';

  constructor(
    private dialog: MatDialog
  ) {}

  private handleError(response: Response, showPopup: boolean): never {
    const error = {
      status: response.status,
      statusText: response.statusText,
      message: 'An error occurred while processing the request.',
    };

    if (showPopup) {
      this.dialog.open(CommonDialogComponent, {
        data: {
          title: 'Error',
          message: `Error: ${response.status} ${response.statusText}`
        }
      });
    }

    throw error;
  }

  private async handleResponse<T>(response: Response, showPopup: boolean): Promise<T> {
    if (!response.ok) {
      this.handleError(response, showPopup);
    }
    const responseData = await response.json();
    if (responseData.desc !== 'success' && showPopup) {
      this.dialog.open(CommonDialogComponent, {
        data: {
          title: 'Error',
          message: `Error: ${responseData.desc}`
        }
      });
      throw new Error(responseData.desc);
    }
    return responseData as T;
  }

  private async fetchWithToken<T>(url: string, options: RequestInit, useToken: boolean, showPopup: boolean): Promise<T> {
    const headers = new Headers(options.headers || {});
    let retry = false; // Retry 플래그 초기화
  
    if (useToken) {
      let token = this.getAccessToken();
  
      if (token) {
        headers.append('Authorization', `Bearer ${token}`);
      } else {
        // 토큰이 없으면 예외 처리
        throw new Error('No access token available');
      }
  
      options.headers = headers;
  
      while (true) {
        let response = await fetch(url, options);
        let responseData;
  
        // Check if the response is in JSON format
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.indexOf('application/json') !== -1) {
          responseData = await response.json();
        } else {
          responseData = await response.text();
        }
  
        // Check if the token is invalid
        if (responseData.desc === 'invalid token' && responseData.code === 2 && !retry) {
          try {
            await this.refreshAccessToken();
            token = this.getAccessToken();
            if (token) {
              headers.set('Authorization', `Bearer ${token}`);
              options.headers = headers;
              retry = true; // 재발급 시도 후 플래그 설정
              continue; // Retry the request with the new token
            } else {
              this.logout();
              throw new Error('Failed to refresh access token');
            }
          } catch (error) {
            this.logout();
            throw new Error('Token refresh failed');
          }
        }
  
        if (!response.ok) {
          this.handleError(response, showPopup);
        }
        if (responseData.desc !== 'success' && showPopup) {
          this.dialog.open(CommonDialogComponent, {
            data: {
              title: 'Error',
              message: `Error: ${responseData.desc}`
            }
          });
          throw new Error(responseData.desc);
        }
        return responseData as T;
      }
    }
  
    const response = await fetch(url, options);
    const contentType = response.headers.get('content-type');
    let responseData;
    if (contentType && contentType.indexOf('application/json') !== -1) {
      responseData = await response.json();
    } else {
      responseData = await response.text();
    }
  
    if (!response.ok) {
      this.handleError(response, showPopup);
    }
    if (responseData.desc !== 'success' && showPopup) {
      this.dialog.open(CommonDialogComponent, {
        data: {
          title: 'Error',
          message: `Error: ${responseData.desc}`
        }
      });
      throw new Error(responseData.desc);
    }
    return responseData as T;
  }  
  
  async get<T>(endpoint: string, useToken: boolean = true, showPopup: boolean = true): Promise<T> {
    try {
      const response = await this.fetchWithToken<T>(`${this.baseUrl}/${endpoint}`, { method: 'GET' }, useToken, showPopup);
      return response;
    } catch (error) {
      console.error('GET request failed:', error);
      throw error;
    }
  }

  async request<T>(method: string, endpoint: string, data?: any, useToken: boolean = true, showPopup: boolean = true): Promise<T> {
    const options: RequestInit = {
      method,
      headers: {
        'Content-Type': 'application/json',
      },
    };

    if (data) {
      options.body = JSON.stringify(data);
    }

    try {
      const response = await this.fetchWithToken<T>(`${this.baseUrl}/${endpoint}`, options, useToken, showPopup);
      return response;
    } catch (error) {
      console.error(`${method} request failed:`, error);
      throw error;
    }
  }

  // authService
  private async refreshAccessToken(): Promise<void> {
    const refreshToken = this.getRefreshToken();
  
    if (!refreshToken) {
      this.logout();
      throw new Error('No refresh token available');
    }
  
    const body = { refreshToken: refreshToken };
  
    const data: any = await this.request('POST', 'users/extend', body, false, false);
  
    if (data.desc === 'success') {
      localStorage.setItem('accessToken', data.data.access);
    } else {
      this.logout();
      throw new Error('Refresh token expired');
    }
  }
  

  // 로그인
  async login(email: string, password: string) {
    const body = {
      'email': email,
      'password': password
    }

    const data:any = await this.request('POST', 'users/login', body, false, false);

    if(data.desc === 'success') {
      localStorage.setItem('accessToken', JSON.stringify(data.data.access));
      localStorage.setItem('refreshToken', JSON.stringify(data.data.refresh));

      this.instanceList();

      return data;
    } else {
      return '';
    }
  }

  // 로그아웃
  async logout() {
    const body = {
      operation: 'logout'
    }

    const data:any = await this.request('POST', 'users/logout', body, true, true);

    if(data.desc === 'success') {
      localStorage.removeItem('accessToken');
      localStorage.removeItem('refreshToken');

      return true;
    } else {
      return false;
    }
  }

  // 회원가입
  async signIn(email:string, password: string) {
    const body = {
      'email': email,
      'password': password
    }

    const data:any = await this.request('POST', 'users/register', body, false);

    return data;
  }

  async checkMe() {
    const data:any = await this.get('users/me', true, true);
  }

  getAccessToken(): string | null {
    const token = localStorage.getItem('accessToken');
    return token ? JSON.parse(token) : null;
  }

  getRefreshToken(): string | null {
    const token = localStorage.getItem('refreshToken');
    return token ? JSON.parse(token) : null;
  }

  isAuthenticated(): boolean {
    return !!this.getAccessToken();
  }

  // BOT instance
  async instanceList() {
    const body = {
      operation: 'list',
      target: 'instance',
      intance_id: ''
    }

    const data:any = await this.request('POST', 'instances/list', body, true, false);

    if(data.desc === 'success') {
      
    }
  }

  async instanceRead() {
    const body = {
      operation: 'read',
      target: 'instance',
      intance_id: ''
    }

    const data:any = await this.request('POST', 'instances/read', body, true, false);
  }

  async instancePost() {
    const body = {
      operation: 'post',
      target: 'instance',
      intance_id: '',
      payload: {},
      name: '',
      data: ''
    }

    const data:any = await this.request('POST', 'instances/post', body, true, false);
  }

  async instanceOperation(operation:string) {
    const body = {
      operation: operation,
      target: 'instance',
      intance_id: '',
      payload: {}
    }

    const data:any = await this.request('POST', 'instances/operation', body, true, false);
  }
}
