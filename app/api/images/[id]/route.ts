import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireImageProjectOwner } from '@/lib/permissions';

/**
 * DELETE /api/images/[id]
 * 이미지 프로젝트 삭제 (soft delete)
 */
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

    const { id } = await params;

    // 권한 확인 (소유자 권한 필요)
    await requireImageProjectOwner(user.id, id);

    // Soft delete
    await prisma.imageProject.update({
      where: {
        id,
      },
      data: {
        deletedAt: new Date(),
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Image delete error:', error);

    if (error instanceof Error && error.message.includes('Forbidden')) {
      return NextResponse.json(
        { error: '이 프로젝트를 삭제할 권한이 없습니다.' },
        { status: 403 }
      );
    }

    return NextResponse.json(
      { error: '이미지 삭제 중 오류가 발생했습니다.' },
      { status: 500 }
    );
  }
}
