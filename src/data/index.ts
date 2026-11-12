/** JSON 선택지 데이터를 타입과 함께 한곳에서 내보낸다. */
import stylesJson from './styles.json';
import layoutsJson from './layouts.json';
import colorsJson from './colors.json';
import typographyJson from './typography.json';
import detailsJson from './details.json';
import slideTypesJson from './slideTypes.json';
import slideCategoriesJson from './slideCategories.json';
import purposesJson from './purposes.json';
import type { ColorSet, DetailGroup, DetailKey, LayoutOption, Option, SlideType, TypographyOption } from '../types';

export const styles = stylesJson as Option[];
export const layouts = layoutsJson as LayoutOption[];
export const colors = colorsJson as ColorSet[];
export const typography = typographyJson as TypographyOption[];
export const detailGroups = detailsJson as DetailGroup[];
export const slideTypes = slideTypesJson as SlideType[];
export const slideCategories = slideCategoriesJson as { name: string; min: number }[];
export const purposes = purposesJson as { id: string; name: string; isDefault?: boolean }[];

export const DETAIL_KEYS: DetailKey[] = detailGroups.map((g) => g.key);
export const moods: string[] = [...new Set(colors.map((c) => c.mood))];

const byId = <T extends { id: string }>(list: T[]) => new Map(list.map((x) => [x.id, x]));
export const styleById = byId(styles);
export const layoutById = byId(layouts);
export const colorById = byId(colors);
export const typographyById = byId(typography);
export const slideTypeById = byId(slideTypes);
export const detailById = byId(detailGroups.flatMap((g) => g.options));

const def = <T extends { isDefault?: boolean }>(list: T[]): T => list.find((x) => x.isDefault) ?? list[0];
export const defaults = {
  purpose: def(purposes).name,
  style: def(styles),
  layout: def(layouts),
  color: def(colors),
  typography: def(typography),
  details: Object.fromEntries(detailGroups.map((g) => [g.key, def(g.options)])) as Record<DetailKey, Option>,
};
