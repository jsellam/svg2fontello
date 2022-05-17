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
  const importFontsPath = conf.importFontsPath;
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
  const glyphs = json.svg.defs.font.glyph;

  let types = "";

  glyphs.forEach((glyph, index) => {
    types += `\t${getIconType(glyph["glyph-name"])}: 'fontello-${
      glyph["glyph-name"]
    }',`;

    if (index < glyphs.length - 1) {
      types += "\n";
    }

    template.glyphs.push({
      css: glyph["glyph-name"],
      code: glyph.unicode.charCodeAt(0),
    });
  });

  const jsTypes = `const IconTypes = {
    ${types}
    };
    
    export default IconTypes;
    `;

  await fse.writeFile(outputTypesPath, jsTypes, "utf8");

  //scss file wor web version
  let css = await fse.readFile(path.resolve(tmpPath, "fontello.css"), "utf8");
  while (css.indexOf("url('fontello") > -1) {
    css = css.replace("url('fontello", "url('" + importFontsPath + "fontello");
  }

  while (css.indexOf('url("fontello') > -1) {
    css = css.replace('url("fontello', 'url("' + importFontsPath + "fontello");
  }

  await fse.writeFile(outputStylesPath, css, "utf8");

  //copy font files
  await fse.copy(
    path.resolve(tmpPath, "fontello.svg"),
    path.resolve(outputFontsPath, "fontello.svg")
  );
  await fse.copy(
    path.resolve(tmpPath, "fontello.ttf"),
    path.resolve(outputFontsPath, "fontello.ttf")
  );

  await fse.copy(
    path.resolve(tmpPath, "fontello.woff"),
    path.resolve(outputFontsPath, "fontello.woff")
  );
  await fse.copy(
    path.resolve(tmpPath, "fontello.woff2"),
    path.resolve(outputFontsPath, "fontello.woff2")
  );
  await fse.copy(
    path.resolve(tmpPath, "fontello.eot"),
    path.resolve(outputFontsPath, "fontello.eot")
  );

  await fse.remove(tmpPath);
}

buildIcons();
