const puppeteer = require("puppeteer");
const [url, region] = process.argv.slice(2);

// Проверка наличия URL и региона в аргументах командной строки
if (!url || !region) {
  console.error("Использование: node index.js <product_url> <region>");
  process.exit(1);
}

class Puppeteer {
  constructor(url) {
    this.page;
    this.url = url;
  }

  // Установка соединения с браузером
  async connection() {
    try {
      // const browser = await puppeteer.launch({
      //   headless: false,
      //   executablePath:
      //     "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      //   args: ["--start-fullscreen"],
      // });
      const browser = await puppeteer.launch();
      this.page = await browser.newPage();

      // Получение разрешения устройства через evaluate
      const deviceResolution = await this.page.evaluate(() => {
        return {
          width: window.screen.width,
          height: window.screen.height,
        };
      });

      // Установка разрешения экрана равным разрешению устройства
      await this.page.setViewport(deviceResolution);
      await this.page.goto(this.url);
      return;
    } catch (error) {
      console.log(error);
    }
  }

  // Ожидание завершения навигации
  async waitTooltip() {
    try {
      return await this.page.waitForSelector(".Tooltip_root__EMk_3");
    } catch (error) {
      console.log(error);
    }
  }

  // Закрытие подсказки
  async closeTooltip() {
    try {
      // Ожидание появления подсказки
      await this.page.waitForSelector(".Tooltip_root__EMk_3", {
        visible: true,
      });

      // Закрытие подсказки кликом по кнопке закрытия
      await this.page.click(".Tooltip_closeIcon__skwl0");
    } catch (error) {
      console.log("Ошибка при закрытии подсказки:", error);
    }
  }

  async getRegion() {
    try {
      await this.page.waitForSelector(".Region_region__6OUBn");

      const regionData = await this.page.evaluate(() => {
        const regionElement = document.querySelector(".Region_region__6OUBn");
        return regionElement.textContent; // Пример: возвращает текст из элемента
      });

      return regionData;
    } catch (error) {
      console.log(error);
    }
  }

  // Клик по кнопке выбора региона
  async clickRegionMenuButton() {
    try {
      await this.page.waitForSelector(".Region_region__6OUBn");
      await this.page.click(".Region_region__6OUBn");
    } catch (error) {
      console.log(error);
    }
  }

  // Клик по выбранному региону
  async clickRegion(region) {
    try {
      // Ожидание появления списка регионов
      await this.page.waitForSelector(".UiRegionListBase_item___ly_A", {
        visible: true,
      });

      // Клик по региону на основе предоставленной переменной
      await this.page.evaluate((region) => {
        const regionElements = document.querySelectorAll(
          ".UiRegionListBase_item___ly_A",
        );
        const regionToClick = Array.from(regionElements).find(
          (element) => element.textContent.trim() === region,
        );

        if (regionToClick) {
          regionToClick.click();
        }
      }, region);
    } catch (error) {
      console.log("Ошибка при выборе региона:", error);
    }
  }

  async getProductDetails() {
    const productDetails = await this.page.evaluate(() => {
      const priceElement = document.querySelector(
        ".PriceInfo_root__GX9Xp .Price_price__QzA8L.Price_size_XL__MHvC1",
      );
      const oldPriceElement = document.querySelector(
        ".Price_price__QzA8L.Price_size_XS__ESEhJ.Price_role_old__r1uT1",
      );
      const ratingElement = document.querySelector(".Rating_value__S2QNR");
      const reviewCountElement = document.querySelector(
        ".ActionsRow_reviews__AfSj_ button",
      );

      const price = priceElement
        ? parseFloat(priceElement.textContent.trim().replace(",", "."))
        : null;
      const oldPrice = oldPriceElement
        ? parseFloat(oldPriceElement.textContent.trim())
        : null;
      const rating = ratingElement
        ? parseFloat(ratingElement.textContent.trim())
        : null;
      const reviewCount = reviewCountElement
        ? parseInt(reviewCountElement.textContent.trim().match(/\d+/)[0])
        : null;

      return { price, oldPrice, rating, reviewCount };
    });

    return productDetails;
  }

  async saveDataToFile(filePath, data) {
    await require("fs").promises.writeFile(filePath, data);
    console.log(`Данные сохранены по пути: ${filePath}`);
  }

  async takeFullPageScreenshot(filePath, targetRegionValue) {
    const screenRegionSelector = ".Region_region__6OUBn";

    let currentScreenRegion;

    // Ждем, пока значение ScreenRegion не станет равным целевому значению
    while (currentScreenRegion !== targetRegionValue) {
      await this.page.waitForSelector(screenRegionSelector);

      currentScreenRegion = await this.page.evaluate(
        (selector, targetValue) => {
          const regionElement = document.querySelector(selector);
          return regionElement ? regionElement.children[1].innerText : null;
        },
        screenRegionSelector,
        targetRegionValue,
      );

      // Если текущее значение не равно целевому, ждем некоторое время перед повторной проверкой
      if (currentScreenRegion !== targetRegionValue) {
        await new Promise((resolve) => setTimeout(resolve, 1000)); // Подождем 1 секунду (можете изменить на необходимое время)
      }
    }

    console.log(`ScreenRegion is now equal to ${targetRegionValue}`);

    // Теперь, когда значение ScreenRegion равно целевому значению, делаем скриншот
    await this.page.screenshot({ path: filePath, fullPage: true });
  }
}

// Асинхронная функция для сбора данных о продукте
async function scrapeProduct(url, region) {
  const puppeteerClass = new Puppeteer(url);
  await puppeteerClass.connection();
  await puppeteerClass.waitTooltip();
  await puppeteerClass.closeTooltip();
  this.region = await puppeteerClass.getRegion();

  if (this.region !== region) {
    await puppeteerClass.clickRegionMenuButton();
    await puppeteerClass.clickRegion(region);
  }

  const screenshotPath = "screenshot.jpg";
  await puppeteerClass.takeFullPageScreenshot(screenshotPath, region);
  console.log(`Скриншот сохранен по пути: ${screenshotPath}`);

  const productDetails = await puppeteerClass.getProductDetails();

  const productFilePath = "product.txt";
  const productData = `price=${productDetails.price}\npriceOld=${productDetails.oldPrice}\nrating=${productDetails.rating}\nreviewCount=${productDetails.reviewCount}`;
  await puppeteerClass.saveDataToFile(productFilePath, productData);

  process.exit(0);
}

scrapeProduct(url, region).catch((error) => {
  console.error("Ошибка во время сбора данных:", error);
  // Завершение выполнения программы с кодом ошибки (1)
  process.exit(1);
});
