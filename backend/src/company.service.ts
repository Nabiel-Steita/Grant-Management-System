import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class CompanyService {
  constructor(private prisma: PrismaService) {}

  async updateLogo(companyId: number, logo: string) {
    try {
      console.log('Updating logo for company ID:', companyId);
      const result = await this.prisma.company.update({
        where: { id: companyId },
        data: { logo },
        include: { users: true }
      });
      console.log('Logo updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating logo:', error);
      throw error;
    }
  }

  async updateCompanyInfo(companyId: number, data: { name?: string; sector?: string }) {
    try {
      console.log('Updating company info for company ID:', companyId, data);
      const result = await this.prisma.company.update({
        where: { id: companyId },
        data,
        include: { users: true }
      });
      console.log('Company info updated successfully');
      return result;
    } catch (error) {
      console.error('Error updating company info:', error);
      throw error;
    }
  }

  async getCompanyInfo(companyId: number) {
    try {
      console.log('Getting company info for company ID:', companyId);
      const result = await this.prisma.company.findUnique({
        where: { id: companyId },
        include: { users: true }
      });
      console.log('Company info retrieved successfully');
      return result;
    } catch (error) {
      console.error('Error getting company info:', error);
      throw error;
    }
  }
}
