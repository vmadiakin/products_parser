const exec = require("child_process").exec;
const fs = require("fs-extra");
const archiver = require("archiver");

const regions = [
  "Москва и область",
  "Санкт-Петербург и область",
  "Владимирская обл.",
  "Калужская обл.",
  "Рязанская обл.",
  "Тверская обл.",
  "Тульская обл.",
];

const links = [
  "https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-3-2-950g--309202",
  "https://www.vprok.ru/product/domik-v-derevne-dom-v-der-moloko-ster-2-5-950g--310778",
  "https://www.vprok.ru/product/makfa-makfa-izd-mak-spirali-450g--306739",
  "https://www.vprok.ru/product/greenfield-greenf-chay-gold-ceyl-bl-pak-100h2g--307403",
  "https://www.vprok.ru/product/chaykofskiy-chaykofskiy-sahar-pesok-krist-900g--308737",
  "https://www.vprok.ru/product/lavazza-kofe-lavazza-1kg-oro-zerno--450647",
  "https://www.vprok.ru/product/parmalat-parmal-moloko-pit-ulster-3-5-1l--306634",
  "https://www.vprok.ru/product/perekrestok-spmi-svinina-duhovaya-1kg--1131362",
  "https://www.vprok.ru/product/vinograd-kish-mish-1-kg--314623",
  "https://www.vprok.ru/product/eko-kultura-tomaty-cherri-konfetto-250g--946756",
  "https://www.vprok.ru/product/bio-perets-ramiro-1kg--476548",
  "https://www.vprok.ru/product/korkunov-kollektsiya-shokoladnyh-konfet-korkunov-iz-molochnogo-shokolada-s-fundukom-karamelizirovannym-gretskim-orehom-vafley-svetloy-orehovoy--1295690",
  "https://www.vprok.ru/product/picnic-picnic-batonchik-big-76g--311996",
  "https://www.vprok.ru/product/ritter-sport-rit-sport-shokol-tsel-les-oreh-mol-100g--305088",
  "https://www.vprok.ru/product/lays-chipsy-kartofelnye-lays-smetana-luk-140g--1197579",
];

async function run() {
  for (const region of regions) {
    const regionFolder = `./${region}`;
    fs.ensureDirSync(regionFolder);

    for (let i = 0; i < links.length; i++) {
      const link = links[i];
      const command = `node index.js ${link} "${region}"`;
      await executeCommand(command);

      // Добавляем порядковый номер к именам файлов
      const screenshotFileName = `screenshot${i + 1}.jpg`;
      const productFileName = `product${i + 1}.txt`;

      // Копируем файлы с новыми именами в папку региона
      fs.copySync("./screenshot.jpg", `${regionFolder}/${screenshotFileName}`);
      fs.copySync("./product.txt", `${regionFolder}/${productFileName}`);
    }

    // Создаем архив для текущего региона
    const archive = archiver("zip", { zlib: { level: 9 } });
    const output = fs.createWriteStream(`${region}.zip`);
    archive.directory(regionFolder, false);
    archive.pipe(output);
    await archive.finalize();

    // Удаляем папку с файлами региона
    fs.removeSync(regionFolder);

    console.log(`Archive created for ${region}`);
  }
}

function executeCommand(command) {
  return new Promise((resolve, reject) => {
    const childProcess = exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`Error executing command: ${command}`);
        reject(error);
      } else {
        console.log(`Command executed successfully: ${command}`);
        resolve();
      }
    });

    childProcess.stdout.pipe(process.stdout);
    childProcess.stderr.pipe(process.stderr);
  });
}

run();
