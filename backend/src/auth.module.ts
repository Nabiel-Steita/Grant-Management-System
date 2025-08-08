import { Module } from '@nestjs/common';
import { AuthController } from './auth.controller';
import { AuthService } from './auth.service';
import { PrismaService } from './prisma.service';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { GoogleStrategy } from './google.strategy';
import { NotificationService } from './notification.service';
import { NotificationController } from './notification.controller';
import { ProjectService } from './project.service';
import { ProjectController } from './project.controller';
import { CompanyService } from './company.service';
import { CompanyController } from './company.controller';
import { JwtStrategy } from './jwt.strategy';

@Module({
  imports: [
    PassportModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET || 'changeme',
      signOptions: { expiresIn: '7d' },
    }),
  ],
  controllers: [AuthController, NotificationController, ProjectController, CompanyController],
  providers: [AuthService, PrismaService, GoogleStrategy, NotificationService, ProjectService, CompanyService, JwtStrategy],
})
export class AuthModule {} 