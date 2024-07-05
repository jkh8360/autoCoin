import { AfterViewInit, Component, ElementRef, HostListener, Input, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';
import { UtilService } from '../shared/util.service';
import { SharedService } from '../shared/shared.service';
import { LayoutsComponent } from '../layouts/layouts.component';

interface AppNotification {
  message: string;
  date: string;
  details: string;
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

  open: { isOpen: boolean }[] = [
    {isOpen: true},
    {isOpen: false},
    {isOpen: false},
    {isOpen: false},
    {isOpen: false}
  ]; // 각 설정의 슬라이드 상태를 저장할 배열

  longSettings: any[] = [];
  shortSettings: any[] = [];

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

  onInput(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input) {
      input.value = input.value.replace(/[^0-9.]/g, '').replace(/(\..*)\./g, '$1');
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

  // 봇 실행
  operateBot() {  
    if(this.botPlay) {
      this.botPlay = false;
    } else {
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

    if(data) {
      this.teleId = data.teleid;
      this.teleBotYn = data.isRemote === 1 ? true : false;
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
    this.utilService.instancePost();
  }
}
