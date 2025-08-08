import { Controller, Post, Put, Body, UseGuards, Req, BadRequestException } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';
import { CompanyService } from './company.service';

@Controller('company')
export class CompanyController {
  constructor(private readonly companyService: CompanyService) {}

  @Put('logo')
  @UseGuards(AuthGuard('jwt'))
  async updateLogo(@Req() req: any, @Body() body: { logo: string }) {
    const user = req.user;
    if (!user.companyId) {
      throw new BadRequestException('User not associated with a company');
    }
    
    return this.companyService.updateLogo(user.companyId, body.logo);
  }

  @Put('info')
  @UseGuards(AuthGuard('jwt'))
  async updateCompanyInfo(@Req() req: any, @Body() body: { name?: string; sector?: string }) {
    const user = req.user;
    if (!user.companyId) {
      throw new BadRequestException('User not associated with a company');
    }
    
    return this.companyService.updateCompanyInfo(user.companyId, body);
  }
}
