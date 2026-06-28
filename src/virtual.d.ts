declare module 'virtual:oriz-fleet-config' {
  import type { OrizFleetConfig } from './index';
  const cfg: OrizFleetConfig;
  export default cfg;
}

declare module 'virtual:oriz-fleet-injected-scripts' {
  export const head: string;
  export const bodyEnd: string;
  export const csp: string;
  const data: { head: string; bodyEnd: string; csp: string };
  export default data;
}
