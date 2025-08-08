import { Controller, Post, Body, BadRequestException, UseGuards, Res, Req, Get } from '@nestjs/common';
import { AuthService } from './auth.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  async register(@Body() body: { email: string; username: string; password: string; companyName: string }) {
    const { email, username, password, companyName } = body;
    if (!email || !username || !password || !companyName) {
      throw new BadRequestException('Email, username, password, and company name required');
    }
    return this.authService.register(email, username, password, companyName);
  }

  @Post('login')
  async login(@Body() body: { emailOrUsername: string; password: string }) {
    const { emailOrUsername, password } = body;
    if (!emailOrUsername || !password) throw new BadRequestException('Email/Username and password required');
    return this.authService.login(emailOrUsername, password);
  }

  @Get('google')
  @UseGuards(AuthGuard('google'))
  async googleAuth() {
    // Initiates Google OAuth
  }

  @Get('google/callback')
  @UseGuards(AuthGuard('google'))
  async googleAuthCallback(@Req() req: any, @Res() res: any) {
    // Successful authentication, redirect to frontend with token
    const user = req.user as any;
    const token = user.token;
    res.redirect(`http://localhost:3001/auth/callback?token=${token}`);
  }

  @Get('me')
  @UseGuards(AuthGuard('jwt'))
  async getMe(@Req() req: any) {
    // req.user is set by the AuthGuard
    const user = req.user as any;
    console.log('Auth /me endpoint called with user:', { id: user.id, username: user.username, companyId: user.companyId });
    return {
      id: user.id,
      email: user.email,
      username: user.username,
      title: user.title || null,
      company: user.company || null,
    };
  }

  @Get('test')
  @UseGuards(AuthGuard('jwt'))
  async testAuth(@Req() req: any) {
    console.log('Test auth endpoint called with user:', req.user);
    return { message: 'Authentication working', user: req.user };
  }
} 