import { EventEmitter, Injectable } from '@angular/core';
import { HttpClient, HttpEvent, HttpEventType, HttpParams, HttpRequest, HttpResponse } from '@angular/common/http';

export interface IS3Data {
  bucket: string;
  folder: string;
  region: string;
  accessKeyId?: string;
  secretAccessKey?: string;
}

export interface IParamStartUpload {
  fileName: string;
  fileType: string;
  bucket: string;
}

@Injectable({
  providedIn: 'root'
})
export class UploadService {
  uploadProgress$ = new EventEmitter<any>();
  finishedProgress$ = new EventEmitter<any>();

  url: string = 'https://2qczmfih6j.execute-api.us-east-1.amazonaws.com/prod';

  constructor(private httpClient: HttpClient) {
  }

  // -------------------------------
  // --- Presigned URL -------------
  // -------------------------------

  /**
   * Initiate a multipart upload.
   *
   * @param params
   */
  private startUpload(params: IParamStartUpload): Promise<any> {
    const httpParams = new HttpParams()
      .set('fileName', encodeURIComponent(params.fileName))
      .set('fileType', encodeURIComponent(params.fileType))
      .set('bucket', encodeURIComponent(params.bucket));

    return this.httpClient.get(`${this.url}/start-upload`, { params: httpParams }).toPromise();
  }

  /**
   * Upload MultiPart.
   *
   * @param file
   * @param tokenEmit
   * @param dataS3
   */
  async uploadMultipartFile(file: any, tokenEmit: string, dataS3: IS3Data) {
    const uploadStartResponse = await this.startUpload({
      fileName: file.name,
      fileType: file.type,
      bucket: dataS3.bucket
    });

    try {
      const FILE_CHUNK_SIZE = 10000000; // 10MB
      const fileSize = file.size;
      const NUM_CHUNKS = Math.floor(fileSize / FILE_CHUNK_SIZE) + 1;
      let start, end, blob;

      let uploadPartsArray = [];
      let countParts = 0;

      let orderData = [];

      for (let index = 1; index < NUM_CHUNKS + 1; index++) {
        start = (index - 1) * FILE_CHUNK_SIZE;
        end = (index) * FILE_CHUNK_SIZE;
        blob = (index < NUM_CHUNKS) ? file.slice(start, end) : file.slice(start);

        const httpParams = new HttpParams()
          .set('fileName', encodeURIComponent(file.name))
          .set('fileType', encodeURIComponent(file.type))
          .set('bucket', encodeURIComponent(dataS3.bucket))
          .set('partNumber', index.toString())
          .set('uploadId', uploadStartResponse.data.uploadId);

        // (1) Generate presigned URL for each part

        const uploadUrlPresigned = await this.httpClient.get(`${this.url}/get-upload-url`, { params: httpParams }).toPromise();

        // (2) Puts each file part into the storage server

        orderData.push({
          presignedUrl: uploadUrlPresigned.toString(),
          index: index
        });

        const req = new HttpRequest('PUT', uploadUrlPresigned.toString(), blob, {
          reportProgress: true
        });

        this.httpClient
          .request(req)
          .subscribe((event: HttpEvent<any>) => {
            switch (event.type) {
              case HttpEventType.UploadProgress:
                const percentDone = Math.round(100 * event.loaded / FILE_CHUNK_SIZE);
                this.uploadProgress$.emit({
                  progress: file.size < FILE_CHUNK_SIZE ? 100 : percentDone,
                  token: tokenEmit
                });
                break;
              case HttpEventType.Response:
                console.log('😺 Done!');
            }

            // (3) Calls the CompleteMultipartUpload endpoint in the backend server

            if (event instanceof HttpResponse) {
              const currentPresigned = orderData.find(item => item.presignedUrl === event.url);

              countParts++;
              uploadPartsArray.push({
                ETag: event.headers.get('ETag').replace(/[|&;$%@"<>()+,]/g, ''),
                PartNumber: currentPresigned.index
              });

              if (uploadPartsArray.length === NUM_CHUNKS) {
                this.httpClient.post(`${this.url}/complete-upload`, {
                  fileName: encodeURIComponent(file.name),
                  parts: uploadPartsArray.sort((a, b) => {
                    return a.PartNumber - b.PartNumber;
                  }),
                  uploadId: uploadStartResponse.data.uploadId,
                  bucket: dataS3.bucket
                }).toPromise()
                  .then(res => {
                    this.finishedProgress$.emit({
                      data: res
                    });
                  });
              }
            }
          });
      }
    } catch (e) {
      console.log('error: ', e);
    }
  }

}
