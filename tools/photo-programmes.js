/* (Re)fait la photographie des programmes : node tools/photo-programmes.js
   À n'utiliser que pour une modification VOLONTAIRE et validée des programmes (voir tests/photo-programmes.js). */
"use strict";
const fs = require("fs"), path = require("path");
const { charger } = require("../tests/charger");
const { photo } = require("../tests/photo-programmes");
const o = photo(charger()), out = path.join(__dirname, "..", "tests", "fixtures", "programmes.json");
fs.writeFileSync(out, JSON.stringify(o, null, 0).replace(/\],"/g, '],\n"') + "\n");
console.log(Object.keys(o.programmes).length + " programmes, " + o.seances.length + " séances différentes → " + out + " (" + fs.statSync(out).size + " octets)");
