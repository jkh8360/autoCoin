import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { UtilService } from '../shared/util.service';
import { SharedService } from '../shared/shared.service';
import { LayoutsComponent } from '../layouts/layouts.component';

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

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements AfterViewInit {
  @ViewChildren('slideBox') slideBox?: QueryList<ElementRef>;
  @ViewChild(LayoutsComponent) layoutsComponent!: LayoutsComponent;

  selectedTab: string = 'auto';
  isMobileView: boolean = false;
  isHovered: boolean = false;
  autoHoverd: boolean = false;
  defaultHoverd: boolean = false;

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
  indicatorOptions: IndicatorOption[] = [
    { value: 'BollingerBands',       label: 'Bollinger Bands',       comparisonOptions: ['상단 상향 돌파', '상단 하향 돌파', '하단 상향 돌파', '하단 하향 돌파'], 
      inputs: [{name: '기간', defaultValue: '20'}, {name: '표준편차', defaultValue: '2'}], showConstant: false  },
    { value: 'EMA',                  label: 'EMA',                   comparisonOptions: ['EMA 상향 돌파', 'EMA 하향 돌파'], 
      inputs: [{name: '기간', defaultValue: '30'}], showConstant: false },
    { value: 'FibonacciRetracement', label: 'Fibonacci Retracement', comparisonOptions: ['해당 비율 상향 돌파', '해당 비율 하향 돌파'], 
      inputs: [{name: '기간', defaultValue: '50'}, {name: '되돌림 비율', defaultValue: '0.618'}], showConstant: false  },
    { value: 'HMA',                  label: 'HMA',                   comparisonOptions: ['HMA 상향 돌파', 'HMA 하향 돌파'], 
      inputs: [{name: '기간', defaultValue: '50'}], showConstant: false  },
    { value: 'KeltnerChannels',      label: 'Keltner Channels',      comparisonOptions: ['캔들이 상단 위에 있을 때', '캔들이 상단 아래 있을 때', '캔들이 하단 위에 있을 때', '캔들이 하단 아래 있을 때'], 
      inputs: [{name: '기간', defaultValue: '20'}, {name: '표준편차', defaultValue: '2'}, {name: 'ATR 길이', defaultValue: '10'}], showConstant: false },
    { value: 'MA',                   label: 'MA',                    comparisonOptions: ['MA 상향 돌파', 'MA 하향 돌파'], 
      inputs: [{name: '기간', defaultValue: '30'}], showConstant: false  },
    { value: 'MACD',                 label: 'MACD',                  comparisonOptions: ['시그널 상향 돌파', '시그널 하향 돌파'], 
      inputs: [{name: '단기 이평', defaultValue: '12'}, {name: '장기 이평', defaultValue: '26'}, {name: '시그널', defaultValue: '9'}], showConstant: false },
    { value: 'MFI',                  label: 'MFI',                   comparisonOptions: ['상수보다 클 때', '상수보다 작을 때'], 
      inputs: [{name: '기간', defaultValue: '14'}], showConstant: true },
    { value: 'ParabolicSAR',         label: 'Parabolic SAR',         comparisonOptions: ['캔들 상향 돌파', '캔들 하향 돌파'], 
      inputs: [{name: '초기 가속요소', defaultValue: '0.02'}, {name: '가속 증가량', defaultValue: '0.02'}, {name: '최대 가속요소', defaultValue: '0.2'}], showConstant: false },
    { value: 'RSI',                  label: 'RSI',                   comparisonOptions: ['상수보다 클 때', '상수보다 작을 때'], 
      inputs: [{name: '기간', defaultValue: '14'}], showConstant: true  },
    { value: 'SMA',                  label: 'SMA',                   comparisonOptions: ['SMA 상향 돌파', 'SMA 하향 돌파'], 
      inputs: [{name: '기간', defaultValue: '30'}], showConstant: false },
    { value: 'SMMA',                 label: 'SMMA',                  comparisonOptions: ['캔들이 SMMA 위에 있을 때', '캔들이 SMMA 아래 있을 때'], 
      inputs: [{name: '기간', defaultValue: '7'}], showConstant: false },
    { value: 'Stochastic',           label: 'Stochastic',            comparisonOptions: ['%K가 상수보다 클 때', '%K가 상수보다 작을 때', '%K 하향 교차', '%K 상향 교차'], 
      inputs: [{name: '기간(%K)', defaultValue: '5'}, {name: '기간(%D)', defaultValue: '3'}, {name: '스무딩(%K)', defaultValue: '3'}], showConstant: true  },
    { value: 'StochasticRSI',        label: 'Stochastic RSI',        comparisonOptions: [''], 
      inputs: [{name: '기간(%K)', defaultValue: '5'}, {name: '기간(%D)', defaultValue: '3'}, {name: 'RSI 기간', defaultValue: '14'}, {name: '스토캐스틱 기간', defaultValue: '14'}], showConstant: false },
    { value: 'Supertrend',           label: 'Supertrend',            comparisonOptions: ['롱 시그널', '숏 시그널'], 
      inputs: [{name: '기간', defaultValue: '7'}, {name: '표준편차', defaultValue: '3'}], showConstant: false  }
  ];

  selectedIndicator1: IndicatorOption | undefined;
  selectedIndicator2: IndicatorOption | undefined;

  isPosition: boolean = false;
  candleConst: number = 0.1;
  candleType = ['last', 'start', 'high', 'low'];
  longCandleType = 'last';
  shortCandleType = 'last';

  // 팝업 ON/OFF
  noticeIn: boolean = false;
  showApiSet: boolean = false;
  
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

  constructor(
    private utilService: UtilService,
    private sharedService: SharedService
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

    this.selectedIndicator1 = this.indicatorOptions[0];
    this.selectedIndicator2 = this.indicatorOptions[0];

    console.log(JSON.stringify(this.selectedIndicator1));
  }

  ngAfterViewInit(): void {
    this.layoutsComponent.tabSelected.subscribe(tab => {
      this.selectedTab = tab;
    });
    this.layoutsComponent.noticeYn.subscribe(open => {
      this.noticeIn = open;
    });
  }

  ngOnDestroy(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
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

  copyText(value: HTMLInputElement) {
    value.select();
    navigator.clipboard.writeText(value.value).then(() => {
      value.setSelectionRange(0,0);
    })
    .catch((error) => {

    });
  }

  onInput(event: Event, indicatorNumber?: number, inputIndex?: number) {
    const input = event.target as HTMLInputElement;
    if(input) {
      // 숫자와 소수점만 허용
      input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
      if (indicatorNumber && inputIndex) {
        // 정제된 값을 저장
        this.saveIndicatorInput(indicatorNumber, inputIndex, input.value);
      }
    }
  }
  
  saveIndicatorInput(indicatorNumber: number, inputIndex: number, value: string) {
    if (indicatorNumber === 1 && this.selectedIndicator1) {
      this.selectedIndicator1.inputs[inputIndex].defaultValue = value;
    } else if (indicatorNumber === 2 && this.selectedIndicator2) {
      this.selectedIndicator2.inputs[inputIndex].defaultValue = value;
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

  // 공지사항
  openNotice() {
    this.noticeIn = true;
  }

  // 팝업 닫기
  closePopup() {
    this.noticeIn = false;
    this.showDetail = false;

    this.showApiSet = false;
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

  checkTabStyle() {
    if(this.isMobileView) {
      return { 'margin-top': '10px' };
    } else {
      return { 'margin-top': '' };
    }
  }

  // 저장하기
  saveInstance() {
    const settings: any = [];

    const createSetting = (setting: any, position: 'long' | 'short') => {
      const indicator1 = this.selectedIndicator1 || this.indicatorOptions[0];
      const indicator2 = this.selectedIndicator2 || this.indicatorOptions[0];
    
      return {
        position: position,
        const1: setting.constant1 || " ",
        argName1: indicator1.value,
        argName2: indicator2.value,
        args1: indicator1.inputs.map(input => input.defaultValue),
        args2: indicator2.inputs.map(input => input.defaultValue),
        longCandle: this.longCandleType,
        shortCandle: this.shortCandleType,
        additionalArgs: [
          setting.indicator1Comparison || "",
          setting.indicator2Comparison || "",
          setting.action || ""
        ]
      };
    };
  
    // 롱 설정 추가
    this.longSettings.forEach(longSetting => {
      settings.push(createSetting(longSetting, 'long'));
    });
  
    // 숏 설정 추가
    this.shortSettings.forEach(shortSetting => {
      settings.push(createSetting(shortSetting, 'short'));
    });

    console.log('settings >> ' + JSON.stringify(settings));

    const postData = this.utilService.createEncodedData(this.isPosition, this.candleConst, settings);
    this.utilService.instancePost(postData);
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
}
