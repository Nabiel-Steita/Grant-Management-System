import { Injectable } from '@nestjs/common';
import { PrismaService } from './prisma.service';

@Injectable()
export class ProjectService {
  constructor(private prisma: PrismaService) {}

  async getUserProjects(userId: number) {
    // Get user with company info
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      include: { company: true }
    });

  
    if (!user || !user.companyId) {
      return [];
    }

    // Get all projects for the user's company
    return this.prisma.project.findMany({
      where: { companyId: user.companyId },
      include: {
        budgetCategories: {
          include: {
            subtitles: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
    });
  }

  async getUserProjectCount(userId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      return 0;
    }

    return this.prisma.project.count({ where: { companyId: user.companyId } });
  }

  async createProject(userId: number, data: { 
    name: string; 
    description?: string;
    budget: number; 
    startDate: Date;
    endDate?: Date;
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
      console.log('Creating project with data:', { userId, ...data });
      
      // Get user with company info
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        include: { company: true }
      });

      if (!user || !user.companyId) {
        throw new Error('User not found or not associated with a company');
      }
      
      // Validate required fields
      if (!data.name || !data.budget || !data.startDate || !data.status) {
        throw new Error('Missing required fields: name, budget, startDate, or status');
      }
      
      // Handle empty budgetCategories
      const budgetCategoriesData = data.budgetCategories && data.budgetCategories.length > 0 
        ? data.budgetCategories.map(category => ({
            title: category.title,
            subtitles: {
              create: category.subtitles.map(subtitle => ({
                name: subtitle.name,
                amount: subtitle.amount,
              }))
            }
          }))
        : [];
      
      const result = await this.prisma.project.create({
        data: {
          userId,
          companyId: user.companyId,
          name: data.name,
          description: data.description,
          budget: data.budget,
          startDate: data.startDate,
          endDate: data.endDate,
          status: data.status,
          budgetCategories: {
            create: budgetCategoriesData
          }
        },
        include: {
          budgetCategories: {
            include: {
              subtitles: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          }
        }
      });
      
      console.log('Project created successfully:', result);
      return result;
    } catch (error) {
      console.error('Error creating project:', error);
      throw error;
    }
  }

  async getProjectWithBudget(userId: number, projectId: number) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: { companyId: true }
    });

    if (!user || !user.companyId) {
      throw new Error('User not found or not associated with a company');
    }

    return this.prisma.project.findFirst({
      where: { id: projectId, companyId: user.companyId },
      include: {
        budgetCategories: {
          include: {
            subtitles: true
          }
        },
        user: {
          select: {
            id: true,
            username: true,
            email: true
          }
        }
      }
    });
  }

  async getProject(userId: number, projectId: number) {
    try {
      console.log('Getting project:', { userId, projectId });
      
      const user = await this.prisma.user.findUnique({
        where: { id: userId },
        select: { companyId: true }
      });

      if (!user || !user.companyId) {
        console.log('User not found or no company:', { userId, user });
        throw new Error('User not found or not associated with a company');
      }

      console.log('User company ID:', user.companyId);

      const project = await this.prisma.project.findFirst({
        where: { id: projectId, companyId: user.companyId },
        include: {
          budgetCategories: {
            include: {
              subtitles: true
            }
          },
          user: {
            select: {
              id: true,
              username: true,
              email: true
            }
          },
          company: {
            select: {
              id: true,
              name: true
            }
          }
        }
      });

      console.log('Project found:', project ? 'Yes' : 'No');
      
      if (!project) {
        console.log('Project not found for user/company:', { projectId, companyId: user.companyId });
        throw new Error('Project not found');
      }

      return project;
    } catch (error) {
      console.error('Error in getProject:', error);
      throw error;
    }
  }

  async updateProject(userId: number, projectId: number, data: {
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
    // Verify the project belongs to the user
    const existingProject = await this.prisma.project.findFirst({
      where: { id: projectId, userId }
    });

    if (!existingProject) {
      throw new Error('Project not found or access denied');
    }

    // Prepare update data
    const updateData: any = {};
    if (data.name !== undefined) updateData.name = data.name;
    if (data.description !== undefined) updateData.description = data.description;
    if (data.budget !== undefined) updateData.budget = data.budget;
    if (data.startDate !== undefined) updateData.startDate = new Date(data.startDate);
    if (data.endDate !== undefined) updateData.endDate = new Date(data.endDate);
    if (data.status !== undefined) updateData.status = data.status;

    // If budget categories are provided, update them
    if (data.budgetCategories !== undefined) {
      // Delete existing spending records first (due to foreign key constraint)
      await this.prisma.spendingRecord.deleteMany({
        where: {
          budgetSubtitle: {
            budgetCategory: {
              projectId: projectId
            }
          }
        }
      });
      
      // Delete existing budget categories and subtitles
      await this.prisma.budgetSubtitle.deleteMany({
        where: {
          budgetCategory: {
            projectId: projectId
          }
        }
      });
      
      await this.prisma.budgetCategory.deleteMany({
        where: { projectId: projectId }
      });

      // Create new budget categories and subtitles
      updateData.budgetCategories = {
        create: data.budgetCategories.map(category => ({
          title: category.title,
          subtitles: {
            create: category.subtitles.map(subtitle => ({
              name: subtitle.name,
              amount: subtitle.amount,
            }))
          }
        }))
      };
    }

    return this.prisma.project.update({
      where: { id: projectId },
      data: updateData,
      include: {
        budgetCategories: {
          include: {
            subtitles: true
          }
        }
      }
    });
  }

  async updateSpending(userId: number, projectId: number, subtitleId: number, amount: number, reason?: string) {
    // Verify the project belongs to the user
    const existingProject = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        budgetCategories: {
          include: {
            subtitles: {
              where: { id: subtitleId }
            }
          }
        }
      }
    });

    if (!existingProject) {
      throw new Error('Project not found or access denied');
    }

    // Check if the subtitle exists in this project
    const subtitleExists = existingProject.budgetCategories.some(category =>
      category.subtitles.some(subtitle => subtitle.id === subtitleId)
    );

    if (!subtitleExists) {
      throw new Error('Budget subtitle not found in this project');
    }

    // Create a spending record if reason is provided
    if (reason) {
      await this.prisma.spendingRecord.create({
        data: {
          budgetSubtitleId: subtitleId,
          amount: amount,
          reason: reason,
          spentDate: new Date()
        }
      });
    }

    // Update the spending for the subtitle
    const updatedSubtitle = await this.prisma.budgetSubtitle.update({
      where: { id: subtitleId },
      data: {
        spent: amount,
        spentDate: new Date()
      }
    });

    return updatedSubtitle;
  }

  async getSpendingHistory(userId: number, projectId: number, subtitleId: number) {
    // Verify the project belongs to the user
    const existingProject = await this.prisma.project.findFirst({
      where: { id: projectId, userId },
      include: {
        budgetCategories: {
          include: {
            subtitles: {
              where: { id: subtitleId },
              include: {
                spendingHistory: {
                  orderBy: { spentDate: 'desc' }
                }
              }
            }
          }
        }
      }
    });

    if (!existingProject) {
      throw new Error('Project not found or access denied');
    }

    // Check if the subtitle exists in this project
    const subtitleExists = existingProject.budgetCategories.some(category =>
      category.subtitles.some(subtitle => subtitle.id === subtitleId)
    );

    if (!subtitleExists) {
      throw new Error('Budget subtitle not found in this project');
    }

    // Get the subtitle with spending history
    const subtitle = existingProject.budgetCategories
      .flatMap(category => category.subtitles)
      .find(subtitle => subtitle.id === subtitleId);

    return subtitle?.spendingHistory || [];
  }
} 