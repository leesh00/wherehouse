# 가져오기(덮어쓰기) 실패 시 기존 데이터가 지워짐

## 문제

JSON 가져오기용 `replaceAll`(전체 지우고 새로 저장)은 한 트랜잭션으로 묶었으니, 중간에 실패하면 모두 취소된다고 생각했다. 그런데 "중간에 실패하면 아무것도 바뀌지 않는다"는 테스트가 실패했다. 저장은 실패했는데 기존 재고가 모두 지워져 있었다.

```
AssertionError: expected [] to deeply equal [ { name: '휴지', … } ]
```

## 원인

IndexedDB 트랜잭션은 **요청이 비동기로 실패할 때만** 자동으로 취소된다.

- 실패 예시: id(keyPath)가 없는 객체를 `put`
- 이 경우 `put()`은 요청을 만들기 전에 **동기로 예외(DataError)를 던진다.** 그래서 트랜잭션은 실패한 요청이 있는 줄 모른다.
- 그 앞에서 이미 요청한 `clear()`만 남아 그대로 커밋됐다.

## 시도한 것

1. 테스트 작성: 기존 재고 1개 → id 없는 재고로 `replaceAll` → 실패 후 기존 재고가 남아 있는지 확인 → **실패(지워짐)**
2. `catch`에서 `tx.abort()`를 직접 호출 → 테스트 통과. 하지만 이미 만든 요청 Promise들이 취소되면서 `Unhandled Rejection` 경고 3건이 생김
3. 만든 요청을 모두 `pending` 배열에 모으고, 실패 시 `abort()` 후 `Promise.allSettled(pending)`로 처리 → 경고 없이 통과

## 해결

```ts
const pending: Promise<unknown>[] = [tx.done];
try {
  pending.push(locStore.clear(), itemStore.clear());
  for (const l of locations) pending.push(locStore.put(l));
  for (const i of items) pending.push(itemStore.put(i));
  await Promise.all(pending);
} catch (err) {
  try {
    tx.abort();
  } catch {}
  await Promise.allSettled(pending);
  throw err;
}
```

위 순서로 바꾼 뒤 기존 데이터가 그대로 남고, Unhandled Rejection 경고도 사라졌다.

화면에서는 가져오기 전에 `parseBackup`이 파일을 검사해 올바른 데이터만 넘긴다. 그래도 저장소는 마지막 방어선이므로 따로 지켰다.

## 배운 점

- **트랜잭션의 범위를 확인한다.** "트랜잭션 안에 넣었으니 원자적이다"는 비동기 요청 실패에만 맞는 말이다. 동기 예외는 직접 `abort()`해야 한다.
- **실패 경로를 테스트한다.** 성공 경로 테스트만으로는 이 문제를 찾지 못한다. 데이터를 지우는 작업은 실패 경로 테스트를 먼저 쓴다.
- **취소한 요청도 끝까지 처리한다.** `Promise.allSettled`로 처리하지 않으면 Unhandled Rejection 경고가 남는다.
