import { Injectable } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonDialogComponent } from '../common-dialog/common-dialog.component';
import { BehaviorSubject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  private baseUrl = '/api'; // 실제 API 서버 URL로 변경해주세요
  private loggedOutSubject = new BehaviorSubject<boolean>(false);

  constructor(
    private dialog: MatDialog
  ) {}

  loggedOut$ = this.loggedOutSubject.asObservable();

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
        if ((responseData.desc === 'invalid token' && responseData.code === 2 && !retry)
          || (response.status === 500 && !retry)) {
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
        if ((responseData.desc !== 'success' && responseData.desc !== 'logout') && showPopup) {
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

    const headers = new Headers({
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${refreshToken}`
    });
  
    try {
      const data: any = await this.fetchWithToken<any>(`${this.baseUrl}/users/extend`, {
        method: 'GET',
        headers: headers
      }, false, false);
  
      if (data && data.desc === 'success') {
        localStorage.setItem('accessToken', JSON.stringify(data.data.access));
      } else {
        throw new Error('Invalid response from server');
      }
    } catch (error) {
      this.logoutWithoutServer();
      if (error instanceof Error) {
        throw new Error(`Failed to refresh token: ${error.message}`);
      } else {
        throw new Error('Failed to refresh token: Unknown error');
      }
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

    let data: any = await this.fetchWithToken<any>(`${this.baseUrl}/users/logout`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(body)
    }, true, false);

    if(data.desc === 'logout') {
      this.clearTokens();
      return true;
    } else if (data.desc === 'invalid data' && data.code === 6) {
      // Refresh the access token and retry logout
      await this.refreshAccessToken();
        data = await this.fetchWithToken<any>(`${this.baseUrl}/users/logout`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(body)
        }, true, false);

      if (data.desc === 'logout') {
        this.clearTokens();
        return true;
      } else {
        return false;
      }
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

   // 서버로 로그아웃 요청 없이 로컬에서 로그아웃 처리
   private logoutWithoutServer() {
    this.clearTokens();
    this.loggedOutSubject.next(false); // 로그아웃 상태로 설정
  }

  // 로컬 스토리지에서 토큰을 삭제
  clearTokens() {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('instanceId');
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
  async instanceCreate() {
    const body = {
      operation: 'create',
      target: 'instance',
      instance_id: ''
    }

    const data: any = await this.request('POST', 'instances/create', body, true, false);

    if(data.data.instance_id) {
      localStorage.setItem('instanceId', data.instance_id);
    } 
  }

  async instanceList() {
    const body = {
      operation: 'list',
      target: 'instance',
      instance_id: ''
    }

    const data:any = await this.request('POST', 'instances/list', body, true, false);

    if(data.data.length === 0) {
      this.instanceCreate();
    } else {
      if(data.data.contexts[0].instance_id !== '') {
        localStorage.setItem('instanceId', data.data.contexts[0].instance_id);
      }
    }

    this.instanceRead();
  }

  async instanceRead() {
    const instance = localStorage.getItem('instanceId');

    const body = {
      operation: 'read',
      target: 'instance',
      instance_id: instance
    }

    const data:any = await this.request('POST', 'instances/read', body, true, false);
  }

  async instancePost(payload: any) {
    const instance = localStorage.getItem('instanceId');
    const postData = this.postSetData(payload);

    const body = {
      operation: 'post',
      target: 'instance',
      instance_id: instance,
      payload: {
        name: 'v1',
        data: postData
      },
    }

    const data:any = await this.request('POST', 'instances/post', body, true, false);


  }

  async instanceOperation(type: string, apiKey?: string, apiPassword?: string, apiPassphase?: string, ApiProvider?: string) {
    const instance = localStorage.getItem('instanceId');

    let body = {};

    if(apiKey && apiPassword && apiPassphase && ApiProvider) {
      body = {
        operation: type,
        target: 'instance',
        instance_id: instance,
        payload: {
          credentials: {
            key: apiKey,
            passphase: apiPassphase,
            secret: apiPassword,
            symbol: 'usdt',           // 임시
            provider: ApiProvider
          },
          parameter: {}
        }
      }
    } else {
      body = {
        operation: type,
        target: 'instance',
        instance_id: instance,
        payload: {}
      }
    }


    const data:any = await this.request('POST', 'instances/operation', body, true, false);

    if(data.desc === 'success') {
      return data;
    } else {
      return '';
    }
  }

  postSetData(data: {}) {
    // JSON을 문자열로 변환
    const jsonString = JSON.stringify(data);

    // UTF-8로 인코딩 및 Base64로 인코딩
    const base64Encoded = btoa(unescape(encodeURIComponent(jsonString)));

    // 결과 출력
    console.log(base64Encoded);

    return base64Encoded;
  }
}
