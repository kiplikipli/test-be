import { BadRequestException, Body, Controller, Get, Patch, Post, Req, UploadedFile, UseGuards, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { memoryStorage } from 'multer';

import { AuthenticatedUser, JwtTcpGuard, Role, Roles, RolesGuard } from '@app/common';

import { UpdateSelfProfileDto } from './dto/update-self-profile.dto';
import { EmployeeService } from './employee.service';
import { PhotoStorageService } from './storage/photo-storage.service';

@UseGuards(JwtTcpGuard, RolesGuard)
@Roles(Role.EMPLOYEE)
@Controller('employees/me')
export class EmployeeSelfController {
  constructor(
    private readonly employeeService: EmployeeService,
    private readonly photoStorageService: PhotoStorageService,
  ) {}

  @Get()
  async getProfile(@Req() request: { user?: AuthenticatedUser }) {
    const email = request.user?.email;
    if (!email) {
      return null;
    }
    return this.employeeService.findProfileByWorkEmail(email);
  }

  @Patch()
  updateProfile(@Req() request: { user?: AuthenticatedUser }, @Body() dto: UpdateSelfProfileDto) {
    const email = request.user?.email;
    if (!email) {
      throw new BadRequestException('User email missing from context');
    }
    return this.employeeService.updateProfileByWorkEmail(email, dto);
  }

  @Post('photo')
  @UseInterceptors(
    FileInterceptor('file', {
      storage: memoryStorage(),
      limits: { fileSize: 5 * 1024 * 1024 },
    }),
  )
  async uploadPhoto(
    @Req() request: { user?: AuthenticatedUser },
    @UploadedFile() file: Express.Multer.File,
  ) {
    const email = request.user?.email;
    const userId = request.user?.id;
    if (!email || !userId) {
      throw new BadRequestException('User context is missing');
    }

    const photoUrl = await this.photoStorageService.save(file, userId);
    return this.employeeService.updateProfilePhoto(email, photoUrl);
  }
}
