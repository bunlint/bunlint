import immutable from './immutable';
import functional from './functional';
import performance from './performance';
import security from './security';

// Export plugins for direct import
export {
  immutable,
  functional,
  performance,
  security
};

// Define a map of official plugins for use in the addPlugin function
export const officialPlugins = {
  immutable,
  functional,
  performance,
  security,
};

// Export a function to get a plugin by name
export const getOfficialPlugin = (name: string) => {
  return officialPlugins[name as keyof typeof officialPlugins] || null;
}; 