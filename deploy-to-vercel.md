# Vercel 배포 가이드 (JSON 키 방식)

## 1️⃣ JSON 키 파일 준비
- `vercel-key.json` 파일 내용 복사

## 2️⃣ Vercel Dashboard 설정
1. https://vercel.com/dashboard 접속
2. 프로젝트 선택 → Settings → Environment Variables
3. 다음 환경 변수 추가:

### 필수 환경 변수
```
# Google Cloud
GOOGLE_CLOUD_PROJECT=project-8949f8d3-b8f3-458d-afd
GOOGLE_CLOUD_LOCATION=us-central1
GOOGLE_GENAI_USE_VERTEXAI=true

# 서비스 계정 JSON (전체 내용을 한 줄로)
GOOGLE_APPLICATION_CREDENTIALS={"type":"service_account","project_id":"project-8949f8d3-b8f3-458d-afd",...}

# Supabase
DATABASE_URL=postgresql://...
DIRECT_URL=postgresql://...
NEXT_PUBLIC_SUPABASE_URL=https://srifqwshpfkxjecuaokf.supabase.co
SUPABASE_SERVICE_ROLE_KEY=eyJhbGci...

# NextAuth
NEXTAUTH_URL=https://your-domain.vercel.app
NEXTAUTH_SECRET=(기존 값 사용)

# Google OAuth
GOOGLE_CLIENT_ID=(기존 값 사용)
GOOGLE_CLIENT_SECRET=(기존 값 사용)

# 암호화
ENCRYPTION_KEY=(기존 값 사용)

# 사업자 인증
BUSINESS_VERIFICATION_API_KEY=(기존 값 사용)
```

## 3️⃣ 배포
```bash
# Vercel CLI 설치 (선택)
npm i -g vercel

# 배포 실행
vercel --prod

# 또는 GitHub 연동으로 자동 배포
git push origin main
```

## 4️⃣ 배포 후 확인
- Vercel 대시보드에서 배포 로그 확인
- `[Vertex AI] Initialized with project:...` 메시지 확인
- 이미지 생성 테스트

## ⚠️ 주의사항
- `GOOGLE_APPLICATION_CREDENTIALS`는 JSON 객체 전체를 **문자열**로 입력
- 줄바꿈 없이 한 줄로 입력 (Vercel이 자동으로 파싱)
- 키 파일은 절대 GitHub에 커밋하지 말 것 (.gitignore에 추가)
