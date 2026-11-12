/** 낱말 끝 글자에 받침이 있는지 (한글이 아니면 false) */
export function hasBatchim(word: string): boolean {
  const ch = word.trim().replace(/[^0-9A-Za-z가-힣]+$/u, '').slice(-1);
  if (!ch) return false;
  const code = ch.charCodeAt(0);
  if (code >= 0xac00 && code <= 0xd7a3) return (code - 0xac00) % 28 !== 0;
  // 숫자·영문은 읽는 소리 기준으로 받침이 있는 것만 처리한다.
  return /[013678LMNRlmnr]/.test(ch);
}

/** 받침에 따라 조사를 골라 붙인다. josa('레트로', '을', '를') → '레트로를' */
export function josa(word: string, withBatchim: string, without: string): string {
  return word + (hasBatchim(word) ? withBatchim : without);
}
