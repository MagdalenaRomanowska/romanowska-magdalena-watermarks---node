const Jimp = require('jimp');  //JavaScript Image Manipulation Program.
const inquirer = require('inquirer');  //A collection of common interactive command line user interfaces.
const fs = require('fs'); // file system module allows you to work with the file system on your computer.

//watermark as text
const addTextWatermarkToImage = async function(inputFile, outputFile, text) {
  try { //blok try ... catch - w przypadku błędu "wyłapywać" go, ale nie pokazywać go bezpośrednio w konsoli. Zamiast tego w razie problemów powinien pojawić się tylko komunikat: Something went wrong... Try again!.
        const image = await Jimp.read(inputFile);  //Metoda .read modułu Jimp służy do ładowania plików graficznych. Jimp wspiera następujące formaty: jpeg, png, bmp, tiff, gif. Po załadowania i przypisaniu pliku do zmiennej (u nas jest nią image), mamy do niego dostęp w dalszej części kodu. await gwarantuje nam oczywiście, że kompilacja nie pójdzie do przodu, dopóki ten plik nie zostanie załadowany.
        const font = await Jimp.loadFont(Jimp.FONT_SANS_32_BLACK);  //Aby napisać tekst, potrzebna będzie nam jakaś czcionka. Jimp zezwala na załadowanie własnych fontów, ale oferuje również dostęp do jednego podstawowego, bez potrzeby pobierania. Jest to Open Sans, dostępny wraz z samą paczką. Jimp.FONT_SANS_32_BLACK to konkretnie odwołanie do czcionki Open Sans o rozmiarze 32px i kolorze black (czarnym). Możemy wybrać jednak analogicznie inne rozmiary oraz inny kolor – biały. Dokładny opis jak korzystać z tej opcji znajdziesz w dokumentacji.
          //Funkcja loadFont po prostu ładuje font i przypisuje go do zmiennej, aby dało się go potem wykorzystać przy próbie "pisania" tekstu na obrazku.
        const textData = {//potraktujemy tekst jako obiekt z trzema parametrami, żeby manipulować rozmieszczeniem.
              text,  
              alignmentX: Jimp.HORIZONTAL_ALIGN_CENTER,  //ustawić tekst na środku i to w poziomie, jak i w pionie.
              alignmentY: Jimp.VERTICAL_ALIGN_MIDDLE,  //ustawić tekst na środku i to w poziomie, jak i w pionie.
            };
        image.print(font, 0, 0, textData, image.getWidth(), image.getHeight());  //dodajemy napis na obrazku. Musimy jeszcze poinformować Jimpa o szerokości i wysokości obrazka. Jest to możliwe przy użyciu czwartego i piątego parametru metody print. Z racji tego, że nie wiemy jaki obrazek i o jakim rozmiarze użytkownik będzie chciał "oznakować", nie możemy podać sztywnych wartości, lecz musimy ustalić po prostu fizyczny rozmiar obrazka. Pomogą nam w tym dwie wbudowane w Jimpa funkcje: getWidth i getHeight.
        await image.quality(100).writeAsync(outputFile);  //Zapisujemy zmieniony obrazek jako nowy plik, a robimy to przy użyciu writeAsync. Dodatkowo użyta metoda quality pozwala na ustalenie jakości w jakiej zapiszemy plik. W naszym przypadku nie chcemy "psuć" wyglądu obrazka, więc wybraliśmy maksymalnie wysoką jakość (100%). Gdybyśmy jednak budowali np. aplikację do kompresowania zdjęć, byłaby to bardzo przydatna opcja.
        console.log('Success! Text Watermark was added.');
        startApp();
      } catch(error) {
        error = 'Something went wrong... Try again.';
        console.log(error);
      }
};

// watermark as image
const addImageWatermarkToImage = async function(inputFile, outputFile, watermarkFile) {  //jako trzeci argument będzie otrzymywać ścieżkę do pliku znaku wodnego.
  try {  //blok try ... catch - w przypadku błędu "wyłapywać" go, ale nie pokazywać go bezpośrednio w konsoli. Zamiast tego w razie problemów powinien pojawić się tylko komunikat: Something went wrong... Try again!.
        const image = await Jimp.read(inputFile);  //Ładujemy obrazek źródłowy.
        const watermark = await Jimp.read(watermarkFile);  //Ładujemy grafikę znaku wodnego.
        const x = image.getWidth() / 2 - watermark.getWidth() / 2;  //Wyrównujemy logo do środka - Szukamy środka głównego obrazka, a potem jeszcze odejmujemy od znalezionych wartości połowę rozmiaru watermarka.
        const y = image.getHeight() / 2 - watermark.getHeight() / 2;  //w CSS wyglądałoby to tak: position: absolute; top: 50%; left: 50%; transform: translate(-50%, -50%).
        image.composite(watermark, x, y, {  //Metoda composite służy do łączenia dwóch obrazków ze sobą. Przykleja ona do pliku wejściowego nowy obrazek. Pozycja jaką nowy obrazek ma przyjąć na grafice źródłowej (u nas to x w poziomie i y w pionie).
          mode: Jimp.BLEND_SOURCE_OVER,  //z pomocą opcji mode, można wybrać w jaki sposób to połączenie zostanie przeprowadzone. Wybraliśmy opcję pokazywania drugiego obrazka (naszego watermarka) na wierzchu – nad obrazkiem źródłowym.
          opacitySource: 0.5,  //powoduje, że nasz watermark jest lekko przezroczysty. 
        });
        await image.quality(100).writeAsync(outputFile);
        console.log('Success! Image Watermark was added.');
        startApp();
      } catch(error) {
        error = 'Something went wrong... Try again.';
        console.log(error);
      }
}; 
  //plik logo.png musimy dodać do katalogu sami.
const prepareOutputFilename = (filename) => {//funkcja, która będzie zajmowała się przygotowaniem odpowiedniej nazwy pliku.
  const [ name, ext ] = filename.split('.');  //split rozdzieli nazwe pliku wejściowego na dwie części.
  return `${name}-with-watermark.${ext}`;//Następnie musisz dodać do pierwszej części końcówkę -with-watermark, a następnie znowu złączyć oba fragmenty w całość.
};

const startApp = async () => { 
    // Ask if user is ready
    const answer = await inquirer.prompt([{  //zastosowanie async ... await. Z racji tego, że w naszym kodzie kilka razy będziemy zadawać kolejne pytania dopiero po wykonaniu jakichś operacji, będzie to spore ułatwienie. Inaczej skończylibyśmy z mało czytelnym kodem, w którym jedna funkcja z .then uruchamiałby kolejny promise z nowym .then, a ta ponownie odpalałby promise z jeszcze jednym .then...
        name: 'start',
        message: 'Hi! Welcome to "Watermark manager". Copy your image files to `/img` folder. Then you\'ll be able to use them in the app. Are you ready?',
        type: 'confirm'//typ pytania 'confirm' służy do potwierdzania (tak czy nie?).
      }]);
    // if answer is no, just quit the app
    if(!answer.start) process.exit();//Uwaga! Inquirer zawsze zwraca jako odpowiedź obiekt z atrybutami, nawet jeśli zadajemy tylko jedno pytanie. Dlatego w kodzie mimo zadania tylko jednego pytania i tak musieliśmy odwoływać się do jego odpowiedzi za pomocą klucza (atrybutu name pytania), w następujący sposób – answer.start.
    //window (tylko w przeglądarce), process (tylko w Node.js).
    // ask about input file and watermark type
    const options = await inquirer.prompt([{
      name: 'inputImage',
      type: 'input',
      message: 'What file do you want to mark?',
      default: 'test.jpg',
    }, {
      name: 'watermarkType',
      type: 'list',  //typ pytania 'list' każe użytkownikowi wybierać z listy kilku wyborów (u nas dwóch).
      choices: ['Text watermark', 'Image watermark'],
    }]);

    if(options.watermarkType === 'Text watermark') { //zależnie od typu, musimy zapytać użytkownika o tekst znaku wodnego, albo o ścieżkę do pliku graficznego.
      const text = await inquirer.prompt([{
        name: 'value',
        type: 'input',
        message: 'Type your watermark text:',
      }]);//mimo tego, że pytamy tylko o jedną rzecz, to i tak dostajemy obiekt. Aby dojść więc do samej wartości, musimy jeszcze wybrać odpowiedni atrybut (u nas to text.value, lub image.filename).
      options.watermarkText = text.value;
      
      if (fs.existsSync('./img/test.jpg')) {
        addTextWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), options.watermarkText);
      } else {
        console.log('Something went wrong... Try again.');
      }
    }
    else {
      const image = await inquirer.prompt([{
        name: 'filename',
        type: 'input',
        message: 'Type your watermark name:',
        default: 'logo.png',
      }]);
      options.watermarkImage = image.filename;
      
      if (fs.existsSync('./img/test.jpg') && fs.existsSync('./img/logo.png')) {
        addImageWatermarkToImage('./img/' + options.inputImage, './img/' + prepareOutputFilename(options.inputImage), './img/' + options.watermarkImage);
      } else {
        console.log('Something went wrong... Try again.');
      }
    }
}
startApp();