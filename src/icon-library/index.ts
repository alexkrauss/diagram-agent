export * from './types';
export { TerrastructIconLibrary } from './TerrastructIconLibrary';

import { TerrastructIconLibrary } from './TerrastructIconLibrary';

/** Shared singleton instance of the Terrastruct icon library */
export const iconLibrary = new TerrastructIconLibrary();
