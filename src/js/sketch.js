import p5 from 'p5';
import '../css/style.scss';
import btc from '../assets/btc.json';
import regeneratorRuntime from 'regenerator-runtime';

const sketch = (p) => {
  let canvas;
  let priceAction;
  let background;
  let pallete;
  let randoms;
  let prev;
  let limits;
  let go = false;
  let y = 0;

  let roboto;
  let fr = 16;

  let h;
  let w;

  let offset;

  p.preload = async () => {
    roboto = p.loadFont('assets/roboto-mono-v13-latin-regular.ttf');
    // https://docs.pro.coinbase.com/#get-historic-rates
    // tlhocv
    priceAction = btc.data;

    limits = { min: 0, max: 1e7, open: 0, close: 0 };

    let lows = arrayColumn(priceAction, 1);
    let highs = arrayColumn(priceAction, 2);
    let open = arrayColumn(priceAction, 3);
    let close = arrayColumn(priceAction, 4);
    let vol = arrayColumn(priceAction, 5);

    limits.min = Math.min(
      Math.min(...lows),
      Math.min(...highs),
      Math.min(...open),
      Math.min(...close)
    );
    limits.max = Math.max(
      Math.max(...lows),
      Math.max(...highs),
      Math.max(...open),
      Math.max(...close)
    );

    limits.minVol = Math.min(...vol);
    limits.maxVol = Math.max(...vol);
  };

  p.setup = async () => {
    canvas = p.createCanvas(p.windowWidth, p.windowHeight);

    p.textFont(roboto);
    p.textSize(12);
    p.textAlign(p.LEFT);
    p.background(0);
    p.frameRate(20);

    await spawn();
  };

  async function spawn() {
    pallete = await createPallete(cryptoColor());
    randoms = await randomNumbers();
    prev = randoms.shift();

    h = p.windowHeight / 4;
    w = p.windowWidth / priceAction.length;
    offset = Math.floor(p.random(priceAction.length));
    y = 0;
    go = true;
  }

  const arrayColumn = (arr, n) => arr.map((x) => x[n]);

  // https://stackoverflow.com/questions/2450954/how-to-randomize-shuffle-a-javascript-array
  function shuffleArray(array) {
    for (var i = array.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1));
      var temp = array[i];
      array[i] = array[j];
      array[j] = temp;
    }
  }

  p.draw = () => {
    p.frameRate(fr);
    if (go) scan();
  };

  function scan() {
    if (y >= priceAction.length) {
      setTimeout(spawn, 5000);
      go = false;
      return;
    }

    printData(y);
    let yy = (y + offset) % priceAction.length;
    console.log(yy);
    candle(y, priceAction[yy]);
    y++;
  }

  p.windowResized = async () => {
    p.resizeCanvas(p.windowWidth, p.windowHeight);
    p.background(0);
  };

  p.keyPressed = () => {};

  p.mousePressed = toggleFullScreen;

  function toggleFullScreen() {
    var doc = window.document;
    var docEl = doc.documentElement;

    var requestFullScreen =
      docEl.requestFullscreen ||
      docEl.mozRequestFullScreen ||
      docEl.webkitRequestFullScreen ||
      docEl.msRequestFullscreen;
    var cancelFullScreen =
      doc.exitFullscreen ||
      doc.mozCancelFullScreen ||
      doc.webkitExitFullscreen ||
      doc.msExitFullscreen;

    if (
      !doc.fullscreenElement &&
      !doc.mozFullScreenElement &&
      !doc.webkitFullscreenElement &&
      !doc.msFullscreenElement
    ) {
      requestFullScreen.call(docEl);
    } else {
      cancelFullScreen.call(doc);
    }

    if (!document.fullscreenElement) {
      p.noCursor();
    } else {
      p.cursor(p.ARROW);
    }
  }

  function candle(i, candle) {
    p.rectMode(p.CORNER);

    let low = p.map(candle[1], limits.min, limits.max, 0, 1);
    let high = p.map(candle[2], limits.min, limits.max, 0, 1);
    let open = p.map(candle[3], limits.min, limits.max, 0, 1);
    let close = p.map(candle[4], limits.min, limits.max, 0, 1);
    let vol = p.map(candle[5], limits.minVol, limits.maxVol, 0, 1);

    let x = i * w;

    let ww = p.windowWidth / priceAction.length;

    let top = p.windowHeight * 0.25;
    let bottom = p.windowHeight - p.windowHeight * 0.25;
    let height = top - bottom;

    p.strokeCap(p.PROJECT);
    let c = toColor('h');
    c.setAlpha(127);
    p.fill(c);
    p.rect(x, top, ww, -high * height);

    c = toColor('l');
    c.setAlpha(127);
    p.fill(c);
    p.rect(x, top, ww, (-low * height) / 2);

    c = toColor('o');
    c.setAlpha(127);
    p.fill(c);
    p.rect(x, top, ww, (-close * height) / 4);
  }

  function printData(row) {
    p.noStroke();
    p.fill(0);
    p.rect(0, 0, p.width, p.windowHeight * 0.25);
    p.fill('#FFF');
    p.text(row + ' ' + priceAction[row], 20, p.windowHeight * 0.25 - 2);
  }

  function random() {
    randoms.push(prev);
    prev = randoms.shift();
    let result = p.map(prev, 0, 255, 0.0, 1.0);

    return result;
  }

  function toColor(polymer) {
    return pallete[polymer];
  }

  function cryptoColor() {
    var letters = '0123456789ABCDEF';
    var color = '';
    let array = new Uint8Array(6);
    // https://developer.mozilla.org/en-US/docs/Web/API/Crypto/getRandomValues
    window.crypto.getRandomValues(array);
    for (var i = 0; i < 6; i++) {
      color += letters[Math.floor(array[i] / 16)];
    }
    return color;
  }

  async function createPallete(value) {
    let url =
      'https://www.thecolorapi.com/scheme?hex=' +
      value +
      '&mode=analogic&count=4&format=json';
    let pallete = {};

    await p.httpGet(url, 'json', false, function (response) {
      console.log(response);
      pallete['l'] = p.color(
        response.colors[0].rgb.r,
        response.colors[0].rgb.g,
        response.colors[0].rgb.b
      );
      pallete['h'] = p.color(
        response.colors[1].rgb.r,
        response.colors[1].rgb.g,
        response.colors[1].rgb.b
      );
      pallete['o'] = p.color(
        response.colors[2].rgb.r,
        response.colors[2].rgb.g,
        response.colors[2].rgb.b
      );
      pallete['c'] = p.color(
        response.colors[3].rgb.r,
        response.colors[3].rgb.g,
        response.colors[3].rgb.b
      );
    });

    return pallete;
  }

  async function randomNumbers() {
    let qty = 512;
    let url =
      'https://qrng.anu.edu.au/API/jsonI.php?length=' + qty + '&type=uint8';
    let r;
    await await p.httpGet(url, 'json', false, function (response) {
      console.log(response);
      r = response.data;
    });

    return r;
  }

  let bit = 0;

  function yes() {
    if (bit == 7) {
      randoms.push(prev);
      prev = randoms.shift();
      bit = 0;
    }
    let result = (prev >> bit) & 1;
    bit++;
    return result;
  }
};

new p5(sketch);
