import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';

@Component({
  selector: 'app-layouts',
  templateUrl: './layouts.component.html',
  styleUrls: ['./layouts.component.css']
})
export class LayoutsComponent implements OnInit {
  @Output() tabSelected = new EventEmitter<string>();
  @Output() noticeYn = new EventEmitter<boolean>();
  @Output() toUsePopup = new EventEmitter<boolean>();
  selectedTab :string = 'auto';
  LAYOUT: any;

  constructor(
    private translate: TranslateService
  ) { }

  ngOnInit(): void {
    this.translate.get('LAYOUT').subscribe(res => {
      this.LAYOUT = res;
    });
  }

  onTabSelect(tab: string) {
    this.selectedTab = tab;
    this.tabSelected.emit(tab)
  }

  openNotice() {
    this.noticeYn.emit(true);
  }

  openToUse() {
    this.toUsePopup.emit(true);
  }
}
