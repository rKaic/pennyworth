import { Command, CommandModule, ServiceCollection } from "../Types";

const flippedChars = {
  // uppercase (incomplete)
  'A':'∀',
  'B':'𐐒',
  'C':'Ɔ',
  'E':'Ǝ',
  'F':'Ⅎ',
  'G':'פ',
  'H':'H',
  'I':'I',
  'J':'ſ',
  'L':'˥',
  'M':'W',
  'N':'N',
  'P':'Ԁ',
  'R':'ᴚ',
  'T':'⊥',
  'U':'∩',
  'V':'Λ',
  'Y':'⅄',

  // lowercase
  'a':'ɐ',
  'b':'q',
  'c':'ɔ',
  'd':'p',
  'e':'ǝ',
  'f':'ɟ',
  'g':'ƃ',
  'h':'ɥ',
  'i':'ᴉ',
  'j':'ɾ',
  'k':'ʞ',
  'm':'ɯ',
  'n':'u',
  'p':'d',
  'q':'b',
  'r':'ɹ',
  't':'ʇ',
  'u':'n',
  'v':'ʌ',
  'w':'ʍ',
  'y':'ʎ',

  // numbers
  '1':'Ɩ',
  '2':'ᄅ',
  '3':'Ɛ',
  '4':'ㄣ',
  '5':'ϛ',
  '6':'9',
  '7':'ㄥ',
  '8':'8',
  '9':'6',
  '0':'0',

  // special chars
  '.':'˙',
  ',':'\'',
  '\'':',',
  '"':',,',
  '`':',',
  '<':'>',
  '>':'<',
  '∴':'∵',
  '&':'⅋',
  '_':'‾',
  '?':'¿',
  '!':'¡',
  '[':']',
  ']':'[',
  '(':')',
  ')':'(',
  '{':'}',
  '}':'{'
};

export default (services: ServiceCollection): CommandModule[] => {
  const modules: CommandModule[] = [{
    key: "flip",
    aliases: [],
    execute: async (command: Command) => {
      var text = command.params.join(" ");
      let flippedText: string[] = [];
      for(let i = 0; i < text.length; i++) {
        let flippedChar = flippedChars.hasOwnProperty(text[i]) ? flippedChars[text[i]] : text[i];
        flippedText.unshift(flippedChar);
      }
      await command.respond(`(╯°□°）╯︵ ${flippedText.join("")}`);
    },
    help: {
      description: "Flips the inputted text upside-down",
      displayAsCommand: true,
      usage: "<phrase>"
    }
  }];

  return modules;
}