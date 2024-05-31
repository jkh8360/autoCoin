import { Component, ElementRef, OnInit, QueryList, ViewChild, ViewChildren } from '@angular/core';

@Component({
  selector: 'app-home',
  templateUrl: './home.component.html',
  styleUrls: ['./home.component.css'],
})
export class HomeComponent implements OnInit {
  @ViewChildren('slideBox') slideBox?: QueryList<ElementRef>;

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
  signIn: boolean = false;
  noticeIn: boolean = false;

  constructor() {
    this.addLongSetting();
    this.addShortSetting();
  }

  ngOnInit(): void {

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

  signUp() {
    this.signIn = true;
  }

  linkToTelegram() {
    window.open('https://telegram.org/', '_blank');
  }

  openNotice() {
    this.noticeIn = true;
  }

  closePopup() {
    this.signIn = false;
    this.noticeIn = false;
  }
}
