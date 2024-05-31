import { Component, ElementRef, HostListener, OnInit, ViewChild } from '@angular/core';

@Component({
  selector: 'app-profile',
  templateUrl: './profile.component.html',
  styleUrls: ['./profile.component.css']
})
export class ProfileComponent implements OnInit {
  @ViewChild('dropMenu', { static: true }) dropMenu!: ElementRef;
  isDropdownOpen = false;

  constructor() {}

  showApiSet: boolean = false;
  showTelegramSet: boolean = false;
  showLangSet: boolean = false;
  displayMode: boolean = false;
  showLogout: boolean = false;
  showMypage: boolean = false;

  ngOnInit(): void {
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
    this.updateDropdownVisibility();
  }

  updateDropdownVisibility() {
    if (this.isDropdownOpen) {
      this.dropMenu.nativeElement.style.display = 'block';
    } else {
      this.dropMenu.nativeElement.style.display = 'none';
    }
  }

  // API 설정
  openApiSet() {
    this.showApiSet = true;
    this.closeDropdown();
  }

  // 텔레그램 설정
  openTelegramSet() {
    this.showTelegramSet = true;
    this.closeDropdown();
  }

  // 언어 변경
  changeLng() {
    this.showLangSet = true;
    this.closeDropdown();
  }

  // 라이트/다크 모드 전환
  displayModeChg() {
    this.displayMode = true;
    this.closeDropdown();
  }

  // 로그아웃
  logout() {
    this.showLogout = true;
    this.closeDropdown();
  }

  // 마이페이지
  openMypage() {
    this.showMypage = true;
    this.closeDropdown();
  }

  closePopup() {
    this.showApiSet = false;
    this.showTelegramSet = false;
    this.showLangSet = false;
    this.displayMode = false;
    this.showLogout = false;
    this.showMypage = false;
  }

  saveAPI() {
    this.showApiSet = false;
  }

  saveTelegram() {
    this.showTelegramSet = false;
  }
}
