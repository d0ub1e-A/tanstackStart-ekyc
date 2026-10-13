import type { IdCardTemplate } from './types';
import { ruetStudentIdTemplate } from './ruet/template';

const templateRegistry: IdCardTemplate[] = [ruetStudentIdTemplate];

export function registerTemplate(template: IdCardTemplate): void {
  templateRegistry.push(template);
}

export function getTemplates(): ReadonlyArray<IdCardTemplate> {
  return templateRegistry;
}

export function findTemplateById(id: string): IdCardTemplate | undefined {
  return templateRegistry.find((t) => t.id === id);
}

export function clearTemplates(): void {
  templateRegistry.length = 0;
}

export { ruetStudentIdTemplate };
