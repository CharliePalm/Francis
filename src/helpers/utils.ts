export const camelify = (text: string) =>
  text
    .split(' ')
    .map((t) => t.split('_'))
    .flat()
    .map((word) => capitalize(word))
    .join('');
export const lowerCamel = (text: string) => toLower(camelify(text));
export const toLower = (text: string): string =>
  text.charAt(0).toLowerCase() + text.slice(1);
export const capitalize = (text: string) =>
  text.charAt(0).toUpperCase() + text.slice(1);

export const typeMap = (type: string) => {
  switch (type) {
    case 'rich_text':
    case 'title':
      return 'Text';
    case 'url':
      return 'URL';
    default:
      return camelify(type);
  }
};
