import type { LayoutOption, Option, TypographyOption } from '../../types';
import SlideWireframe from '../SlideWireframe';
import DetailPreview from './DetailPreview';
import StylePreview from './StylePreview';
import TypoPreview from './TypoPreview';

/**
 * 옵션의 preview 식별자를 보고 알맞은 미리보기를 고른다.
 *  - "shapes"  : 옵션이 가진 도형 목록을 와이어프레임으로
 *  - "typo"    : 옵션이 가진 글꼴 정보로 글자 견본을
 *  - "style-*" : 스타일 미리보기
 *  - 그 밖     : 디테일 미리보기(shadow-soft 등)
 */
export default function Preview({ option }: { option: Option }) {
  const p = option.preview;
  if (p === 'shapes' && 'shapes' in option) return <SlideWireframe shapes={(option as LayoutOption).shapes} label={`${option.name} 미리보기`} />;
  if (p === 'typo' && 'sample' in option) return <TypoPreview sample={(option as TypographyOption).sample} />;
  if (p.startsWith('style-')) return <StylePreview kind={p} />;
  return <DetailPreview kind={p} />;
}
