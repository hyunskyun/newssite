# 디자인 프롬프트 빌더

객관식 옵션을 순서대로 고르면 디자인 지시문(프롬프트)이 자동으로 조립되는 개인용 웹앱입니다.
서버·로그인·외부 API 없이 브라우저에서만 동작하고, 모든 미리보기는 코드로 그린 SVG/CSS 입니다(외부 이미지 없음).
전체 계획은 [PLAN.md](./PLAN.md)에 있습니다.

- **파트 A. 전체 스타일** — 스타일 → 레이아웃·그리드 → 컬러 → 타이포그래피 → 디테일 (5단계, 단계마다 "잘 모르겠어요" = 기본값)
- **파트 B. 슬라이드 구성** — 레이아웃 102종에서 골라 순서대로 쌓고 슬라이드마다 한 줄 메모
- **결과** — 상세형 / 한 줄 요약형 프롬프트, 복사, 프리셋 저장, JSON 내보내기·불러오기

## 실행

Node.js 22 이상이 필요합니다.

```bash
npm install
```

```bash
npm run dev
```

| 명령 | 하는 일 |
| --- | --- |
| `npm run dev` | 개발 서버 |
| `npm run build` | 컬러 대비 검증 → 타입 검사 → `dist/` 빌드 |
| `npm run preview` | 빌드 결과를 로컬에서 확인 |
| `npm test` | 단위 테스트 (프롬프트 조립, 충돌 규칙, 데이터 검증) |
| `npm run validate` | 컬러 32세트 대비 검증만 실행 |
| `npm run gen:slides` | 슬라이드 레이아웃 데이터 다시 생성 |

빌드한 `dist/index.html`은 서버 없이 파일로 바로 열어도 동작합니다.

## 저장되는 곳

모든 데이터는 이 브라우저의 localStorage(`dpb:state`, `dpb:view`, `dpb:library`)에만 저장됩니다.
다른 기기로 옮기려면 결과 화면의 **JSON 내보내기 / 불러오기**를 쓰세요.

## 옵션 추가하기

선택지는 모두 `src/data/*.json`에 있고, 추가할 때 컴포넌트 코드를 고치지 않습니다.
추가한 뒤 `npm test`를 실행하면 개수·중복·기본값·대비를 검사합니다.

### 공통 필드

| 필드 | 뜻 |
| --- | --- |
| `id` | 고유 식별자 (영문 소문자와 `-`) |
| `name` | 카드에 보이는 이름 |
| `description` | 초보자용 한 줄 설명 |
| `promptText` | 상세형 프롬프트에 들어가는 문구 |
| `shortText` | 한 줄 요약형에 들어가는 짧은 문구 (없으면 `name`) |
| `preview` | 미리보기 식별자 (아래 참고) |
| `conflictsWith` | 함께 고르면 경고할 옵션 id 목록 (선택은 막지 않음) |
| `isDefault` | "잘 모르겠어요"일 때 쓰는 기본값. 목록마다 정확히 하나 |

### 파일별 안내

- **`styles.json`** — `preview`는 `style-이름` 형태의 CSS 클래스입니다. 새 스타일은 기존 클래스를 재사용하거나 `src/styles.css`의 "스타일" 미리보기 구역에 `.style-이름` 규칙을 추가합니다.
- **`layouts.json`** — `preview: "shapes"`와 함께 `shapes`(도형 목록)를 적으면 그대로 그려집니다.
- **`typography.json`** — `preview: "typo"`와 `sample`(제목·본문 글꼴 `sans | serif | mono | round`, 굵기)을 적습니다.
- **`details.json`** — 그림자·모서리·장식·테두리·여백 묶음. `preview`는 `shadow-soft`처럼 CSS 클래스입니다.
- **`colors.json`** — 세트마다 `mood`(분위기 탭), 역할 6색(`bg, surface, text, accent, accent2, border`)을 모두 채웁니다. 본문:배경·본문:면 4.5:1, 포인트:배경 3:1 미만이면 빌드가 중단됩니다.
- **`purposes.json`** — 용도 버튼 목록.
- **`slideTypes.json`** — 슬라이드 레이아웃. 항목 하나를 추가하면 끝입니다.

### 슬라이드 레이아웃 한 종 추가

`src/data/slideTypes.json`에 항목을 추가합니다. `"source": "generated"`가 **없는** 항목은 `npm run gen:slides`를 다시 돌려도 보존됩니다.

```json
{
  "id": "my-layout",
  "name": "내 레이아웃",
  "description": "언제 쓰면 좋은지 한 줄",
  "category": "카드·그리드",
  "tags": ["검색어1", "검색어2"],
  "promptText": "내 레이아웃: 이 문장만 읽고도 같은 구조를 그릴 수 있게 구조를 말로 정확히",
  "shapes": [
    { "type": "textLines", "x": 0.9, "y": 0.65, "w": 4.2, "lines": 1, "size": 0.3 },
    { "type": "rect", "x": 0.9, "y": 1.7, "w": 10.2, "h": 4.2, "fill": "surface", "radius": 0.14 }
  ]
}
```

- 좌표는 16:9 화면을 **가로 12 × 세로 6.75** 격자로 나눈 값입니다.
- 도형: `rect`, `circle`(`arc`·`start`로 도넛/진행률), `line`(`dash`), `arrow`, `textLines`(글줄 막대), `imagePlaceholder`(사진 자리).
- 색은 역할 이름(`bg, surface, text, accent, accent2, border`, 사진 자리용 `muted`, 투명 `none`)으로만 지정하므로 컬러 세트를 바꾸면 함께 바뀝니다.
- `"invert": true`를 주면 배경과 포인트 색을 맞바꿔 칠합니다(섹션 구분·정리 등).
- `category`는 `slideCategories.json`에 있는 이름이어야 합니다.

여러 종을 규칙으로 한꺼번에 만들려면 `scripts/generateSlideTypes.ts`를 고치고 `npm run gen:slides`를 실행합니다.
변형 축(열 수 · 정렬 · 이미지 위치 · 배경 반전)으로 만든 조합 중 무엇을 남기고 걸렀는지는 `scripts/slideVariants.review.md`에 기록됩니다.

## 구조

```text
src/
├─ data/          선택지 JSON + index.ts(타입 붙여 내보내기)
├─ lib/           buildPrompt(순수 함수) · conflicts · contrast · storage · korean(조사)
├─ state/store.ts useReducer 상태 + localStorage 저장
├─ components/    OptionCard · StepNav · ColorSetCard · SlideWireframe · PromptOutput · previews/ …
├─ pages/         StylePart(파트 A) · SlidePart(파트 B) · Result
scripts/          validateColors.ts · generateSlideTypes.ts
tests/            buildPrompt.test.ts
```

## 배포 (Cloudflare Pages)

정적 사이트입니다. 서버 코드·환경 변수·API 키가 없습니다.

1. Cloudflare 대시보드 → Workers & Pages → Create → Pages → **Connect to Git**에서 이 저장소를 고릅니다.
2. 빌드 설정: Framework preset `None`(또는 Vite), **Build command `npm run build`**, **Build output directory `dist`**.
3. 저장하면 이후 push할 때마다 자동으로 배포됩니다.

- Node 버전은 `.node-version`(22)으로 고정했습니다.
- `wrangler.toml`에 출력 폴더(`dist`)를 적어 두었습니다.
- 접근을 제한하려면 Cloudflare Access를 사용합니다(코드 수정 없음).
- 폰트(Pretendard, Noto Serif KR, JetBrains Mono, Jua)는 npm 패키지에서 가져와 함께 빌드하므로 CDN 요청이 없습니다.

## 계획안과 다르게 한 점

- 저장소 루트를 프로젝트 폴더로 썼습니다(계획안의 `design-prompt-builder/`에 해당).
- `Option`에 `shortText`(한 줄 요약형 문구)를, `AppState`에 `unsure`("잘 모르겠어요"를 누른 단계)를 추가했습니다.
- 디테일 옵션 id는 `shadow-none`, `border-none`처럼 묶음 이름을 앞에 붙였습니다("없음"이 두 묶음에 있어서).
- 다크 탭의 "네이비 다크·앨버"는 오타로 보고 "네이비 다크·앰버"로 넣었습니다.
- 충돌 경고는 단계 화면에서는 직접 고른 것끼리만, 결과 화면에서는 기본값으로 채워진 것까지 포함해 보여 줍니다.
