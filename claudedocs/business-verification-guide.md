# 사업자 인증 시스템 가이드

**작성일**: 2025-12-10
**목적**: 국세청 공공데이터 API를 활용한 사업자등록번호 진위 확인 및 보너스 크레딧 지급

---

## ✅ 구현 완료 내역

### 백엔드
1. ✅ **데이터베이스 스키마 변경** (`prisma/schema.prisma`)
   - User 모델에 사업자 인증 필드 6개 추가
2. ✅ **국세청 API 유틸리티** (`lib/utils/businessVerification.ts`)
   - 사업자등록번호 형식 검증 및 체크섬 알고리즘
   - 국세청 API 호출 및 응답 파싱
   - 사업자 상태 확인 (계속사업자/휴업자/폐업자)
3. ✅ **사업자 인증 API 엔드포인트** (`/api/profile/business-verification`)
   - POST: 사업자 인증 요청 및 크레딧 지급
   - GET: 인증 상태 조회

### 프론트엔드
4. ✅ **사업자 인증 페이지** (`/profile/business`)
   - 사업자등록번호, 담당자 이름, 전화번호 입력 폼
   - 실시간 사업자번호 형식 자동 포맷팅 (000-00-00000)
   - 인증 상태 표시 및 완료 배지

### 환경 설정
5. ✅ **환경 변수 추가** (`.env.local`)
   - `BUSINESS_VERIFICATION_API_KEY` 설정

---

## 🔧 환경 변수 설정

### 1. 공공데이터포탈 API 키 발급

#### 단계 1: 회원가입 및 로그인
- URL: https://www.data.go.kr/
- 회원가입 (본인인증 필요)

#### 단계 2: API 신청
1. 검색창에 **"국세청_사업자등록정보 진위확인 및 상태조회 서비스"** 검색
2. **활용신청** 클릭
3. 신청 정보 입력:
   - 활용 목적: FlowStudio 사업자 인증 시스템
   - 상세 기능: 사업자 인증 및 크레딧 지급
   - 트래픽: 하루 1,000건
4. 신청 후 **즉시 승인** (자동 승인)

#### 단계 3: 인증키 확인
1. 마이페이지 → **오픈API** → **개발계정 상세보기**
2. **일반 인증키(Encoding)** 복사
3. `.env.local` 파일에 추가:
   ```bash
   BUSINESS_VERIFICATION_API_KEY="복사한_인증키"
   ```

### 2. 환경 변수 전체 설정 예시

```bash
# ============================================
# 사업자 인증 (국세청 API)
# ============================================
# 공공데이터포탈 API 키
# Get from: https://www.data.go.kr/ → 국세청_사업자등록정보 진위확인 및 상태조회 서비스
# 활용신청 후 발급받은 인증키(Encoding)를 입력

BUSINESS_VERIFICATION_API_KEY="YOUR_API_KEY_HERE"
```

---

## 📊 데이터베이스 마이그레이션

### 1. 마이그레이션 파일 확인

```bash
ls prisma/migrations/20251210_add_business_verification/
```

`migration.sql` 파일이 있어야 합니다.

### 2. Supabase SQL Editor에서 마이그레이션 실행

1. Supabase Dashboard → **SQL Editor** → **New Query**
2. `prisma/migrations/20251210_add_business_verification/migration.sql` 내용 복사
3. SQL Editor에 붙여넣기 후 **Run** 실행

### 3. 마이그레이션 확인

```sql
-- Supabase SQL Editor에서 실행
SELECT column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'User'
AND column_name IN ('businessNumber', 'businessOwnerName', 'businessPhone', 'businessVerified', 'businessVerifiedAt', 'businessBonusClaimed');
```

6개 컬럼이 모두 나타나면 성공입니다.

---

## 🎨 사용자 플로우

### 1. 사업자 인증 페이지 접속
- URL: `/profile/business`
- 로그인 필수

### 2. 정보 입력
- **사업자등록번호**: 10자리 (자동으로 하이픈 삽입, 예: 123-45-67890)
- **담당자 이름**: 사업자 대표 또는 담당자 이름
- **전화번호**: 연락 가능한 전화번호

### 3. 인증 요청
- **사업자 인증 및 150 크레딧 받기** 버튼 클릭
- 국세청 API로 실시간 진위 확인
- 계속사업자만 인증 통과 (휴업자/폐업자 제외)

### 4. 크레딧 지급
- 인증 성공 시 **150 크레딧** 자동 지급 (1회 한정)
- `CreditTransaction` 테이블에 거래 내역 기록

### 5. 인증 완료 화면
- 사업자 정보 표시
- 인증 완료 시각 표시
- 보너스 크레딧 지급 여부 표시

---

## 🔒 보안 및 검증

### 1. 사업자등록번호 검증
- **형식 검증**: 10자리 숫자
- **체크섬 검증**: 국세청 체크섬 알고리즘 적용
- **실시간 진위 확인**: 국세청 API로 실제 사업자 여부 확인

### 2. 중복 방지
- 같은 사업자번호로 여러 계정 인증 불가
- 이미 인증된 사용자는 재인증 불가

### 3. 상태 검증
- **계속사업자 (코드: 01)**: 인증 허용 ✅
- **휴업자 (코드: 02)**: 인증 거부 ❌
- **폐업자 (코드: 03)**: 인증 거부 ❌

### 4. 크레딧 지급 검증
- 인증 성공 시에만 지급
- 1인당 1회 한정 (businessBonusClaimed 플래그)
- 트랜잭션 로그 기록

---

## 🚀 API 사용법

### GET /api/profile/business-verification
**목적**: 사용자의 사업자 인증 상태 조회

**요청 헤더**:
```
Authorization: NextAuth Session (자동)
```

**응답 (성공)**:
```json
{
  "success": true,
  "data": {
    "verified": true,
    "verifiedAt": "2025-12-10T07:30:00.000Z",
    "bonusClaimed": true,
    "businessNumber": "1234567890",
    "ownerName": "홍길동",
    "phone": "010-1234-5678"
  }
}
```

**응답 (미인증)**:
```json
{
  "success": true,
  "data": {
    "verified": false,
    "verifiedAt": null,
    "bonusClaimed": false,
    "businessNumber": null,
    "ownerName": null,
    "phone": null
  }
}
```

### POST /api/profile/business-verification
**목적**: 사업자 인증 요청

**요청 본문**:
```json
{
  "businessNumber": "1234567890",
  "ownerName": "홍길동",
  "phone": "010-1234-5678"
}
```

**응답 (성공)**:
```json
{
  "success": true,
  "message": "사업자 인증이 완료되었습니다",
  "data": {
    "verified": true,
    "verifiedAt": "2025-12-10T07:30:00.000Z",
    "bonusCredits": 150,
    "businessStatus": "계속사업자",
    "taxType": "일반과세자"
  }
}
```

**응답 (실패)**:
```json
{
  "success": false,
  "error": "휴업자 상태의 사업자는 인증할 수 없습니다"
}
```

---

## 🐛 트러블슈팅

### 문제 1: API 키 인증 오류

**증상**: "국세청 API 인증 오류: API 키를 확인해주세요"

**해결방법**:
1. `.env.local`에서 `BUSINESS_VERIFICATION_API_KEY` 확인
2. 공공데이터포탈 → 마이페이지 → 오픈API에서 **일반 인증키(Encoding)** 복사
3. 인증키가 만료되었는지 확인 (활용신청 상태 확인)
4. 서버 재시작 (환경 변수 반영)

### 문제 2: 사업자번호 검증 실패

**증상**: "유효하지 않은 사업자등록번호 형식입니다"

**해결방법**:
1. 사업자등록번호가 정확히 10자리인지 확인
2. 하이픈은 자동으로 제거되므로 숫자만 확인
3. 국세청 체크섬 알고리즘 검증 실패 시 실제 사업자번호 확인

### 문제 3: 중복 사업자번호 오류

**증상**: "이미 등록된 사업자등록번호입니다"

**해결방법**:
- 해당 사업자번호로 이미 다른 사용자가 인증 완료
- 사업자번호 오타 확인
- 필요 시 관리자 문의

### 문제 4: 크레딧 지급 안 됨

**증상**: 인증은 성공했지만 크레딧이 지급되지 않음

**해결방법**:
1. `/api/credits/balance` 호출하여 실제 잔액 확인
2. Prisma Studio로 `CreditTransaction` 테이블 확인:
   ```bash
   npx prisma studio
   ```
3. 서버 로그 확인:
   ```bash
   [Business Verification] Bonus credited: 150 credits
   ```
4. `businessBonusClaimed` 플래그 확인 (이미 true면 재지급 불가)

---

## 📈 모니터링 및 로그

### 서버 로그 확인

정상적인 인증 플로우:
```bash
# 인증 요청
[Business Verification] Checking business number: 1234567890

# 국세청 API 응답 성공
[Business Verification] Success: { valid: true, status: '계속사업자', taxType: '일반과세자' }

# 크레딧 지급
[Business Verification] Bonus credited: 150 credits
```

오류 플로우:
```bash
# 휴업자/폐업자
[Business Verification] Failed: { valid: false, status: '휴업자', reason: '휴업자 상태의 사업자는 인증할 수 없습니다' }

# API 호출 실패
[NTS API] HTTP Error: { status: 401, statusText: 'Unauthorized' }
```

### 데이터베이스 모니터링

```sql
-- 최근 사업자 인증 현황 (Supabase SQL Editor)
SELECT
  u.email,
  u."businessNumber",
  u."businessOwnerName",
  u."businessVerified",
  u."businessVerifiedAt",
  u."businessBonusClaimed"
FROM "User" u
WHERE u."businessVerified" = true
ORDER BY u."businessVerifiedAt" DESC
LIMIT 20;

-- 사업자 인증 보너스 크레딧 지급 내역
SELECT
  u.email,
  ct.amount,
  ct.type,
  ct.description,
  ct."createdAt"
FROM "CreditTransaction" ct
JOIN "User" u ON ct."userId" = u.id
WHERE ct.type = 'BONUS'
AND ct.description LIKE '%사업자 인증%'
ORDER BY ct."createdAt" DESC
LIMIT 20;
```

---

## 🎯 다음 단계

### 추가 기능 구현 (선택)

1. **사업자 인증 배지 표시**:
   - ProfileDropdown에 "사업자 회원" 배지 추가
   - Header에 사업자 전용 아이콘 표시

2. **세금계산서 발행**:
   - 사업자 회원 전용 세금계산서 발행 기능
   - 결제 시 세금계산서 자동 발행 옵션

3. **사업자 전용 혜택**:
   - 사업자 회원 할인 (크레딧 충전 시 추가 5% 할인)
   - 우선 지원 (고객 지원 우선 처리)

4. **사업자 정보 수정**:
   - 담당자 이름, 전화번호 수정 기능
   - 사업자등록번호는 변경 불가

---

## 📚 참고 문서

- **공공데이터포탈**: https://www.data.go.kr/
- **국세청 사업자등록정보 API**: https://www.data.go.kr/data/15081808/openapi.do
- **구현 가이드**: `claudedocs/pricing-strategy.md` (사업자 인증 부분)
- **크레딧 시스템**: `claudedocs/credit-system-implementation.md`

---

## ❓ 자주 묻는 질문 (FAQ)

### Q1. 사업자 인증에 얼마나 걸리나요?
**A**: 국세청 API 호출은 보통 1-3초 이내에 완료됩니다. 네트워크 상태에 따라 최대 10초까지 소요될 수 있습니다.

### Q2. 휴업 중인 사업자도 인증 가능한가요?
**A**: 아니요. 계속사업자 상태만 인증 가능합니다. 휴업자나 폐업자는 인증이 거부됩니다.

### Q3. 사업자등록번호를 잘못 입력했는데 수정할 수 있나요?
**A**: 인증 완료 후에는 사업자등록번호를 수정할 수 없습니다. 신중하게 입력해주세요.

### Q4. 크레딧 150개는 얼마나 사용할 수 있나요?
**A**:
- 2K 이미지 생성 (4장): 20 크레딧 → 7회 생성 가능 (28장)
- 업스케일링 (1장): 10 크레딧 → 15회 가능

### Q5. 사업자 인증 보너스를 여러 번 받을 수 있나요?
**A**: 아니요. 계정당 1회 한정입니다.

---

**구현 완료일**: 2025-12-10
**구현자**: Claude Code (Sonnet 4.5)
