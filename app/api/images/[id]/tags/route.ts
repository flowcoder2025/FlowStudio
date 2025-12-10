import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireImageProjectEditor } from '@/lib/permissions';

/**
 * PATCH /api/images/[id]/tags
 * 이미지 프로젝트 태그 업데이트
 */
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
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

    // 권한 확인 (편집 권한 필요)
    await requireImageProjectEditor(user.id, params.id);

    const body = await request.json();
    const { tags } = body;

    if (!Array.isArray(tags)) {
      return NextResponse.json(
        { error: '태그는 문자열 배열이어야 합니다.' },
        { status: 400 }
      );
    }

    // 태그 업데이트
    const updatedProject = await prisma.imageProject.update({
      where: {
        id: params.id,
      },
      data: {
        tags,
      },
      select: {
        id: true,
        tags: true,
        updatedAt: true,
      },
    });

    return NextResponse.json({ project: updatedProject });
  } catch (error) {
    console.error('Tag update error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: '이 프로젝트를 수정할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: '태그 업데이트 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
