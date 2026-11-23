import { AfterViewInit, Component, ElementRef, EventEmitter, NgZone, OnDestroy, Output, ViewChild } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import QrScanner from 'qr-scanner';

type CameraError = 'NO_CAMERA' | 'DENIED';

const CAMERA_ERROR_KEYS: Record<CameraError, string> = {
  NO_CAMERA: 'COFFEE.CAMERA_MISSING',
  DENIED: 'COFFEE.CAMERA_DENIED',
};

@Component({
  selector: 'app-qr-camera',
  standalone: true,
  imports: [TranslatePipe],
  templateUrl: './qr-camera.component.html',
  styleUrls: ['./qr-camera.component.scss'],
})
export class QrCameraComponent implements AfterViewInit, OnDestroy {
  @ViewChild('video', { static: true }) video!: ElementRef<HTMLVideoElement>;
  @Output() readonly scanned = new EventEmitter<string>();

  error: CameraError | null = null;

  private scanner: QrScanner | null = null;
  private emitted = false;

  constructor(private readonly zone: NgZone) {}

  get errorKey(): string {
    if (!this.error) {
      return '';
    }

    return CAMERA_ERROR_KEYS[this.error];
  }

  ngAfterViewInit(): void {
    QrScanner.hasCamera().then((hasCamera) => {
      if (!hasCamera) {
        this.zone.run(() => (this.error = 'NO_CAMERA'));
        return;
      }

      this.scanner = new QrScanner(this.video.nativeElement, (result) => this.onResult(result.data), {
        preferredCamera: 'environment',
        highlightScanRegion: true,
        highlightCodeOutline: true,
        returnDetailedScanResult: true,
      });
      this.scanner.start().catch(() => this.zone.run(() => (this.error = 'DENIED')));
    });
  }

  ngOnDestroy(): void {
    this.scanner?.stop();
    this.scanner?.destroy();
    this.scanner = null;
  }

  private onResult(data: string): void {
    if (this.emitted || !data) {
      return;
    }

    this.emitted = true;
    this.scanner?.stop();
    this.zone.run(() => this.scanned.emit(data));
  }
}
