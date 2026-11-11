import config from 'config';

function disabled(key: string): string[] {
  const path = `system.${key}`;
  return config.has(path) ? config.get<string[]>(path) : [];
}

export function isModuleEnabled(name: string): boolean {
  return !disabled('disabledModules').includes(name);
}

export function isRouteEnabled(id: string): boolean {
  return !disabled('disabledRoutes').includes(id);
}

export function isComponentEnabled(file: string): boolean {
  const normalized = file.replaceAll('\\', '/');
  return !disabled('disabledComponents').some((path) =>
    normalized.endsWith(`/modules/${path}`)
  );
}

export function isGraphqlQueryEnabled(name: string): boolean {
  return !disabled('disabledGraphqlQueries').includes(name);
}
