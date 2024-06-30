import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { SharedService } from '../shared/shared.service';

@Component({
  selector: 'app-layouts',
  templateUrl: './layouts.component.html',
  styleUrls: ['./layouts.component.css']
})
export class LayoutsComponent implements OnInit {
  @Output() tabSelected = new EventEmitter<string>();
  @Output() noticeYn = new EventEmitter<boolean>();
  selectedTab :string = 'auto';

  constructor(
    private sharedService: SharedService,
  ) { }

  ngOnInit(): void {
  }

  onTabSelect(tab: string) {
    this.selectedTab = tab;
    this.tabSelected.emit(tab)
  }

  openNotice() {
    this.noticeYn.emit(true);
  }

}
