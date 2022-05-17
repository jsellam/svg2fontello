# svg2fontello

## presentation

This package convert svg files in fontello files for web

## Installation

`npm i svg2fontello`

`yarn add svg2fontello`

Create a file `.svg2fontellorc` at the root of your project with this content :

```
{
  "svg": "./src/assets/svg",
  "outputFonts": "./src/assets/fonts",
  "importFontsPath": "../assets/fonts/",
  "outputTypes": "./src/types/IconTypes.js",
  "outputStyles": "./src/styles/fontello.css"
}
```

| Property        | description                                                           |
| --------------- | :-------------------------------------------------------------------- |
| svg             | the path to your svgs files                                           |
| outputFonts     | the path where the font files are copied (eot, svg, ttf, woff, woff2) |
| importFontsPath | the relative path to your fonts from the css file                     |
| outputTypes     | The constant definition file in javascript                            |
| outputStyles    | The css file output                                                   |

### Add Script

In your package.json add this command inside the "scripts" element :

```
    "scripts": {
        ...other scripts
        "fontello":"svg2fontello"
    }
```

Use the command line `npm run fontello` in your terminal to generate all files

## Usage

- Import the css file in your web page
- use html element `<i class="fontello-[iconName]" />` (replace iconName by the name of your icon)

The icon name is the svg file name converted in kebab-case.

### Example :

For "Toggle off.svg" file use `<i class="fontello-toggle-off" />`

### Example in ReactJS :

`<i className={IconTypes.TOGGLE_OFF} />`
