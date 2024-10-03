import { Component, ElementRef, HostListener, NgZone, OnInit, ViewChild } from '@angular/core';
import { ThemeService } from '../shared/theme.service';
import { UtilService } from '../shared/util.service';
import { SharedService } from '../shared/shared.service';
import { Subscription } from 'rxjs';
import { ToastService } from '../toast/toast.service';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @ViewChild('dropMenu', { static: true }) dropMenu!: ElementRef;
  isDropdownOpen = false;
  currentTheme: 'light' | 'dark' = 'dark';

  constructor(
    private themeService: ThemeService,
    private utilService: UtilService,
    private sharedService: SharedService,
    private toastService: ToastService,
    private translate: TranslateService,
    private zone: NgZone
  ) {}
  private logoutSubscription!: Subscription;
  isLoggedOut: boolean = false;

  // 팝업 관련
  showTelegramSet: boolean = false;
  displayMode: boolean = false;
  showLogout: boolean = false;
  showMypage: boolean = false;

  loginYn: boolean = false;
  showLogin: boolean = false;
  showSignUp: boolean = false;
  showTerms: boolean = false;
  showPassword: boolean = false;

  changeProfile: boolean = false;
  unregistUser: boolean = false;

  // 로그인 관련
  loginEmail: string = '';
  loginPassword: string = '';
  loginFailed: boolean = false;
  saveIdCheck: boolean = false;
  selectedProfileIndex: number = 0;
  profileImages = Array(30).fill(0).map((_, i) => i + 1);
  savedProfileIndex: number = 0;

  // 회원가입 관련
  signEmail: string = '';
  signPassword: string = '';
  signPasswordCheck: string = '';
  emailPattern = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  passwordPattern = /^(?=.*[A-Za-z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,32}$/;

  // 비밀번호 재설정
  changePwEmail: string = '';
  changePw: string = '';
  changePwCheck: string = '';
  agreeTerms: boolean = false;
  certifyYn: boolean = false;
  sendAfterEmail: boolean = false;
  captcha: string = '';

  // 텔레그램 설정
  teleId: string = '';
  chatId: string = '';
  alarmJoinYn: boolean = false;
  alarmExitYn: boolean = false;
  teleBotYn: boolean = false;
  errSaveTele: boolean = false;

  // 언어 설정
  showLangSet = false;
  currentLang: string = '';
  supportedLanguages = this.sharedService.getSupportedLanguages();

  // 번역
  COM: any;
  AUTO: any;
  DEFAULT: any;
  USE: any;
  API: any;
  TELEGRAM: any;
  MEMBER: any;
  TOAST: any;

  async ngOnInit() {
    this.logoutSubscription = this.utilService.loggedOut$.subscribe(loggedOut => {
      this.isLoggedOut = loggedOut;
      if (this.isLoggedOut) {
        this.loginYn = loggedOut;
      }
    });

    // this.currentTheme = this.themeService.getTheme();
    // this.themeService.applyTheme(this.currentTheme);

    let save = localStorage.getItem('saveID');
    let email = localStorage.getItem('email');

    this.loginEmail = !email ? '' : email;
    this.saveIdCheck = !save ? false : true;

    this.loginYn = this.utilService.isAuthenticated();

    if(!localStorage.getItem('accessToken') && !localStorage.getItem('refreshToken')) {
      this.loginYn = false;
    } else {
      this.loginYn = true;
    }

    this.currentLang = this.sharedService.getCurrentLang();

    this.transLanguage();

    if(this.loginYn) {
      const data = await this.sharedService.loadTelegramSetting();
      
      if(data.desc === 'success') {
        this.selectedProfileIndex = data.data.profile_id;
        this.savedProfileIndex = data.data.profile_id;
      }
    }
  }

  // 번역
  transLanguage() {
    this.translate.get('COM').subscribe(res => {
      this.COM = res;
    });
    this.translate.get('AUTO').subscribe(res => {
      this.AUTO = res;
    });
    this.translate.get('DEFAULT').subscribe(res => {
      this.DEFAULT = res;
    });
    this.translate.get('USE').subscribe(res => {
      this.USE = res;
    });
    this.translate.get('API').subscribe(res => {
      this.API = res;
    });
    this.translate.get('TELEGRAM').subscribe(res => {
      this.TELEGRAM = res;
    });
    this.translate.get('MEMBER').subscribe(res => {
      this.MEMBER = res;
    });
    this.translate.get('TOAST').subscribe(res => {
      this.TOAST = res;
    });
  }

  ngOnDestroy(): void {
    this.utilService.clearTokens();

    this.loginEmail = '';
    this.loginPassword = '';

    if(this.logoutSubscription) {
      this.logoutSubscription.unsubscribe();
    }
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent) {
    if (!this.dropMenu.nativeElement.contains(event.target)) {
      this.closeDropdown();
    }
  }

  toggleDropdown(event: MouseEvent) {
    event.stopPropagation();
    this.isDropdownOpen = !this.isDropdownOpen;
    this.updateDropdownVisibility();
  }

  closeDropdown() {
    this.isDropdownOpen = false;
    this.showLangSet = false;
    this.updateDropdownVisibility();
  }

  updateDropdownVisibility() {
    if (this.isDropdownOpen) {
      this.dropMenu.nativeElement.style.display = 'block';
    } else {
      this.dropMenu.nativeElement.style.display = 'none';
    }
  }

  // 라이트/다크 모드
  toggleTheme(): void {
    this.currentTheme = this.currentTheme === 'light' ? 'dark' : 'light';
    this.themeService.setTheme(this.currentTheme);
  }

  // 텔레그램 설정
  async openTelegramSet() {
    const data = await this.sharedService.loadTelegramSetting();
    
    if(data.desc === 'success') {
      this.zone.run(() => {
        this.teleId = !data.data.teleid ? '' : data.data.teleid;
        this.chatId = !data.data.chatid ? '' : data.data.chatid;
        this.teleBotYn = data.data.is_remote === 1 ? true : false;

        setTimeout(() => {
          this.showTelegramSet = true;
        }, 200);
      });
    }

    this.closeDropdown();
  }

  setLanguage(langCode: string) {
    this.sharedService.setLanguage(langCode);
    this.currentLang = this.sharedService.getCurrentLang();

    this.closeDropdown();
    this.transLanguage();
  }

  changeLng() {
    this.showLangSet = !this.showLangSet;
  }

  // 라이트/다크 모드 전환
  displayModeChg() {
    this.displayMode = true;

    this.closeDropdown();
  }

  // 로그아웃
  async logout() {
    const data = await this.utilService.logout();

    if(data) {
      this.showLogout = true;
      this.loginYn = false;
      this.loginFailed = false;
  
      if(!this.saveIdCheck) {
        this.loginEmail = '';
  
        localStorage.removeItem('saveID');
      }
  
      this.loginPassword = '';

      this.toastService.showInfo(this.TOAST.OK_LOGOUT);
    }

    this.closeDropdown();
  }

  // 마이페이지
  openMypage() {
    this.showMypage = true;
    this.closeDropdown();
  }

  closePopup() {
    this.showTelegramSet = false;
    this.showLangSet = false;
    this.displayMode = false;
    this.showLogout = false;
    this.showMypage = false;

    this.showLogin = false;
    this.showSignUp = false;
    this.showTerms = false;
    this.showPassword = false;

    this.signEmail = '';
    this.signPassword = '';
    this.signPasswordCheck = '';
  }

  // 텔레그램 설정
  async saveTelegram() {
    const body = {
      teleid: await this.utilService.encryptRSA(this.teleId),
      chatid: this.chatId,
      is_remote: this.teleBotYn ? 1 : 0,
      profile_id: '',
      nickname: ''
    }

    const data: any = await this.utilService.request('POST', 'users/updateinfo', body, true, false);

    if(data.desc === 'check') {
      this.showTelegramSet = false;

      this.errSaveTele = false;

      this.toastService.showInfo(this.TOAST.OK_SAVE_TELEGRAM);

      this.sharedService.updateProfile();
    } else {
      this.errSaveTele = true;

      this.toastService.showError(this.TOAST.FAIL_SAVE);
    }
  }

  // 프로필 저장
  async saveProfile() {
    const body = {
      profile_id: this.selectedProfileIndex,
      nickname: '',
      teleid: await this.utilService.encryptRSA(this.teleId) || '',
      chatid: this.chatId || ''
    }

    const data: any = await this.utilService.request('POST', 'users/updateinfo', body, true, false);

    if(data.desc === 'check') {
      this.changeProfile = false;

      this.toastService.showInfo(this.TOAST.OK_SAVE);

      this.savedProfileIndex = this.selectedProfileIndex;
    } else {
      this.toastService.showError(this.TOAST.FAIL_SAVE);
    }
  }

  selectImage(index: number) {
    this.selectedProfileIndex = index;
  }

  openLogin() {
    this.showLogin = true;

    this.signEmail = '';
    this.signPassword = '';
    this.signPasswordCheck = '';
  }

  openSignUp() {
    this.showSignUp = true;
  }

  openTerms() {
    this.showTerms = true;
  }

  openPassword() {
    this.showPassword = true;
  }

  // 로그인
  async authLogin() {
    const data: any = await this.utilService.login(this.loginEmail, this.loginPassword);

    if(data) {
      this.loginYn = true;
      this.showLogin = false;

      this.toastService.showInfo(this.TOAST.OK_LOGIN);

      const teleData = await this.sharedService.loadTelegramSetting();

      if(teleData.desc === 'success') {
        this.teleId = teleData.data.teleid;
        this.chatId = teleData.data.chatid;
        this.teleBotYn = teleData.data.is_remote === 1 ? true : false;
        this.selectedProfileIndex = teleData.data.profile_id;
        this.savedProfileIndex = teleData.data.profile_id;
      }

      localStorage.setItem('email', this.loginEmail);
    } else {
      this.loginFailed = true;
    }

    if(this.saveIdCheck) {
      localStorage.setItem('saveID', this.loginEmail);
    }

    this.loginPassword = '';
  }

  // 회원가입
  async authSign() {
    this.showSignUp = false;

    const data:any = await this.utilService.signIn(this.signEmail, this.signPassword);

    if(data.desc === 'success') {
      this.toastService.showInfo(this.TOAST.OK_SIGNIN);
    } else {
      this.toastService.showError(this.TOAST.FAIL_SIGNIN);
    }
  }

  get emailValid() {
    return this.emailPattern.test(this.signEmail);
  }

  get passwordValid() {
    return this.passwordPattern.test(this.signPassword);
  }

  get passwordCheckValid() {
    return this.signPassword === this.signPasswordCheck;
  }

  get passwordValidChange() {
    return this.passwordPattern.test(this.changePw);
  }

  get passwordCheckValidChange() {
    return this.changePw === this.changePwCheck;
  }

  // 회원탈퇴
  async unRegister() {
    const body = {
      operation: 'delete'
    }

    const data:any = await this.utilService.request('DELETE', 'users/unregister', body, true, false);

    if(data.desc === 'success') {
      this.utilService.clearTokens();

      this.showLogout = true;
      this.loginYn = false;
      this.loginFailed = false;

      this.toastService.showInfo(this.TOAST.OK_UNREGISTE);
    }
  }

  // 이메일 인증
  async certifyEmail() {
    this.sendAfterEmail = false;
    const body = {
      email: this.changePwEmail
    }

    const data:any = await this.utilService.request('POST', 'users/reset_request', body, false, false);

    if(data.desc === 'success') {
      this.certifyYn = true;
    } else if (data.code === 12) {
      this.sendAfterEmail = true;
    }
  }

  // 비밀번호 변경
  async changePassword() {
    const body = {
      email: this.changePwEmail,
      password: await this.utilService.encryptRSA(this.changePwCheck),
      profile: '',
      captcha: this.captcha
    }

    const data:any = await this.utilService.request('POST', 'users/reset_post', body, false, false);

    if(data.desc === 'success') {
      this.showPassword = false;

      this.changePwEmail = '';
      this.changePw = '';
      this.changePwCheck = '';

      this.toastService.showInfo(this.TOAST.OK_PW_CHANGE);

      this.logout();
    } else {
      this.toastService.showError(this.TOAST.FAIL_PW_CHANGE);
    }
  }

  isChangePassword(): boolean {
    return Boolean(this.certifyYn) && 
          Boolean(this.changePwEmail) && 
          Boolean(this.changePw) && 
          Boolean(this.changePwCheck) && 
          Boolean(this.passwordValidChange) && 
          Boolean(this.passwordCheckValidChange) &&
          Boolean(this.captcha) && 
          this.captcha.trim() !== '';
  }

  refreshPage() {
    window.location.reload();
  }
}
