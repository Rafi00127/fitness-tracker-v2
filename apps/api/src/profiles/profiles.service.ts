import { Injectable, NotFoundException } from '@nestjs/common';
import { Prisma, WeightUnit } from '@prisma/client';
import { PrismaService } from '../prisma/prisma.service';
import { UpdateProfileDto } from './dto/update-profile.dto';

const userSelection = {
  id: true,
  email: true,
  name: true,
  createdAt: true,
} satisfies Prisma.UserSelect;

@Injectable()
export class ProfilesService {
  constructor(private readonly prisma: PrismaService) {}

  async getForUser(userId: string) {
    const user = await this.prisma.user.findUnique({
      where: { id: userId },
      select: userSelection,
    });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    const profile = await this.prisma.profile.upsert({
      where: { userId },
      create: { userId },
      update: {},
    });

    return toProfileResponse(user, profile);
  }

  async updateForUser(userId: string, input: UpdateProfileDto) {
    return this.prisma.$transaction(async (transaction) => {
      const user = await transaction.user.findUnique({
        where: { id: userId },
        select: userSelection,
      });
      if (!user) {
        throw new NotFoundException('User not found');
      }

      const updatedUser =
        input.name === undefined
          ? user
          : await transaction.user.update({
              where: { id: userId },
              data: { name: input.name },
              select: userSelection,
            });

      const profile = await transaction.profile.upsert({
        where: { userId },
        create: {
          userId,
          heightCm: input.heightCm,
          weightUnit: input.weightUnit ?? WeightUnit.KG,
        },
        update: {
          ...(input.heightCm !== undefined && { heightCm: input.heightCm }),
          ...(input.weightUnit !== undefined && {
            weightUnit: input.weightUnit,
          }),
        },
      });

      return toProfileResponse(updatedUser, profile);
    });
  }
}

function toProfileResponse(
  user: Prisma.UserGetPayload<{ select: typeof userSelection }>,
  profile: Prisma.ProfileGetPayload<object>,
) {
  return {
    user,
    profile: {
      heightCm: profile.heightCm === null ? null : Number(profile.heightCm),
      weightUnit: profile.weightUnit,
    },
  };
}
