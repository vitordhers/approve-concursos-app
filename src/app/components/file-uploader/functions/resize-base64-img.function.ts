export const resizeBase64Img = (
  base64: string, // image base64
  type: string, // image mime type
  newWidth: number, // new image width
  newHeight: number // new image height
) =>
  new Promise<string>((resolve, reject) => {
    // rejects promise if no document variable
    if (!document) {
      reject('document is not available');
    }
    // create a brand new canvas element
    const canvasElement = document.createElement('canvas');
    // set its width
    canvasElement.width = newWidth;
    // and height
    canvasElement.height = newHeight;
    // adjust style for width
    canvasElement.style.width = newWidth.toString() + 'px';
    // and height
    canvasElement.style.height = newHeight.toString() + 'px';
    // get canvas context
    const context = canvasElement.getContext('2d') as CanvasRenderingContext2D;
    // create nem image
    const img = new Image();
    // set it's source from base64 argument
    img.src = base64;
    // when it loads
    img.onload = () => {
      // get the imgRatioType: landscape or portrait
      const imgRatioType =
        img.width / img.height >= 1 ? 'landscape' : 'portrait'; // 1 > landscape ; 1 < portrait

      // if image is a portrait, then what's limiting it's sWidth is the img width. Otherwise it'll be the img height
      const sWidth = imgRatioType === 'portrait' ? img.width : img.height;
      // if image is a landscape, then what's limiting it's sHeight is the img height. Otherwise it'll be the img width
      const sHeight = imgRatioType === 'landscape' ? img.height : img.width;
      // if landscape, the image width is equals to 2 equal sx plus the sWidth. Otherwise, it should be 0.
      const sx = imgRatioType === 'landscape' ? (img.width - sWidth) / 2 : 0;
      // if portrait, the image height is equals to 2 equal sy plus the sHeight. Otherwise, it should be 0.
      const sy = imgRatioType === 'portrait' ? (img.height - sHeight) / 2 : 0;

      // destination canvas should have no space on dx
      const dx = 0;
      // neither on dy
      const dy = 0;
      // it's dWidth should be equal to the canvas width
      const dWidth = canvasElement.width;
      // and the same applies to dHeight with height
      const dHeight = canvasElement.height;
      // use clearRect for setting pixels in a clear rectangle with defined width and height
      context.clearRect(0, 0, canvasElement.width, canvasElement.height);
      // then draws the image
      context.drawImage(img, sx, sy, sWidth, sHeight, dx, dy, dWidth, dHeight);

      // resolve the promise with canvas toDataUrl method using type argument for mime
      resolve(canvasElement.toDataURL(type));
    };
    img.onerror = (err) => {
      // if image fails to load, rejects promise
      reject(err);
    };
  });
