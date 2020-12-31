import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { ProgressbarModule } from 'ngx-bootstrap/progressbar';
import { NgxFileDropModule } from 'ngx-file-drop';
import { NgCircleProgressModule } from 'ng-circle-progress';

import { AppComponent } from './app.component';
import { HttpClientModule } from '@angular/common/http';
import { ItemUploadComponent } from './item-upload/item-upload.component';
import { BytesPipe } from './bytes.pipe';

@NgModule({
  declarations: [
    AppComponent,
    ItemUploadComponent,
    BytesPipe
  ],
  imports: [
    BrowserModule,
    BrowserAnimationsModule,
    HttpClientModule,

    ProgressbarModule.forRoot(),
    NgxFileDropModule,
    NgCircleProgressModule.forRoot({
      // set defaults here
      radius: 100,
      outerStrokeWidth: 16,
      innerStrokeWidth: 8,
      outerStrokeColor: '#78C000',
      innerStrokeColor: '#C7E596',
      animationDuration: 300
    })
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule {
}
