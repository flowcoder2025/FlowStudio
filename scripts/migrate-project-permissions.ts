/**
 * 프로젝트 권한 마이그레이션 스크립트
 *
 * 목적: 기존 ImageProject에 ReBAC 권한 레코드 추가
 * - RelationTuple 테이블에 owner 권한 부여
 * - 사용자가 생성한 모든 프로젝트에 자동 적용
 *
 * 실행 방법:
 * npx tsx scripts/migrate-project-permissions.ts
 */

import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

interface MigrationStats {
  totalProjects: number
  alreadyHavePermissions: number
  migrated: number
  failed: number
  errors: Array<{ projectId: string; userId: string; error: string }>
}

async function migrateProjectPermissions() {
  console.log('🚀 프로젝트 권한 마이그레이션 시작...\n')

  const stats: MigrationStats = {
    totalProjects: 0,
    alreadyHavePermissions: 0,
    migrated: 0,
    failed: 0,
    errors: []
  }

  try {
    // 1. 모든 활성 프로젝트 조회 (삭제되지 않은 것만)
    const projects = await prisma.imageProject.findMany({
      where: {
        deletedAt: null
      },
      select: {
        id: true,
        userId: true,
        title: true,
        createdAt: true
      },
      orderBy: {
        createdAt: 'asc'
      }
    })

    stats.totalProjects = projects.length
    console.log(`📊 총 ${stats.totalProjects}개의 프로젝트 발견\n`)

    // 2. 각 프로젝트마다 권한 확인 및 생성
    for (const project of projects) {
      try {
        // 2-1. 이미 권한이 있는지 확인
        const existingPermission = await prisma.relationTuple.findFirst({
          where: {
            namespace: 'image_project',
            objectId: project.id,
            relation: 'owner',
            subjectType: 'user',
            subjectId: project.userId
          }
        })

        if (existingPermission) {
          stats.alreadyHavePermissions++
          console.log(`✅ [SKIP] ${project.id} - 이미 권한 존재`)
          continue
        }

        // 2-2. 권한 생성 (grantImageProjectOwnership과 동일한 로직)
        await prisma.relationTuple.create({
          data: {
            namespace: 'image_project',
            objectId: project.id,
            relation: 'owner',
            subjectType: 'user',
            subjectId: project.userId
          }
        })

        stats.migrated++
        console.log(`✅ [MIGRATED] ${project.id} → User ${project.userId} (${project.title})`)

      } catch (error) {
        stats.failed++
        const errorMessage = error instanceof Error ? error.message : String(error)
        stats.errors.push({
          projectId: project.id,
          userId: project.userId,
          error: errorMessage
        })
        console.error(`❌ [FAILED] ${project.id} - ${errorMessage}`)
      }
    }

    // 3. 결과 요약
    console.log('\n' + '='.repeat(60))
    console.log('📊 마이그레이션 완료 결과:')
    console.log('='.repeat(60))
    console.log(`총 프로젝트:        ${stats.totalProjects}개`)
    console.log(`이미 권한 있음:     ${stats.alreadyHavePermissions}개 (스킵)`)
    console.log(`권한 생성 완료:     ${stats.migrated}개 ✅`)
    console.log(`실패:              ${stats.failed}개 ❌`)
    console.log('='.repeat(60))

    if (stats.errors.length > 0) {
      console.log('\n⚠️  실패한 프로젝트 상세:')
      stats.errors.forEach((err, idx) => {
        console.log(`${idx + 1}. Project: ${err.projectId}`)
        console.log(`   User: ${err.userId}`)
        console.log(`   Error: ${err.error}`)
      })
    }

    // 4. 검증 쿼리 실행
    console.log('\n🔍 검증 중...')
    const verificationResult = await prisma.relationTuple.count({
      where: {
        namespace: 'image_project',
        relation: 'owner'
      }
    })
    console.log(`✅ 총 ${verificationResult}개의 image_project owner 권한 확인됨`)

  } catch (error) {
    console.error('❌ 마이그레이션 중 치명적 오류 발생:', error)
    throw error
  } finally {
    await prisma.$disconnect()
  }
}

// 스크립트 실행
migrateProjectPermissions()
  .then(() => {
    console.log('\n✅ 마이그레이션 스크립트 완료')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ 마이그레이션 실패:', error)
    process.exit(1)
  })
