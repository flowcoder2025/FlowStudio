import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { prisma } from '@/lib/prisma';
import { authOptions } from '@/lib/auth';
import { requireImageProjectOwner } from '@/lib/permissions';

/**
 * DELETE /api/images/[id]
 * 이미지 프로젝트 삭제
 * - ImageProject: soft delete (deletedAt 설정)
 * - DetailPageDraft: hard delete (실제 삭제)
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

    // 상세페이지 드래프트인 경우 (draft_ 접두사)
    if (id.startsWith('draft_')) {
      const draftId = id.replace('draft_', '');

      // 드래프트 소유자 확인
      const draft = await prisma.detailPageDraft.findUnique({
        where: { id: draftId },
        select: { userId: true },
      });

      if (!draft) {
        return NextResponse.json(
          { error: '상세페이지를 찾을 수 없습니다.' },
          { status: 404 }
        );
      }

      if (draft.userId !== user.id) {
        return NextResponse.json(
          { error: '이 상세페이지를 삭제할 권한이 없습니다.' },
          { status: 403 }
        );
      }

      // 드래프트 삭제
      await prisma.detailPageDraft.delete({
        where: { id: draftId },
      });

      return NextResponse.json({ success: true });
    }

    // 일반 이미지 프로젝트인 경우
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
