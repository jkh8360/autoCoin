import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { UtilService } from '../shared/util.service';
import { SharedService } from '../shared/shared.service';
import { LayoutsComponent } from '../layouts/layouts.component';
import { ToastService } from '../toast/toast.service';
import { AuthService } from '../shared/auth/auth.service';
import { Subscription } from 'rxjs';
import { TranslateService } from '@ngx-translate/core';

interface AppNotification {
  message: string;
  date: string;
  details: string;
}
interface IndicatorOption {
  value: string;
  label: string;
  comparisonOptions: string[];
  inputs: {name: string; defaultValue: string}[];
  showConstant: boolean;
}

// 비교 옵션을 영어 키워드로 매핑하는 객체
const comparisonOptionMapping: { [key: string]: string } = {
  '상단 상향 돌파': 'surpassed_upper_line',
  '상단 하향 돌파': 'surpassed_lower_line',
  '하단 상향 돌파': 'dropped_upper_line',
  '하단 하향 돌파': 'dropped_lower_line',
  '시그널 상향 돌파': 'surpassed_signal',
  '시그널 하향 돌파': 'dropped_signal',
  '상수보다 클 때': 'constant_high',
  '상수보다 작을 때': 'constant_low',
  '현재가가 높을 때': 'current_high',
  '현재가가 작을 때': 'current_low',
  '%K가 상수보다 클 때': 'k_high',
  '%K가 상수보다 작을 때': 'k_low',
  '%K 하향 교차': 'cross_k_high',
  '%K 상향 교차': 'cross_k_low',
  '롱 시그널': 'long_signal',
  '숏 시그널': 'short_signal',
  '해당 비율 상향 돌파': 'surpassed_ratio',
  '해당 비율 하향 돌파': 'dropped_ratio'
};

// 비교 옵션을 영어 키워드로 변환하는 함수
function mapComparisonOption(option: string): string {
  return comparisonOptionMapping[option] || option;
}

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements AfterViewInit {
  @ViewChildren('slideBox') slideBox?: QueryList<ElementRef>;
  @ViewChild(LayoutsComponent) layoutsComponent!: LayoutsComponent;
  @ViewChildren('textInput1, textInput2, textInput3') inputs!: QueryList<ElementRef>;

  selectedTab: string = 'auto';
  isMobileView: boolean = false;
  isHovered: boolean = false;
  autoHoverd: boolean = false;
  defaultHoverd: boolean = false;
  operateHoverd: boolean = false;

  // 각 설정의 슬라이드 상태를 저장할 배열
  open: { isOpen: boolean }[] = [
    {isOpen: true},
    {isOpen: false},
    {isOpen: false},
    {isOpen: false},
    {isOpen: false}
  ]; 

  // 롱, 숏 설정 추가
  longSettings: any[] = [];
  shortSettings: any[] = [];

  // 지표 1, 2
  indicatorOptions: IndicatorOption[] = [];

  selectedIndicator1: IndicatorOption | undefined;
  selectedIndicator2: IndicatorOption | undefined;

  // 기본 설정
  isPosition: boolean = false;
  candleConst: number = 0.1;
  candleType = ['last', 'start', 'high', 'low'];
  longCandleType: string = 'last';
  shortCandleType: string = 'last';
  candleTimeType = ['1m', '3m', '5m', '15m', '30m', '1h', '4h', '1d'];
  candleInterval: string = '1m';
  tradeSymbol: string = 'usdt';
  botOperation: string = 'open';
  onConstant1: number = 20;
  onConstant2: number = 20;

  indicator1UserInputs: { [key: string]: string } = {};
  indicator2UserInputs: { [key: string]: string } = {};

  // 팝업 ON/OFF
  noticeIn: boolean = false;
  showApiSet: boolean = false;
  toUsePopup: boolean = false;
  
  // 봇 실행 (+ API 설정값)
  botPlay: boolean = false;
  ApiKey: string = '';
  ApiPassword: string = '';
  ApiPassphase: string = '';
  ApiProvider: string = 'Bitget';

  // 공지사항
  notifications: AppNotification[] = [];
  currentPage: number = 1;
  totalPages: number = 5;
  
  showDetail: boolean = false;
  selectedNotification:AppNotification | null = null;

  // 텔레그램
  teleId: string = '';
  teleBotYn: boolean = false;

  // 인스턴스
  instanceId: string = '';

  // 로그인
  loginYn: boolean = false;
  isLoggedOut: boolean = false;

  // 번역
  COM: any;
  AUTO: any;
  DEFAULT: any;
  USE: any;
  API: any;
  TELEGRAM: any;
  MEMBER: any;
  TOAST: any;

  private loginSubscription?: Subscription;
  private logoutSubscription!: Subscription;

  constructor(
    private utilService: UtilService,
    private sharedService: SharedService,
    private toastService: ToastService,
    private authService: AuthService,
    private translate: TranslateService
  ) {
    this.addLongSetting();
    this.addShortSetting();
    this.checkScreenSize();
  }

  @HostListener('window:resize', ['$event'])
  onResize(event: any) {
    this.checkScreenSize();
  }

  async ngOnInit() {
    this.loadNotifications(); // 공지사항 로딩
    this.setTelegramData();   // 텔레그램 세팅
    this.checkScreenSize();   // 스크린 사이즈 체크
    this.transLanguage();     // 번역

    console.log(JSON.stringify(this.selectedIndicator1));

    // 로그인 구독 관리
    this.loginSubscription = this.authService.loginStatus$.subscribe(
      status => {
        this.loginYn = status;
      }
    );

    this.loginYn = this.utilService.isAuthenticated();
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

    setTimeout(() => {
      this.initializeIndicatorOptions();
    }, 300);
  }

  private initializeIndicatorOptions() {
    // 지표 1, 2
    this.indicatorOptions = [
      { value: 'BollingerBands',       label: 'Bollinger Bands',       comparisonOptions: [this.AUTO.SURPASSED_UPPER_LINE, this.AUTO.DROPPED_BELOW_UPPER_LINE, '하단 상향 돌파', '하단 하향 돌파'], 
        inputs: [{name: this.AUTO.PERIOD, defaultValue: '20'}, {name: this.AUTO.STANDARD_DEVIATION, defaultValue: '2'}], showConstant: false  },
      { value: 'EMA',                  label: 'EMA',                   comparisonOptions: ['현재가가 높을 때', '현재가가 낮을 때'], 
        inputs: [{name: this.AUTO.PERIOD, defaultValue: '30'}], showConstant: false },
      { value: 'FibonacciRetracement', label: 'Fibonacci Retracement', comparisonOptions: ['해당 비율 상향 돌파', '해당 비율 하향 돌파'], 
        inputs: [{name: this.AUTO.PERIOD, defaultValue: '50'}, {name: this.AUTO.RETRACEMENT, defaultValue: '0.618'}], showConstant: false  },
      { value: 'HMA',                  label: 'HMA',                   comparisonOptions: ['현재가가 높을 때', '현재가가 낮을 때'], 
        inputs: [{name: this.AUTO.PERIOD, defaultValue: '50'}], showConstant: false  },
      { value: 'KeltnerChannels',      label: 'Keltner Channels',      comparisonOptions: [this.AUTO.SURPASSED_UPPER_LINE, this.AUTO.DROPPED_BELOW_UPPER_LINE, '하단 상향 돌파', '하단 하향 돌파'], 
        inputs: [{name: this.AUTO.PERIOD, defaultValue: '20'}, {name: this.AUTO.STANDARD_DEVIATION, defaultValue: '2'}, {name: this.AUTO.ATR_LENGTH, defaultValue: '10'}], showConstant: false },
      { value: 'MA',                   label: 'MA',                    comparisonOptions: ['현재가가 높을 때', '현재가가 낮을 때'], 
        inputs: [{name: this.AUTO.PERIOD, defaultValue: '30'}], showConstant: false  },
      { value: 'MACD',                 label: 'MACD',                  comparisonOptions: ['시그널 상향 돌파', '시그널 하향 돌파'], 
        inputs: [{name: '단기 이평', defaultValue: '12'}, {name: '장기 이평', defaultValue: '26'}, {name: '시그널', defaultValue: '9'}], showConstant: false },
      { value: 'MFI',                  label: 'MFI',                   comparisonOptions: ['상수보다 클 때', '상수보다 작을 때'], 
        inputs: [{name: this.AUTO.PERIOD, defaultValue: '14'}], showConstant: true },
      { value: 'ParabolicSAR',         label: 'Parabolic SAR',         comparisonOptions: ['현재가가 높을 때', '현재가가 낮을 때'], 
        inputs: [{name: this.AUTO.INITIAL_ACCELERATION, defaultValue: '0.02'}, {name: this.AUTO.INCREMENT, defaultValue: '0.02'}, {name: '최대 가속요소', defaultValue: '0.2'}], showConstant: false },
      { value: 'RSI',                  label: 'RSI',                   comparisonOptions: ['상수보다 클 때', '상수보다 작을 때'], 
        inputs: [{name: this.AUTO.PERIOD, defaultValue: '14'}], showConstant: true  },
      { value: 'SMA',                  label: 'SMA',                   comparisonOptions: ['현재가가 높을 때', '현재가가 낮을 때'], 
        inputs: [{name: this.AUTO.PERIOD, defaultValue: '30'}], showConstant: false },
      { value: 'SMMA',                 label: 'SMMA',                  comparisonOptions: ['현재가가 높을 때', '현재가가 낮을 때'], 
        inputs: [{name: this.AUTO.PERIOD, defaultValue: '7'}], showConstant: false },
      { value: 'Stochastic',           label: 'Stochastic',            comparisonOptions: ['%K가 상수보다 클 때', '%K가 상수보다 작을 때', '%K 하향 교차', '%K 상향 교차'], 
        inputs: [{name: this.AUTO.PERIOD+'(%K)', defaultValue: '5'}, {name: this.AUTO.PERIOD+'(%D)', defaultValue: '3'}, {name: '스무딩(%K)', defaultValue: '3'}], showConstant: true  },
      { value: 'StochasticRSI',        label: 'Stochastic RSI',        comparisonOptions: [''], 
        inputs: [{name: this.AUTO.PERIOD+'(%K)', defaultValue: '5'}, {name: this.AUTO.PERIOD+'(%D)', defaultValue: '3'}, {name: 'RSI 기간', defaultValue: '14'}, {name: '스토캐스틱 기간', defaultValue: '14'}], showConstant: false },
      { value: 'Supertrend',           label: 'Supertrend',            comparisonOptions: [this.AUTO.LONG_SIGNAL, this.AUTO.SHORT_SIGNAL], 
        inputs: [{name: this.AUTO.PERIOD, defaultValue: '7'}, {name: this.AUTO.STANDARD_DEVIATION, defaultValue: '3'}], showConstant: false  }
    ];
    
    this.selectedIndicator1 = this.indicatorOptions[0];
    this.selectedIndicator2 = this.indicatorOptions[0];
  }

  ngAfterViewInit(): void {
    this.layoutsComponent.tabSelected.subscribe(tab => {
      this.selectedTab = tab;
    });
    this.layoutsComponent.noticeYn.subscribe(open => {
      this.noticeIn = open;
    });
    this.layoutsComponent.toUsePopup.subscribe(open => {
      this.toUsePopup = open;
    });

    this.preventCopyAndDrag();
  }

  ngOnDestroy(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');

    if (this.loginSubscription) {
      this.loginSubscription.unsubscribe();
    }
  }
  
  toggleSlide(index: number, duration: number = 200) {
    const open = this.open[index];
    open.isOpen = !open.isOpen;
    const slideBoxElement = this.slideBox?.toArray()[index].nativeElement;
  
    if (open.isOpen) {
      slideBoxElement.style.display = 'block';
      slideBoxElement.style.opacity = '0';
      slideBoxElement.style.height = '0';
      slideBoxElement.style.transition = `opacity ${duration}ms ease-in-out, height ${duration}ms ease-in-out`;
  
      setTimeout(() => {
        slideBoxElement.style.opacity = '1';
        slideBoxElement.style.height = `${slideBoxElement.scrollHeight}px`;
        setTimeout(() => {
          slideBoxElement.style.height = 'auto';
        }, duration);
      }, 0);
    } else {
      slideBoxElement.style.height = `${slideBoxElement.clientHeight}px`;
      slideBoxElement.style.transition = `opacity ${duration}ms ease-in-out, height ${duration}ms ease-in-out`;
  
      setTimeout(() => {
        slideBoxElement.style.opacity = '0';
        slideBoxElement.style.height = '0';
        setTimeout(() => {
          slideBoxElement.style.display = 'none';
        }, duration);
      }, 0);
    }
  }

  copyText(element: HTMLSpanElement) {
    const text = element.textContent;
    if (text) {
      navigator.clipboard.writeText(text).then(() => {
      }).catch(err => {
        console.error('복사 중 오류가 발생했습니다:', err);
      });
    }
  }

  onInput(event: Event, indicatorNumber?: number, inputIndex?: number) {
    const input = event.target as HTMLInputElement;
    if(input) {
      // 숫자와 소수점만 허용
      input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
      if (indicatorNumber !== undefined && inputIndex !== undefined) {
        // 정제된 값을 저장
        this.saveIndicatorInput(indicatorNumber, inputIndex, input.value);
      }
    }
  }

  saveIndicatorInput(indicatorNumber: number, inputIndex: number, value: string) {
    const key = `arg${inputIndex + 1}`;
    if (indicatorNumber === 1) {
      this.indicator1UserInputs[key] = value;
    } else if (indicatorNumber === 2) {
      this.indicator2UserInputs[key] = value;
    }
  }

  onConstantInput(event: Event, indicatorNumber: number) {
    const input = event.target as HTMLInputElement;
    if (input) {
      // 숫자와 소수점만 허용
      input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
      
      // 정제된 값을 저장 (여기서는 콘솔에 출력만 하고 있습니다. 실제로는 적절한 저장 로직을 구현해야 합니다.)
      console.log(`Indicator ${indicatorNumber} constant value: ${input.value}`);
    }
  }

  addLongSetting() {
    // 새로운 롱 설정 객체를 생성하여 배열에 추가
    this.longSettings.push({});
    this.open.push({ isOpen: false });
  }

  addShortSetting() {
    // 새로운 숏 설정 객체를 생성하여 배열에 추가
    this.shortSettings.push({});
    this.open.push({ isOpen: false });
  }

  // 텔레그램 바로가기
  linkToTelegram() {
    window.open('https://telegram.org/', '_blank');
  }

  // 팝업 닫기
  closePopup() {
    this.noticeIn = false;
    this.showDetail = false;

    this.showApiSet = false;
    this.toUsePopup = false;
  }

  // 봇 동작
  operateBot() {  
    if(this.botPlay) {
      this.botPlay = false;
      // 봇 정지
      this.utilService.instanceOperation('halt');
    } else {
      // 봇 실행
      this.showApiSet = true;
    }
  }

  //API 설정 저장
  async saveAPI() {
    this.showApiSet = false;
    
    const data = await this.utilService.instanceOperation('start', this.ApiKey, this.ApiPassword, this.ApiPassphase, this.ApiProvider);
    
    if(data) {
      this.botPlay = true;
      
      this.toastService.showInfo(this.TOAST.OK_OPERATE_BOT);
    } else {
      this.toastService.showError(this.TOAST.FAIL_OPERATE_BOT);
    }
  }

  // 공지사항 받아오기
  loadNotifications(): void {
    // this.notificationService.getNotifications(this.currentPage).subscribe(data => {
    //   this.notifications = data.notifications;
    //   this.totalPages = data.totalPages;
    // });

    const exampleData: AppNotification[] = [
      { message: '알림기능 사용 일시정지 안내', date: '04. 18.', details: 'abbbbbbbb1' },
      { message: '알림기능 사용 일시정지 안내', date: '04. 18.', details: 'abbbbbbbb2' },
      { message: '알림기능 사용 일시정지 안내', date: '04. 18.', details: 'abbbbbbbb3' },
      { message: '알림기능 사용 일시정지 안내', date: '04. 18.', details: 'abbbbbbbb4' },
      { message: '알림기능 사용 일시정지 안내', date: '04. 18.', details: 'abbbbbbbb5' },
      { message: '알림기능 사용 일시정지 안내', date: '04. 18.', details: 'abbbbbbbb6' },
      { message: '알림기능 사용 일시정지 안내', date: '04. 18.', details: 'abbbbbbbb7' },
      { message: '알림기능 사용 일시정지 안내', date: '04. 18.', details: 'abbbbbbbb8' }
    ];

    this.notifications = exampleData;
    this.totalPages = 5;
  }

  // 공지사항 페이지 변경
  changePage(page: number): void {
    this.currentPage = page;
    this.loadNotifications();
  }

  // 공지 상세 뒤로가기
  closeDetailPopup() {
    this.showDetail = false;
  }

  // 공지 상세 보기
  showNotificationDetails(notification:any) {
    this.selectedNotification = notification;
    this.showDetail = true;
  }

  // 공지 상세 이전
  showPreviousNotification() {
    if (this.selectedNotification) {
      const currentIndex = this.notifications.indexOf(this.selectedNotification);
      if (currentIndex > 0) {
        this.selectedNotification = this.notifications[currentIndex - 1];
      }
    }
  }

  // 공지 상세 다음
  showNextNotification() {
    if (this.selectedNotification) {
      const currentIndex = this.notifications.indexOf(this.selectedNotification);
      if (currentIndex < this.notifications.length - 1) {
        this.selectedNotification = this.notifications[currentIndex + 1];
      }
    }
  }

  // 텔레그램 정보
  async setTelegramData() {
    const data = await this.sharedService.loadTelegramSetting();
    const botConn = await this.utilService.instanceOperation('report');

    if(data) {
      this.teleId = data.teleid;
      this.teleBotYn = data.isRemote === 1 ? true : false;
      if(botConn) {
        this.teleBotYn;
      }
    }
  }

  // 스크린 사이즈
  checkScreenSize() {
    this.isMobileView = window.innerWidth <= 1100; // 모바일 기준 너비 설정
    
  }

  // 탭 스타일 체크
  checkTabStyle() {
    if(this.isMobileView) {
      return { 'margin-top': '10px' };
    } else {
      return { 'margin-top': '' };
    }
  }

  // 로그인 체크
  checkLogin(event: Event) {
    if(!this.loginYn) {
      event.preventDefault();
      event.stopPropagation();

      this.toastService.showInfo(this.TOAST.NEED_LOGIN);
    }
  }

  checkLoginStyle() {
    return {
      'pointer-events': this.loginYn ? '' : 'none'
    };
  }

  // 저장하기
  async saveInstance() {
    // 1. 데이터 형식 구성
    let data = [
      {
        id: 0,
        output: 1,
        contents: {
          cross_close: this.isPosition,
          interval: this.candleInterval,
          quantity: this.candleConst,
          index: [
            { [this.selectedIndicator1?.value || '']: this.getIndicatorArgs(this.selectedIndicator1, this.indicator1UserInputs) },
            { [this.selectedIndicator2?.value || '']: this.getIndicatorArgs(this.selectedIndicator2, this.indicator2UserInputs) }
          ]
        }
      },
      ...this.longSettings.map((setting, index) => ({
        id: index + 1,
        output: index + 2 <= this.longSettings.length ? index + 2 : this.longSettings.length + 1,
        contents: {
          position: "long",
          candle_type: this.longCandleType,
          num_of_conds: 2,
          cond_1: this.getCondObject(this.selectedIndicator1, this.selectedIndicator2, 0),
          cond_2: this.getCondObject(this.selectedIndicator2, this.selectedIndicator1, 1),
          operation: this.botOperation
        }
      })),
      ...this.shortSettings.map((setting, index) => ({
        id: this.longSettings.length + index + 1,
        output: index + 1 < this.shortSettings.length ? this.longSettings.length + index + 2 : 0,
        contents: {
          position: "short",
          candle_type: this.shortCandleType,
          num_of_conds: 2,
          cond_1: this.getCondObject(this.selectedIndicator1, this.selectedIndicator2, 0),
          cond_2: this.getCondObject(this.selectedIndicator2, this.selectedIndicator1, 1),
          operation: this.botOperation
        }
      }))
    ];
  
    // 2. JSON 문자열로 변환
    const jsonString = JSON.stringify(data);

    console.log(jsonString);

    // 3. UTF-8로 인코딩 및 4. Base64로 인코딩
    const base64Encoded = btoa(unescape(encodeURIComponent(jsonString)));
  
    // 5. 결과 반환 또는 저장
    console.log(base64Encoded);
    // 여기서 base64Encoded 문자열을 저장하거나 필요한 곳에 사용할 수 있습니다.
    
    const postData = await this.utilService.instancePost(base64Encoded);

    if(postData) {
      this.toastService.showInfo(this.TOAST.OK_SAVE_INSTANCE);
    } else {
      this.toastService.showError(this.TOAST.FAIL_SAVE_INSTANCE);
    }
  }

  // cond_1, cond_2 를 생성
  private getCondObject(indicator: IndicatorOption | undefined, otherIndicator: IndicatorOption | undefined, index: number): any {
    if (!indicator) return {};
    
    const indicatorValue = indicator.value || '';
    const comparisonOption = indicator.comparisonOptions[0] || '';
    const mappedComparisonOption = mapComparisonOption(comparisonOption);
    
    // 두 지표의 이름이 같은 경우에만 index를 사용하고, 그렇지 않으면 항상 0 사용
    const indexToUse = indicator.value === otherIndicator?.value ? index : 0;
  
    const condObject: any = {
      operation: `${indicatorValue}.${indexToUse}.${mappedComparisonOption}`
    };
  
    if (indicator.showConstant) {
      condObject.const = index === 0 ? this.onConstant1 : this.onConstant2;
    }
  
    return condObject;
  }

  private getIndicatorArgs(indicator: IndicatorOption | undefined, userInputs: { [key: string]: string }): { [key: string]: string } {
    if (!indicator || !indicator.inputs) return {};
    
    const args: { [key: string]: string } = {};
    indicator.inputs.forEach((input, index) => {
      const key = `arg${index + 1}`;
      args[key] = userInputs[key] || input.defaultValue || '';
    });
    
    return args;
  }

  onIndicatorChange(indicatorNumber: number, event: any) {
    const selectedValue = event.target.value;
    const selectedIndicator = this.indicatorOptions.find(option => option.value === selectedValue);
    
    if (indicatorNumber === 1) {
      this.selectedIndicator1 = selectedIndicator;
    } else if (indicatorNumber === 2) {
      this.selectedIndicator2 = selectedIndicator;
    }
  }

  isIndicatorOption(indicator: IndicatorOption | undefined): indicator is IndicatorOption {
    return indicator !== undefined;
  }

  // 초기화 버튼
  defaultSettingClear() {
    this.tradeSymbol = 'usdt';
    this.candleInterval = '1m';
    this.candleConst = 0.1;

    this.toastService.showInfo(this.TOAST.OK_RESET);
  }

  onDisabledAreaClick(event: Event) {
    if (!this.loginYn) {
      event.preventDefault();
      event.stopPropagation();
      this.toastService.showInfo(this.TOAST.NEED_LOGIN);
    }
  }

  preventCopyAndDrag() {
    this.inputs.forEach(input => {
      const inputElement = input.nativeElement as HTMLInputElement;
      const events = ['copy', 'cut', 'paste', 'select', 'selectstart', 'mousedown', 'mouseup', 'mousemove', 'touchstart', 'touchend', 'touchmove', 'contextmenu'];
      
      events.forEach(eventName => {
        inputElement.addEventListener(eventName, (e: Event) => {
          e.preventDefault();
          return false;
        });
      });

      // 더블 클릭 방지
      inputElement.addEventListener('dblclick', (e: Event) => {
        e.preventDefault();
        return false;
      });
    });
  }
}
