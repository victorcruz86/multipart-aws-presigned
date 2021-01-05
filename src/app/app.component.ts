import { Component, OnInit } from '@angular/core';
import { FileSystemDirectoryEntry, FileSystemFileEntry, NgxFileDropEntry } from 'ngx-file-drop';
import { UploadService, IS3Data } from './upload.service';

@Component({
  selector: 'app-root',
  templateUrl: './app.component.html',
  styleUrls: ['./app.component.scss']
})
export class AppComponent implements OnInit {
  files: NgxFileDropEntry[] = [];
  listFilesToUpload = [];

  constructor(private awsS3UploadService: UploadService) {
  }

  ngOnInit() {
    // uploader events

    this.awsS3UploadService.uploadProgress$
      .subscribe(event => {
        const fileIndex = this.listFilesToUpload.findIndex(item => item.token === event.token);
        const fileProgress = this.listFilesToUpload[fileIndex].progress || 0;
        this.listFilesToUpload[fileIndex].progress = event.progress > fileProgress ? event.progress : fileProgress;
      });
  }

  /**
   * Dropped files or folders.
   *
   * @param files
   */
  dropped(files: NgxFileDropEntry[]) {
    this.files = [...this.files, ...files];

    for (let i = 0; i < files.length; i++) {
      const droppedFile = files[i];

      // Is it a file?
      if (droppedFile.fileEntry.isFile) {
        const fileEntry = droppedFile.fileEntry as FileSystemFileEntry;
        fileEntry.file(async (file: File) => {
          this.upload(file);
        });
      } else {
        // It was a directory (empty directories are added, otherwise only files)
        const fileEntry = droppedFile.fileEntry as FileSystemDirectoryEntry;
      }
    }
  }

  fileOver(event) {
    // console.log(event);
  }

  fileLeave(event) {
    // console.log(event);
  }

  async upload(file: File) {
    const fileUpload = {
      file: file,
      progress: 0,
      token: this.generateToken()
    };

    this.listFilesToUpload.push(fileUpload);

    await this.awsS3UploadService.uploadMultipartFile(file, fileUpload.token);
  }

  generateToken() {
    return Math.random().toString(36).substr(2) + new Date().getTime();
  }
}
