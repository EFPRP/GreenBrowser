import fs from 'fs';
import pngToIco from 'png-to-ico';

console.log("Generating ICO from PNG...");
pngToIco('public/icon.png')
  .then(buf => {
    fs.writeFileSync('public/icon.ico', buf);
    console.log("public/icon.ico created natively!");
  })
  .catch(err => {
    console.error("Crash during conversion:", err);
  });
