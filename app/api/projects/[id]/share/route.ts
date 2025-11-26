/**
 * Project Sharing API - Add collaborators with ReBAC
 * /api/projects/[id]/share
 */

import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authOptions } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { check, grant, revoke } from '@/lib/permissions'

// POST /api/projects/[id]/share - 협업자 추가
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Owner만 공유 가능
    const isOwner = await check(session.user.id, 'image_project', id, 'owner')

    if (!isOwner) {
      return NextResponse.json({ error: '프로젝트 소유자만 공유할 수 있습니다.' }, { status: 403 })
    }

    const body = await req.json()
    const { collaboratorEmail, role } = body

    if (!collaboratorEmail || !role) {
      return NextResponse.json(
        { error: '협업자 이메일과 권한을 입력해주세요.' },
        { status: 400 }
      )
    }

    if (!['editor', 'viewer'].includes(role)) {
      return NextResponse.json(
        { error: '권한은 editor 또는 viewer만 가능합니다.' },
        { status: 400 }
      )
    }

    // 협업자 찾기
    const collaborator = await prisma.user.findUnique({
      where: { email: collaboratorEmail },
    })

    if (!collaborator) {
      return NextResponse.json({ error: '사용자를 찾을 수 없습니다.' }, { status: 404 })
    }

    // 자기 자신에게 권한 부여 방지
    if (collaborator.id === session.user.id) {
      return NextResponse.json(
        { error: '본인에게는 권한을 부여할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 권한 부여
    await grant('image_project', id, role as 'editor' | 'viewer', 'user', collaborator.id)

    return NextResponse.json({
      success: true,
      message: `${collaboratorEmail}님에게 ${role} 권한을 부여했습니다.`,
    })
  } catch (error) {
    console.error('Share error:', error)
    return NextResponse.json({ error: '공유에 실패했습니다.' }, { status: 500 })
  }
}

// DELETE /api/projects/[id]/share - 협업자 제거
export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Owner만 권한 제거 가능
    const isOwner = await check(session.user.id, 'image_project', id, 'owner')

    if (!isOwner) {
      return NextResponse.json({ error: '프로젝트 소유자만 권한을 제거할 수 있습니다.' }, { status: 403 })
    }

    const body = await req.json()
    const { collaboratorId, role } = body

    if (!collaboratorId || !role) {
      return NextResponse.json(
        { error: '협업자 ID와 권한을 입력해주세요.' },
        { status: 400 }
      )
    }

    // Owner 권한은 제거 불가
    if (role === 'owner') {
      return NextResponse.json(
        { error: 'Owner 권한은 제거할 수 없습니다.' },
        { status: 400 }
      )
    }

    // 권한 제거
    await revoke('image_project', id, role as 'editor' | 'viewer', 'user', collaboratorId)

    return NextResponse.json({
      success: true,
      message: '권한을 제거했습니다.',
    })
  } catch (error) {
    console.error('Revoke share error:', error)
    return NextResponse.json({ error: '권한 제거에 실패했습니다.' }, { status: 500 })
  }
}

// GET /api/projects/[id]/share - 협업자 목록 조회
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions)

  if (!session?.user?.id) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }

  const { id } = await params

  try {
    // Viewer 이상 권한 필요
    const canView = await check(session.user.id, 'image_project', id, 'viewer')

    if (!canView) {
      return NextResponse.json({ error: '프로젝트에 대한 권한이 없습니다.' }, { status: 403 })
    }

    // 프로젝트의 모든 권한 튜플 조회
    const tuples = await prisma.relationTuple.findMany({
      where: {
        namespace: 'image_project',
        objectId: id,
      },
    })

    // 사용자 정보 조회
    const userIds = tuples.map(t => t.subjectId).filter(id => id !== '*')
    const users = await prisma.user.findMany({
      where: { id: { in: userIds } },
      select: {
        id: true,
        name: true,
        email: true,
        image: true,
      },
    })

    // 권한 정보와 사용자 정보 결합
    const collaborators = tuples
      .filter(t => t.subjectId !== '*')
      .map(tuple => {
        const user = users.find(u => u.id === tuple.subjectId)
        return {
          ...user,
          relation: tuple.relation,
        }
      })

    return NextResponse.json(collaborators)
  } catch (error) {
    console.error('Get collaborators error:', error)
    return NextResponse.json({ error: '협업자 목록 조회에 실패했습니다.' }, { status: 500 })
  }
}
