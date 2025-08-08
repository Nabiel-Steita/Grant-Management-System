import { Controller, Get, Post, Put, Patch, Body, Param, UseGuards, Req } from '@nestjs/common';
import { ProjectService } from './project.service';
import { AuthGuard } from '@nestjs/passport';

@Controller('projects')
@UseGuards(AuthGuard('jwt'))
export class ProjectController {
  constructor(private readonly projectService: ProjectService) {}

  @Get()
  async getProjects(@Req() req: any) {
    return this.projectService.getUserProjects(req.user.id);
  }

  @Get('count')
  async getProjectCount(@Req() req: any) {
    return this.projectService.getUserProjectCount(req.user.id);
  }

  @Get(':id')
  async getProject(@Req() req: any, @Param('id') id: string) {
    return this.projectService.getProject(req.user.id, Number(id));
  }

  @Put(':id')
  async updateProject(@Req() req: any, @Param('id') id: string, @Body() body: {
    name?: string;
    description?: string;
    budget?: number;
    startDate?: string;
    endDate?: string;
    status?: string;
    budgetCategories?: Array<{
      id?: string;
      title: string;
      subtitles: Array<{
        id?: string;
        name: string;
        amount: number;
      }>;
    }>;
  }) {
    return this.projectService.updateProject(req.user.id, Number(id), body);
  }

  @Patch(':id/spending')
  async updateSpending(@Req() req: any, @Param('id') id: string, @Body() body: {
    subtitleId: number;
    amount: number;
    reason?: string;
  }) {
    return this.projectService.updateSpending(req.user.id, Number(id), body.subtitleId, body.amount, body.reason);
  }

  @Get(':id/spending/:subtitleId/history')
  async getSpendingHistory(@Req() req: any, @Param('id') id: string, @Param('subtitleId') subtitleId: string) {
    return this.projectService.getSpendingHistory(req.user.id, Number(id), Number(subtitleId));
  }

  @Post()
  async createProject(@Req() req: any, @Body() body: { 
    name: string; 
    description?: string;
    budget: number; 
    startDate: string;
    endDate?: string;
    status: string;
    budgetCategories: Array<{
      title: string;
      subtitles: Array<{
        name: string;
        amount: number;
      }>;
    }>;
  }) {
    try {
      console.log('Received project creation request:', { userId: req.user?.id, body });
      
      if (!req.user?.id) {
        throw new Error('User not authenticated');
      }
      
      const result = await this.projectService.createProject(req.user.id, {
        name: body.name,
        description: body.description,
        budget: body.budget,
        startDate: new Date(body.startDate),
        endDate: body.endDate ? new Date(body.endDate) : undefined,
        status: body.status,
        budgetCategories: body.budgetCategories,
      });
      
      console.log('Project created successfully in controller');
      return result;
    } catch (error) {
      console.error('Error in createProject controller:', error);
      throw error;
    }
  }
} 