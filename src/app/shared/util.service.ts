import { Injectable, Injector } from '@angular/core';
import { MatDialog } from '@angular/material/dialog';
import { CommonDialogComponent } from '../common-dialog/common-dialog.component';
import { BehaviorSubject } from 'rxjs';
import { AuthService } from './auth/auth.service';
import { HttpClient } from '@angular/common/http';

@Injectable({
  providedIn: 'root'
})
export class UtilService {
  private baseUrl = '/api'; // 실제 API 서버 URL로 변경해주세요
  private authService: AuthService | null = null;
  private loggedOutSubject = new BehaviorSubject<boolean>(false);
  private publicKey: Promise<CryptoKey>;

  constructor(
    private dialog: MatDialog,
    private injector: Injector,
    private http: HttpClient
  ) {
    this.publicKey = this.loadPublicKey();
  }

  loggedOut$ = this.loggedOutSubject.asObservable();

  private getAuthService(): AuthService {
    if (!this.authService) {
      this.authService = this.injector.get(AuthService);
    }
    return this.authService;
  }

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
          message: `An error occurred while processing the request.`
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
      'password': await this.encryptRSA(password)
    }

    const data:any = await this.request('POST', 'users/login', body, false, false);

    if(data.desc === 'success') {
      localStorage.setItem('accessToken', JSON.stringify(data.data.access));
      localStorage.setItem('refreshToken', JSON.stringify(data.data.refresh));

      this.instanceList();

      // 로그인 상태 업데이트
      this.getAuthService().setLoginStatus(true);

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
      this.getAuthService().logout();

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
        this.getAuthService().logout();
        return true;
      } else {
        this.getAuthService().logout();
        return false;
      }
    } else {
      this.getAuthService().logout();
      return false;
    }
  }

  // 회원가입
  async signIn(email:string, password: string) {
    const body = {
      'email': email,
      'password': await this.encryptRSA(password)
    }

    const data:any = await this.request('POST', 'users/register', body, false);

    if(data) {
      return data;
    } else {
      return '';
    }

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
    localStorage.removeItem('file');
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
        localStorage.setItem('botStatus', data.data.contexts[0].status);
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

    if(data.desc === 'file downloaded') {
      localStorage.setItem('file', data.data.data);
    }
  }

  async instancePost(dir: any) {
    const instance = localStorage.getItem('instanceId');

    const body = {
      operation: 'post',
      target: 'instance',
      instance_id: instance,
      payload: {
        name: 'v1',
        data: dir
      },
    }

    const data:any = await this.request('POST', 'instances/post', body, true, false);

    if(data.desc === 'file uploaded') {
      return data;
    } else {
      return '';
    }
  }

  async instanceOperation(type: string, apiKey?: string, apiPassword?: string, apiPassphrase?: string, ApiProvider?: string, symbol?: string) {
    const instance = localStorage.getItem('instanceId');

    let body = {};

    if(apiKey && apiPassword && apiPassphrase && ApiProvider) {
      body = {
        operation: type,
        target: 'instance',
        instance_id: instance,
        payload: {
          credentials: {
            key: await this.encryptRSA(apiKey),
            passphrase: await this.encryptRSA(apiPassphrase),
            secret: await this.encryptRSA(apiPassword),
            symbol: symbol,           // 임시
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

  /**
   * 공개키 암호화
   * public_key.pem
   */
  private async loadPublicKey(): Promise<CryptoKey> {
    // .pem 파일에서 공개키 내용을 읽어옵니다.
    const pemContent = await this.http.get('assets/public_key.pem', { responseType: 'text' }).toPromise();
    return this.importPublicKey(pemContent);
  }

  private async importPublicKey(pemContent: string): Promise<CryptoKey> {
    const pemHeader = "-----BEGIN PUBLIC KEY-----";
    const pemFooter = "-----END PUBLIC KEY-----";
    const pemContents = pemContent.substring(
      pemContent.indexOf(pemHeader) + pemHeader.length,
      pemContent.indexOf(pemFooter)
    ).replace(/\s/g, '');
    
    const binaryDer = Uint8Array.from(atob(pemContents), c => c.charCodeAt(0));

    return await crypto.subtle.importKey(
      "spki",
      binaryDer,
      {
        name: "RSA-OAEP",
        hash: "SHA-256",
      },
      true,
      ["encrypt"]
    );
  }

  async encryptRSA(plaintext: string): Promise<string> {
    const encodedText = new TextEncoder().encode(plaintext);
    const key = await this.publicKey;
    const encryptedData = await crypto.subtle.encrypt(
      {
        name: "RSA-OAEP"
      },
      key,
      encodedText
    );

    // 3. base64 인코드 (base64encode)
    const uintArray = new Uint8Array(encryptedData);
    const numberArray = Array.from(uintArray);  // Uint8Array를 일반 배열로 변환
    const base64Encoded = btoa(String.fromCharCode.apply(null, numberArray));

    console.log(base64Encoded);
    
    // 4. decode() 하여 string화
    return base64Encoded;
  }

  private decodeBase64ToString(base64Encoded: string): string {
    return atob(base64Encoded);
  }

  // 선택적: Base64로 다시 인코딩하는 메서드 (서버로 전송 시 필요할 수 있음)
  encodeToBase64(decodedString: string): string {
    return btoa(decodedString);
  }
}
