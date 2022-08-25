#!/usr/bin/env node
const path = require("path");
const svgtofont = require("svgtofont");
const fse = require("fs-extra");
const parser = require("xml2json");

const baseConf = {};
const conf = require("rc")("svg2fontello", baseConf);



const website = {
  title: "Genius icons",
  version: 1,
  logo: "logo.png",
  meta: {
    description: "Converts SVG fonts to TTF/EOT/WOFF/WOFF2/SVG format.",
    keywords: "svgtofont,TTF,EOT,WOFF,WOFF2,SVG",
  },
  links: [],
};

const template = JSON.parse(`
  {
    "name": "",
    "css_prefix_text": "icon-",
    "css_use_suffix": false,
    "hinting": true,
    "units_per_em": 1000,
    "ascent": 850,
    "glyphs": []
  }
  `);

function getIconType(glyphName) {
  let staticName = glyphName.toUpperCase();
  while (staticName.indexOf("-") > -1) {
    staticName = staticName.replace("-", "_");
  }
  return staticName;
}

async function buildIcons() {
  const svgPath = conf.svg; //path.resolve(__dirname, conf.svg);
  const outputFontsPath = conf.outputFonts;
  const outputTypesPath = conf.outputTypes;
  const outputStylesPath = conf.outputStyles;
  const fontelloConfigPath = conf.fontelloConfig;
  const importFontsPath = conf.importFontsPath;
  const formats = conf.formats || ["eot", "svg", "ttf", "woff", "woff2"];
  const tmpPath = path.resolve(__dirname, "./tmpsvg2fonts");

  await svgtofont({
    src: svgPath, // svg path
    dist: tmpPath, // output path
    fontName: "fontello", // font name
    css: true, // Create CSS files.
    classNamePrefix: "fontello",
    website: website,
    svgicons2svgfont: {
      fontHeight: 1000,
      normalize: true,
    },
  });

  const svg = await fse.readFile(path.resolve(tmpPath, "fontello.svg"));
  const data = parser.toJson(svg);
  const json = JSON.parse(data);
  let glyphs = json.svg.defs.font.glyph;

  let types = "";

  if (!(glyphs instanceof Array)) glyphs = [glyphs];

  const isTypescript =
    outputTypesPath.indexOf(".ts") === outputTypesPath.length - 3;

  glyphs.forEach((glyph, index) => {
    if (isTypescript) {
      types += `\t${getIconType(glyph["glyph-name"])} = 'fontello-${
        glyph["glyph-name"]
      }',`;
    } else {
      types += `\t${getIconType(glyph["glyph-name"])}: 'fontello-${
        glyph["glyph-name"]
      }',`;
    }

    if (index < glyphs.length - 1) {
      types += "\n";
    }

    template.glyphs.push({
      css: glyph["glyph-name"],
      code: glyph.unicode.charCodeAt(0),
    });
  });

  let jsTypes = isTypescript
    ? `enum IconTypes {
${types}
}
export default IconTypes;
`
    : `const IconTypes = {
${types}
};
export default IconTypes;
`;

  await fse.ensureFile(outputTypesPath);
  await fse.writeFile(outputTypesPath, jsTypes, "utf8");

  if (fontelloConfigPath) {
    const fontelloConfig = {
      name: "fontello",
      css_prefix_text: "fontello-",
      css_use_suffix: false,
      hinting: true,
      units_per_em: 1000,
      ascent: 850,
      glyphs: glyphs.map((glyph) => {
        return {
          css: glyph["glyph-name"],
          code: glyph.unicode.charCodeAt(0),
        };
      }),
    };

    await fse.ensureFile(fontelloConfigPath);
    await fse.writeJSON(fontelloConfigPath, fontelloConfig);
  }

  //scss file wor web version
  if (outputStylesPath) {
    await fse.ensureDir(outputStylesPath);
    let css = await fse.readFile(path.resolve(tmpPath, "fontello.css"), "utf8");
    while (css.indexOf("url('fontello") > -1) {
      css = css.replace(
        "url('fontello",
        "url('" + importFontsPath + "fontello"
      );
    }

    while (css.indexOf('url("fontello') > -1) {
      css = css.replace(
        'url("fontello',
        'url("' + importFontsPath + "fontello"
      );
    }

    await fse.writeFile(outputStylesPath, css, "utf8");
  }

  //copy font files
  await fse.ensureDir(outputFontsPath);
  if (formats.includes("svg")) {
    await fse.copy(
      path.resolve(tmpPath, "fontello.svg"),
      path.resolve(outputFontsPath, "fontello.svg")
    );
  }
  if (formats.includes("ttf")) {
    await fse.copy(
      path.resolve(tmpPath, "fontello.ttf"),
      path.resolve(outputFontsPath, "fontello.ttf")
    );
  }
  if (formats.includes("woff")) {
    await fse.copy(
      path.resolve(tmpPath, "fontello.woff"),
      path.resolve(outputFontsPath, "fontello.woff")
    );
  }
  if (formats.includes("woff2")) {
    await fse.copy(
      path.resolve(tmpPath, "fontello.woff2"),
      path.resolve(outputFontsPath, "fontello.woff2")
    );
  }
  if (formats.includes("eot")) {
    await fse.copy(
      path.resolve(tmpPath, "fontello.eot"),
      path.resolve(outputFontsPath, "fontello.eot")
    );
  }

  await fse.remove(tmpPath);
}

buildIcons();
