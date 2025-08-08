import { Injectable, ConflictException } from '@nestjs/common';
import { PrismaService } from './prisma.service';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';
import { NotificationService } from './notification.service';

@Injectable()
export class AuthService {
  constructor(
    private prisma: PrismaService,
    private jwtService: JwtService,
    private notificationService: NotificationService,
  ) {}

  async register(email: string, username: string, password: string, companyName: string) {
    try {
      console.log('Registration attempt:', { email, username, companyName });
      
      const existing = await this.prisma.user.findUnique({ where: { email } });
      if (existing) throw new ConflictException('Email already in use');
      
      const hashed = await bcrypt.hash(password, 10);
      
      // Create or find company with better error handling
      let company;
      try {
        // First try to find existing company
        company = await this.prisma.company.findUnique({ 
          where: { name: companyName.trim() } 
        });
        console.log('Existing company found:', company ? 'Yes' : 'No');
        
        if (!company) {
          console.log('Creating new company:', companyName.trim());
          company = await this.prisma.company.create({
            data: { 
              name: companyName.trim(), 
              sector: 'General' 
            }
          });
          console.log('Company created with ID:', company.id);
        }
      } catch (companyError) {
        console.error('Error with company creation/lookup:', companyError);
        // If there's a unique constraint violation, try to find the company again
        if (companyError.code === 'P2002') {
          company = await this.prisma.company.findUnique({ 
            where: { name: companyName.trim() } 
          });
          if (!company) {
            throw new Error('Failed to create or find company');
          }
        } else {
          throw companyError;
        }
      }
      
      console.log('Creating user with company ID:', company.id);
      const user = await this.prisma.user.create({
        data: { 
          email, 
          username, 
          password: hashed,
          companyId: company.id
        },
      });
      
      console.log('User created with ID:', user.id);
      
      await this.notificationService.createNotification(
        user.id,
        'Welcome!',
        'Welcome to Grant Management! Start by creating your first project.'
      );
      
      const token = this.jwtService.sign({ sub: user.id, email: user.email, username: user.username });
      return { id: user.id, email: user.email, username: user.username, token };
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  }

  async login(emailOrUsername: string, password: string) {
    const user = await this.prisma.user.findFirst({
      where: {
        OR: [
          { email: emailOrUsername },
          { username: emailOrUsername },
        ],
      },
      include: { company: true }
    });
    if (!user || !user.password) throw new ConflictException('Invalid credentials');
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) throw new ConflictException('Invalid credentials');
    const token = this.jwtService.sign({ sub: user.id, email: user.email, username: user.username });
    return { 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      company: user.company,
      token 
    };
  }

  async validateGoogleUser({ providerId, email, username }: { providerId: string; email: string; username: string }) {
    let user = await this.prisma.user.findUnique({ 
      where: { providerId },
      include: { company: true }
    });
    if (!user) {
      // For Google users, assign to default company if no company specified
      const defaultCompany = await this.prisma.company.findFirst({ where: { name: 'Default Company' } });
      
      user = await this.prisma.user.create({
        data: {
          email,
          username,
          provider: 'google',
          providerId,
          companyId: defaultCompany?.id
        },
        include: { company: true }
      });
      await this.notificationService.createNotification(
        user.id,
        'Welcome!',
        'Welcome to Grant Management! Start by creating your first project.'
      );
    }
    const token = this.jwtService.sign({ sub: user.id, email: user.email, username: user.username });
    return { 
      id: user.id, 
      email: user.email, 
      username: user.username, 
      company: user.company,
      token 
    };
  }
}