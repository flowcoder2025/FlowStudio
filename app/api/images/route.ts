import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { logger } from '@/lib/logger';

/**
 * GET /api/images
 * 사용자의 저장된 이미지 목록 조회
 * - ImageProject: CREATE, EDIT, DETAIL_EDIT, POSTER, COLOR_CORRECTION 모드
 * - DetailPageDraft: 상세페이지 (DETAIL_PAGE) 이미지
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

    // 1. 이미지 프로젝트 조회 (CREATE, EDIT, DETAIL_EDIT 등)
    const imageProjects = await prisma.imageProject.findMany({
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

    // 2. 상세페이지 드래프트 조회 (DETAIL_PAGE 모드)
    const detailPageDrafts = await prisma.detailPageDraft.findMany({
      where: {
        userId: user.id,
        detailPageSegments: { isEmpty: false }, // 이미지가 있는 드래프트만
        ...(search && {
          OR: [
            { title: { contains: search, mode: 'insensitive' } },
            { prompt: { contains: search, mode: 'insensitive' } },
          ],
        }),
      },
      orderBy: {
        updatedAt: 'desc',
      },
      select: {
        id: true,
        title: true,
        detailPageSegments: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    // 3. 상세페이지 드래프트를 프로젝트 형식으로 변환
    const detailPageProjects = detailPageDrafts.map(draft => ({
      id: `draft_${draft.id}`,
      title: draft.title,
      description: null,
      mode: 'DETAIL_PAGE',
      resultImages: draft.detailPageSegments,
      tags: [] as string[],
      createdAt: draft.createdAt.toISOString(),
      updatedAt: draft.updatedAt.toISOString(),
    }));

    // 4. 두 소스 합치기 및 날짜순 정렬
    const allProjects = [
      ...imageProjects.map(p => ({
        ...p,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      })),
      ...detailPageProjects,
    ].sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    return NextResponse.json({ projects: allProjects });
  } catch (error) {
    logger.error('Image list error', { module: 'Images' }, error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: '이미지 목록을 가져오는 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
