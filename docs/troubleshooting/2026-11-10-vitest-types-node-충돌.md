# Vitest 설치 시 @types/node peer 의존성 충돌 (ERESOLVE)

## 문제

`npm install -D vitest fake-indexeddb` 실행 시 `ERESOLVE could not resolve` 에러가 나며 설치가 실패했다.

## 원인

create-next-app 템플릿은 `@types/node@^20`을 넣는다. Vitest 5.1은 peer로 `@types/node@"^22.0.0 || >=24.0.0"`을 요구한다. 둘이 맞지 않아 충돌이 났다.

## 시도한 것

1. 에러 로그에서 충돌한 패키지와 요구 버전 범위 확인 → `@types/node` 20 vs 22 이상
2. 실제 Node 런타임 확인 → v22.18.0

## 해결

`npm install -D @types/node@^22 vitest fake-indexeddb`. 타입 버전을 실제 런타임(Node 22)에 맞췄다.

`--legacy-peer-deps`나 `--force`는 쓰지 않았다. 충돌을 숨길 뿐이라 이후 설치에서도 계속 플래그가 필요해진다.

## 배운 점

- `@types/node` 메이저 버전은 실제로 쓰는 Node 런타임 버전에 맞춘다.
- ERESOLVE가 나면 우회 플래그보다 "누가 무엇을 요구하는지"부터 읽는다.
