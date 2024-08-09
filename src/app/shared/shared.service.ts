import { Injectable } from '@angular/core';
import { UtilService } from './util.service';
import { TranslateService } from '@ngx-translate/core';
import { BehaviorSubject, Subject } from 'rxjs';
import { ToastService } from '../toast/toast.service';

@Injectable({
  providedIn: 'root'
})
export class SharedService {
  private languageSubject = new Subject<string>();
  language$ = this.languageSubject.asObservable();
  private currentLang = 'en';
  private supportedLanguages = [
    { code: 'en', name: 'English' },
    { code: 'zh', name: '中文 (简体)' },
    { code: 'ko', name: '한국어' },
    { code: 'ja', name: '日本語' }
  ];

  private profileUpdatedSource = new BehaviorSubject<boolean>(false);
  profileUpdated$ = this.profileUpdatedSource.asObservable();

  constructor(
    private utilService: UtilService,
    private translate: TranslateService,
    private toastService: ToastService
  ) { 
    this.detectBrowserLanguage();
  }

  // 텔레그램 정보 세팅
  async loadTelegramSetting() {
    const data: any = await this.utilService.get('users/getuserinfo', true, false);

    if(data.desc === 'success') {

      return data;
    }
  }

  detectBrowserLanguage() {
    let browserLang = navigator.language || (navigator as any).browserLanguage;
    browserLang = browserLang.split('-')[0];

    const supportedLang = this.supportedLanguages.find(lang => lang.code === browserLang);

    if (supportedLang) {
      this.setLanguage(supportedLang.code, true);
    } else {
      this.setLanguage('en', true);
    }
  }

  setLanguage(langCode: string, startYn?: boolean) {
    this.translate.use(langCode);
    this.languageSubject.next(langCode);
    this.currentLang = langCode;
    
    if(!startYn) {
      setTimeout(() => {
        this.toastService.showInfo(this.translate.instant('TOAST.OK_CHANGE_LANGUAGE'));
      }, 200);
    }
  }

  getCurrentLang() {
    return this.currentLang;
  }

  getSupportedLanguages() {
    return this.supportedLanguages;
  }

  updateProfile() {
    this.profileUpdatedSource.next(true);
  }
}
