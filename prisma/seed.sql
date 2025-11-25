-- FlowStudio ReBAC Initial Data
-- Supabase SQL Editor에서 실행

-- RelationDefinition 초기화 (권한 계층 정의)
-- owner는 editor, viewer 권한을 상속
-- editor는 viewer 권한을 상속
-- viewer는 기본 권한 (상속 없음)

INSERT INTO "RelationDefinition" ("id", "namespace", "relation", "inherits", "createdAt")
VALUES
  (gen_random_uuid(), 'image_project', 'owner', ARRAY['editor', 'viewer'], NOW()),
  (gen_random_uuid(), 'image_project', 'editor', ARRAY['viewer'], NOW()),
  (gen_random_uuid(), 'image_project', 'viewer', ARRAY[]::text[], NOW())
ON CONFLICT ("namespace", "relation") DO NOTHING;

-- 시스템 레벨 권한 정의 (옵션)
INSERT INTO "RelationDefinition" ("id", "namespace", "relation", "inherits", "createdAt")
VALUES
  (gen_random_uuid(), 'system', 'admin', ARRAY[]::text[], NOW())
ON CONFLICT ("namespace", "relation") DO NOTHING;

-- 확인 쿼리
SELECT * FROM "RelationDefinition" ORDER BY "namespace", "relation";
