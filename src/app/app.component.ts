import { Component } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.css']
})
export class AppComponent {
  title = 'autoCoin';
  selectedTab: string = 'auto';

  constructor(private translate: TranslateService) {
    let browserLang = navigator.language || (navigator as any).browserLanguage;
    browserLang = browserLang.split('-')[0]; // 'en-US'와 같은 형식에서 'en'만 추출

    const supportedLang = ['en', 'ko', 'ja', 'zh'].find(lang => lang === browserLang);
    if(supportedLang) {
      translate.setDefaultLang(supportedLang);
      translate.use(supportedLang);
    } else {
      translate.setDefaultLang('en');
      translate.use('en');
    }
  }
}
