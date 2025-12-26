/**
 * permissions.ts Unit Tests
 *
 * Tests for the ReBAC (Relationship-Based Access Control) permission system
 */

import { describe, it, expect, vi, beforeEach } from 'vitest'
import { prisma } from '@/lib/prisma'
import {
  check,
  checkAny,
  checkAll,
  grant,
  revoke,
  revokeAll,
  grantImageProjectOwnership,
  grantSystemAdmin,
  listAccessible,
  isAdmin,
  requireAdmin,
  requireImageProjectOwner,
  requireImageProjectEditor,
  requireImageProjectViewer,
} from '@/lib/permissions'

// Type the mock
const mockPrisma = vi.mocked(prisma)

describe('permissions.ts', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  // ============================================
  // check() Tests
  // ============================================
  describe('check()', () => {
    it('should return true when user has direct permission', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue({
        id: '1',
        namespace: 'image_project',
        objectId: 'project-123',
        relation: 'owner',
        subjectType: 'user',
        subjectId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await check('user-1', 'image_project', 'project-123', 'owner')

      expect(result).toBe(true)
      expect(mockPrisma.relationTuple.findFirst).toHaveBeenCalledWith({
        where: {
          OR: expect.arrayContaining([
            expect.objectContaining({
              namespace: 'image_project',
              objectId: 'project-123',
              subjectId: 'user-1',
            }),
          ]),
        },
      })
    })

    it('should return false when user has no permission', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue(null)

      const result = await check('user-1', 'image_project', 'project-123', 'editor')

      expect(result).toBe(false)
    })

    it('should check inherited permissions (owner inherits editor and viewer)', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue({
        id: '1',
        namespace: 'image_project',
        objectId: 'project-123',
        relation: 'owner',
        subjectType: 'user',
        subjectId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      // User with owner should pass viewer check (via inheritance)
      const result = await check('user-1', 'image_project', 'project-123', 'viewer')

      expect(result).toBe(true)
      // Verify that OR conditions include inherited relations
      expect(mockPrisma.relationTuple.findFirst).toHaveBeenCalledWith({
        where: {
          OR: expect.arrayContaining([
            expect.objectContaining({
              relation: { in: ['viewer', 'editor', 'owner'] },
            }),
          ]),
        },
      })
    })

    it('should grant access if user is system admin', async () => {
      // First call: return null for direct permission
      // The query includes system admin check in OR condition
      mockPrisma.relationTuple.findFirst.mockResolvedValue({
        id: '1',
        namespace: 'system',
        objectId: 'global',
        relation: 'admin',
        subjectType: 'user',
        subjectId: 'admin-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await check('admin-user', 'image_project', 'project-123', 'viewer')

      expect(result).toBe(true)
    })

    it('should grant access for wildcard permissions', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue({
        id: '1',
        namespace: 'image_project',
        objectId: 'project-123',
        relation: 'viewer',
        subjectType: 'user',
        subjectId: '*', // Wildcard
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await check('any-user', 'image_project', 'project-123', 'viewer')

      expect(result).toBe(true)
    })
  })

  // ============================================
  // checkAny() Tests
  // ============================================
  describe('checkAny()', () => {
    it('should return true if user has any of the specified permissions', async () => {
      // First check fails, second check succeeds
      mockPrisma.relationTuple.findFirst
        .mockResolvedValueOnce(null) // owner check fails
        .mockResolvedValueOnce({
          id: '1',
          namespace: 'image_project',
          objectId: 'project-123',
          relation: 'editor',
          subjectType: 'user',
          subjectId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        }) // editor check succeeds

      const result = await checkAny('user-1', 'image_project', 'project-123', ['owner', 'editor'])

      expect(result).toBe(true)
    })

    it('should return false if user has none of the specified permissions', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue(null)

      const result = await checkAny('user-1', 'image_project', 'project-123', ['owner', 'editor'])

      expect(result).toBe(false)
    })
  })

  // ============================================
  // checkAll() Tests
  // ============================================
  describe('checkAll()', () => {
    it('should return true only if user has all specified permissions', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue({
        id: '1',
        namespace: 'image_project',
        objectId: 'project-123',
        relation: 'editor',
        subjectType: 'user',
        subjectId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await checkAll('user-1', 'image_project', 'project-123', ['editor', 'viewer'])

      expect(result).toBe(true)
    })

    it('should return false if user is missing any permission', async () => {
      mockPrisma.relationTuple.findFirst
        .mockResolvedValueOnce({
          id: '1',
          namespace: 'image_project',
          objectId: 'project-123',
          relation: 'viewer',
          subjectType: 'user',
          subjectId: 'user-1',
          createdAt: new Date(),
          updatedAt: new Date(),
        })
        .mockResolvedValueOnce(null) // editor check fails

      const result = await checkAll('user-1', 'image_project', 'project-123', ['viewer', 'editor'])

      expect(result).toBe(false)
    })
  })

  // ============================================
  // grant() Tests
  // ============================================
  describe('grant()', () => {
    it('should upsert a permission tuple', async () => {
      mockPrisma.relationTuple.upsert.mockResolvedValue({
        id: '1',
        namespace: 'image_project',
        objectId: 'project-123',
        relation: 'owner',
        subjectType: 'user',
        subjectId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await grant('image_project', 'project-123', 'owner', 'user', 'user-1')

      expect(mockPrisma.relationTuple.upsert).toHaveBeenCalledWith({
        where: {
          namespace_objectId_relation_subjectType_subjectId: {
            namespace: 'image_project',
            objectId: 'project-123',
            relation: 'owner',
            subjectType: 'user',
            subjectId: 'user-1',
          },
        },
        update: {},
        create: {
          namespace: 'image_project',
          objectId: 'project-123',
          relation: 'owner',
          subjectType: 'user',
          subjectId: 'user-1',
        },
      })
    })
  })

  // ============================================
  // grantImageProjectOwnership() Tests
  // ============================================
  describe('grantImageProjectOwnership()', () => {
    it('should grant owner permission to a project', async () => {
      mockPrisma.relationTuple.upsert.mockResolvedValue({
        id: '1',
        namespace: 'image_project',
        objectId: 'project-123',
        relation: 'owner',
        subjectType: 'user',
        subjectId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await grantImageProjectOwnership('project-123', 'user-1')

      expect(mockPrisma.relationTuple.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            namespace_objectId_relation_subjectType_subjectId: expect.objectContaining({
              namespace: 'image_project',
              objectId: 'project-123',
              relation: 'owner',
              subjectId: 'user-1',
            }),
          }),
        })
      )
    })
  })

  // ============================================
  // grantSystemAdmin() Tests
  // ============================================
  describe('grantSystemAdmin()', () => {
    it('should grant system admin permission', async () => {
      mockPrisma.relationTuple.upsert.mockResolvedValue({
        id: '1',
        namespace: 'system',
        objectId: 'global',
        relation: 'admin',
        subjectType: 'user',
        subjectId: 'admin-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await grantSystemAdmin('admin-user')

      expect(mockPrisma.relationTuple.upsert).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            namespace_objectId_relation_subjectType_subjectId: expect.objectContaining({
              namespace: 'system',
              objectId: 'global',
              relation: 'admin',
            }),
          }),
        })
      )
    })
  })

  // ============================================
  // revoke() Tests
  // ============================================
  describe('revoke()', () => {
    it('should delete a permission tuple', async () => {
      mockPrisma.relationTuple.deleteMany.mockResolvedValue({ count: 1 })

      await revoke('image_project', 'project-123', 'editor', 'user', 'user-1')

      expect(mockPrisma.relationTuple.deleteMany).toHaveBeenCalledWith({
        where: {
          namespace: 'image_project',
          objectId: 'project-123',
          relation: 'editor',
          subjectType: 'user',
          subjectId: 'user-1',
        },
      })
    })
  })

  // ============================================
  // revokeAll() Tests
  // ============================================
  describe('revokeAll()', () => {
    it('should delete all permission tuples for a resource', async () => {
      mockPrisma.relationTuple.deleteMany.mockResolvedValue({ count: 3 })

      await revokeAll('image_project', 'project-123')

      expect(mockPrisma.relationTuple.deleteMany).toHaveBeenCalledWith({
        where: {
          namespace: 'image_project',
          objectId: 'project-123',
        },
      })
    })
  })

  // ============================================
  // listAccessible() Tests
  // ============================================
  describe('listAccessible()', () => {
    it('should return list of accessible resource IDs', async () => {
      mockPrisma.relationTuple.findMany.mockResolvedValue([
        { objectId: 'project-1' },
        { objectId: 'project-2' },
        { objectId: 'project-3' },
      ])
      mockPrisma.relationTuple.findFirst.mockResolvedValue(null) // Not admin

      const result = await listAccessible('user-1', 'image_project', 'viewer')

      expect(result).toEqual(['project-1', 'project-2', 'project-3'])
      expect(mockPrisma.relationTuple.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            namespace: 'image_project',
            relation: { in: ['viewer', 'editor', 'owner'] },
            subjectId: 'user-1',
          }),
        })
      )
    })

    it('should return empty array for admin users (special handling)', async () => {
      mockPrisma.relationTuple.findMany.mockResolvedValue([])
      mockPrisma.relationTuple.findFirst.mockResolvedValue({
        id: '1',
        namespace: 'system',
        objectId: 'global',
        relation: 'admin',
        subjectType: 'user',
        subjectId: 'admin-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await listAccessible('admin-user', 'image_project', 'viewer')

      // Admin returns empty array (caller should handle admin case separately)
      expect(result).toEqual([])
    })
  })

  // ============================================
  // isAdmin() Tests
  // ============================================
  describe('isAdmin()', () => {
    it('should return true if user is system admin', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue({
        id: '1',
        namespace: 'system',
        objectId: 'global',
        relation: 'admin',
        subjectType: 'user',
        subjectId: 'admin-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      const result = await isAdmin('admin-user')

      expect(result).toBe(true)
    })

    it('should return false if user is not admin', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue(null)

      const result = await isAdmin('regular-user')

      expect(result).toBe(false)
    })

    it('should return false if userId is undefined', async () => {
      const result = await isAdmin(undefined)

      expect(result).toBe(false)
      expect(mockPrisma.relationTuple.findFirst).not.toHaveBeenCalled()
    })
  })

  // ============================================
  // requireAdmin() Tests
  // ============================================
  describe('requireAdmin()', () => {
    it('should not throw if user is admin', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue({
        id: '1',
        namespace: 'system',
        objectId: 'global',
        relation: 'admin',
        subjectType: 'user',
        subjectId: 'admin-user',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await expect(requireAdmin('admin-user')).resolves.not.toThrow()
    })

    it('should throw Unauthorized if userId is undefined', async () => {
      await expect(requireAdmin(undefined)).rejects.toThrow('Unauthorized')
    })

    it('should throw Forbidden if user is not admin', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue(null)

      await expect(requireAdmin('regular-user')).rejects.toThrow('Forbidden')
    })
  })

  // ============================================
  // requireImageProjectOwner() Tests
  // ============================================
  describe('requireImageProjectOwner()', () => {
    it('should not throw if user is project owner', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue({
        id: '1',
        namespace: 'image_project',
        objectId: 'project-123',
        relation: 'owner',
        subjectType: 'user',
        subjectId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await expect(requireImageProjectOwner('user-1', 'project-123')).resolves.not.toThrow()
    })

    it('should throw Unauthorized if userId is undefined', async () => {
      await expect(requireImageProjectOwner(undefined, 'project-123')).rejects.toThrow('Unauthorized')
    })

    it('should throw Forbidden if user is not owner', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue(null)

      await expect(requireImageProjectOwner('user-1', 'project-123')).rejects.toThrow('Forbidden')
    })
  })

  // ============================================
  // requireImageProjectEditor() Tests
  // ============================================
  describe('requireImageProjectEditor()', () => {
    it('should not throw if user has editor permission', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue({
        id: '1',
        namespace: 'image_project',
        objectId: 'project-123',
        relation: 'editor',
        subjectType: 'user',
        subjectId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await expect(requireImageProjectEditor('user-1', 'project-123')).resolves.not.toThrow()
    })

    it('should throw Unauthorized if userId is undefined', async () => {
      await expect(requireImageProjectEditor(undefined, 'project-123')).rejects.toThrow('Unauthorized')
    })

    it('should throw Forbidden if user has no editor permission', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue(null)

      await expect(requireImageProjectEditor('user-1', 'project-123')).rejects.toThrow('Forbidden')
    })
  })

  // ============================================
  // requireImageProjectViewer() Tests
  // ============================================
  describe('requireImageProjectViewer()', () => {
    it('should not throw if user has viewer permission', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue({
        id: '1',
        namespace: 'image_project',
        objectId: 'project-123',
        relation: 'viewer',
        subjectType: 'user',
        subjectId: 'user-1',
        createdAt: new Date(),
        updatedAt: new Date(),
      })

      await expect(requireImageProjectViewer('user-1', 'project-123')).resolves.not.toThrow()
    })

    it('should throw Unauthorized if userId is undefined', async () => {
      await expect(requireImageProjectViewer(undefined, 'project-123')).rejects.toThrow('Unauthorized')
    })

    it('should throw Forbidden if user has no viewer permission', async () => {
      mockPrisma.relationTuple.findFirst.mockResolvedValue(null)

      await expect(requireImageProjectViewer('user-1', 'project-123')).rejects.toThrow('Forbidden')
    })
  })
})
