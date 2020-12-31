import { Component, Input, OnInit } from '@angular/core';

@Component({
  selector: 'app-item-upload',
  templateUrl: './item-upload.component.html',
  styleUrls: ['./item-upload.component.scss']
})
export class ItemUploadComponent implements OnInit {
  @Input() data: any;

  progress: number = 0;
  preview: any;

  constructor() {
  }

  ngOnInit(): void {
    if (this.data) {
      this.processData();
    }
  }

  processData() {
    if (this.isImageFile()) {
      this.preview = this.imagePreview();
    }
  }

  isImageFile() {
    return this.data.file && this.data.file.type.split('/')[0] === 'image';
  }

  imagePreview() {
    return window.URL.createObjectURL(this.data.file);
  }
}
