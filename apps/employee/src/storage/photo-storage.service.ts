import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { promises as fs } from 'fs';
import { extname, join } from 'path';

@Injectable()
export class PhotoStorageService {
  constructor(private readonly configService: ConfigService) {}

  async save(file: Express.Multer.File, employeeId: string): Promise<string> {
    if (!file?.buffer) {
      throw new InternalServerErrorException('Invalid photo upload payload');
    }

    const uploadDir = this.getUploadDirectory();
    await fs.mkdir(uploadDir, { recursive: true });

    const filename = this.buildFilename(file.originalname, employeeId);
    const filePath = join(uploadDir, filename);

    await fs.writeFile(filePath, file.buffer);

    return this.buildPublicPath(filename);
  }

  private getUploadDirectory(): string {
    return this.configService.get<string>('EMPLOYEE_PHOTO_UPLOAD_DIR', join(process.cwd(), 'uploads', 'employees'));
  }

  private getPublicBasePath(): string {
    return this.configService.get<string>('EMPLOYEE_PHOTO_BASE_URL', '/uploads/employees');
  }

  private buildFilename(originalName: string, employeeId: string): string {
    const extension = this.sanitizedExtension(originalName);
    return `${employeeId}-${Date.now()}${extension}`;
  }

  private sanitizedExtension(originalName: string): string {
    const ext = extname(originalName)?.toLowerCase();
    if (!ext) {
      return '.jpg';
    }

    return ext.replace(/[^.a-z0-9]/g, '') || '.jpg';
  }

  private buildPublicPath(filename: string): string {
    const base = this.getPublicBasePath();
    return `${base.replace(/\/$/, '')}/${filename}`;
  }
}
