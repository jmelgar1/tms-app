import { Component, inject } from '@angular/core';
import { DomSanitizer } from '@angular/platform-browser';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-map',
  imports: [],
  templateUrl: './map.html',
  styleUrl: './map.scss',
})
export class MapPage {
  private sanitizer = inject(DomSanitizer);
  bluemapSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(environment.bluemapUrl);
}
