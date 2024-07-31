import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';
import { ThemeService } from '../shared/theme.service';
import { UtilService } from '../shared/util.service';
import { SharedService } from '../shared/shared.service';
import { Subscription } from 'rxjs';
import { ToastService } from '../toast/toast.service';

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
    private toastService: ToastService
  ) {}
  private logoutSubscription!: Subscription;
  isLoggedOut: boolean = false;

  // 팝업 관련
  showTelegramSet: boolean = false;
  showLangSet: boolean = false;
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
  profileImages = Array(14).fill(0).map((_, i) => i + 1);

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

  // 텔레그램 설정
  teleId: string = '';
  chatId: string = '';
  alarmJoinYn: boolean = false;
  alarmExitYn: boolean = false;
  teleBotYn: boolean = false;
  errSaveTele: boolean = false;

  ngOnInit(): void {
    this.logoutSubscription = this.utilService.loggedOut$.subscribe(loggedOut => {
      this.isLoggedOut = loggedOut;
      if (this.isLoggedOut) {
        this.loginYn = loggedOut;
      }
    });

    // this.currentTheme = this.themeService.getTheme();
    // this.themeService.applyTheme(this.currentTheme);

    let save = localStorage.getItem('saveID');

    this.loginEmail = !save ? '' : save;
    this.saveIdCheck = !save ? false : true;

    this.loginYn = this.utilService.isAuthenticated();
  }

  ngOnDestroy(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

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
  openTelegramSet() {
    this.showTelegramSet = true;

    this.closeDropdown();
  }

  // 언어 변경
  changeLng() {
    if(this.showLangSet) {
      this.showLangSet = false;
    } else {
      this.showLangSet = true;
    }

    // this.closeDropdown();
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
  }

  // 텔레그램 설정
  async saveTelegram() {
    const body = {
      teleid: this.teleId,
      chatid: this.chatId,
      isRemote: this.teleBotYn ? 1 : 0,
      profile_id: '',
      nickname: ''
    }

    const data: any = await this.utilService.request('POST', 'users/updateinfo', body, false, false);

    if(data.desc === 'success') {
      this.showTelegramSet = false;

      this.errSaveTele = false;

      this.toastService.showInfo('텔레그램 정보가 저장되었습니다.');
    } else {
      this.errSaveTele = true;

      this.toastService.showError('저장에 실패했습니다.');
    }
  }

  // 프로필 저장
  async saveProfile() {
    const body = {
      profile_id: this.selectedProfileIndex,
      nickname: '',
      teleid: '',
      chatid: ''
    }

    const data: any = await this.utilService.request('POST', 'users/updateinfo', body, false, false);

    if(data.desc === 'success') {
      this.changeProfile = false;

      this.toastService.showInfo('저장되었습니다.');
    } else {
      this.toastService.showError('저장에 실패했습니다.');
    }
  }

  selectImage(index: number) {
    this.selectedProfileIndex = index;
  }

  openLogin() {
    this.showLogin = true;
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
    const data:any = await this.utilService.login(this.loginEmail, this.loginPassword);

    if(data) {
      this.loginYn = true;
      this.showLogin = false;

      const teleData = await this.sharedService.loadTelegramSetting();

      this.teleId = teleData.teleid;
      this.chatId = teleData.chatid;
      this.teleBotYn = teleData.isRemote === 1 ? true : false;
      this.selectedProfileIndex = teleData.profile_id;
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

      this.toastService.showInfo('탈퇴되었습니다.');
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
      password: this.changePwCheck,
      profile: ''
    }

    const data:any = await this.utilService.request('POST', 'users/reset_post', body, false, false);

    if(data.desc === 'success') {
      this.showPassword = false;

      this.changePwEmail = '';
      this.changePw = '';
      this.changePwCheck = '';

      this.toastService.showError('비밀번호 변경에 성공했습니다.');
    } else {
      this.toastService.showError('비밀번호 변경에 실패했습니다.');
    }
  }

  isChangePassword(): boolean {
    return Boolean(this.certifyYn) && 
          Boolean(this.changePwEmail) && 
          Boolean(this.changePw) && 
          Boolean(this.changePwCheck) && 
          Boolean(this.passwordValidChange) && 
          Boolean(this.passwordCheckValidChange);
  }
}
