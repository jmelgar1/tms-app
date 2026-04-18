import { Component, inject, output, signal, OnDestroy, HostListener } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Subscription, interval } from 'rxjs';
import { switchMap, takeWhile, filter, take } from 'rxjs/operators';
import { ScreenshotService } from '../../services/screenshot.service';

type Step = 'username' | 'waiting' | 'upload' | 'success' | 'error';

@Component({
  selector: 'app-screenshot-upload-modal',
  imports: [FormsModule],
  templateUrl: './screenshot-upload-modal.html',
  styleUrl: './screenshot-upload-modal.scss',
})
export class ScreenshotUploadModal implements OnDestroy {
  private screenshotService = inject(ScreenshotService);
  private pollSub: Subscription | null = null;

  closed = output<void>();
  uploaded = output<void>();

  step = signal<Step>('username');
  username = signal('');
  token = signal('');
  caption = signal('');
  selectedFile = signal<File | null>(null);
  previewUrl = signal<string | null>(null);
  uploading = signal(false);
  submitting = signal(false);
  errorMessage = signal('');

  ngOnDestroy(): void {
    this.stopPolling();
    this.revokePreview();
  }

  @HostListener('document:keydown.escape')
  onEscape(): void {
    this.close();
  }

  onBackdropClick(event: MouseEvent): void {
    if ((event.target as HTMLElement).classList.contains('modal-backdrop')) {
      this.close();
    }
  }

  close(): void {
    this.stopPolling();
    this.revokePreview();
    this.closed.emit();
  }

  submitUsername(): void {
    const name = this.username().trim();
    if (!name || this.submitting()) return;

    this.submitting.set(true);
    this.errorMessage.set('');

    this.screenshotService.requestToken(name).subscribe({
      next: (res) => {
        this.token.set(res.token);
        this.step.set('waiting');
        this.submitting.set(false);
        this.startPolling();
      },
      error: (err) => {
        this.submitting.set(false);
        const msg = err.error?.error || 'Something went wrong. Please try again.';
        this.errorMessage.set(msg);
      },
    });
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (!input.files || input.files.length === 0) return;
    this.setFile(input.files[0]);
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    if (!event.dataTransfer?.files || event.dataTransfer.files.length === 0) return;
    this.setFile(event.dataTransfer.files[0]);
  }

  submitUpload(): void {
    const file = this.selectedFile();
    if (!file || this.uploading()) return;

    this.uploading.set(true);
    this.errorMessage.set('');

    const caption = this.caption().trim() || undefined;

    this.screenshotService.uploadScreenshot(this.token(), file, caption).subscribe({
      next: () => {
        this.uploading.set(false);
        this.step.set('success');
        this.uploaded.emit();
      },
      error: (err) => {
        this.uploading.set(false);
        const msg = err.error?.error || 'Upload failed. Please try again.';
        this.errorMessage.set(msg);
      },
    });
  }

  private setFile(file: File): void {
    const validTypes = ['image/png', 'image/jpeg'];
    if (!validTypes.includes(file.type)) {
      this.errorMessage.set('Only PNG and JPEG images are allowed.');
      return;
    }
    if (file.size > 5 * 1024 * 1024) {
      this.errorMessage.set('File exceeds 5 MB limit.');
      return;
    }

    this.revokePreview();
    this.errorMessage.set('');
    this.selectedFile.set(file);
    this.previewUrl.set(URL.createObjectURL(file));
  }

  private startPolling(): void {
    this.pollSub = interval(3000)
      .pipe(
        switchMap(() => this.screenshotService.checkTokenStatus(this.token())),
        takeWhile((res) => !res.verified, true),
        filter((res) => res.verified),
        take(1),
      )
      .subscribe({
        next: () => {
          this.step.set('upload');
        },
      });

    // Auto-timeout after 10 minutes
    setTimeout(() => {
      if (this.step() === 'waiting') {
        this.stopPolling();
        this.errorMessage.set('Verification timed out. Please try again.');
        this.step.set('error');
      }
    }, 10 * 60 * 1000);
  }

  private stopPolling(): void {
    if (this.pollSub) {
      this.pollSub.unsubscribe();
      this.pollSub = null;
    }
  }

  private revokePreview(): void {
    const url = this.previewUrl();
    if (url) {
      URL.revokeObjectURL(url);
      this.previewUrl.set(null);
    }
  }
}
