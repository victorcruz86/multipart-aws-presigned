import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'bytes'
})
export class BytesPipe implements PipeTransform {

  transform(size: number, extension: string = 'MB'): any {
    // return (size / (1024 * 1024)).toFixed(2).replace(/(\.\d*?[1-9])0+$/g, "$1") + extension;
    return this.readableBytes(size);
  }

  readableBytes(bytes: any) {
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB'];

    return ((parseFloat(bytes) / Math.pow(1024, i)) * 1).toFixed(2).replace(/(\.\d*?[1-9])0+$/g, "$1") + ' ' + sizes[i];
  }

}
