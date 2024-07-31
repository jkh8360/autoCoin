import { Injectable } from '@angular/core';
import { UtilService } from './util.service';

@Injectable({
  providedIn: 'root'
})
export class SharedService {

  constructor(
    private utilService: UtilService
  ) { }

  // 텔레그램 정보 세팅
  async loadTelegramSetting() {
    const data: any = await this.utilService.get('users/getuserinfo', true, false);

    if(data.desc === 'success') {

      return data;
    }
  }
}
