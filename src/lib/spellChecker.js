// Utility for converting all system text to UPPERCASE and applying Portuguese Building Materials & Hardware Spell-Checking

const dictionaryCorrections = {
  'CONEXOES': 'CONEXÕES',
  'CONEXAO': 'CONEXÃO',
  'DOBRADICA': 'DOBRADIÇA',
  'DOBRADISAS': 'DOBRADIÇAS',
  'DOBRADISA': 'DOBRADIÇA',
  'TABUA': 'TÁBUA',
  'TABUAS': 'TÁBUAS',
  'MADERA': 'MADEIRA',
  'MADERAIS': 'MADEIRAS',
  'HIDRAULICA': 'HIDRÁULICA',
  'HIDRAULICO': 'HIDRÁULICO',
  'ELETRICA': 'ELÉTRICA',
  'ELETRICO': 'ELÉTRICO',
  'MARCENARIA': 'MARCENARIA',
  'SERRALHERIA': 'SERRALHERIA',
  'FERRAGENS': 'FERRAGENS',
  'FERRAGEM': 'FERRAGEM',
  'ALMOXARIFADO': 'ALMOXARIFADO',
  'ARGAMASSA': 'ARGAMASSA',
  'VERNIZ': 'VERNIZ',
  'BROCA': 'BROCA',
  'BUCHA': 'BUCHA',
  'PARAFUSO': 'PARAFUSO',
  'PARAFUSOS': 'PARAFUSOS',
  'PORTA': 'PORTA',
  'PORTAS': 'PORTAS',
  'COMPENSADO': 'COMPENSADO',
  'MDF': 'MDF',
  'CIMENTO': 'CIMENTO',
  'FECHADURA': 'FECHADURA',
  'FECHADURAS': 'FECHADURAS',
  'TORNEIRA': 'TORNEIRA',
  'TORNEIRAS': 'TORNEIRAS',
  'LAMINA': 'LÂMINA',
  'LAMINAS': 'LÂMINAS',
  'MARTELO': 'MARTELO',
  'SERROTE': 'SERROTE',
  'TRENA': 'TRENA'
};

export const correctSpellingAndUppercase = (inputStr) => {
  if (!inputStr || typeof inputStr !== 'string') return inputStr || '';

  // 1. Convert to Uppercase
  let upper = inputStr.toUpperCase().trim();

  // 2. Spell check words in dictionary
  const words = upper.split(/\s+/);
  const correctedWords = words.map(w => {
    const cleanWord = w.replace(/[^A-ZÁÉÍÓÚÂÊÔÃÕÇ]/g, '');
    if (dictionaryCorrections[cleanWord]) {
      return w.replace(cleanWord, dictionaryCorrections[cleanWord]);
    }
    return w;
  });

  return correctedWords.join(' ');
};

export const spellCheckProps = {
  spellCheck: true,
  lang: 'pt-BR',
  autoCapitalize: 'characters'
};
