import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';

/**
 * GET /api/images
 * 사용자의 저장된 이미지 목록 조회
 */
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);

    if (!session?.user?.email) {
      return NextResponse.json(
        { error: '인증이 필요합니다.' },
        { status: 401 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email: session.user.email },
    });

    if (!user) {
      return NextResponse.json(
        { error: '사용자를 찾을 수 없습니다.' },
        { status: 404 }
      );
    }

    // 쿼리 파라미터 (검색, 필터)
    const { searchParams } = new URL(request.url);
    const tag = searchParams.get('tag');
    const search = searchParams.get('search');

    // 이미지 프로젝트 조회
    const projects = await prisma.imageProject.findMany({
      where: {
        userId: user.id,
        deletedAt: null,
        ...(tag && {
          tags: {
            has: tag,
          },
        }),
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { description: { contains: search, mode: 'insensitive' } },
            { prompt: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: {
        createdAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        description: true,
        mode: true,
        resultImages: true,
        tags: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ projects });
  } catch (error) {
    console.error('Image list error:', error);
    return NextResponse.json(
      { error: '이미지 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
